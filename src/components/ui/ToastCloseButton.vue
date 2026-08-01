<template>
  <div class="toast-actions-wrapper">
    <!-- The original X close button -->
    <button
      type="button"
      class="toast-x-btn"
      aria-label="close"
      @click.stop.prevent="$emit('click')"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13 1L1 13M1 1L13 13"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <!-- The custom 'Okay' button at the bottom -->
    <button type="button" class="toast-custom-close-btn" @click.stop.prevent="$emit('click')">
      {{ text }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const text = ref("حسنًا");

const updateText = () => {
  text.value = document.documentElement.lang === "ar" ? "حسنًا" : "Ok";
};

let observer = null;

onMounted(() => {
  updateText();
  observer = new MutationObserver(updateText);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
.toast-actions-wrapper {
  width: 100%;
  position: static;
}

.toast-custom-close-btn {
  color: #161616;
  font-weight: 500;
  cursor: pointer;
  font-size: 14px;
  max-width: 100px !important;
  margin-inline-start: 40px;
  text-align: end;
  background: transparent;
  border: none;
  padding: 0;
}

.toast-x-btn {
  position: absolute;
  top: 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #161616 !important;
  opacity: 0.5;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 10px !important;
}

.toast-x-btn:hover {
  opacity: 1;
}
</style>
