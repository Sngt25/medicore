<script setup lang="ts">
interface Props {
  entityType: string
  entityName: string
  count?: number
}

withDefaults(defineProps<Props>(), {
  count: 1
})

const emit = defineEmits<{
  delete: []
}>()

const open = ref(false)

defineExpose({
  open: () => {
    open.value = true
  },
  close: () => {
    open.value = false
  }
})

function onCancel() {
  open.value = false
}

function onDelete() {
  emit('delete')
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Delete ${count > 1 ? `${count} ${entityType}s` : entityType}`"
    :description="`Are you sure you want to delete ${
      count > 1 ? `these ${count} ${entityType}s` : entityName
    }? This action cannot be undone.`"
  >
    <slot />

    <template #body>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="subtle"
          @click="onCancel"
        />
        <UButton
          label="Delete"
          color="error"
          variant="solid"
          @click="onDelete"
        />
      </div>
    </template>
  </UModal>
</template>
