<script setup lang="ts">
const { data: districts, status } = await useFetch<District[]>('/api/districts')
const { user } = useUserSession()

definePageMeta({
  middleware: 'auth'
})
</script>

<template>
  <UApp>
    <UContainer class="py-8">
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold">
              Select Your Nearest RHU
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Choose a health district to start a conversation
            </p>
          </div>

          <UButton
            to="/"
            color="secondary"
            variant="outline"
            icon="i-heroicons-home"
          >
            Home
          </UButton>
        </div>

        <UCard
          v-if="user"
          class="mb-6"
        >
          <div class="flex items-center gap-3">
            <UAvatar
              :src="user.avatar"
              :alt="user.name"
              size="md"
            />
            <div>
              <p class="font-semibold">
                {{ user.name }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ user.email }}
              </p>
            </div>
          </div>
        </UCard>

        <div
          v-if="status === 'pending'"
          class="grid gap-4 md:grid-cols-2"
        >
          <USkeleton class="h-32" />
          <USkeleton class="h-32" />
          <USkeleton class="h-32" />
          <USkeleton class="h-32" />
        </div>

        <UEmpty
          v-else-if="!districts || districts.length === 0"
          icon="i-heroicons-map-pin"
          title="No districts available"
          description="Please contact an administrator to set up districts."
        />

        <div
          v-else
          class="grid gap-4 md:grid-cols-2"
        >
          <UCard
            v-for="district in districts"
            :key="district?.id"
            class="p-6 sm:p-6 hover:ring-2 hover:ring-primary transition-all cursor-pointer"
            @click="navigateTo(`/chat/new?districtId=${district.id}`)"
          >
            <div class="space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-heroicons-building-office-2"
                    class="w-6 h-6 text-primary"
                  />
                  <h3 class="text-lg font-semibold">
                    {{ district.name }}
                  </h3>
                </div>
                <UIcon
                  name="i-heroicons-chevron-right"
                  class="w-5 h-5 text-gray-400"
                />
              </div>

              <div
                v-if="district.address"
                class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <UIcon
                  name="i-heroicons-map-pin"
                  class="w-4 h-4 mt-0.5"
                />
                <span>{{ district.address }}</span>
              </div>

              <div
                v-if="district.contactInfo"
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <UIcon
                  name="i-heroicons-phone"
                  class="w-4 h-4"
                />
                <span>{{ district.contactInfo }}</span>
              </div>
            </div>
          </UCard>
        </div>

        <UAlert
          icon="i-heroicons-information-circle"
          color="info"
          variant="soft"
          title="Need immediate help?"
          description="If you're experiencing a medical emergency, please call emergency services immediately."
        />
      </div>
    </UContainer>
  </UApp>
</template>
