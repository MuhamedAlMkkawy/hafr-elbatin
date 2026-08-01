<template>
  <div class="flex flex-col items-center justify-center p-6 text-center h-full min-h-[400px]">
    <div class="max-w-lg w-full">
      <div class="mb-8">
        <div class="relative">
          <img src="@/assets/images/403.png" alt="403" class="mb-4 mx-auto max-w-[391px]" />
          <p class="text-[#000000] mb-2 leading-relaxed text-[24px] font-[600]">
            {{ t(`errors.${errorCode}.message`) }}
          </p>
          <p class="text-[#4D5761] mb-8 leading-9 text-[18px] font-[500]">
            {{ t(`errors.${errorCode}.message_description`) }}
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              variant="primary"
              size="lg"
              class="px-8 w-full sm:w-auto"
              @click="goHome"
            >
              {{ t(`errors.${errorCode}.backHome`) }}
            </Button>
            <Button
              v-if="errorCode === '401'"
              variant="outline"
              size="lg"
              class="px-8 w-full sm:w-auto text-[#FF4D4F] border-[#FF4D4F] hover:bg-[#FFF1F0]"
              @click="logout"
            >
              {{ t('nav.logout') }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Button from '@/components/ui/Button.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const errorCode = computed(() => {
  const code = route.query.code
  if (code === '401' || code === '419') return '401'
  if (route.path.includes('/401') && !code) return '401'
  return '403'
})

const goHome = () => {
  router.push('/')
}

const logout = () => {
  authStore.logout()
  const isEn = route.path.startsWith('/en')
  router.push(isEn ? '/en/login' : '/login')
}
</script>
