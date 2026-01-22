<script setup lang="ts">
const props = defineProps<{
  chats?: ChatX[]
  districts?: District[]
  currentChatId?: string
}>()

const { user } = useUserSession()

const districtPrefixes = computed(() => {
  const prefixMap: Record<string, string> = {}
  const prefixes = ['BHD-', 'EHD-', 'WHD-']

  if (props.districts) {
    props.districts.forEach((d, index) => {
      prefixMap[d.id] = prefixes[index] || 'RHU-'
    })
  }

  return prefixMap
})

function getChatLabel(chat: ChatX) {
  const prefix = districtPrefixes.value[chat.districtId] || 'RHU-'
  const shortId = chat?.id?.split('-')[0]?.toUpperCase() || 'UNKNOWN'
  return `${prefix}${shortId}`
}

function formatChatDate(dateString: Date | string) {
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

const displayDates = ref<Record<string, string>>({})

watch(() => props.chats, (newChats) => {
  if (newChats) {
    newChats.forEach((chat) => {
      if (!displayDates.value[chat.id]) {
        displayDates.value[chat.id] = new Date(chat.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }
    })
  }
}, { immediate: true })

const sortedChats = computed(() => {
  if (!props.chats) return []
  return [...props.chats].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

const isMobileSidebarOpen = inject<Ref<boolean>>('chatSidebarOpen')

function closeMobileSidebar() {
  if (isMobileSidebarOpen) {
    isMobileSidebarOpen.value = false
  }
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold">
        Chat History
      </h2>
      <UButton
        :to="user?.role === 'healthcare_worker' ? '/dashboard' : '/districts'"
        color="secondary"
        variant="ghost"
        icon="i-heroicons-home"
        square
      />
    </div>

    <UButton
      v-if="user?.role !== 'healthcare_worker'"
      to="/districts"
      color="primary"
      variant="outline"
      icon="i-heroicons-plus"
      block
    >
      New Chat
    </UButton>

    <div
      v-if="!chats || chats.length === 0"
      class="text-center py-8 text-gray-500"
    >
      <UIcon
        name="i-heroicons-chat-bubble-left-ellipsis"
        class="w-12 h-12 mx-auto mb-3 opacity-50"
      />
      <p class="text-sm">
        No chat history yet
      </p>
      <p class="text-xs mt-1">
        Start your first conversation
      </p>
    </div>

    <div
      v-else
      class="space-y-2"
    >
      <UCard
        v-for="chat in sortedChats"
        :key="chat.id"
        class="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        :class="{
          'ring-2 ring-primary': chat.id === currentChatId
        }"
        @click="() => {
          closeMobileSidebar()
          navigateTo(`/chat/${chat.id}`)
        }"
      >
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-mono font-semibold text-sm">{{
              getChatLabel(chat)
            }}</span>
            <UBadge
              :color="chat.status === 'active' ? 'primary' : chat.status === 'queued' ? 'warning' : 'secondary'"
              size="xs"
            >
              {{ chat.status }}
            </UBadge>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 truncate">
            {{ chat.initialDescription }}
          </p>
          <ClientOnly>
            <p class="text-xs text-gray-500">
              {{ displayDates[chat.id] || formatChatDate(chat.createdAt) }}
            </p>
            <template #fallback>
              <p class="text-xs text-gray-500">
                {{ formatChatDate(chat.createdAt) }}
              </p>
            </template>
          </ClientOnly>
        </div>
      </UCard>
    </div>
  </div>
</template>
