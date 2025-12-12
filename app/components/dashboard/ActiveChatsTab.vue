<script setup lang="ts">
interface Chat {
  id: string
  patient?: { name: string, avatar?: string }
  district?: { name: string }
  initialDescription?: string
  createdAt: Date
}

interface Props {
  chats: Chat[] | null
}

defineProps<Props>()

const emit = defineEmits<{
  close: [chatId: string]
}>()
</script>

<template>
  <div class="grid gap-4">
    <UCard
      v-for="chat in chats"
      :key="chat.id"
    >
      <div class="space-y-3">
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
              variant="subtle"
              size="sm"
            >
              Open Chat
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              @click="emit('close', chat.id)"
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
      v-if="!chats || chats.length === 0"
      icon="i-heroicons-chat-bubble-left-right"
      title="No active conversations"
      description="Accept a chat from the queue to start"
    />
  </div>
</template>
