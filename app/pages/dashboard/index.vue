<script setup lang="ts">
const toast = useToast()
const ws = ref<WebSocket | null>(null)
const activeTab = ref('queue')

// Fetch queued and active chats
const { data: queuedChats, refresh: refreshQueue } = await useFetch(
  '/api/chats',
  {
    query: { status: 'queued' }
  }
)

const { data: activeChats, refresh: refreshActive } = await useFetch(
  '/api/chats',
  {
    query: { status: 'active' }
  }
)

const { data: tasks, refresh: refreshTasks } = await useFetch('/api/tasks')

definePageMeta({
  middleware: 'auth'
})

// WebSocket connection for real-time updates
onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  if (ws.value) {
    ws.value.close()
  }
})

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws.value = new WebSocket(`${protocol}//${window.location.host}/ws/chat`)

  ws.value.onopen = () => {
    console.log('WebSocket connected')
    // Subscribe to district queue updates (worker will receive all districts they handle)
  }

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log('WebSocket message:', data)

    if (data.type === 'new_chat' || data.type === 'chat_assigned') {
      refreshQueue()
      refreshActive()
    }
  }

  ws.value.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  ws.value.onclose = () => {
    console.log('WebSocket disconnected')
    setTimeout(connectWebSocket, 3000)
  }
}

// Accept a chat from the queue
async function acceptChat(chatId: string) {
  try {
    await $fetch(`/api/chats/${chatId}`, {
      method: 'PATCH',
      body: { status: 'active' }
    })

    toast.add({
      title: 'Chat accepted',
      description: 'You are now connected with the patient',
      color: 'green'
    })

    await Promise.all([refreshQueue(), refreshActive()])
    activeTab.value = 'active'
  }
  catch (error: unknown) {
    toast.add({
      title: 'Error',
      description:
        error instanceof Error ? error.message : 'Failed to accept chat',
      color: 'red'
    })
  }
}

// Close a chat
async function closeChat(chatId: string) {
  try {
    await $fetch(`/api/chats/${chatId}`, {
      method: 'PATCH',
      body: { status: 'closed' }
    })

    toast.add({
      title: 'Chat closed',
      description: 'The conversation has been closed',
      color: 'blue'
    })

    await refreshActive()
  }
  catch (error: unknown) {
    toast.add({
      title: 'Error',
      description:
        error instanceof Error ? error.message : 'Failed to close chat',
      color: 'red'
    })
  }
}

// Task management
const isTaskModalOpen = ref(false)
const selectedTask = ref<any>(null)
const taskForm = reactive({
  title: '',
  description: '',
  patientId: '',
  chatId: '',
  status: 'pending',
  dueDate: ''
})

function openTaskModal(task?: any) {
  if (task) {
    selectedTask.value = task
    taskForm.title = task.title
    taskForm.description = task.description || ''
    taskForm.patientId = task.patientId
    taskForm.chatId = task.chatId || ''
    taskForm.status = task.status
    taskForm.dueDate = task.dueDate || ''
  }
  else {
    selectedTask.value = null
    taskForm.title = ''
    taskForm.description = ''
    taskForm.patientId = ''
    taskForm.chatId = ''
    taskForm.status = 'pending'
    taskForm.dueDate = ''
  }
  isTaskModalOpen.value = true
}

async function saveTask() {
  try {
    if (selectedTask.value) {
      await $fetch(`/api/tasks/${selectedTask.value.id}`, {
        method: 'PATCH',
        body: taskForm
      })
      toast.add({ title: 'Task updated', color: 'green' })
    }
    else {
      await $fetch('/api/tasks', {
        method: 'POST',
        body: taskForm
      })
      toast.add({ title: 'Task created', color: 'green' })
    }

    await refreshTasks()
    isTaskModalOpen.value = false
  }
  catch (error: unknown) {
    toast.add({
      title: 'Error',
      description:
        error instanceof Error ? error.message : 'Failed to save task',
      color: 'red'
    })
  }
}

async function deleteTask(taskId: string) {
  if (!confirm('Are you sure you want to delete this task?')) return

  try {
    await $fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    toast.add({ title: 'Task deleted', color: 'blue' })
    await refreshTasks()
  }
  catch (error: unknown) {
    toast.add({
      title: 'Error',
      description:
        error instanceof Error ? error.message : 'Failed to delete task',
      color: 'red'
    })
  }
}

const queueColumns = [
  { key: 'patient', label: 'Patient' },
  { key: 'district', label: 'District' },
  { key: 'description', label: 'Description' },
  { key: 'created', label: 'Created' },
  { key: 'actions', label: '' }
]

const taskColumns = [
  { key: 'title', label: 'Task' },
  { key: 'patient', label: 'Patient' },
  { key: 'status', label: 'Status' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'actions', label: '' }
]
</script>

<template>
  <UDashboardLayout>
    <UDashboardPanel>
      <UDashboardNavbar title="Healthcare Worker Dashboard">
        <template #right>
          <UButton
            to="/"
            color="gray"
            variant="ghost"
            icon="i-heroicons-home"
          >
            Home
          </UButton>
        </template>
      </UDashboardNavbar>

      <UDashboardPanelContent>
        <div class="space-y-6">
          <!-- Stats -->
          <div class="grid gap-4 md:grid-cols-3">
            <UCard>
              <div class="flex items-center gap-3">
                <div class="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                  <UIcon
                    name="i-heroicons-clock"
                    class="w-6 h-6 text-amber-600"
                  />
                </div>
                <div>
                  <p class="text-2xl font-bold">
                    {{ queuedChats?.length || 0 }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Queued Chats
                  </p>
                </div>
              </div>
            </UCard>

            <UCard>
              <div class="flex items-center gap-3">
                <div class="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <UIcon
                    name="i-heroicons-chat-bubble-left-right"
                    class="w-6 h-6 text-green-600"
                  />
                </div>
                <div>
                  <p class="text-2xl font-bold">
                    {{ activeChats?.length || 0 }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Active Conversations
                  </p>
                </div>
              </div>
            </UCard>

            <UCard>
              <div class="flex items-center gap-3">
                <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <UIcon
                    name="i-heroicons-clipboard-document-list"
                    class="w-6 h-6 text-blue-600"
                  />
                </div>
                <div>
                  <p class="text-2xl font-bold">
                    {{ tasks?.length || 0 }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Active Tasks
                  </p>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Tabs -->
          <UTabs
            v-model="activeTab"
            :items="[
              { label: 'Queue', value: 'queue', icon: 'i-heroicons-clock' },
              {
                label: 'Active Chats',
                value: 'active',
                icon: 'i-heroicons-chat-bubble-left-right'
              },
              {
                label: 'Tasks',
                value: 'tasks',
                icon: 'i-heroicons-clipboard-document-list'
              }
            ]"
          >
            <template #queue>
              <UCard>
                <template #header>
                  <h3 class="font-semibold">
                    Queued Chats
                  </h3>
                </template>

                <UTable
                  :columns="queueColumns"
                  :rows="queuedChats || []"
                >
                  <template #patient-data="{ row }">
                    <div class="flex items-center gap-2">
                      <UAvatar
                        :src="row.patient?.avatar"
                        :alt="row.patient?.name"
                        size="xs"
                      />
                      <span>{{ row.patient?.name }}</span>
                    </div>
                  </template>

                  <template #district-data="{ row }">
                    {{ row.district?.name }}
                  </template>

                  <template #description-data="{ row }">
                    <p class="max-w-xs truncate">
                      {{ row.initialDescription }}
                    </p>
                  </template>

                  <template #created-data="{ row }">
                    {{ new Date(row.createdAt).toLocaleString() }}
                  </template>

                  <template #actions-data="{ row }">
                    <UButton
                      color="primary"
                      size="xs"
                      @click="acceptChat(row.id)"
                    >
                      Accept
                    </UButton>
                  </template>
                </UTable>

                <UEmpty
                  v-if="!queuedChats || queuedChats.length === 0"
                  icon="i-heroicons-inbox"
                  title="No queued chats"
                  description="New patient conversations will appear here"
                />
              </UCard>
            </template>

            <template #active>
              <div class="grid gap-4">
                <UCard
                  v-for="chat in activeChats"
                  :key="chat.id"
                  :ui="{ body: { padding: 'p-0' } }"
                >
                  <div class="p-4 space-y-3">
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
                        <UButton
                          color="gray"
                          variant="outline"
                          size="sm"
                          @click="closeChat(chat.id)"
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
                  v-if="!activeChats || activeChats.length === 0"
                  icon="i-heroicons-chat-bubble-left-right"
                  title="No active conversations"
                  description="Accept a chat from the queue to start"
                />
              </div>
            </template>

            <template #tasks>
              <UCard>
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold">
                      Tasks
                    </h3>
                    <UButton
                      icon="i-heroicons-plus"
                      size="sm"
                      @click="openTaskModal()"
                    >
                      New Task
                    </UButton>
                  </div>
                </template>

                <UTable
                  :columns="taskColumns"
                  :rows="tasks || []"
                >
                  <template #title-data="{ row }">
                    <div>
                      <p class="font-medium">
                        {{ row.title }}
                      </p>
                      <p
                        v-if="row.description"
                        class="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs"
                      >
                        {{ row.description }}
                      </p>
                    </div>
                  </template>

                  <template #patient-data="{ row }">
                    {{ row.patient?.name || 'N/A' }}
                  </template>

                  <template #status-data="{ row }">
                    <UBadge
                      :color="
                        row.status === 'completed'
                          ? 'green'
                          : row.status === 'in_progress'
                            ? 'blue'
                            : 'gray'
                      "
                      size="xs"
                    >
                      {{ row.status.replace('_', ' ') }}
                    </UBadge>
                  </template>

                  <template #dueDate-data="{ row }">
                    {{
                      row.dueDate
                        ? new Date(row.dueDate).toLocaleDateString()
                        : 'N/A'
                    }}
                  </template>

                  <template #actions-data="{ row }">
                    <div class="flex gap-1">
                      <UButton
                        color="gray"
                        variant="ghost"
                        size="xs"
                        icon="i-heroicons-pencil"
                        @click="openTaskModal(row)"
                      />
                      <UButton
                        color="red"
                        variant="ghost"
                        size="xs"
                        icon="i-heroicons-trash"
                        @click="deleteTask(row.id)"
                      />
                    </div>
                  </template>
                </UTable>

                <UEmpty
                  v-if="!tasks || tasks.length === 0"
                  icon="i-heroicons-clipboard-document-list"
                  title="No tasks"
                  description="Create a task to track your work"
                />
              </UCard>
            </template>
          </UTabs>
        </div>
      </UDashboardPanelContent>
    </UDashboardPanel>

    <!-- Task Modal -->
    <UModal
      v-model="isTaskModalOpen"
      prevent-close
    >
      <UCard>
        <template #header>
          <h3 class="font-semibold">
            {{ selectedTask ? 'Edit Task' : 'New Task' }}
          </h3>
        </template>

        <div class="space-y-4">
          <UFormField
            label="Title"
            required
          >
            <UInput
              v-model="taskForm.title"
              placeholder="Task title"
            />
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              v-model="taskForm.description"
              :rows="3"
              placeholder="Task description (optional)"
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
            />
          </UFormField>

          <UFormField label="Due Date">
            <UInput
              v-model="taskForm.dueDate"
              type="date"
            />
          </UFormField>

          <UFormField label="Patient ID">
            <UInput
              v-model="taskForm.patientId"
              placeholder="Patient ID (optional)"
            />
          </UFormField>

          <UFormField label="Chat ID">
            <UInput
              v-model="taskForm.chatId"
              placeholder="Chat ID (optional)"
            />
          </UFormField>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="gray"
              variant="outline"
              @click="isTaskModalOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              :disabled="!taskForm.title"
              @click="saveTask"
            >
              {{ selectedTask ? 'Update' : 'Create' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </UDashboardLayout>
</template>
