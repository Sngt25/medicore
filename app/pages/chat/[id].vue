<script setup lang="ts">
const route = useRoute()
const toast = useToast()
const { user } = useUserSession()

const chatId = computed(() => route.params.id as string)
const messageBody = ref('')
const messagesContainer = ref<HTMLElement>()
const ws = ref<WebSocket | null>(null)

// Fetch chat data
const { data: chat, refresh: refreshChat } = await useFetch(
  `/api/chats/${chatId.value}`
)

definePageMeta({
  middleware: 'auth'
})

// WebSocket connection
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
    // Subscribe to this chat
    ws.value?.send(
      JSON.stringify({
        action: 'subscribe_chat',
        chatId: chatId.value
      })
    )
  }

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log('WebSocket message:', data)

    if (data.type === 'new_message') {
      refreshChat()
      scrollToBottom()
    }
  }

  ws.value.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  ws.value.onclose = () => {
    console.log('WebSocket disconnected')
    // Reconnect after 3 seconds
    setTimeout(connectWebSocket, 3000)
  }
}

async function sendMessage() {
  if (!messageBody.value.trim()) return

  const body = messageBody.value
  messageBody.value = ''

  try {
    const message = await $fetch(`/api/chats/${chatId.value}/messages`, {
      method: 'POST',
      body: { body }
    })

    // Broadcast via WebSocket
    ws.value?.send(
      JSON.stringify({
        action: 'broadcast_message',
        chatId: chatId.value,
        message
      })
    )

    await refreshChat()
    scrollToBottom()
  }
  catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to send message',
      color: 'red'
    })
    messageBody.value = body
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(
  () => chat.value?.messages,
  () => {
    scrollToBottom()
  },
  { immediate: true }
)

const statusColor = computed(() => {
  switch (chat.value?.status) {
    case 'queued':
      return 'amber'
    case 'active':
      return 'green'
    case 'closed':
      return 'gray'
    default:
      return 'gray'
  }
})
</script>

<template>
  <UApp>
    <div class="flex flex-col h-screen">
      <!-- Header -->
      <div
        class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
      >
        <UContainer class="py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UButton
                to="/districts"
                color="gray"
                variant="ghost"
                icon="i-heroicons-arrow-left"
                square
              />
              <div>
                <h1 class="font-semibold">
                  {{
                    chat?.assignedWorker?.name
                      || 'Waiting for healthcare worker...'
                  }}
                </h1>
                <div
                  class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <UBadge
                    :color="statusColor"
                    size="xs"
                  >
                    {{ chat?.status }}
                  </UBadge>
                  <span v-if="chat?.district?.name">{{
                    chat.district.name
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </UContainer>
      </div>

      <!-- Messages -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950"
      >
        <UContainer class="py-6">
          <div class="max-w-4xl mx-auto space-y-4">
            <!-- Initial description -->
            <UCard
              class="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
            >
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-document-text"
                    class="w-5 h-5 text-blue-600"
                  />
                  <span class="font-semibold text-blue-900 dark:text-blue-100">Initial Description</span>
                </div>
                <p class="text-gray-700 dark:text-gray-300">
                  {{ chat?.initialDescription }}
                </p>
              </div>
            </UCard>

            <!-- Messages -->
            <div
              v-for="message in chat?.messages"
              :key="message.id"
              :class="[
                'flex',
                message.senderId === user?.id ? 'justify-end' : 'justify-start'
              ]"
            >
              <div
                :class="[
                  'max-w-md rounded-lg px-4 py-2',
                  message.senderId === user?.id
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                ]"
              >
                <p class="whitespace-pre-wrap">
                  {{ message.body }}
                </p>
                <p
                  :class="[
                    'text-xs mt-1',
                    message.senderId === user?.id
                      ? 'text-primary-100'
                      : 'text-gray-500'
                  ]"
                >
                  {{ new Date(message.createdAt).toLocaleTimeString() }}
                </p>
              </div>
            </div>

            <div
              v-if="!chat?.messages || chat.messages.length === 0"
              class="text-center py-12"
            >
              <UIcon
                name="i-heroicons-chat-bubble-left-right"
                class="w-12 h-12 text-gray-400 mx-auto mb-3"
              />
              <p class="text-gray-600 dark:text-gray-400">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        </UContainer>
      </div>

      <!-- Message input -->
      <div
        class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
      >
        <UContainer class="py-4">
          <div class="max-w-4xl mx-auto">
            <div class="flex gap-2">
              <UTextarea
                v-model="messageBody"
                placeholder="Type your message..."
                :rows="1"
                autoresize
                class="flex-1"
                @keydown.enter.prevent="sendMessage"
              />
              <UButton
                icon="i-heroicons-paper-airplane"
                color="primary"
                :disabled="!messageBody.trim() || chat?.status === 'closed'"
                @click="sendMessage"
              />
            </div>
            <p
              v-if="chat?.status === 'closed'"
              class="text-sm text-gray-500 mt-2"
            >
              This conversation has been closed
            </p>
          </div>
        </UContainer>
      </div>
    </div>
  </UApp>
</template>
