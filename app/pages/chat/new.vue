<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const districtId = computed(() => route.query.districtId as string)
const description = ref('')
const isSubmitting = ref(false)

const { data: district } = await useFetch<District>(`/api/districts`, {
  query: { id: districtId }
})

definePageMeta({
  middleware: 'auth',
  layout: 'chat'
})

async function createChat() {
  if (!description.value.trim()) {
    toast.add({
      title: 'Description required',
      description: 'Please describe your illness or injury',
      color: 'error'
    })
    return
  }

  isSubmitting.value = true

  try {
    const chat = await $fetch('/api/chats', {
      method: 'POST',
      body: {
        districtId: districtId.value,
        initialDescription: description.value
      }
    })

    toast.add({
      title: 'Chat created',
      description: 'You will be connected with a healthcare worker shortly',
      color: 'primary'
    })

    router.push(`/chat/${chat.id}`)
  }
  catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to create chat',
      color: 'error'
    })
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="flex-1">
    <UContainer class="py-8">
      <div class="max-w-2xl mx-auto space-y-6">
        <div class="flex items-center gap-3">
          <UButton
            to="/districts"
            color="secondary"
            variant="ghost"
            icon="i-heroicons-arrow-left"
            square
          />
          <h1 class="text-2xl font-bold">
            Start New Conversation
          </h1>
        </div>

        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-heroicons-building-office-2"
                class="w-6 h-6 text-primary"
              />
              <div>
                <h2 class="font-semibold">
                  {{ district?.name || 'Loading...' }}
                </h2>
                <p
                  v-if="district?.address"
                  class="text-sm text-gray-600 dark:text-gray-400"
                >
                  {{ district.address }}
                </p>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <UAlert
              icon="i-heroicons-exclamation-triangle"
              color="warning"
              variant="soft"
              title="Emergency Notice"
              description="If you're experiencing a life-threatening emergency, please call emergency services immediately (911)."
            />

            <UFormField
              label="Describe your illness or injury"
              description="Please provide details about your symptoms, when they started, and any relevant medical history."
              required
            >
              <UTextarea
                v-model="description"
                :rows="6"
                placeholder="Example: I've had a persistent headache for the past 3 days, accompanied by mild fever..."
                autofocus
                class="w-full"
              />
            </UFormField>

            <div class="flex gap-3">
              <UButton
                color="primary"
                size="lg"
                :loading="isSubmitting"
                :disabled="!description.trim()"
                block
                @click="createChat"
              >
                Start Conversation
              </UButton>
              <UButton
                to="/districts"
                color="secondary"
                variant="outline"
                size="lg"
              >
                Cancel
              </UButton>
            </div>

            <div class="pt-4 border-t border-gray-200 dark:border-gray-800">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                <UIcon
                  name="i-heroicons-lock-closed"
                  class="w-4 h-4 inline"
                />
                Your information is secure and will only be shared with
                healthcare workers in this district.
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </UContainer>
  </main>
</template>
