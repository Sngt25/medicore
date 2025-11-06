<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()

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

        <div
          v-else
          class="space-y-4"
        >
          <div
            class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <UAvatar
              :src="user.avatar"
              :alt="user.name"
              size="lg"
            />
            <div class="flex-1">
              <p class="font-semibold">
                {{ user.name }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ user.email }}
              </p>
              <UBadge
                v-if="user.role"
                :color="
                  user.role === 'admin'
                    ? 'red'
                    : user.role === 'healthcare_worker'
                      ? 'blue'
                      : 'gray'
                "
                size="xs"
                class="mt-1"
              >
                {{ user.role.replace('_', ' ') }}
              </UBadge>
            </div>
          </div>

          <div class="flex gap-2">
            <UButton
              v-if="user.role === 'admin'"
              to="/admin"
              block
              color="primary"
            >
              Go to Admin Console
            </UButton>
            <UButton
              v-else-if="user.role === 'healthcare_worker'"
              to="/dashboard"
              block
              color="primary"
            >
              Go to Dashboard
            </UButton>
            <UButton
              v-else
              to="/districts"
              block
              color="primary"
            >
              Select District
            </UButton>

            <UButton
              color="gray"
              variant="outline"
              icon="i-heroicons-arrow-right-on-rectangle"
              @click="clear()"
            />
          </div>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>
