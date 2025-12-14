<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
const props = defineProps<{
  open: boolean
  task?: any
  chatId?: string
  patientId?: string
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
  linkedPatientId: '',
  linkedChatId: '',
  status: 'todo' as 'todo' | 'in_progress' | 'done',
  dueAt: '',
  priority: 'medium' as 'low' | 'medium' | 'high'
})

watch(
  () => [props.task, props.chatId, props.patientId, props.open],
  ([newTask, newChatId, newPatientId]) => {
    if (newTask) {
      taskForm.title = newTask.title
      taskForm.description = newTask.description || ''
      taskForm.linkedPatientId = newTask.linkedPatientId || ''
      taskForm.linkedChatId = newTask.linkedChatId || ''
      taskForm.status = newTask.status
      const dueAtDate = newTask.dueAt ? new Date(newTask.dueAt).toISOString().split('T')[0] : ''
      taskForm.dueAt = dueAtDate || ''
      taskForm.priority = newTask.priority || 'medium'
    }
    else {
      taskForm.title = ''
      taskForm.description = ''
      taskForm.linkedPatientId = (newPatientId as string | undefined) || ''
      taskForm.linkedChatId = (newChatId as string | undefined) || ''
      taskForm.status = 'todo'
      taskForm.dueAt = ''
      taskForm.priority = 'medium'
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

        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Status"
            required
          >
            <USelect
              v-model="taskForm.status"
              :items="[
                { id: 'todo', label: 'To Do' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'done', label: 'Done' }
              ]"
              value-key="id"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Priority"
            required
          >
            <USelect
              v-model="taskForm.priority"
              :items="[
                { id: 'low', label: 'Low' },
                { id: 'medium', label: 'Medium' },
                { id: 'high', label: 'High' }
              ]"
              value-key="id"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Due Date">
          <UInput
            v-model="taskForm.dueAt"
            type="date"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="taskForm.linkedChatId"
          label="Linked Chat"
        >
          <UInput
            :model-value="taskForm.linkedChatId"
            disabled
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="taskForm.linkedPatientId"
          label="Linked Patient"
        >
          <UInput
            :model-value="taskForm.linkedPatientId"
            disabled
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
