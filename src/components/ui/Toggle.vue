<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const toggle = () => {
  if (props.disabled || props.loading) return;
  const newValue = !props.modelValue;
  emit("update:modelValue", newValue);
  emit("change", newValue);
};
</script>

<template>
  <label
    class="relative inline-flex items-center cursor-pointer select-none"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
    @click.prevent="toggle"
  >
    <input
      type="checkbox"
      :checked="modelValue"
      class="sr-only peer"
      :disabled="disabled || loading"
      tabindex="-1"
    />
    <div
      class="peer rounded-full bg-white border border-[#0D121C] transition-all after:absolute after:top-[4px] after:left-[4px] after:rounded-full after:bg-[#0D121C] after:transition-all after:content-[''] peer-checked:bg-[#1B8354] peer-checked:border-[#1B8354] peer-checked:after:left-auto peer-checked:after:right-[4px] peer-checked:after:bg-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1B8354]/20"
      :class="{
        'h-5 w-9 after:h-4 after:w-4': size === 'sm',
        'h-[24px] w-[48px] after:h-[16px] after:w-[16px]': size === 'md',
        'h-7 w-14 after:h-6 after:w-6': size === 'lg',
        'opacity-70': loading,
      }"
    >
      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center"
      >
        <svg
          class="animate-spin h-3 w-3 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    </div>
  </label>
</template>
