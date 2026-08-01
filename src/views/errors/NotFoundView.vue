<template>
  <div class="flex flex-col items-center justify-center p-6 text-center h-full min-h-[400px]">
    <div class="max-w-lg w-full">
      <div class="mb-8">
        <div class="relative">
          <img src="@/assets/images/404.png" alt="404" class="mb-4 mx-auto max-w-[391px]" />
          <p class="text-[#000000] mb-2 leading-relaxed text-[24px] font-[600]">
            {{ t('errors.404.message') }}
          </p>
          <p class="text-[#4D5761] mb-8 leading-9 text-[18px] font-[500]">
            {{ t('errors.404.message_description') }}
          </p>
          <Button
            variant="primary"
            size="lg"
            class="px-8"
            @click="goHome"
          >
            {{ t('errors.404.backHome') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Icon from '@/components/ui/Icon.vue'

const { t } = useI18n()
const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>
