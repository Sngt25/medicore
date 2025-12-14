<script setup lang="ts">
interface Chat {
  id: string
  patientId: string
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
  { id: 'patient', header: 'Patient' },
  { id: 'district', header: 'District' },
  { id: 'description', header: 'Description' },
  { id: 'created', header: 'Created' },
  { id: 'actions', header: '' }
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
      :data="chats || []"
    >
      <!-- @vue-ignore -->
      <template #patient-cell="{ row }">
        <div class="flex items-center gap-2">
          <UAvatar
            :src="(row as any).original.patient?.avatar"
            :alt="(row as any).original.patient?.name"
            size="xs"
          />
          <span>{{ (row as any).original.patient?.name }}</span>
        </div>
      </template>

      <!-- @vue-ignore -->
      <template #district-cell="{ row }">
        {{ (row as any).original.district?.name }}
      </template>

      <!-- @vue-ignore -->
      <template #description-cell="{ row }">
        <p class="max-w-xs truncate">
          {{ (row as any).original.initialDescription }}
        </p>
      </template>

      <!-- @vue-ignore -->
      <template #created-cell="{ row }">
        {{ new Date((row as any).original.createdAt).toLocaleString() }}
      </template>

      <!-- @vue-ignore -->
      <template #actions-cell="{ row }">
        <div class="flex gap-2">
          <UButton
            :to="`/chat/${(row as any).original.id}`"
            color="primary"
            variant="subtle"
            size="xs"
          >
            Open
          </UButton>
          <UButton
            color="primary"
            size="xs"
            @click="emit('accept', (row as any).original)"
          >
            Accept
          </UButton>
        </div>
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
