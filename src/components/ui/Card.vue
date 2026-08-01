<template>
  <div :class="cardClasses">
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'elevated', 'outlined'].includes(value)
  },
  padding: {
    type: String,
    default: 'md',
    validator: (value) => ['none', 'sm', 'md', 'lg'].includes(value)
  },
  hover: {
    type: Boolean,
    default: false
  }
})

const cardClasses = computed(() => {
  const baseClasses = 'bg-white rounded-[12px] transition-all duration-200'
  
  const variantClasses = {
    default: '',
    elevated: 'border border-gray-200',
    outlined: 'border-2 border-gray-200'
  }
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  const hoverClass = props.hover ? '' : ''
  
  return [
    baseClasses,
    variantClasses[props.variant],
    paddingClasses[props.padding],
    hoverClass
  ].filter(Boolean).join(' ')
})
</script>

<style scoped>
@reference {
  @import "tailwindcss";
}

.card-header {
  @apply border-b border-gray-200 pb-4 mb-4;
}

.card-footer {
  @apply border-t border-gray-200 pt-4 mt-4;
}
</style>

