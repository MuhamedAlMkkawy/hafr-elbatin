<template>
  <div class="empty flex items-center h-[70vh]" >
    <img src="@/assets/images/empty.gif" alt="empty image" loading="lazy" class="w-[200px]">
    <h3>{{ props.text }}</h3>
  </div>
</template>

<script setup>
  const props = defineProps({
    text : String
  })
</script>

<style scoped>
.empty,
.empty-chat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 40px 0;
  min-height: 50vh;
}

.empty i,
.empty-chat i {
  font-size: 150px;
  margin-bottom: 20px;
  color: var(
    --main-color
  ); /* replace $mainColor with a CSS variable or static color */
  animation-name: rotate;
  animation-duration: 5s;
  animation-iteration-count: infinite;
  animation-direction: alternate-reverse;
}

.empty h3,
.empty-chat h3 {
  font-size: 18px;
  font-weight: 500;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
