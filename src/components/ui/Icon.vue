<template>
  <component :is="iconComponent" :class="iconClasses" />
</template>

<script setup>
import { computed } from 'vue'
import * as HeroIcons from '@heroicons/vue/24/outline'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  class: {
    type: String,
    default: ''
  }
})

const iconComponent = computed(() => {
  // Convert kebab-case or camelCase to PascalCase + Icon
  // e.g., "chevronDown" -> "ChevronDownIcon", "x-mark" -> "XMarkIcon"
  const pascalName = props.name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
  const iconName = pascalName + 'Icon'
  return HeroIcons[iconName] || HeroIcons['QuestionMarkCircleIcon']
})

const iconClasses = computed(() => {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }
  return `${sizeMap[props.size]} ${props.class}`
})
</script>

