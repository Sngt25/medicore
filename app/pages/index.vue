<script setup lang="ts">
const { loggedIn } = useUserSession()

definePageMeta({
  middleware: 'guest'
})
</script>

<template>
  <UContainer class="min-h-screen flex items-center justify-center">
    <UCard class="max-w-md w-full">
      <template #header>
        <div class="flex items-center justify-center">
          <h1 class="text-2xl font-bold">
            Medicore
          </h1>
        </div>
      </template>

      <div class="space-y-6">
        <div class="text-center space-y-2">
          <h2 class="text-xl font-semibold">
            Healthcare Communication Platform
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            Connect with healthcare workers in your district
          </p>
        </div>

        <div
          v-if="!loggedIn"
          class="space-y-4"
        >
          <UButton
            color="white"
            block
            size="lg"
            external
            to="/auth/google"
          >
            <template #leading>
              <UIcon
                name="i-logos-google-icon"
                class="w-5 h-5"
              />
            </template>
            Sign in with Google
          </UButton>

          <p class="text-sm text-center text-gray-500">
            By signing in, you agree to our terms of service
          </p>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>
