<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'

const UButton = resolveComponent('UButton')
const UCheckbox = resolveComponent('UCheckbox')

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  linkedPatientId?: string
  linkedChatId?: string
  dueAt?: Date
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
  patient?: {
    id: string
    name: string
    email: string
  } | null
}

definePageMeta({
  middleware: 'healthcare',
  layout: 'healthcare'
})

const { data: tasks, refresh: refreshTasks, status } = useFetch<Task[]>('/api/tasks', {
  lazy: true
})

const toast = useToast()
const table = useTemplateRef('table')

const isTaskModalOpen = ref(false)
const selectedTask = ref<Task | null>(null)
const deleteModalRef = ref()
const taskToDelete = ref<Task | null>(null)

const columnFilters = ref([])
const columnVisibility = ref({})
const rowSelection = ref({})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const titleFilterValue = ref('')

const updateTitleFilter = (value: string) => {
  titleFilterValue.value = value
  table.value?.tableApi?.getColumn('title')?.setFilterValue(value)
}

const columns: TableColumn<Task>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          row.toggleSelected(!!value),
        'ariaLabel': 'Select row'
      })
  },
  {
    accessorKey: 'title',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Task',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    }
  },
  {
    accessorKey: 'patient',
    header: 'Patient'
  },
  {
    accessorKey: 'status',
    header: 'Status'
  },
  {
    accessorKey: 'priority',
    header: 'Priority'
  },
  {
    accessorKey: 'dueAt',
    header: 'Due Date'
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h('div', { class: 'text-right' }, [
        h(UButton, {
          icon: 'i-lucide-pencil',
          color: 'neutral',
          variant: 'ghost',
          size: 'xs',
          square: true,
          onClick: () => openTaskModal(row.original)
        }),
        h(UButton, {
          icon: 'i-lucide-trash',
          color: 'error',
          variant: 'ghost',
          size: 'xs',
          square: true,
          onClick: () => openDeleteModal(row.original)
        })
      ])
    }
  }
]

function openTaskModal(task?: Task) {
  selectedTask.value = task || null
  isTaskModalOpen.value = true
}

function openDeleteModal(task: Task) {
  taskToDelete.value = task
  deleteModalRef.value?.open()
}

async function handleDelete() {
  if (!taskToDelete.value) return

  try {
    await $fetch(`/api/tasks/${taskToDelete.value.id}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'Task deleted', color: 'warning' })
    refreshTasks()
    taskToDelete.value = null
  }
  catch (error: unknown) {
    toast.add({
      title: 'Error',
      description:
        error instanceof Error ? error.message : 'Failed to delete task',
      color: 'error'
    })
  }
}

function handleTaskSaved() {
  refreshTasks()
  isTaskModalOpen.value = false
}
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Tasks">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>

      <template #right>
        <UButton
          icon="i-heroicons-plus"
          label="New Task"
          @click="openTaskModal()"
        />
      </template>
    </UDashboardNavbar>

    <div class="flex flex-col gap-4 p-4">
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="titleFilterValue"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filter tasks..."
          @update:model-value="updateTitleFilter"
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <UButton
            v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
            label="Delete"
            color="error"
            variant="subtle"
            icon="i-lucide-trash"
          >
            <template #trailing>
              <UKbd>
                {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
              </UKbd>
            </template>
          </UButton>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="shrink-0"
        :data="tasks"
        :columns="columns"
        :loading="status === 'pending'"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
      >
        <template #title-cell="{ row }">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-heroicons-clipboard-document-list"
                class="size-5 text-primary"
              />
              <span class="font-medium">{{ row.original.title }}</span>
            </div>
            <span
              v-if="row.original.description"
              class="text-sm text-muted truncate max-w-xs ml-8"
            >
              {{ row.original.description }}
            </span>
          </div>
        </template>

        <template #patient-cell="{ row }">
          <div v-if="row.original.patient">
            <div class="font-medium">
              {{ row.original.patient.name }}
            </div>
            <div class="text-xs text-muted">
              {{ row.original.patient.email }}
            </div>
          </div>
          <span
            v-else
            class="text-muted"
          >
            N/A
          </span>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="
              row.original.status === 'done'
                ? 'success'
                : row.original.status === 'in_progress'
                  ? 'info'
                  : 'neutral'
            "
            size="xs"
          >
            {{ row.original.status === 'in_progress' ? 'In Progress' : row.original.status === 'done' ? 'Done' : 'To Do' }}
          </UBadge>
        </template>

        <template #priority-cell="{ row }">
          <UBadge
            :color="
              row.original.priority === 'high'
                ? 'error'
                : row.original.priority === 'medium'
                  ? 'warning'
                  : 'neutral'
            "
            size="xs"
            variant="subtle"
          >
            {{ row.original.priority }}
          </UBadge>
        </template>

        <template #dueAt-cell="{ row }">
          <span class="text-muted">
            {{
              row.original.dueAt
                ? new Date(row.original.dueAt).toLocaleDateString()
                : 'N/A'
            }}
          </span>
        </template>
      </UTable>

      <div
        class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto"
      >
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }}
          of
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s)
          selected.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="
              (table?.tableApi?.getState().pagination.pageIndex || 0) + 1
            "
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </div>

    <DashboardTaskModal
      v-model:open="isTaskModalOpen"
      :task="selectedTask"
      @save="handleTaskSaved"
    />

    <DashboardDeleteModal
      ref="deleteModalRef"
      entity-type="task"
      :entity-name="taskToDelete?.title || ''"
      @delete="handleDelete"
    />
  </UDashboardPanel>
</template>
