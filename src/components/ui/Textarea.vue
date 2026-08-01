<template>
  <div class="input-wrapper" :class="attrs.class" :style="attrs.style">
    <label
      v-if="label"
      :for="inputId"
      class="input-label transition-colors duration-300 text-[#161616]"
    >
      <span v-if="required" class="text-[#B42318]">*</span>
      {{ label }}
    </label>
    <div class="relative overflow-hidden">
      <textarea
        :id="inputId"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        :rows="rows"
        v-bind="inputAttrs"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      ></textarea>
      <div
        class="focus-line"
        :class="{ 'bg-[#b42318]': error, 'bg-[#0D121C]': !error }"
      ></div>
    </div>
    <p v-if="error" class="input-error">
      {{ error }}
    </p>
    <p v-if="hint && !error" class="input-hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup>
import { computed, ref, useAttrs } from "vue";
import { useI18n } from "vue-i18n";

defineOptions({ inheritAttrs: false });

const { locale } = useI18n();
const attrs = useAttrs();

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
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
  rows: {
    type: Number,
    default: 4,
  },
});

const emit = defineEmits(["update:modelValue", "blur", "focus"]);

const isFocused = ref(false);

const generatedId = `textarea-${Math.random().toString(36).slice(2, 11)}`;
const inputId = computed(() => (attrs.id ? String(attrs.id) : generatedId));

const inputAttrs = computed(() => {
  const a = { ...attrs };
  delete a.class;
  delete a.style;
  return a;
});

const inputClasses = computed(() => {
  const baseClasses =
    "w-full block bg-[#F3F4F6] focus:bg-white text-[#161616] placeholder:text-[#6C737F] focus:outline-none transition-all duration-300 disabled:cursor-not-allowed focus:border focus:!border-gray-500 resize-none border-b-3";

  const stateClasses = props.error
    ? "border-[#B42318]/30"
    : "border-transparent";

  const placeholderClasses =
    locale.value == "ar" ? "placeholder:text-right" : "";

  return [
    baseClasses,
    "px-4 py-2 text-base rounded-sm",
    stateClasses,
    placeholderClasses,
  ]
    .filter(Boolean)
    .join(" ");
});

const handleInput = (event) => {
  emit("update:modelValue", event.target.value);
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

.focus-line {
  @apply absolute bottom-0 left-1/2 h-[3px] w-0 transition-all duration-300 ease-out -translate-x-1/2 pointer-events-none;
}

textarea:focus ~ .focus-line {
  @apply w-full;
}

.input-error {
  @apply mt-1 text-xs font-medium text-[#B42318];
}

.input-hint {
  @apply mt-1 text-xs text-gray-400;
}
</style>
