<template>
  <div class="date-picker-wrapper" v-click-outside="close">
    <label
      v-if="label"
      class="date-picker-label transition-colors duration-300"
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
          ref="triggerRef"
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
          <div class="flex items-center gap-2 overflow-hidden text-base">
            <div><SvgIcon name="date_calender" /></div>
            <span v-if="modelValue" class="text-base">
              {{ displayDate }}
            </span>
            <span v-else class="text-[#6C737F] text-base select-none">
              {{ placeholder || t("common.selectDate") }}
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
      <Teleport to="body">
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
            class="fixed z-[2000] bg-white rounded-sm shadow-xl border border-gray-100 p-4 min-w-[320px]"
            :style="dropdownStyle"
            @click.stop
          >
          <!-- Calendar Header -->
          <div class="flex items-center justify-between mb-4">
            <div
              class="flex items-center gap-2 font-[500] text-[#161616] text-[16px]"
            >
              <span class="capitalize">{{ currentMonthName }}</span>
              <span>{{ currentYear }}</span>
              <Icon
                name="chevron-down"
                size="sm"
                class="text-[#161616] cursor-pointer"
              />
            </div>
            <div class="flex items-center gap-4">
              <button
                type="button"
                @click="prevMonth"
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
                @click="nextMonth"
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

          <!-- Weekdays -->
          <div class="grid grid-cols-7 mb-2">
            <div
              v-for="day in weekDays"
              :key="day"
              class="text-center text-[16px] text-[#64748B] py-2"
            >
              {{ day }}
            </div>
          </div>

          <!-- Days Grid -->
          <div class="grid grid-cols-7">
            <div
              v-for="(day, index) in calendarDays"
              :key="index"
              class="relative aspect-square flex items-center justify-center text-[16px] group"
              :class="[
                !day.isCurrentMonth || day.isDisabled
                  ? 'text-[#6C737F] cursor-not-allowed'
                  : 'text-[#161616] cursor-pointer',
              ]"
              @click="!day.isDisabled && selectDate(day)"
            >
              <div
                class="w-8 h-8 flex items-center justify-center transition-colors hover:bg-[#DFF6E7] hover:border-[2px] hover:border-[#1B8354] rounded-full"
                :class="[
                  day.isSelected
                    ? 'bg-[#1B8354] !text-white rounded-full'
                    : day.isToday
                      ? 'border border-[2px] border-[#1B8354] text-[#1B8354] rounded-full'
                      : '',
                ]"
              >
                {{ day.date.getDate() }}
              </div>
            </div>
          </div>

          <!-- Actions footer -->
          <div class="flex justify-end mt-4 pt-2 border-t border-gray-100">
            <button
              type="button"
              @click="clearDate"
              class="text-xs text-gray-400 hover:text-[#B42318] cursor-pointer"
            >
              {{ t("roles.resetFilters") }}
            </button>
          </div>
          </div>
        </transition>
      </Teleport>
    </div>

    <p v-if="error" class="date-picker-error">
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import SvgIcon from "./SvgIcon.vue";
import Icon from "./Icon.vue";
import { bus } from "@/utils/eventBus";

const { t, locale } = useI18n();

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
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
  minDate: {
    type: String,
    default: "",
  },
  maxDate: {
    type: String,
    default: "",
  },
  format: {
    type: String,
    default: "YYYY-MM-DD", // Match native date input default
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const isOpen = ref(false);
const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());

const formatDate = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  if (props.format === "MM/DD/YY") {
    return `${month}/${day}/${String(year).slice(-2)}`;
  }
  return `${year}-${month}-${day}`;
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr.includes("-")) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  if (dateStr.includes("/")) {
    let [month, day, year] = dateStr.split("/").map(Number);
    if (year < 100) year += 2000;
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};

const displayDate = computed(() => {
  if (!props.modelValue) return "";
  const date = parseDate(props.modelValue);
  if (!date || isNaN(date.getTime())) return props.modelValue;
  
  // Format based on locale for display
  return new Intl.DateTimeFormat(locale.value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
});

const initializeCalendar = () => {
  if (props.modelValue) {
    const d = parseDate(props.modelValue);
    if (d && !isNaN(d.getTime())) {
      currentMonth.value = d.getMonth();
      currentYear.value = d.getFullYear();
    }
  }
};

onMounted(() => {
  initializeCalendar();
});

watch(isOpen, (newVal) => {
  if (newVal) {
    initializeCalendar();
  }
});

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    updateDropdownPosition();
  }
};

const triggerRef = ref(null);
const dropdownStyle = ref({});

const updateDropdownPosition = () => {
  if (triggerRef.value && isOpen.value) {
    const rect = triggerRef.value.getBoundingClientRect();

    // 1. Check if trigger is scrolled out of viewport
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      close();
      return;
    }

    // 2. Check if trigger is obscured by its scroll container (e.g. sticky header)
    let parent = triggerRef.value.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if (style.overflow !== "visible" && style.overflowY !== "visible") {
        const parentRect = parent.getBoundingClientRect();
        if (rect.top < parentRect.top - 2 || rect.bottom > parentRect.bottom + 2) {
          close();
          return;
        }
        break;
      }
      parent = parent.parentElement;
    }

    const roomBelow = window.innerHeight - rect.bottom;
    const roomAbove = rect.top;

    let top = rect.bottom + 4;
    let transform = "none";

    // If not enough room below, show above
    if (roomBelow < 300 && roomAbove > roomBelow) {
      top = rect.top - 4;
      transform = "translateY(-100%)";
    }

    dropdownStyle.value = {
      top: `${top}px`,
      left:
        locale.value === "ar"
          ? `${rect.right - 320}px`
          : `${rect.left}px`,
      width: `320px`,
      transform: transform,
    };
  }
};

onMounted(() => {
  initializeCalendar();
  bus.on("close-all-selects", close);
});

onUnmounted(() => {
  bus.off("close-all-selects", close);
  window.removeEventListener("scroll", updateDropdownPosition, true);
  window.removeEventListener("resize", updateDropdownPosition);
});

watch(isOpen, (val) => {
  if (val) {
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);
    nextTick(updateDropdownPosition);
  } else {
    window.removeEventListener("scroll", updateDropdownPosition, true);
    window.removeEventListener("resize", updateDropdownPosition);
  }
});

const close = () => {
  isOpen.value = false;
};

const weekDays = computed(() => {
  if (locale.value === "ar") {
    return ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
  }
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
});

const currentMonthName = computed(() => {
  return new Intl.DateTimeFormat(locale.value, { month: "long" }).format(
    new Date(currentYear.value, currentMonth.value),
  );
});

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

const calendarDays = computed(() => {
  const firstDayOfMonth = new Date(currentYear.value, currentMonth.value, 1);
  const lastDayOfMonth = new Date(currentYear.value, currentMonth.value + 1, 0);

  const days = [];

  // Previous month padding
  const firstDayWeekday = firstDayOfMonth.getDay();
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0);
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    days.push({
      date: new Date(
        currentYear.value,
        currentMonth.value - 1,
        prevMonthLastDay.getDate() - i,
      ),
      isCurrentMonth: false,
    });
  }

  // Current month
  const todayStr = formatDate(new Date());
  const selectedStr = props.modelValue;
  const min = parseDate(props.minDate);
  const max = parseDate(props.maxDate);

  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const date = new Date(currentYear.value, currentMonth.value, i);
    const dateStr = formatDate(date);

    let isDisabled = false;
    if (min && date < min) isDisabled = true;
    if (max && date > max) isDisabled = true;

    days.push({
      date,
      isCurrentMonth: true,
      isDisabled,
      isToday: formatDate(date) === todayStr,
      isSelected: selectedStr === dateStr,
    });
  }

  // Next month padding
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(currentYear.value, currentMonth.value + 1, i),
      isCurrentMonth: false,
    });
  }

  return days;
});

const selectDate = (day) => {
  if (!day.isCurrentMonth) return;

  const dateStr = formatDate(day.date);
  emit("update:modelValue", dateStr);
  emit("change", dateStr);
  isOpen.value = false;
};

const clearDate = (e) => {
  e.stopPropagation();
  emit("update:modelValue", "");
  emit("change", "");
};

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

.date-picker-wrapper {
  @apply w-full;
}

.date-picker-label {
  @apply block text-sm font-medium text-[#161616] mb-1.5;
}

.date-picker-error {
  @apply mt-1 text-xs font-medium text-[#B42318];
}

.focus-line {
  @apply absolute bottom-0 left-1/2 h-[3px] w-0 transition-all duration-300 ease-out -translate-x-1/2 pointer-events-none;
}

.trigger-focused .focus-line {
  @apply w-full;
}
</style>
