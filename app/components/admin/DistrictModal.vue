<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
const props = defineProps<{
  open: boolean
  district?: any
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [district: any]
}>()

const toast = useToast()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const districtForm = reactive({
  name: '',
  address: '',
  contactInfo: ''
})

watch(
  () => props.district,
  (newDistrict) => {
    if (newDistrict) {
      districtForm.name = newDistrict.name
      districtForm.address = newDistrict.address || ''
      districtForm.contactInfo = newDistrict.contactInfo || ''
    }
    else {
      districtForm.name = ''
      districtForm.address = ''
      districtForm.contactInfo = ''
    }
  },
  { immediate: true }
)

async function handleSave() {
  try {
    if (props.district) {
      await $fetch(`/api/districts/${props.district.id}`, {
        method: 'PATCH',
        body: districtForm
      })
      toast.add({ title: 'District updated', color: 'success' })
    }
    else {
      await $fetch('/api/districts', {
        method: 'POST',
        body: districtForm
      })
      toast.add({ title: 'District created', color: 'success' })
    }

    emit('save', districtForm)
    isOpen.value = false
  }
  catch (error: unknown) {
    toast.add({
      title: 'Error',
      description:
        error instanceof Error ? error.message : 'Failed to save district',
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
    :title="district ? 'Edit District' : 'New District'"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField
          label="District Name"
          required
        >
          <UInput
            v-model="districtForm.name"
            placeholder="e.g., Central District Health Center"
          />
        </UFormField>

        <UFormField label="Address">
          <UTextarea
            v-model="districtForm.address"
            :rows="2"
            placeholder="Full address (optional)"
          />
        </UFormField>

        <UFormField label="Contact Information">
          <UInput
            v-model="districtForm.contactInfo"
            placeholder="Phone, email, or other contact info (optional)"
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
        :disabled="!districtForm.name"
        @click="handleSave"
      >
        {{ district ? 'Update' : 'Create' }}
      </UButton>
    </template>
  </UModal>
</template>
