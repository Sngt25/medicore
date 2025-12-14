<script setup lang="ts">
defineProps<{
  chatId?: string
  patientId?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'outline' | 'soft' | 'ghost' | 'link' | 'subtle'
  label?: string
  icon?: string
}>()

const isTaskModalOpen = ref(false)

function openTaskModal() {
  isTaskModalOpen.value = true
}

function handleTaskSaved() {
  isTaskModalOpen.value = false
  // Emit event if parent needs to refresh
  emit('taskCreated')
}

const emit = defineEmits<{
  taskCreated: []
}>()
</script>

<template>
  <div>
    <UButton
      :icon="icon || 'i-heroicons-clipboard-document-list'"
      :label="label || 'Create Task'"
      :size="size || 'sm'"
      :variant="variant || 'soft'"
      color="primary"
      @click="openTaskModal"
    />

    <DashboardTaskModal
      v-model:open="isTaskModalOpen"
      :chat-id="chatId"
      :patient-id="patientId"
      @save="handleTaskSaved"
    />
  </div>
</template>
