<template>
  <div class="month-picker-wrapper" v-click-outside="close">
    <label
      v-if="label"
      class="month-picker-label transition-colors duration-300"
      :class="{
        'text-[#0E5F4A]': isOpen && !error,
        'text-[#B42318]': error,
        'text-[#161616]': !isOpen && !error,
      }"
    >
      <span v-if="required" class="text-[#B42318]">*</span>
      {{ label }}
    </label>

    <div class="relative group">
      <div
        class="relative overflow-hidden rounded-sm"
        :class="[{ 'trigger-focused': isOpen && !disabled }]"
      >
        <!-- Trigger -->
        <div
          class="w-full flex items-center justify-between bg-[#F3F4F6] text-[#161616] px-4 py-2 cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-b-3 focus:outline-none"
          :class="[
            isOpen && !disabled
              ? error
                ? 'bg-white border border-[#B42318] shadow-sm'
                : 'bg-white border border-[#0D121C] shadow-sm'
              : error
                ? 'border border-[#B42318]/30'
                : 'border-transparent',
            disabled ? '!cursor-not-allowed' : 'cursor-pointer',
          ]"
          @click="toggleDropdown"
        >
          <div class="flex items-center gap-2 overflow-hidden">
            <div><SvgIcon name="date_calender" /></div>
            <span v-if="modelValue" class="text-base">
              {{ formattedValue }}
            </span>
            <span v-else class="text-[#6C737F] text-base select-none">
              {{ placeholder || t("common.selectMonth") }}
            </span>
          </div>

          <Icon
            name="chevron-down"
            size="sm"
            class="transition-transform duration-200 !text-[#0E5F4A]"
            :class="{ 'rotate-180': isOpen }"
          />
        </div>

        <div
          class="focus-line"
          :class="{
            'bg-[#B42318]': error,
            'bg-[#0D121C]': !error,
            'w-full': isOpen && !disabled,
          }"
        ></div>
      </div>

      <!-- Calendar Dropdown -->
      <transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div
          v-if="isOpen"
          class="absolute z-[100] mt-1 bg-white rounded-sm shadow-xl border border-gray-100 p-4 min-w-[280px]"
          :class="locale === 'ar' ? 'left-0' : 'right-0'"
          @click.stop
        >
          <!-- Year Selection Header -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2 font-[500] text-[#161616] text-[18px]">
              <span>{{ currentYear }}</span>
            </div>
            <div class="flex items-center gap-4">
              <button
                type="button"
                @click="prevYear"
                class="text-gray-600 hover:text-[#161616] cursor-pointer"
              >
                <Icon
                  name="arrow-right"
                  size="sm"
                  :class="locale === 'en' ? 'rotate-180' : ''"
                />
              </button>
              <button
                type="button"
                @click="nextYear"
                class="text-gray-600 hover:text-[#161616] cursor-pointer"
              >
                <Icon
                  name="arrow-right"
                  size="sm"
                  :class="locale === 'ar' ? 'rotate-180' : ''"
                />
              </button>
            </div>
          </div>

          <!-- Months Grid -->
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="(month, index) in months"
              :key="index"
              type="button"
              @click="selectMonth(index)"
              class="cursor-pointer py-3 text-center rounded-md transition-colors hover:bg-[#DFF6E7] text-[14px]"
              :class="[
                isSelected(index)
                  ? 'bg-[#1B8354] text-white hover:!bg-[#1B8354] hover:!text-white'
                  : 'text-[#161616]',
                isCurrentMonth(index) && !isSelected(index) ? 'border border-[#1B8354] text-[#1B8354]' : ''
              ]"
            >
              {{ month }}
            </button>
          </div>
        </div>
      </transition>
    </div>

    <p v-if="error" class="month-picker-error">
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import SvgIcon from "./SvgIcon.vue";
import Icon from "./Icon.vue";

const { t, locale } = useI18n();

const props = defineProps({
  modelValue: {
    type: String,
    default: "", // Format: YYYY-MM
  },
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  error: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const isOpen = ref(false);
const currentYear = ref(new Date().getFullYear());

const months = computed(() => {
  const result = [];
  for (let i = 0; i < 12; i++) {
    result.push(
      new Intl.DateTimeFormat(locale.value, { month: "short" }).format(
        new Date(2021, i, 1)
      )
    );
  }
  return result;
});

const formattedValue = computed(() => {
  if (!props.modelValue) return "";
  const [year, month] = props.modelValue.split("-");
  const monthName = new Intl.DateTimeFormat(locale.value, { month: "long" }).format(
    new Date(parseInt(year), parseInt(month) - 1, 1)
  );
  return `${monthName} ${year}`;
});

const initializeYear = () => {
  if (props.modelValue) {
    const [year] = props.modelValue.split("-");
    currentYear.value = parseInt(year);
  } else {
    currentYear.value = new Date().getFullYear();
  }
};

onMounted(() => {
  initializeYear();
});

watch(isOpen, (newVal) => {
  if (newVal) {
    initializeYear();
  }
});

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
};

const close = () => {
  isOpen.value = false;
};

const prevYear = () => {
  currentYear.value--;
};

const nextYear = () => {
  currentYear.value++;
};

const selectMonth = (monthIndex) => {
  const month = String(monthIndex + 1).padStart(2, "0");
  const value = `${currentYear.value}-${month}`;
  emit("update:modelValue", value);
  emit("change", value);
  isOpen.value = false;
};

const isSelected = (monthIndex) => {
  if (!props.modelValue) return false;
  const [year, month] = props.modelValue.split("-");
  return parseInt(year) === currentYear.value && parseInt(month) === monthIndex + 1;
};

const isCurrentMonth = (monthIndex) => {
  const now = new Date();
  return now.getFullYear() === currentYear.value && now.getMonth() === monthIndex;
};

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.addEventListener("click", el.clickOutsideEvent);
  },
  unmounted(el) {
    document.removeEventListener("click", el.clickOutsideEvent);
  },
};
</script>

<style scoped>
@reference {
  @import "tailwindcss";
}

.month-picker-wrapper {
  @apply w-full;
}

.month-picker-label {
  @apply block text-sm font-medium text-[#161616] mb-1.5;
}

.month-picker-error {
  @apply mt-1 text-xs font-medium text-[#B42318];
}

.focus-line {
  @apply absolute bottom-0 left-1/2 h-[3px] w-0 transition-all duration-300 ease-out -translate-x-1/2 pointer-events-none;
}

.trigger-focused .focus-line {
  @apply w-full;
}
</style>
