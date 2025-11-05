<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { data: districts, refresh: refreshDistricts }
  = useFetch('/api/districts')
const { data: workers, refresh: refreshWorkers } = useFetch('/api/users', {
  query: { role: 'healthcare_worker' }
})
</script>

<template>
  <UDashboardGroup>
    <UDashboardPanel>
      <UDashboardNavbar title="Admin Console">
        <template #right>
          <UButton
            to="/"
            color="neutral"
            variant="ghost"
            icon="i-heroicons-home"
          >
            Home
          </UButton>
        </template>
      </UDashboardNavbar>

      <div class="space-y-8 p-4">
        <AdminDistrictsCard
          :districts="districts || []"
          @refresh="refreshDistricts"
        />

        <AdminWorkersCard
          :workers="(workers as any) || []"
          :districts="districts || []"
          @refresh="refreshWorkers"
        />
      </div>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
