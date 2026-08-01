<template>
  <div class="time-picker-wrapper" v-click-outside="close">
    <label
      v-if="label"
      class="time-picker-label transition-colors duration-300"
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
          class="w-full flex items-center justify-between bg-[#F3F4F6] text-[#161616] px-4 py-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-b-3 focus:outline-none"
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
            <div class="text-[#0E5F4A]"><SvgIcon name="clock" /></div>
            <span v-if="modelValue" class="text-base">
              {{ displayTime }}
            </span>
            <span v-else class="text-[#6C737F] text-base select-none">
              {{ placeholder || t("common.selectTime") }}
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

      <!-- Time Dropdown (Wheel Style) -->
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
            class="fixed z-[2000] bg-white rounded-lg shadow-2xl border border-gray-100 p-2 min-w-[190px]"
            :style="dropdownStyle"
            @click.stop
          >
          <div
            class="relative flex justify-center items-center h-32 overflow-hidden select-none rounded-xl"
            dir="ltr"
          >
            <!-- Overlay Gradients for premium look -->
            <div
              class="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent z-20 pointer-events-none"
            ></div>
            <div
              class="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent z-20 pointer-events-none"
            ></div>

            <!-- Highlighter Box -->
            <div
              class="absolute inset-x-2 h-7 border-2 border-[#1B8354] bg-[#F3FCF6] rounded-[8px] pointer-events-none z-0 box-border"
            ></div>

            <!-- Hours Column -->
            <div
              class="wheel-column h-full scrollbar-hide"
              :class="{ dragging: isDragging && activeColumn === 'hour' }"
              @scroll="handleScroll($event, 'hour')"
              @mousedown="startDrag($event, 'hour')"
              @mousemove="onDrag($event, 'hour')"
              @mouseup="stopDrag"
              @mouseleave="stopDrag"
            >
              <div class="wheel-spacer"></div>
              <div
                v-for="h in hourOptions"
                :key="h"
                class="wheel-item"
                :class="{ active: tempHour === h }"
                @click="scrollToValue('hour', h)"
              >
                {{ h }}
              </div>
              <div class="wheel-spacer"></div>
            </div>

            <div class="relative z-10 !text-[#111927] font-bold text-base pb-0.5">
              :
            </div>

            <!-- Minutes Column -->
            <div
              class="wheel-column h-full scrollbar-hide"
              :class="{ dragging: isDragging && activeColumn === 'minute' }"
              @scroll="handleScroll($event, 'minute')"
              @mousedown="startDrag($event, 'minute')"
              @mousemove="onDrag($event, 'minute')"
              @mouseup="stopDrag"
              @mouseleave="stopDrag"
            >
              <div class="wheel-spacer"></div>
              <div
                v-for="m in minuteOptions"
                :key="m"
                class="wheel-item"
                :class="{ active: tempMinute === m }"
                @click="scrollToValue('minute', m)"
              >
                {{ m }}
              </div>
              <div class="wheel-spacer"></div>
            </div>

            <!-- AM/PM Column -->
            <div
              class="wheel-column h-full scrollbar-hide"
              :class="{ dragging: isDragging && activeColumn === 'period' }"
              @scroll="handleScroll($event, 'period')"
              @mousedown="startDrag($event, 'period')"
              @mousemove="onDrag($event, 'period')"
              @mouseup="stopDrag"
              @mouseleave="stopDrag"
            >
              <div class="wheel-spacer"></div>
              <div
                v-for="(p, index) in periodOptions"
                :key="p"
                class="wheel-item translate-y-[-4px]"
                :class="{ active: tempPeriod === (index === 0 ? 'AM' : 'PM') }"
                @click="scrollToValue('period', index === 0 ? 'AM' : 'PM')"
              >
                {{ p }}
              </div>
              <div class="wheel-spacer"></div>
            </div>
          </div>

          <div
            class="flex justify-between items-center mt-3 pt-2 border-t border-gray-50"
          >
            <button
              type="button"
              @click="clearTime"
              class="text-[10px] text-gray-400 hover:text-[#B42318] cursor-pointer"
            >
              {{ t("roles.resetFilters") }}
            </button>
            <button
              type="button"
              @click="confirmTime"
              class="bg-[#0E5F4A] text-white text-xs px-4 py-1.5 rounded-lg hover:bg-[#0C4F3E] transition-colors font-medium cursor-pointer"
            >
              {{ t("common.confirm") || "OK" }}
            </button>
          </div>
          </div>
        </transition>
      </Teleport>
    </div>

    <p v-if="error" class="time-picker-error">
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import SvgIcon from "./SvgIcon.vue";
import Icon from "./Icon.vue";
import { bus } from "@/utils/eventBus";

const { t, locale } = useI18n();

const props = defineProps({
  modelValue: {
    type: String,
    default: "", // Internal format HH:mm (24h)
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
const tempHour = ref("04");
const tempMinute = ref("00");
const tempPeriod = ref("AM");

const hourOptions = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const minuteOptions = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);
const periodOptions = computed(() => {
  return locale.value === "ar" ? ["ص", "م"] : ["AM", "PM"];
});

const displayTime = computed(() => {
  if (!props.modelValue) return "";
  const [h, m] = props.modelValue.split(":").map(Number);
  const period =
    h >= 12
      ? locale.value === "ar"
        ? "م"
        : "PM"
      : locale.value === "ar"
        ? "ص"
        : "AM";
  const displayH = h % 12 || 12;
  return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && newVal.includes(":")) {
      const [h, m] = newVal.split(":").map(Number);
      tempPeriod.value = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 || 12;
      tempHour.value = String(displayH).padStart(2, "0");
      tempMinute.value = String(m).padStart(2, "0");
    } else {
      // Default to current time if empty and opened
      const now = new Date();
      let h = now.getHours();
      tempPeriod.value = h >= 12 ? "PM" : "AM";
      tempHour.value = String(h % 12 || 12).padStart(2, "0");
      tempMinute.value = String(now.getMinutes()).padStart(2, "0");
    }
  },
  { immediate: true },
);

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    updateDropdownPosition();
    nextTick(() => {
      syncWheels();
    });
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
    if (roomBelow < 250 && roomAbove > roomBelow) {
      top = rect.top - 4;
      transform = "translateY(-100%)";
    }

    dropdownStyle.value = {
      top: `${top}px`,
      left:
        locale.value === "ar"
          ? `${rect.right - 190}px`
          : `${rect.left}px`,
      width: `190px`,
      transform: transform,
    };
  }
};

onMounted(() => {
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

const syncWheels = () => {
  scrollToValue("hour", tempHour.value, "auto");
  scrollToValue("minute", tempMinute.value, "auto");
  scrollToValue("period", tempPeriod.value, "auto");
};

const scrollToValue = (type, value, behavior = "smooth") => {
  const wheels = document.querySelectorAll(".wheel-column");
  let container;
  if (type === "hour") container = wheels[0];
  else if (type === "minute") container = wheels[1];
  else if (type === "period") container = wheels[2];

  if (!container) return;

  const options =
    type === "hour"
      ? hourOptions
      : type === "minute"
        ? minuteOptions
        : ["AM", "PM"];
  const index = options.indexOf(value);
  if (index === -1) return;

  const itemHeight = 28; // matching .wheel-item height
  container.scrollTo({
    top: index * itemHeight,
    behavior,
  });
};

const handleScroll = (event, type) => {
  if (isDragging.value) return;
  const container = event.target;
  const itemHeight = 28;
  const index = Math.round(container.scrollTop / itemHeight);

  const options =
    type === "hour"
      ? hourOptions
      : type === "minute"
        ? minuteOptions
        : ["AM", "PM"];
  const value = options[index];

  if (value) {
    if (type === "hour") tempHour.value = value;
    if (type === "minute") tempMinute.value = value;
    if (type === "period") tempPeriod.value = value;
  }
};

// Drag to scroll logic
const isDragging = ref(false);
const activeColumn = ref(null);
const startY = ref(0);
const startScrollTop = ref(0);

const startDrag = (e, type) => {
  isDragging.value = true;
  activeColumn.value = type;
  startY.value = e.pageY;
  startScrollTop.value = e.currentTarget.scrollTop;
  e.currentTarget.style.cursor = "grabbing";
};

const onDrag = (e, type) => {
  if (!isDragging.value) return;
  const container = e.currentTarget;
  const y = e.pageY;
  const walk = startY.value - y;
  container.scrollTop = startScrollTop.value + walk;
};

const stopDrag = (e) => {
  if (!isDragging.value) return;
  isDragging.value = false;
  const container = e.currentTarget;
  container.style.cursor = "pointer";

  // Recalculate snap after drag
  const itemHeight = 28;
  const index = Math.round(container.scrollTop / itemHeight);
  container.scrollTo({
    top: index * itemHeight,
    behavior: "smooth",
  });
};

const confirmTime = () => {
  let h = parseInt(tempHour.value);
  const m = tempMinute.value;

  if (tempPeriod.value === "PM" && h < 12) h += 12;
  if (tempPeriod.value === "AM" && h === 12) h = 0;

  const timeStr = `${String(h).padStart(2, "0")}:${m}`;
  emit("update:modelValue", timeStr);
  emit("change", timeStr);
  isOpen.value = false;
};

const clearTime = () => {
  emit("update:modelValue", "");
  emit("change", "");
  isOpen.value = false;
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

.time-picker-wrapper {
  @apply w-full;
}

.time-picker-label {
  @apply block text-sm font-medium text-[#161616] mb-1.5;
}

.time-picker-error {
  @apply mt-1 text-xs font-medium text-[#B42318];
}

.focus-line {
  @apply absolute bottom-0 left-1/2 h-[3px] w-0 transition-all duration-300 ease-out -translate-x-1/2 pointer-events-none;
}

.trigger-focused .focus-line {
  @apply w-full;
}

.wheel-column {
  @apply relative z-10 flex-1 flex flex-col items-center overflow-y-auto snap-y snap-mandatory cursor-pointer;
  /* Adjusting scroll behavior */
  scroll-behavior: smooth;
  -ms-overflow-style: none;
  scrollbar-width: none;
  scroll-snap-stop: always;
}

.wheel-column.dragging {
  scroll-behavior: auto;
  scroll-snap-type: none;
}

.wheel-column::-webkit-scrollbar {
  display: none;
}

.wheel-spacer {
  @apply h-[50px] flex-shrink-0;
  min-height: 50px;
}

.wheel-item {
  @apply h-7 w-full flex items-center justify-center text-sm text-gray-400 transition-all duration-200 snap-center flex-shrink-0;
}

.wheel-item.active {
  @apply !text-[#111927] text-base;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
