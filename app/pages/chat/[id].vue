<script setup lang="ts">
import { useFileDialog, useWebSocket } from '@vueuse/core'

const route = useRoute()
const toast = useToast()
const { user } = useUserSession()

const chatId = computed(() => route.params.id as string)
const messageBody = ref('')
const messagesContainer = ref<HTMLElement>()
const uploadedFiles = ref<string[]>([])
const isUploading = ref(false)

const { data: chat, refresh: refreshChat } = await useFetch<ChatX>(
  `/api/chats/${chatId.value}`
)

definePageMeta({
  middleware: 'auth'
})

const { open: openFileDialog, reset: resetFileDialog, onChange } = useFileDialog({
  accept: 'image/*,application/pdf',
  multiple: false
})

onChange(async (selectedFiles) => {
  if (!selectedFiles || selectedFiles.length === 0)
    return

  const file = selectedFiles[0]
  if (!file)
    return

  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('chatId', chatId.value)

    const uploadedFile = await $fetch<{ pathname: string }>('/api/files/upload', {
      method: 'POST',
      body: formData
    })

    uploadedFiles.value.push(uploadedFile.pathname)

    toast.add({
      title: 'Success',
      description: 'File uploaded successfully',
      color: 'success'
    })
  }
  catch (error) {
    toast.add({
      title: 'Error',
      description: (error as { data?: { message?: string } }).data?.message || 'Failed to upload file',
      color: 'error'
    })
  }
  finally {
    isUploading.value = false
    resetFileDialog()
  }
})

const { status, data: wsData, send, close: closeWs } = useWebSocket('/ws/chat', {
  autoReconnect: {
    retries: 3,
    delay: 3000,
    onFailed() {
      console.error('Failed to connect WebSocket after 3 retries')
    }
  },
  heartbeat: {
    message: 'ping',
    interval: 30000,
    pongTimeout: 5000
  },
  immediate: true,
  onConnected() {
    console.log('WebSocket connected')
    // Subscribe to this chat
    send(
      JSON.stringify({
        action: 'subscribe_chat',
        chatId: chatId.value
      })
    )
  },
  onDisconnected() {
    console.log('WebSocket disconnected')
  },
  onError(_ws, event) {
    console.error('WebSocket error:', event)
  }
})

// Watch for WebSocket messages
watch(wsData, (data) => {
  if (!data)
    return

  try {
    const message = JSON.parse(data)
    console.log('WebSocket message:', message)

    if (message.type === 'new_message') {
      refreshChat()
      scrollToBottom()
    }
  }
  catch (error) {
    console.error('Failed to parse WebSocket message:', error)
  }
})

onUnmounted(() => {
  closeWs()
})

async function sendMessage() {
  if (!messageBody.value.trim() && uploadedFiles.value.length === 0)
    return

  const body = messageBody.value
  const attachments = [...uploadedFiles.value]

  messageBody.value = ''
  uploadedFiles.value = []

  try {
    const message = await $fetch(`/api/chats/${chatId.value}/messages`, {
      method: 'POST',
      body: {
        body: body || '(File attachment)',
        attachments: attachments.length > 0 ? attachments : undefined
      }
    })

    // Broadcast via WebSocket
    send(
      JSON.stringify({
        action: 'broadcast_message',
        chatId: chatId.value,
        message
      })
    )

    await refreshChat()
    scrollToBottom()
  }
  catch (error) {
    toast.add({
      title: 'Error',
      description: (error as { data?: { message?: string } }).data?.message || 'Failed to send message',
      color: 'error'
    })
    messageBody.value = body
    uploadedFiles.value = attachments
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function removeUploadedFile(pathname: string) {
  uploadedFiles.value = uploadedFiles.value.filter(p => p !== pathname)
}

function getFileUrl(pathname: string) {
  return `/api/files/${pathname}`
}

function getFileName(pathname: string) {
  return pathname.split('/').pop() || pathname
}

function isImage(pathname: string) {
  const ext = pathname.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
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
      return 'warning'
    case 'active':
      return 'primary'
    case 'closed':
      return 'secondary'
    default:
      return 'secondary'
  }
})

const wsStatusColor = computed(() => {
  switch (status.value) {
    case 'OPEN':
      return 'success'
    case 'CONNECTING':
      return 'warning'
    default:
      return 'error'
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
                color="secondary"
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
                  <UBadge
                    :color="wsStatusColor"
                    size="xs"
                    variant="subtle"
                  >
                    {{ status }}
                  </UBadge>
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
                <p
                  v-if="message.sender"
                  :class="[
                    'text-xs font-semibold mb-1',
                    message.senderId === user?.id
                      ? 'text-primary-100'
                      : 'text-gray-600 dark:text-gray-400'
                  ]"
                >
                  {{ message.sender.name }}
                </p>
                <p class="whitespace-pre-wrap">
                  {{ message.body }}
                </p>

                <!-- Attachments -->
                <div
                  v-if="message.attachments && message.attachments.length > 0"
                  class="mt-2 space-y-2"
                >
                  <div
                    v-for="attachment in message.attachments"
                    :key="attachment"
                  >
                    <img
                      v-if="isImage(attachment)"
                      :src="getFileUrl(attachment)"
                      :alt="getFileName(attachment)"
                      class="rounded max-w-full h-auto max-h-64 object-contain"
                    >
                    <a
                      v-else
                      :href="getFileUrl(attachment)"
                      target="_blank"
                      :class="[
                        'flex items-center gap-2 p-2 rounded',
                        message.senderId === user?.id
                          ? 'bg-primary-600 hover:bg-primary-700'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      ]"
                    >
                      <UIcon name="i-heroicons-document" />
                      <span class="text-sm">{{ getFileName(attachment) }}</span>
                    </a>
                  </div>
                </div>

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
            <!-- Uploaded files preview -->
            <div
              v-if="uploadedFiles.length > 0"
              class="mb-2 flex gap-2 flex-wrap"
            >
              <UBadge
                v-for="file in uploadedFiles"
                :key="file"
                color="primary"
                variant="subtle"
                class="flex items-center gap-1"
              >
                <span class="text-xs">{{ getFileName(file) }}</span>
                <UButton
                  icon="i-heroicons-x-mark"
                  size="xs"
                  color="primary"
                  variant="ghost"
                  :padded="false"
                  @click="removeUploadedFile(file)"
                />
              </UBadge>
            </div>

            <div class="flex gap-2">
              <UButton
                icon="i-heroicons-paper-clip"
                color="secondary"
                variant="ghost"
                :loading="isUploading"
                :disabled="chat?.status === 'closed'"
                @click="openFileDialog()"
              />
              <UTextarea
                v-model="messageBody"
                placeholder="Type your message..."
                :rows="1"
                autoresize
                class="flex-1"
                :disabled="chat?.status === 'closed'"
                @keydown.enter.prevent="sendMessage"
              />
              <UButton
                icon="i-heroicons-paper-airplane"
                color="primary"
                :disabled="(!messageBody.trim() && uploadedFiles.length === 0) || chat?.status === 'closed'"
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
