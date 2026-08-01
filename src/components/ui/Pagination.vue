<template>
  <nav
    class="flex items-center justify-center gap-4 select-none"
    :dir="isRTL ? 'rtl' : 'ltr'"
  >
    <!-- First Page -->
    <button
      type="button"
      class="p-1 text-[#161616] hover:text-primary transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
      :disabled="modelValue === 1"
      @click="first"
    >
      <Icon
        :name="isRTL ? 'chevronDoubleRight' : 'chevronDoubleLeft'"
        size="sm"
        class="text-[#0E5F4A]"
      />
    </button>

    <!-- Previous Page -->
    <button
      type="button"
      class="p-1 text-[#161616] hover:text-primary transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
      :disabled="modelValue === 1"
      @click="prev"
    >
      <Icon :name="isRTL ? 'chevronRight' : 'chevronLeft'" size="sm" class="text-[#0E5F4A]" />
    </button>

    <!-- Page Numbers -->
    <div class="flex items-center gap-2">
      <template v-for="(page, index) in pages" :key="index">
        <button
          v-if="page !== '...'"
          type="button"
          class="min-w-[40px] h-10 px-2 flex items-center justify-center text-sm font-medium transition-all relative disabled:cursor-not-allowed cursor-pointer"
          :class="[
            modelValue === page
              ? 'text-primary'
              : 'text-gray-500 hover:text-primary',
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
          <span
            v-if="modelValue === page"
            class="absolute bottom-1 left-[15%] right-[15%] h-[2px] border-b-3 border-[#1B8354] rounded-full"
          ></span>
        </button>
        <div
          v-else
          class="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-md text-gray-500 text-sm font-medium mx-1"
        >
          ...
        </div>
      </template>
    </div>

    <!-- Next Page -->
    <button
      type="button"
      class="p-1 text-[#161616] hover:text-primary transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
      :disabled="modelValue === totalPages"
      @click="next"
    >
      <Icon :name="isRTL ? 'chevronLeft' : 'chevronRight'" size="sm" class="text-[#0E5F4A]" />
    </button>

    <!-- Last Page -->
    <button
      type="button"
      class="p-1 text-[#161616] hover:text-primary transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
      :disabled="modelValue === totalPages"
      @click="last"
    >
      <Icon
        :name="isRTL ? 'chevronDoubleLeft' : 'chevronDoubleRight'"
        size="sm"
        class="text-[#0E5F4A]"
      />
    </button>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import Icon from "./Icon.vue";

const props = defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  maxVisiblePages: {
    type: Number,
    default: 5,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const { locale } = useI18n();
const isRTL = computed(() => locale.value === "ar");

const pages = computed(() => {
  const range = [];
  const total = props.totalPages;
  const current = props.modelValue;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      range.push(i);
    }
  } else {
    // Always show first
    range.push(1);

    if (current > 4) {
      range.push("...");
    }

    // Neighbors
    const start = Math.max(2, current - 2);
    const end = Math.min(total - 1, current + 2);

    for (let i = start; i <= end; i++) {
      if (!range.includes(i)) {
        range.push(i);
      }
    }

    if (current < total - 3) {
      if (!range.includes("...")) {
        range.push("...");
      }
    }

    // Always show last
    if (!range.includes(total)) {
      range.push(total);
    }
  }

  return range;
});

const goToPage = (page) => {
  if (page === "...") return;
  if (page < 1 || page > props.totalPages) return;
  emit("update:modelValue", parseInt(page));
  emit("change", parseInt(page));
};

const next = () => goToPage(props.modelValue + 1);
const prev = () => goToPage(props.modelValue - 1);
const first = () => goToPage(1);
const last = () => goToPage(props.totalPages);
</script>