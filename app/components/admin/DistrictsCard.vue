<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
defineProps<{
  districts: any[]
}>()

const emit = defineEmits<{
  refresh: []
}>()

const toast = useToast()

const isDistrictModalOpen = ref(false)
const selectedDistrict = ref<any>(null)

const districtColumns = [
  { id: 'name', accessorKey: 'name', header: 'Name' },
  { id: 'address', accessorKey: 'address', header: 'Address' },
  { id: 'contactInfo', accessorKey: 'contactInfo', header: 'Contact Info' },
  { id: 'actions', header: '' }
]

function openDistrictModal(district?: any) {
  selectedDistrict.value = district || null
  isDistrictModalOpen.value = true
}

async function deleteDistrict(districtId: string) {
  if (
    !confirm(
      'Are you sure you want to delete this district? This action cannot be undone.'
    )
  )
    return

  try {
    await $fetch(`/api/districts/${districtId}`, { method: 'DELETE' })
    toast.add({ title: 'District deleted', color: 'warning' })
    emit('refresh')
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
  emit('refresh')
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">
          Health Districts
        </h2>
        <UButton
          icon="i-heroicons-plus"
          @click="openDistrictModal()"
        >
          New District
        </UButton>
      </div>
    </template>

    <UTable
      :data="districts || []"
      :columns="districtColumns"
    >
      <template #name-cell="{ row }">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-heroicons-building-office-2"
            class="w-5 h-5 text-primary"
          />
          <span class="font-medium">{{ row.original.name }}</span>
        </div>
      </template>

      <template #address-cell="{ row }">
        <span class="text-gray-600 dark:text-gray-400">{{
          row.original.address || 'N/A'
        }}</span>
      </template>

      <template #contactInfo-cell="{ row }">
        <span class="text-gray-600 dark:text-gray-400">{{
          row.original.contactInfo || 'N/A'
        }}</span>
      </template>

      <template #actions-cell="{ row }">
        <div class="flex gap-1">
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-heroicons-pencil"
            @click="openDistrictModal(row.original)"
          />
          <UButton
            color="error"
            variant="ghost"
            size="xs"
            icon="i-heroicons-trash"
            @click="deleteDistrict(row.original.id)"
          />
        </div>
      </template>
    </UTable>

    <UEmpty
      v-if="!districts || districts.length === 0"
      icon="i-heroicons-building-office-2"
      title="No districts"
      description="Create your first health district"
    />

    <AdminDistrictModal
      :open="isDistrictModalOpen"
      :district="selectedDistrict"
      @update:open="isDistrictModalOpen = $event"
      @save="handleDistrictSaved"
    />
  </UCard>
</template>
