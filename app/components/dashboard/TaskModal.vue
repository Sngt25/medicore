<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
const props = defineProps<{
  open: boolean
  task?: any
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [task: any]
}>()

const toast = useToast()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const taskForm = reactive({
  title: '',
  description: '',
  patientId: '',
  chatId: '',
  status: 'pending' as 'pending' | 'in_progress' | 'completed',
  dueDate: ''
})

watch(
  () => props.task,
  (newTask) => {
    if (newTask) {
      taskForm.title = newTask.title
      taskForm.description = newTask.description || ''
      taskForm.patientId = newTask.patientId || ''
      taskForm.chatId = newTask.chatId || ''
      taskForm.status = newTask.status
      taskForm.dueDate = newTask.dueDate || ''
    }
    else {
      taskForm.title = ''
      taskForm.description = ''
      taskForm.patientId = ''
      taskForm.chatId = ''
      taskForm.status = 'pending'
      taskForm.dueDate = ''
    }
  },
  { immediate: true }
)

async function handleSave() {
  try {
    if (props.task) {
      await $fetch(`/api/tasks/${props.task.id}`, {
        method: 'PATCH',
        body: taskForm
      })
      toast.add({ title: 'Task updated', color: 'success' })
    }
    else {
      await $fetch('/api/tasks', {
        method: 'POST',
        body: taskForm
      })
      toast.add({ title: 'Task created', color: 'success' })
    }

    emit('save', taskForm)
    isOpen.value = false
  }
  catch (error: unknown) {
    toast.add({
      title: 'Error',
      description:
        error instanceof Error ? error.message : 'Failed to save task',
      color: 'error'
    })
  }
}

function handleClose() {
  isOpen.value = false
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="task ? 'Edit Task' : 'New Task'"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField
          label="Title"
          required
        >
          <UInput
            v-model="taskForm.title"
            placeholder="Task title"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Description">
          <UTextarea
            v-model="taskForm.description"
            :rows="3"
            placeholder="Task description (optional)"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Status"
          required
        >
          <USelect
            v-model="taskForm.status"
            :options="[
              { label: 'Pending', value: 'pending' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Completed', value: 'completed' }
            ]"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Due Date">
          <UInput
            v-model="taskForm.dueDate"
            type="date"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Patient ID">
          <UInput
            v-model="taskForm.patientId"
            placeholder="Patient ID (optional)"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Chat ID">
          <UInput
            v-model="taskForm.chatId"
            placeholder="Chat ID (optional)"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="outline"
        @click="handleClose"
      >
        Cancel
      </UButton>
      <UButton
        color="primary"
        :disabled="!taskForm.title"
        @click="handleSave"
      >
        {{ task ? 'Update' : 'Create' }}
      </UButton>
    </template>
  </UModal>
</template>
