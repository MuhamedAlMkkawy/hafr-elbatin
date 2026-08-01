<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
    class="cursor-pointer"
  >
    <SvgIcon
      v-if="icon && !loading"
      :name="icon"
      :classes="iconClasses + (variant != 'transparent' ? ' me-2' : '')"
    />
    <SvgIcon
      v-if="loading"
      name="loading"
      :classes="iconClasses + ' me-2 animate-spin'"
    />
    <slot />
  </button>
</template>

<script setup>
import { computed } from "vue";
import SvgIcon from "./SvgIcon.vue";

const props = defineProps({
  variant: {
    type: String,
    default: "primary",
    validator: (value) =>
      ["primary", "secondary", "outline", "ghost", "danger"].includes(value),
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    default: "button",
  },
  fullWidth: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["click"]);

const iconClasses = computed(() => {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };
  return sizeMap[props.size];
});

const buttonClasses = computed(() => {
  const baseClasses =
    "color-[#0E5F4A] inline-flex items-center justify-center font-medium rounded-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const variantClasses = {
    primary:
      "bg-[#0E5F4A] text-white hover:bg-[#0E5F4A]/85 focus:ring-[#0E5F4A]",
    secondary:
      "bg-[#E5E7EB] text-[#384250] hover:bg-gray-300 focus:ring-gray-300",
    outline:
      "border-2 border-[#0E5F4A] text-[#0E5F4A] hover:bg-[#0E5F4A]/10 focus:ring-[#0E5F4A]",
    ghost: "text-[#6C737F] bg-[#F3F4F6] hover:bg-[#F3F4F6]/80 focus:ring-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const widthClass = props.fullWidth ? "w-full" : "";

  return [
    baseClasses,
    sizeClasses[props.size],
    variantClasses[props.variant],
    widthClass,
  ]
    .filter(Boolean)
    .join(" ");
});
</script>
