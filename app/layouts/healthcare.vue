<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const items: NavigationMenuItem[][] = [
  [
    {
      label: 'Dashboard',
      icon: 'i-heroicons-home',
      to: '/dashboard'
    },
    {
      label: 'Tasks',
      icon: 'i-heroicons-clipboard-document-list',
      to: '/dashboard/tasks'
    }
  ],
  [
    {
      label: 'Districts',
      icon: 'i-heroicons-building-office-2',
      to: '/districts'
    }
  ]
]
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar
      collapsible
      resizable
      :ui="{ footer: 'border-t border-gray-200 dark:border-gray-800' }"
    >
      <template #header="{ collapsed }">
        <ULink
          to="/"
        >
          <span
            v-if="!collapsed"
            class="font-semibold text-lg flex items-center"
          >
            MED<img
              src="/images/medicore-logo.png"
              class="h-[2em] w-auto mx-px"
              alt="i"
            >CORE
          </span>
        </ULink>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="items[0]"
          orientation="vertical"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="items[1]"
          orientation="vertical"
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
