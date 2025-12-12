<script setup lang="ts">
interface Chat {
  id: string
  patient?: { name: string, avatar?: string }
  district?: { name: string }
  initialDescription?: string
  createdAt: Date
  closedAt?: Date | null
}

interface Props {
  chats: Chat[] | null
}

defineProps<Props>()
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
              size="sm"
            >
              Open Chat
            </UButton>
            <UBadge
              color="neutral"
              variant="subtle"
            >
              Closed
            </UBadge>
          </div>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ chat.initialDescription }}
        </p>

        <div class="text-xs text-gray-500 space-y-1">
          <div>Started {{ new Date(chat.createdAt).toLocaleString() }}</div>
          <div v-if="chat.closedAt">
            Closed {{ new Date(chat.closedAt).toLocaleString() }}
          </div>
        </div>
      </div>
    </UCard>

    <UEmpty
      v-if="!chats || chats.length === 0"
      icon="i-heroicons-check-circle"
      title="No closed conversations"
      description="Closed chats will appear here"
    />
  </div>
</template>
