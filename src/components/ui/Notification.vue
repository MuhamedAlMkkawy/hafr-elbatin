<template>
  <div
    class="fixed left-[30px] bottom-[20px] z-[99999] flex gap-2 items-start bg-white shadow-md rounded-lg animate-pulseScale outline-none py-[16px] px-[8px] pr-[20px] min-w-[400px] border-r-[8px] border-[#1570efb3] shadow-[0px_32px_64px_-12px_#10182824]"
    style="animation: pulseScale 2s infinite alternate"
  >
    <!-- Image -->
    <SvgIcon
      name="notification_icon"
      classes="w-[40px] h-[40px] flex-shrink-0"
    />

    <!-- Text -->
    <div class="flex flex-col w-full">
      <div class="flex justify-between items-start">
        <h4 class="text-[16px] font-[600] mb-[4px]">
          {{ props.title }}
        </h4>
        <button class="scale-[150%] ml-[20px]" @click="$emit('close')">
          &times;
        </button>
      </div>
      <p
        class="text-[14px] font-[400] w-[245px] text-[#384250] leading-[1.2] line-clamp-3"
      >
        {{ props.body }}
      </p>

      <a
        :href="props.url"
        target="_blank"
        class="text-[12px] font-[500] text-[#161616] mt-[22px] mb-[5px]"
      >
        {{ lang == "ar" ? "عرض التفاصيل" : "Show Details" }}
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import SvgIcon from "./SvgIcon.vue";
import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();
const lang = computed(() => locale.value);

const props = defineProps({
  title: { type: String, default: "" },
  body: { type: String, default: "" },
  url: { type: String, default: "" },
});
</script>

<style>
/* Custom pulse animation for Tailwind */
@keyframes pulseScale {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* Register as a utility */
.animate-pulseScale {
  animation: pulseScale 4s infinite alternate-reverse !important;
}
</style>
