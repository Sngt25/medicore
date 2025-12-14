<script setup lang="ts">
interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueAt?: Date
  linkedChatId?: string
}

const props = defineProps<{
  chatId: string
  readOnly?: boolean
}>()

const toast = useToast()
const isExpanded = ref(true)
const isTaskModalOpen = ref(false)
const selectedTask = ref<Task | null>(null)

const { data: tasks, refresh: refreshTasks } = await useFetch<Task[]>('/api/tasks', {
  query: { chatId: props.chatId },
  key: `chat-tasks-${props.chatId}`
})

function openTaskModal(task?: Task) {
  selectedTask.value = task || null
  isTaskModalOpen.value = true
}

function handleTaskSaved() {
  refreshTasks()
  isTaskModalOpen.value = false
}

async function toggleTaskStatus(task: Task) {
  const newStatus = task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done'
  
  try {
    await $fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      body: { status: newStatus }
    })
    refreshTasks()
  }
  catch (error: unknown) {
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to update task',
      color: 'error'
    })
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'done':
      return 'success'
    case 'in_progress':
      return 'info'
    default:
      return 'neutral'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'error'
    case 'medium':
      return 'warning'
    default:
      return 'neutral'
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-heroicons-clipboard-document-list"
            class="size-5 text-primary"
          />
          <h3 class="font-semibold">
            Tasks
          </h3>
          <UBadge
            v-if="tasks && tasks.length > 0"
            size="xs"
            color="primary"
            variant="subtle"
          >
            {{ tasks.length }}
          </UBadge>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            v-if="!readOnly"
            icon="i-heroicons-plus"
            size="xs"
            variant="soft"
            @click="openTaskModal()"
          >
            New
          </UButton>
          <UButton
            :icon="isExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
            variant="ghost"
            color="neutral"
            size="xs"
            square
            @click="isExpanded = !isExpanded"
          />
        </div>
      </div>
    </template>

    <div
      v-if="isExpanded"
      class="space-y-2"
    >
      <div
        v-for="task in tasks"
        :key="task.id"
        class="p-3 border border-default rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div class="flex items-start gap-3">
          <UCheckbox
            v-if="!readOnly"
            :model-value="task.status === 'done'"
            class="mt-0.5"
            @update:model-value="toggleTaskStatus(task)"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <h4
                :class="[
                  'font-medium text-sm',
                  task.status === 'done' && 'line-through text-muted'
                ]"
              >
                {{ task.title }}
              </h4>
              <UButton
                v-if="!readOnly"
                icon="i-heroicons-pencil"
                variant="ghost"
                color="neutral"
                size="xs"
                square
                @click="openTaskModal(task)"
              />
            </div>
            <p
              v-if="task.description"
              class="text-xs text-muted mt-1"
            >
              {{ task.description }}
            </p>
            <div class="flex items-center gap-2 mt-2 flex-wrap">
              <UBadge
                :color="getStatusColor(task.status)"
                size="xs"
              >
                {{ task.status === 'in_progress' ? 'In Progress' : task.status === 'done' ? 'Done' : 'To Do' }}
              </UBadge>
              <UBadge
                :color="getPriorityColor(task.priority)"
                size="xs"
                variant="subtle"
              >
                {{ task.priority }}
              </UBadge>
              <span
                v-if="task.dueAt"
                class="text-xs text-muted"
              >
                Due {{ new Date(task.dueAt).toLocaleDateString() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <UEmpty
        v-if="!tasks || tasks.length === 0"
        icon="i-heroicons-clipboard-document-list"
        :title="readOnly ? 'No tasks' : 'No tasks'"
        :description="readOnly ? 'No tasks were created for this chat' : 'Create a task to track work for this chat'"
        class="py-6"
      />
    </div>

    <DashboardTaskModal
      v-if="!readOnly"
      v-model:open="isTaskModalOpen"
      :task="selectedTask"
      :chat-id="chatId"
      @save="handleTaskSaved"
    />
  </UCard>
</template>
