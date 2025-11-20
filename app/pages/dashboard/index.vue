<script setup lang="ts">
const toast = useToast()
const ws = ref<WebSocket | null>(null)
const activeTab = ref('queue')

// Fetch queued and active chats
const { data: queuedChats, refresh: refreshQueue } = await useFetch(
  '/api/chats',
  {
    query: { status: 'queued' }
  }
)

const { data: activeChats, refresh: refreshActive } = await useFetch(
  '/api/chats',
  {
    query: { status: 'active' }
  }
)

definePageMeta({
  middleware: 'healthcare',
  layout: 'healthcare'
})

// WebSocket connection for real-time updates
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

// Accept a chat from the queue
async function acceptChat(chatId: string) {
  try {
    await $fetch(`/api/chats/${chatId}`, {
      method: 'PATCH',
      body: { status: 'active' }
    })

    toast.add({
      title: 'Chat accepted',
      description: 'You are now connected with the patient',
      color: 'success'
    })

    await Promise.all([refreshQueue(), refreshActive()])
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

    await refreshActive()
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

const queueColumns = [
  { key: 'patient', label: 'Patient' },
  { key: 'district', label: 'District' },
  { key: 'description', label: 'Description' },
  { key: 'created', label: 'Created' },
  { key: 'actions', label: '' }
]
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Healthcare Worker Dashboard">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>

    <UDashboardPanelContent>
      <div class="space-y-6">
        <!-- Stats -->
        <div class="grid gap-4 md:grid-cols-2">
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
        </div>

        <!-- Tabs -->
        <UTabs
          v-model="activeTab"
          :items="[
            { label: 'Queue', value: 'queue', icon: 'i-heroicons-clock' },
            {
              label: 'Active Chats',
              value: 'active',
              icon: 'i-heroicons-chat-bubble-left-right'
            }
          ]"
        >
          <template #queue>
            <UCard>
              <template #header>
                <h3 class="font-semibold">
                  Queued Chats
                </h3>
              </template>

              <UTable
                :columns="queueColumns"
                :rows="queuedChats || []"
              >
                <template #patient-data="{ row }">
                  <div class="flex items-center gap-2">
                    <UAvatar
                      :src="row.patient?.avatar"
                      :alt="row.patient?.name"
                      size="xs"
                    />
                    <span>{{ row.patient?.name }}</span>
                  </div>
                </template>

                <template #district-data="{ row }">
                  {{ row.district?.name }}
                </template>

                <template #description-data="{ row }">
                  <p class="max-w-xs truncate">
                    {{ row.initialDescription }}
                  </p>
                </template>

                <template #created-data="{ row }">
                  {{ new Date(row.createdAt).toLocaleString() }}
                </template>

                <template #actions-data="{ row }">
                  <UButton
                    color="primary"
                    size="xs"
                    @click="acceptChat(row.id)"
                  >
                    Accept
                  </UButton>
                </template>
              </UTable>

              <UEmpty
                v-if="!queuedChats || queuedChats.length === 0"
                icon="i-heroicons-inbox"
                title="No queued chats"
                description="New patient conversations will appear here"
              />
            </UCard>
          </template>

          <template #active>
            <div class="grid gap-4">
              <UCard
                v-for="chat in activeChats"
                :key="chat.id"
                :ui="{ body: { padding: 'p-0' } }"
              >
                <div class="p-4 space-y-3">
                  <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                      <UAvatar
                        :src="chat.patient?.avatar"
                        :alt="chat.patient?.name"
                      />
                      <div>
                        <p class="font-semibold">
                          {{ chat.patient?.name }}
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          {{ chat.district?.name }}
                        </p>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <UButton
                        :to="`/chat/${chat.id}`"
                        color="primary"
                        size="sm"
                      >
                        Open Chat
                      </UButton>
                      <UButton
                        color="neutral"
                        variant="outline"
                        size="sm"
                        @click="closeChat(chat.id)"
                      >
                        Close
                      </UButton>
                    </div>
                  </div>

                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ chat.initialDescription }}
                  </p>

                  <div class="text-xs text-gray-500">
                    Started {{ new Date(chat.createdAt).toLocaleString() }}
                  </div>
                </div>
              </UCard>

              <UEmpty
                v-if="!activeChats || activeChats.length === 0"
                icon="i-heroicons-chat-bubble-left-right"
                title="No active conversations"
                description="Accept a chat from the queue to start"
              />
            </div>
          </template>
        </UTabs>
      </div>
    </UDashboardPanelContent>
  </UDashboardPanel>
</template>
