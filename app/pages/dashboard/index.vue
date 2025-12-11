<script setup lang="ts">
const toast = useToast()
const ws = ref<WebSocket | null>(null)
const activeTab = ref('queue')
const showAcceptDialog = ref(false)
const { user } = useUserSession()

interface ChatType {
  id: string
  patient?: { name: string, avatar?: string }
  district?: { name: string }
  initialDescription?: string
  createdAt: Date
  closedAt?: Date | null
}

const selectedChat = ref<ChatType | null>(null)

const { data: queuedChats, refresh: refreshQueue } = await useFetch<ChatType[]>(
  '/api/chats',
  {
    query: { status: 'queued' },
    key: 'queued-chats'
  }
)

const { data: activeChats, refresh: refreshActive } = await useFetch<ChatType[]>(
  '/api/chats',
  {
    query: { status: 'active' },
    key: 'active-chats'
  }
)

const { data: closedChats, refresh: refreshClosed } = await useFetch<ChatType[]>(
  '/api/chats',
  {
    query: { status: 'closed' },
    key: 'closed-chats'
  }
)

definePageMeta({
  middleware: 'healthcare',
  layout: 'healthcare'
})

// Watch for district changes and refresh all chats
watch(() => user.value?.districtId, async (newDistrictId, oldDistrictId) => {
  if (newDistrictId && newDistrictId !== oldDistrictId) {
    console.log('District changed, refreshing chats...')
    await Promise.all([refreshQueue(), refreshActive(), refreshClosed()])
  }
}, { immediate: false })

onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  if (ws.value) {
    ws.value.close()
  }
})

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws.value = new WebSocket(`${protocol}//${window.location.host}/ws/chat`)

  ws.value.onopen = () => {
    console.log('WebSocket connected')
    // Subscribe to district queue updates (worker will receive all districts they handle)
  }

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log('WebSocket message:', data)

    if (data.type === 'new_chat' || data.type === 'chat_assigned') {
      refreshQueue()
      refreshActive()
      refreshClosed()
    }
  }

  ws.value.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  ws.value.onclose = () => {
    console.log('WebSocket disconnected')
    setTimeout(connectWebSocket, 3000)
  }
}

// Show accept dialog
function showAcceptChatDialog(chat: ChatType) {
  selectedChat.value = chat
  showAcceptDialog.value = true
}

// Accept a chat from the queue
async function acceptChat() {
  if (!selectedChat.value) return

  try {
    await $fetch(`/api/chats/${selectedChat.value.id}`, {
      method: 'PATCH',
      body: { status: 'active' }
    })

    toast.add({
      title: 'Chat accepted',
      description: 'You are now connected with the patient',
      color: 'success'
    })

    await Promise.all([refreshQueue(), refreshActive()])
    showAcceptDialog.value = false
    selectedChat.value = null
    activeTab.value = 'active'
  }
  catch (error: unknown) {
    toast.add({
      title: 'Error',
      description:
        error instanceof Error ? error.message : 'Failed to accept chat',
      color: 'error'
    })
  }
}

// Close a chat
async function closeChat(chatId: string) {
  try {
    await $fetch(`/api/chats/${chatId}`, {
      method: 'PATCH',
      body: { status: 'closed' }
    })

    toast.add({
      title: 'Chat closed',
      description: 'The conversation has been closed',
      color: 'info'
    })

    await Promise.all([refreshActive(), refreshClosed()])
  }
  catch (error: unknown) {
    toast.add({
      title: 'Error',
      description:
        error instanceof Error ? error.message : 'Failed to close chat',
      color: 'error'
    })
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Healthcare Worker Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Stats -->
        <div class="grid gap-4 md:grid-cols-3">
          <UCard>
            <div class="flex items-center gap-3">
              <div class="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <UIcon
                  name="i-heroicons-clock"
                  class="w-6 h-6 text-amber-600"
                />
              </div>
              <div>
                <p class="text-2xl font-bold">
                  {{ queuedChats?.length || 0 }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Queued Chats
                </p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-3">
              <div class="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <UIcon
                  name="i-heroicons-chat-bubble-left-right"
                  class="w-6 h-6 text-green-600"
                />
              </div>
              <div>
                <p class="text-2xl font-bold">
                  {{ activeChats?.length || 0 }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Active Conversations
                </p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-3">
              <div class="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <UIcon
                  name="i-heroicons-check-circle"
                  class="w-6 h-6 text-gray-600"
                />
              </div>
              <div>
                <p class="text-2xl font-bold">
                  {{ closedChats?.length || 0 }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Closed Chats
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Tabs -->
        <UTabs
          v-model="activeTab"
          :items="[
            { label: 'Queue', value: 'queue', icon: 'i-heroicons-clock', slot: 'queue' },
            {
              label: 'Active Chats',
              value: 'active',
              icon: 'i-heroicons-chat-bubble-left-right',
              slot: 'active'
            },
            {
              label: 'Closed Chats',
              value: 'closed',
              icon: 'i-heroicons-check-circle',
              slot: 'closed'
            }
          ]"
        >
          <!-- @vue-ignore -->
          <template #queue>
            <DashboardQueueTab
              :chats="queuedChats || null"
              @accept="showAcceptChatDialog"
            />
          </template>

          <!-- @vue-ignore -->
          <template #active>
            <DashboardActiveChatsTab
              :chats="activeChats || null"
              @close="closeChat"
            />
          </template>

          <!-- @vue-ignore -->
          <template #closed>
            <DashboardClosedChatsTab :chats="closedChats || null" />
          </template>
        </UTabs>

        <!-- Accept Chat Confirmation Modal -->
        <DashboardAcceptChatModal
          v-model="showAcceptDialog"
          :chat="selectedChat"
          @accept="acceptChat"
          @cancel="showAcceptDialog = false"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
