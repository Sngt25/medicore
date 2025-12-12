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
  close: []
  cancel: []
}>()

const model = defineModel<boolean>({ required: true })
</script>

<template>
  <UModal v-model:open="model">
    <template #content>
      <div class="p-6">
        <div class="flex items-start gap-4">
          <div class="p-3 bg-error/10 rounded-full">
            <UIcon
              name="i-heroicons-x-circle"
              class="w-6 h-6 text-error"
            />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold mb-2">
              Close Chat?
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to close this conversation with <strong>{{ chat?.patient?.name }}</strong>?
              This action cannot be undone and the patient will no longer be able to send messages.
            </p>
            <div class="flex gap-2 justify-end">
              <UButton
                color="neutral"
                variant="outline"
                @click="emit('cancel')"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                @click="emit('close')"
              >
                Close Chat
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
