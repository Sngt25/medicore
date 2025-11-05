<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
defineProps<{
  workers: any[]
  districts: any[]
}>()

const emit = defineEmits<{
  refresh: []
}>()

// Worker management state
const isWorkerModalOpen = ref(false)
const selectedWorker = ref<any>(null)

const workerColumns = [
  { id: 'name', accessorKey: 'name', header: 'Name' },
  { id: 'email', accessorKey: 'email', header: 'Email' },
  { id: 'district', header: 'District' },
  { id: 'status', header: 'Status' },
  { id: 'actions', header: '' }
]

function openWorkerModal(worker?: any) {
  selectedWorker.value = worker || null
  isWorkerModalOpen.value = true
}

function handleWorkerSaved() {
  emit('refresh')
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">
          Healthcare Workers
        </h2>
        <UButton
          icon="i-heroicons-plus"
          @click="openWorkerModal()"
        >
          New Worker
        </UButton>
      </div>
    </template>

    <UTable
      :data="workers || []"
      :columns="workerColumns"
    >
      <template #name-cell="{ row }">
        <div class="flex items-center gap-2">
          <UAvatar
            :src="row.original.avatar"
            :alt="row.original.name"
            size="xs"
          />
          <span>{{ row.original.name }}</span>
        </div>
      </template>

      <template #email-cell="{ row }">
        <span class="text-gray-600 dark:text-gray-400">{{
          row.original.email
        }}</span>
      </template>

      <template #district-cell="{ row }">
        <span class="text-gray-600 dark:text-gray-400">{{
          row.original.district?.name || 'Unassigned'
        }}</span>
      </template>

      <template #status-cell="{ row }">
        <UBadge
          :color="row.original.districtId ? 'success' : 'neutral'"
          size="xs"
        >
          {{ row.original.districtId ? 'Active' : 'Pending' }}
        </UBadge>
      </template>

      <template #actions-cell="{ row }">
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-heroicons-pencil"
          @click="openWorkerModal(row.original)"
        />
      </template>
    </UTable>

    <UEmpty
      v-if="!workers || workers.length === 0"
      icon="i-heroicons-user-group"
      title="No healthcare workers"
      description="Add healthcare workers to handle patient conversations"
    />

    <!-- Worker Modal -->
    <AdminWorkerModal
      :open="isWorkerModalOpen"
      :worker="selectedWorker"
      :districts="districts"
      @update:open="isWorkerModalOpen = $event"
      @save="handleWorkerSaved"
    />
  </UCard>
</template>
