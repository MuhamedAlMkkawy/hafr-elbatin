<template>
  <div class="input-wrapper" :class="attrs.class" :style="attrs.style">
    <template v-if="type === 'date'">
      <DatePicker
        :model-value="modelValue"
        @update:model-value="v => $emit('update:modelValue', v)"
        @change="v => $emit('change', v)"
        :label="label"
        :placeholder="placeholder"
        :error="error"
        :disabled="disabled"
        :required="required"
        :min-date="inputAttrs.min"
        :max-date="inputAttrs.max"
        v-bind="inputAttrs"
      />
    </template>
    <template v-else-if="type === 'time'">
      <TimePicker
        :model-value="modelValue"
        @update:model-value="v => $emit('update:modelValue', v)"
        @change="v => $emit('change', v)"
        :label="label"
        :placeholder="placeholder"
        :error="error"
        :disabled="disabled"
        :required="required"
        v-bind="inputAttrs"
      />
    </template>
    <template v-else>
      <label
        v-if="label"
        :for="inputId"
        class="input-label transition-colors duration-300 text-[#161616]"
      >
      <span v-if="required" class="text-[#B42318]">*</span>
      {{ label }}
    </label>
    <div class="relative overflow-hidden">
      <div
        v-if="$slots.prefix"
        class="input-prefix"
        :class="{
          'pointer-events-none': [
            'date',
            'time',
            'datetime-local',
            'month',
            'week',
          ].includes(type),
        }"
      >
        <slot name="prefix" />
      </div>
      <input
        :id="inputId"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        v-bind="inputAttrs"
        :class="[
          inputClasses,
          $slots.prefix &&
          (!['date', 'time', 'datetime-local', 'month', 'week'].includes(
            type,
          ) ||
            (['date', 'time', 'datetime-local', 'month', 'week'].includes(
              type,
            ) &&
              locale === 'en'))
            ? 'pe-10'
            : '',
          $slots.suffix &&
          (!['date', 'time', 'datetime-local', 'month', 'week'].includes(
            type,
          ) ||
            (['date', 'time', 'datetime-local', 'month', 'week'].includes(
              type,
            ) &&
              locale === 'en'))
            ? 'ps-10'
            : '',
        ]"
        @input="handleInput"
        @keydown="handleKeydown"
        @blur="handleBlur"
        @focus="handleFocus"
        @click="handleInputClick"
      />
      <div
        class="focus-line"
        :class="{ 'bg-[#b42318]': error, 'bg-[#0D121C]': !error }"
      ></div>
      <div
        v-if="$slots.suffix"
        class="input-suffix"
        :class="{
          'pointer-events-none': [
            'date',
            'time',
            'datetime-local',
            'month',
            'week',
          ].includes(type),
        }"
      >
        <slot name="suffix" />
      </div>
    </div>
    <p v-if="error" class="input-error">
      {{ error }}
    </p>
      <p v-if="hint && !error" class="input-hint">
        {{ hint }}
      </p>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, useAttrs } from "vue";
import { useI18n } from "vue-i18n";
import DatePicker from "./DatePicker.vue";
import TimePicker from "./TimePicker.vue";

defineOptions({ inheritAttrs: false });

const { locale } = useI18n();
const attrs = useAttrs();

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
  type: {
    type: String,
    default: "text",
  },
  placeholder: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "",
  },
  error: {
    type: String,
    default: "",
  },
  hint: {
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
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
  phoneField: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "blur", "focus"]);

const { t } = useI18n();
const isFocused = ref(false);

const generatedId = `input-${Math.random().toString(36).slice(2, 11)}`;
const inputId = computed(() => (attrs.id ? String(attrs.id) : generatedId));

const inputAttrs = computed(() => {
  const a = { ...attrs };
  delete a.class;
  delete a.style;
  return a;
});

const inputClasses = computed(() => {
  const baseClasses =
    "w-full bg-[#F3F4F6] focus:bg-white text-[#161616] placeholder:text-[#6C737F] focus:outline-none transition-all duration-300 disabled:cursor-not-allowed focus:border focus:!border-gray-500 border-b-3 focus:shadow-sm";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-5 py-3 text-lg",
  };

  const stateClasses = props.error
    ? "border-[#B42318]/30"
    : "border-transparent";

  const phoneFieldClasses = props.phoneField ? "rounded-r-sm" : "rounded-sm";
  const placeholderClasses =
    locale.value == "ar"
      ? props.phoneField
        ? "placeholder:text-right"
        : "placeholder:text-right"
      : "";

  return [
    baseClasses,
    sizeClasses[props.size],
    stateClasses,
    phoneFieldClasses,
    placeholderClasses,
  ]
    .filter(Boolean)
    .join(" ");
});

const handleInput = (event) => {
  let value = event.target.value;

  if (props.type === "tel") {
    const numericValue = value.replace(/\D/g, "");

    if (numericValue !== value) {
      value = numericValue;
      event.target.value = numericValue;
    }
  }

  if (props.type === "number") {
    // If a min attribute is provided, clamp to it (prevents negatives when min >= 0)
    const rawMin = attrs.min;
    const hasMin = rawMin !== undefined && rawMin !== null && rawMin !== "";
    const min = hasMin ? Number(rawMin) : null;

    // Prevent intermediate "-" state
    if (value === "-") {
      value = "";
      event.target.value = "";
    }

    const num = Number(value);
    if (value !== "" && !Number.isNaN(num) && min !== null && num < min) {
      value = String(min);
      event.target.value = value;
    }
  }

  emit("update:modelValue", value);
};

const handleKeydown = (event) => {
  if (props.type !== "number") return;

  const rawMin = attrs.min;
  const hasMin = rawMin !== undefined && rawMin !== null && rawMin !== "";
  const min = hasMin ? Number(rawMin) : null;

  // Block typing "-" only when min >= 0 (lat/long can pass negative mins)
  if (event.key === "-" && min !== null && !Number.isNaN(min) && min >= 0) {
    event.preventDefault();
  }
};

const handleInputClick = (event) => {
  if (
    ["date", "time", "datetime-local", "month", "week"].includes(props.type)
  ) {
    try {
      if (typeof event.target.showPicker === "function") {
        event.target.showPicker();
      }
    } catch (e) {
      console.warn("showPicker is not supported or failed:", e);
    }
  }
};

const handleFocus = (event) => {
  isFocused.value = true;
  emit("focus", event);
};

const handleBlur = (event) => {
  isFocused.value = false;
  emit("blur", event);
};
</script>

<style scoped>
@reference {
  @import "tailwindcss";
}

.input-wrapper {
  @apply w-full;
}

.input-label {
  @apply block text-sm font-medium mb-1.5;
}

.input-prefix {
  @apply absolute left-3 top-1/2 -translate-y-1/2 text-gray-400;
}

.input-suffix {
  @apply absolute start-3 top-1/2 -translate-y-1/2 text-gray-400;
}

.focus-line {
  @apply absolute bottom-0 left-1/2 h-[3px] w-0 transition-all duration-300 ease-out -translate-x-1/2 pointer-events-none;
}

input:focus ~ .focus-line {
  @apply w-full;
}

.input-error {
  @apply mt-1 text-xs font-medium text-[#B42318];
}

.input-hint {
  @apply mt-1 text-xs text-gray-400;
}

input[type="time"]::-webkit-calendar-picker-indicator,
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="datetime-local"]::-webkit-calendar-picker-indicator,
input[type="month"]::-webkit-calendar-picker-indicator,
input[type="week"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
  z-index: 1;
  opacity: 0;
}
</style>
