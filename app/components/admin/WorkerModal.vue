<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
const props = defineProps<{
  open: boolean
  worker?: any
  districts: any[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': []
}>()

const toast = useToast()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const workerForm = reactive({
  email: '',
  name: '',
  districtId: ''
})

// Watch for worker changes to populate form
watch(
  () => props.worker,
  (newWorker) => {
    if (newWorker) {
      workerForm.email = newWorker.email
      workerForm.name = newWorker.name
      workerForm.districtId = newWorker.districtId || ''
    }
    else {
      workerForm.email = ''
      workerForm.name = ''
      workerForm.districtId = ''
    }
  },
  { immediate: true }
)

async function handleSave() {
  try {
    if (props.worker) {
      await $fetch(`/api/users/${props.worker.id}`, {
        method: 'PATCH',
        body: { districtId: workerForm.districtId }
      })
      toast.add({ title: 'Worker updated', color: 'success' })
    }
    else {
      await $fetch('/api/users', {
        method: 'POST',
        body: {
          ...workerForm,
          role: 'healthcare_worker'
        }
      })
      toast.add({ title: 'Worker created', color: 'success' })
    }

    emit('save')
    isOpen.value = false
  }
  catch (error: unknown) {
    toast.add({
      title: 'Error',
      description:
        error instanceof Error ? error.message : 'Failed to save worker',
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
    :title="worker ? 'Edit Healthcare Worker' : 'New Healthcare Worker'"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField
          label="Email"
          required
        >
          <UInput
            v-model="workerForm.email"
            type="email"
            placeholder="worker@example.com"
            :disabled="!!worker"
          />
        </UFormField>

        <UFormField
          label="Name"
          :required="!worker"
        >
          <UInput
            v-model="workerForm.name"
            placeholder="Full name"
            :disabled="!!worker"
          />
        </UFormField>

        <UFormField label="Assigned District">
          <USelect
            v-model="workerForm.districtId"
            :options="[
              { label: 'Unassigned', value: '' },
              ...(districts || []).map((d: any) => ({
                label: d.name,
                value: d.id
              }))
            ]"
          />
        </UFormField>

        <UAlert
          v-if="!worker"
          icon="i-heroicons-information-circle"
          color="info"
          variant="soft"
          title="Note"
          description="The worker will be created when they first sign in with Google using this email."
        />
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
        :disabled="!workerForm.email || (!worker && !workerForm.name)"
        @click="handleSave"
      >
        {{ worker ? 'Update' : 'Create' }}
      </UButton>
    </template>
  </UModal>
</template>
