<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'

const UButton = resolveComponent('UButton')
const UCheckbox = resolveComponent('UCheckbox')
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')

interface Worker {
  id: string
  name: string
  email: string
  districtId?: string
  districtName?: string
  avatar?: string
  role: string
  verified: boolean
  createdAt: Date
}

interface District {
  id: string
  name: string
}

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

const { data: workers, refresh: refreshWorkers, status } = useFetch<Worker[]>(
  '/api/users',
  {
    lazy: true,
    query: { role: 'healthcare_worker' }
  }
)
const { data: districts } = useFetch<District[]>('/api/districts')

const table = useTemplateRef('table')
const toast = useToast()

const isWorkerModalOpen = ref(false)
const selectedWorker = ref<Worker | null>(null)
const deleteModalRef = ref()
const workerToDelete = ref<Worker | null>(null)

const columnFilters = ref([
  {
    id: 'email',
    value: ''
  }
])
const columnVisibility = ref()
const rowSelection = ref({})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const statusFilter = ref('all')

const columns: TableColumn<Worker>[] = [
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
    accessorKey: 'name',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Name',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          src: row.original.avatar,
          alt: row.original.name,
          size: 'lg'
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium' }, row.original.name),
          h('p', { class: 'text-muted' }, row.original.email)
        ])
      ])
    }
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Email',
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
    id: 'district',
    header: 'District',
    cell: ({ row }) => row.original.districtName || 'Unassigned'
  },
  {
    id: 'status',
    header: 'Status',
    filterFn: 'equals',
    cell: ({ row }) => {
      const hasDistrict = !!row.original.districtId
      const color = hasDistrict ? ('success' as const) : ('neutral' as const)

      return h(
        UBadge,
        {
          class: 'capitalize',
          variant: 'subtle',
          color
        },
        () => (hasDistrict ? 'Active' : 'Pending')
      )
    }
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
          onClick: () => openWorkerModal(row.original)
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

watch(
  () => statusFilter.value,
  (newVal) => {
    if (!table?.value?.tableApi) return

    const statusColumn = table.value.tableApi.getColumn('status')
    if (!statusColumn) return

    if (newVal === 'all') {
      statusColumn.setFilterValue(undefined)
    }
    else {
      statusColumn.setFilterValue(newVal)
    }
  }
)

function openWorkerModal(worker?: Worker) {
  selectedWorker.value = worker || null
  isWorkerModalOpen.value = true
}

function openDeleteModal(worker: Worker) {
  workerToDelete.value = worker
  deleteModalRef.value?.open()
}

async function handleDelete() {
  if (!workerToDelete.value) return

  try {
    await $fetch(`/api/users/${workerToDelete.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Worker deleted', color: 'warning' })
    refreshWorkers()
    workerToDelete.value = null
  }
  catch (error: unknown) {
    toast.add({
      title: 'Error',
      description:
        error instanceof Error ? error.message : 'Failed to delete worker',
      color: 'error'
    })
  }
}

function handleWorkerSaved() {
  refreshWorkers()
  isWorkerModalOpen.value = false
}
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Healthcare Workers">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>

      <template #right>
        <UButton
          icon="i-heroicons-plus"
          label="New Worker"
          @click="openWorkerModal()"
        />
      </template>
    </UDashboardNavbar>

    <div class="flex flex-col gap-4 p-4">
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          :model-value="(table?.tableApi?.getColumn('email')?.getFilterValue() as string)"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filter emails..."
          @update:model-value="
            table?.tableApi?.getColumn('email')?.setFilterValue($event)
          "
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

          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Pending', value: 'pending' }
            ]"
            :ui="{
              trailingIcon:
                'group-data-[state=open]:rotate-180 transition-transform duration-200'
            }"
            placeholder="Filter status"
            class="min-w-28"
          />
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
        :data="workers"
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
      />

      <div
        class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto"
      >
        <div class="text-sm text-muted">
          {{
            table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
          }}
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

    <AdminWorkerModal
      v-model:open="isWorkerModalOpen"
      :worker="selectedWorker"
      :districts="districts || []"
      @save="handleWorkerSaved"
    />

    <AdminDeleteModal
      ref="deleteModalRef"
      entity-type="worker"
      :entity-name="workerToDelete?.name || ''"
      @delete="handleDelete"
    />
  </UDashboardPanel>
</template>
