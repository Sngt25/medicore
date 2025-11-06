<script setup lang="ts">
interface District {
  id: string
  name: string
}

interface Worker {
  id: string
  name: string
  email: string
}

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

const { data: districts } = useFetch<District[]>('/api/districts')
const { data: workers } = useFetch<Worker[]>('/api/users', {
  query: { role: 'healthcare_worker' }
})
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Admin Console" />

    <UCard class="ring-0">
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Total Districts
              </p>
              <p class="text-3xl font-bold mt-1">
                {{ districts?.length || 0 }}
              </p>
            </div>
            <UIcon
              name="i-heroicons-building-office-2"
              class="size-12 text-primary"
            />
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Healthcare Workers
              </p>
              <p class="text-3xl font-bold mt-1">
                {{ workers?.length || 0 }}
              </p>
            </div>
            <UIcon
              name="i-heroicons-users"
              class="size-12 text-primary"
            />
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Quick Actions
              </p>
              <div class="flex gap-2 mt-2">
                <UButton
                  to="/admin/districts"
                  size="xs"
                  color="primary"
                >
                  Districts
                </UButton>
                <UButton
                  to="/admin/workers"
                  size="xs"
                  color="primary"
                  variant="outline"
                >
                  Workers
                </UButton>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </UCard>
  </UDashboardPanel>
</template>
