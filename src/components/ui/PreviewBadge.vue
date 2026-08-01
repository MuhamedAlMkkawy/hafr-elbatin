<template>
  <Transition name="scale">
    <div
      v-if="auth.isPreviewMode"
      ref="badgeRef"
      class="fixed z-[9999] select-none touch-none !bg-primary"
      :style="{
        [isRtl ? 'left' : 'right']: position.x + 'px',
        top: position.y + 'px',
        cursor: isDragging ? 'grabbing' : 'grab'
      }"
      @mousedown="startDrag"
    >
      <!-- Glassmorphism Container with Primary influence -->
      <div
        class="relative flex items-center gap-3 p-1.5 transition-all duration-500 ease-out border shadow-2xl backdrop-blur-xl overflow-hidden"
        :class="[
          isOpen 
            ? 'rounded-3xl bg-white/70 border-primary/30 px-5 py-3 w-max max-w-[90vw]' 
            : 'rounded-full bg-primary border-white/20 w-14 h-14 justify-center ring-3 ring-primary/50'
        ]"
      >
        <!-- Background shimmer with primary tint -->
        <div class="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none !bg-[#0e5f4a]/10"></div>

        <!-- Main Icon / Branch Initial -->
        <div 
          @click.stop="toggleOpen"
          class="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all active:scale-90"
          :class="[isOpen ? 'bg-primary/10 text-primary' : 'bg-white/20 text-white']"
        >
          <SvgIcon name="access" />
        </div>

        <!-- Expanded Content -->
        <Transition name="fade-slide">
          <div v-if="isOpen" class="relative z-10 flex items-center gap-4 whitespace-nowrap">
            <div class="flex flex-col min-w-0">
              <span class="text-[10px] font-bold tracking-[0.1em] uppercase text-primary/70">{{ t('branches.previewMode.label') }}</span>
              <h4 class="text-sm font-bold text-black truncate max-w-[150px]">{{ auth.previewBranchName }}</h4>
            </div>

            <div class="w-px h-8 bg-primary/20"></div>

            <button
              @click.stop="exitPreview"
              class="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all duration-300 group shadow-lg shadow-red-500/20"
            >
              <span class="text-xs font-bold cursor-pointer">{{ t('branches.previewMode.exit') }}</span>
            </button>
          </div>
        </Transition>

        <!-- Tooltip hint when closed -->
        <div v-if="!isOpen && !isDragging" class="cursor-pointer absolute -top-10 end-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {{ auth.previewBranchName }}
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useI18n } from "vue-i18n";
import SvgIcon from "@/components/ui/SvgIcon.vue";

const auth = useAuthStore();
const { t, locale } = useI18n();

const isRtl = computed(() => locale.value === 'ar');

const badgeRef = ref(null);
const isOpen = ref(false);
const isDragging = ref(false);
const dragStartTime = ref(0);

const position = reactive({
  x: 20,
  y: window.innerHeight - 100
});

const offset = reactive({ x: 0, y: 0 });

const toggleOpen = () => {
  const dragDuration = Date.now() - dragStartTime.value;
  if (dragDuration < 200) {
    isOpen.value = !isOpen.value;
  }
};

const startDrag = (e) => {
  isDragging.value = true;
  dragStartTime.value = Date.now();
  
  if (isRtl.value) {
    offset.x = e.clientX - position.x;
  } else {
    offset.x = (window.innerWidth - e.clientX) - position.x;
  }
  offset.y = e.clientY - position.y;
  
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
};

const onDrag = (e) => {
  if (!isDragging.value) return;
  
  let newX;
  if (isRtl.value) {
    newX = e.clientX - offset.x;
  } else {
    newX = (window.innerWidth - e.clientX) - offset.x;
  }
  let newY = e.clientY - offset.y;
  
  const margin = 20;
  const badgeWidth = isOpen.value ? 280 : 60;
  const badgeHeight = 60;
  
  newX = Math.max(margin, Math.min(newX, window.innerWidth - badgeWidth - margin));
  newY = Math.max(margin, Math.min(newY, window.innerHeight - badgeHeight - margin));
  
  position.x = newX;
  position.y = newY;
};

const stopDrag = () => {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
};

const exitPreview = () => {
  auth.stopPreview();
  window.location.reload();
};

onMounted(() => {
  // Initial position is already set to 20 for both (from left in AR, from right in EN)
});

onUnmounted(() => {
  stopDrag();
});
</script>

<style scoped>
.scale-enter-active,
.scale-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

.fade-slide-enter-active {
  transition: all 0.3s ease-out 0.2s;
}
.fade-slide-leave-active {
  transition: all 0.2s ease-in;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
