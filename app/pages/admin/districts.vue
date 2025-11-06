<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'

const UButton = resolveComponent('UButton')
const UCheckbox = resolveComponent('UCheckbox')

interface District {
  id: string
  name: string
  address?: string
  contactInfo?: string
  createdAt: Date
}

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

const { data: districts, refresh: refreshDistricts }
  = useFetch<District[]>('/api/districts')

const toast = useToast()
const table = useTemplateRef('table')

const isDistrictModalOpen = ref(false)
const selectedDistrict = ref<District | null>(null)
const deleteModalRef = ref()
const districtToDelete = ref<District | null>(null)

const columnFilters = ref([])
const columnVisibility = ref({})
const rowSelection = ref({})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const columns: TableColumn<District>[] = [
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
    }
  },
  {
    accessorKey: 'address',
    header: 'Address'
  },
  {
    accessorKey: 'contactInfo',
    header: 'Contact Info'
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
          onClick: () => openDistrictModal(row.original)
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

function openDistrictModal(district?: District) {
  selectedDistrict.value = district || null
  isDistrictModalOpen.value = true
}

function openDeleteModal(district: District) {
  districtToDelete.value = district
  deleteModalRef.value?.open()
}

async function handleDelete() {
  if (!districtToDelete.value) return

  try {
    await $fetch(`/api/districts/${districtToDelete.value.id}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'District deleted', color: 'warning' })
    refreshDistricts()
    districtToDelete.value = null
  }
  catch (error: unknown) {
    toast.add({
      title: 'Error',
      description:
        error instanceof Error ? error.message : 'Failed to delete district',
      color: 'error'
    })
  }
}

function handleDistrictSaved() {
  refreshDistricts()
  isDistrictModalOpen.value = false
}
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Districts">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>

      <template #right>
        <UButton
          icon="i-heroicons-plus"
          label="New District"
          @click="openDistrictModal()"
        />
      </template>
    </UDashboardNavbar>

    <div class="flex flex-col gap-4 p-4">
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          :model-value="(table?.tableApi?.getColumn('name')?.getFilterValue() as string)"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filter districts..."
          @update:model-value="
            table?.tableApi?.getColumn('name')?.setFilterValue($event)
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
        :data="districts || []"
        :columns="columns"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
      >
        <template #name-cell="{ row }">
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-building-office-2"
              class="size-5 text-primary"
            />
            <span class="font-medium">{{ row.original.name }}</span>
          </div>
        </template>

        <template #address-cell="{ row }">
          <span class="text-muted">
            {{ row.original.address || 'N/A' }}
          </span>
        </template>

        <template #contactInfo-cell="{ row }">
          <span class="text-muted">
            {{ row.original.contactInfo || 'N/A' }}
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

    <AdminDistrictModal
      v-model:open="isDistrictModalOpen"
      :district="selectedDistrict"
      @save="handleDistrictSaved"
    />

    <AdminDeleteModal
      ref="deleteModalRef"
      entity-type="district"
      :entity-name="districtToDelete?.name || ''"
      @delete="handleDelete"
    />
  </UDashboardPanel>
</template>
