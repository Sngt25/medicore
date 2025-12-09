<script setup lang="ts">
interface Chat {
  id: string
  patient?: { name: string, avatar?: string }
  district?: { name: string }
  initialDescription?: string
  createdAt: Date
}

interface Props {
  chats: Chat[] | null
}

defineProps<Props>()

const emit = defineEmits<{
  accept: [chat: Chat]
}>()

const queueColumns = [
  { key: 'patient', label: 'Patient' },
  { key: 'district', label: 'District' },
  { key: 'description', label: 'Description' },
  { key: 'created', label: 'Created' },
  { key: 'actions', label: '' }
] as const
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold">
        Queued Chats
      </h3>
    </template>

    <UTable
      :columns="queueColumns as any"
      :rows="chats || []"
    >
      <!-- @vue-ignore -->
      <template #patient-data="{ row }">
        <div class="flex items-center gap-2">
          <UAvatar
            :src="(row as any).patient?.avatar"
            :alt="(row as any).patient?.name"
            size="xs"
          />
          <span>{{ (row as any).patient?.name }}</span>
        </div>
      </template>

      <!-- @vue-ignore -->
      <template #district-data="{ row }">
        {{ (row as any).district?.name }}
      </template>

      <!-- @vue-ignore -->
      <template #description-data="{ row }">
        <p class="max-w-xs truncate">
          {{ (row as any).initialDescription }}
        </p>
      </template>

      <!-- @vue-ignore -->
      <template #created-data="{ row }">
        {{ new Date((row as any).createdAt).toLocaleString() }}
      </template>

      <!-- @vue-ignore -->
      <template #actions-data="{ row }">
        <UButton
          color="primary"
          size="xs"
          @click="emit('accept', row as any)"
        >
          Accept
        </UButton>
      </template>
    </UTable>

    <UEmpty
      v-if="!chats || chats.length === 0"
      icon="i-heroicons-inbox"
      title="No queued chats"
      description="New patient conversations will appear here"
    />
  </UCard>
</template>
