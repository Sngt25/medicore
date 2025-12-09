<script setup lang="ts">
interface Chat {
  id: string
  patient?: { name: string, avatar?: string }
  initialDescription?: string
}

interface Props {
  chat: Chat | null
}

defineProps<Props>()

const emit = defineEmits<{
  accept: []
  cancel: []
}>()

const model = defineModel<boolean>({ required: true })
</script>

<template>
  <UModal v-model:open="model">
    <template #content>
      <div class="p-6">
        <div class="flex items-start gap-4">
          <div class="p-3 bg-primary/10 rounded-full">
            <UIcon
              name="i-heroicons-chat-bubble-left-right"
              class="w-6 h-6 text-primary"
            />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold mb-2">
              Accept Chat Request?
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You are about to accept a chat request from <strong>{{ chat?.patient?.name }}</strong>.
            </p>
            <div
              v-if="chat?.initialDescription"
              class="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg mb-4"
            >
              <p class="text-sm font-medium mb-1">
                Patient's Message:
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ chat.initialDescription }}
              </p>
            </div>
            <div class="flex gap-2 justify-end">
              <UButton
                color="neutral"
                variant="outline"
                @click="emit('cancel')"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                @click="emit('accept')"
              >
                Accept Chat
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
