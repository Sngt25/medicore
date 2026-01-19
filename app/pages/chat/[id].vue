<script setup lang="ts">
import { useFileDialog } from '@vueuse/core'
import type { Channel } from 'pusher-js'

const route = useRoute()
const toast = useToast()
const { user } = useUserSession()
const { subscribe, unsubscribe } = usePusher()

const chatId = computed(() => route.params.id as string)
const messageBody = ref('')
const messagesContainer = ref<HTMLElement>()
const uploadedFiles = ref<string[]>([])
const isUploading = ref(false)
const showAcceptModal = ref(false)
const showCloseModal = ref(false)
let chatChannel: Channel | null | undefined = null

const { data: chat, refresh: refreshChat } = await useFetch<ChatX>(
  `/api/chats/${chatId.value}`
)

definePageMeta({
  middleware: 'auth',
  layout: 'chat'
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

// Realtime connection
onMounted(() => {
  chatChannel = subscribe(`chat-${chatId.value}`)
  
  if (chatChannel) {
    chatChannel.bind('new_message', () => {
      refreshChat()
      scrollToBottom()
    })
    
    chatChannel.bind('chat_updated', async () => {
      await refreshChat()
      await refreshNuxtData('chats-list')
    })
  }

  if (chat.value?.messages) {
    chat.value.messages.forEach((message) => {
      messageDisplayTimes.value[message.id] = new Date(message.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    })
  }
})

onUnmounted(() => {
  if (chatChannel) {
    unsubscribe(`chat-${chatId.value}`)
  }
})

const messageDisplayTimes = ref<Record<string, string>>({})

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
  (messages) => {
    if (messages) {
      messages.forEach((message) => {
        if (!messageDisplayTimes.value[message.id]) {
          messageDisplayTimes.value[message.id] = new Date(message.createdAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      })
    }
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

function getMessageTime(message: { id: string, createdAt: string }) {
  const isoTime = new Date(message.createdAt).toISOString().split('T')[1]
  return messageDisplayTimes.value[message.id] || (isoTime ? isoTime.substring(0, 5) : '')
}

const isMobileSidebarOpen = inject<Ref<boolean>>('chatSidebarOpen')

function openMobileSidebar() {
  if (isMobileSidebarOpen) {
    isMobileSidebarOpen.value = true
  }
}

async function acceptChat() {
  try {
    await $fetch(`/api/chats/${chatId.value}`, {
      method: 'PATCH',
      body: { status: 'active' }
    })

    toast.add({
      title: 'Success',
      description: 'Chat accepted successfully',
      color: 'success'
    })

    showAcceptModal.value = false
    await refreshChat()
    await refreshNuxtData('chats-list')
  }
  catch (error) {
    toast.add({
      title: 'Error',
      description: (error as { data?: { message?: string } }).data?.message || 'Failed to accept chat',
      color: 'error'
    })
  }
}

async function closeChat() {
  try {
    await $fetch(`/api/chats/${chatId.value}`, {
      method: 'PATCH',
      body: { status: 'closed' }
    })

    toast.add({
      title: 'Success',
      description: 'Chat closed successfully',
      color: 'success'
    })

    showCloseModal.value = false
    await refreshChat()
    await refreshNuxtData('chats-list')
  }
  catch (error) {
    toast.add({
      title: 'Error',
      description: (error as { data?: { message?: string } }).data?.message || 'Failed to close chat',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="flex flex-col flex-1">
    <div class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <UContainer class="py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <UButton
              icon="i-heroicons-bars-3"
              color="secondary"
              variant="ghost"
              square
              class="lg:hidden"
              @click="openMobileSidebar"
            />
            <UButton
              :to="user?.role === 'healthcare_worker' ? '/dashboard' : '/districts'"
              color="secondary"
              variant="ghost"
              icon="i-heroicons-arrow-left"
              square
              class="hidden lg:inline-flex"
            />
            <UAvatar
              :src="user?.role === 'healthcare_worker' ? chat?.patient?.avatar : chat?.assignedWorker?.avatar"
              :alt="user?.role === 'healthcare_worker' ? (chat?.patient?.name || 'Patient') : (chat?.assignedWorker?.name || 'Waiting...')"
            />
            <div>
              <h1 class="font-semibold">
                {{ user?.role === 'healthcare_worker' ? (chat?.patient?.name || 'Patient') : (chat?.assignedWorker?.name || 'Waiting for healthcare worker...') }}
              </h1>
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <UBadge
                  :color="statusColor"
                  size="xs"
                >
                  {{ chat?.status }}
                </UBadge>
                <span v-if="chat?.district?.name">{{ chat.district.name }}</span>
              </div>
            </div>
          </div>
          <div v-if="user?.role === 'healthcare_worker'">
            <div class="flex items-center gap-2">
              <UButton
                v-if="chat?.status === 'queued'"
                color="primary"
                variant="soft"
                icon="i-heroicons-check"
                size="sm"
                @click="showAcceptModal = true"
              >
                Accept
              </UButton>
              <UButton
                v-else-if="chat?.status === 'active'"
                color="error"
                variant="soft"
                icon="i-heroicons-x-mark"
                size="sm"
                @click="showCloseModal = true"
              >
                Close
              </UButton>
            </div>
          </div>
        </div>
      </UContainer>
    </div>

    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950"
    >
      <UContainer class="py-6">
        <div class="max-w-4xl mx-auto space-y-4">
          <UAlert
            color="info"
            variant="subtle"
            icon="i-heroicons-information-circle"
            title="Initial Description"
            :description="chat?.initialDescription"
          />

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

              <ClientOnly>
                <p
                  :class="[
                    'text-xs mt-1',
                    message.senderId === user?.id ? 'text-primary-100' : 'text-gray-500'
                  ]"
                >
                  {{ messageDisplayTimes[message.id] }}
                </p>
                <template #fallback>
                  <p
                    :class="[
                      'text-xs mt-1',
                      message.senderId === user?.id ? 'text-primary-100' : 'text-gray-500'
                    ]"
                  >
                    {{ getMessageTime(message as any) }}
                  </p>
                </template>
              </ClientOnly>
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

    <div
      v-if="user?.role === 'healthcare_worker' && chat?.status !== 'queued'"
      class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
    >
      <UContainer class="py-4">
        <div class="max-w-4xl mx-auto">
          <DashboardChatTasksList
            :chat-id="chatId"
            :read-only="chat?.status === 'closed'"
          />
        </div>
      </UContainer>
    </div>

    <div class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <UContainer class="py-4">
        <div class="max-w-4xl mx-auto">
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
              :disabled="chat?.status === 'closed' || (chat?.status === 'queued' && user?.role === 'healthcare_worker')"
              @click="openFileDialog()"
            />
            <UTextarea
              v-model="messageBody"
              placeholder="Type your message..."
              :rows="1"
              autoresize
              class="flex-1"
              :disabled="chat?.status === 'closed' || (chat?.status === 'queued' && user?.role === 'healthcare_worker')"
              @keydown.enter.prevent="sendMessage"
            />
            <UButton
              icon="i-heroicons-paper-airplane"
              color="primary"
              :disabled="(!messageBody.trim() && uploadedFiles.length === 0) || chat?.status === 'closed' || (chat?.status === 'queued' && user?.role === 'healthcare_worker')"
              @click="sendMessage"
            />
          </div>
          <p
            v-if="chat?.status === 'closed'"
            class="text-sm text-gray-500 mt-2"
          >
            This conversation has been closed
          </p>
          <p
            v-if="chat?.status === 'queued' && user?.role === 'healthcare_worker'"
            class="text-sm text-gray-500 mt-2"
          >
            Accept first to start messaging...
          </p>
        </div>
      </UContainer>
    </div>

    <DashboardAcceptChatModal
      v-model="showAcceptModal"
      :chat="chat || null"
      @accept="acceptChat"
      @cancel="showAcceptModal = false"
    />

    <DashboardCloseChatModal
      v-model="showCloseModal"
      :chat="chat || null"
      @close="closeChat"
      @cancel="showCloseModal = false"
    />
  </div>
</template>
