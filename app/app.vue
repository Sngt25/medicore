<script setup lang="ts">
const { fontSize } = useFontSize()

useHead({
  htmlAttrs: {
    style: () => `font-size: ${fontSize.value}%`
  }
})
</script>

<template>
  <UApp :toaster="{ position: 'top-right', duration: 3000 }">
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
