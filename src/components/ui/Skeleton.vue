<template>
  <div
    class="skeleton-loader overflow-hidden relative"
    :class="[width, height, radius, customClass]"
  >
    <div class="shimmer-wrapper">
      <div class="shimmer"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  width: {
    type: String,
    default: 'w-full'
  },
  height: {
    type: String,
    default: 'h-4'
  },
  radius: {
    type: String,
    default: 'rounded-md'
  },
  customClass: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.skeleton-loader {
  background-color: #f3f4f6;
}

.shimmer-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  animation: loading 1.5s infinite;
}

.shimmer {
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: skewX(-20deg);
}

@keyframes loading {
  0% {
    transform: translateX(-150%);
  }
  50% {
    transform: translateX(-60%);
  }
  100% {
    transform: translateX(150%);
  }
}
</style>
