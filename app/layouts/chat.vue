<script setup lang="ts">
const isMobileSidebarOpen = ref(false)

provide('chatSidebarOpen', isMobileSidebarOpen)

const selectedDistrict = useSelectedDistrict()

const { data: chats } = await useFetch<ChatX[]>('/api/chats', {
  key: 'chats-list',
  query: computed(() => ({
    districtId: selectedDistrict.value || undefined
  }))
})

const { data: districts } = await useFetch<District[]>('/api/districts')

const route = useRoute()
const currentChatId = computed(() => route.params.id as string || undefined)

const { user } = useUserSession()
const { subscribe, unsubscribe } = usePusher()

onMounted(() => {
  if (user.value?.role === 'healthcare_worker' && user.value.districtId) {
    const channel = subscribe(`district-${user.value.districtId}-queue`)
    if (channel) {
      channel.bind('new_chat', () => refreshNuxtData('chats-list'))
      channel.bind('chat_updated', () => refreshNuxtData('chats-list'))
    }
  }
})

onUnmounted(() => {
  if (user.value?.role === 'healthcare_worker' && user.value.districtId) {
    unsubscribe(`district-${user.value.districtId}-queue`)
  }
})
</script>

<template>
  <div>
    <UDrawer
      v-model:open="isMobileSidebarOpen"
      direction="left"
      class="lg:hidden"
      title="Chat History"
    >
      <template #body>
        <ChatSidebar
          :chats="chats"
          :districts="districts"
          :current-chat-id="currentChatId"
        />
      </template>
    </UDrawer>

    <div class="flex h-screen">
      <aside class="hidden lg:block w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">
        <div class="p-4 space-y-4 sticky top-0">
          <ChatSidebar
            class="w-full"
            :chats="chats"
            :districts="districts"
            :current-chat-id="currentChatId"
          />
        </div>
      </aside>

      <slot />
    </div>
  </div>
</template>
