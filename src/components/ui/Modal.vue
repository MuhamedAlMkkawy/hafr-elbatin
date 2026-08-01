<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4"
      @click.self="close"
    >
      <div
        class="bg-white rounded-xl shadow-xl w-full max-h-[90vh] flex flex-col px-4 py-3 text-start animate-slide-up"
        :class="widthClass"
        :style="modalStyle"
      >
        <div
          class="flex items-center justify-between mb-4 flex-shrink-0 relative"
        >
          <div
            class="flex items-start justify-between w-full gap-2"
            :class="{ 'mx-auto': !title && (image || icon) }"
          >
            <img
              v-if="!title && image"
              :src="image"
              alt="modal-header"
              class="h-10 w-10 object-contain"
            />
            <div class="w-10 h-10" v-if="!title && icon">
              <SvgIcon :name="icon" classes="object-contain" />
            </div>
            <h3 v-if="title" class="text-[18px] font-[600]" :class="titleClass">
              {{ title }}
            </h3>
            <button
              type="button"
              class="text-[#161616] hover:text-gray-600 text-xl cursor-pointer hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
              @click="close"
            >
              ×
            </button>
          </div>
        </div>

        <div
          class="modal-body text-sm text-gray-600 mb-2 flex-1 px-2 custom-scrollbar"
          :class="[
            overflowVisible ? 'overflow-visible z-10 relative' : 'overflow-y-auto',
          ]"
        >
          <slot />
        </div>

        <div class="flex justify-end gap-2">
          <slot name="footer">
            <Button variant="secondary" size="sm" @click="close">
              {{ cancelText }}
            </Button>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, watch } from "vue";
import Button from "./Button.vue";
import SvgIcon from "./SvgIcon.vue";
import { bus } from "@/utils/eventBus";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "",
  },
  borderColor: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "default", // default | danger | warning
  },
  cancelText: {
    type: String,
    default: "Cancel",
  },
  width: {
    type: String,
    default: "sm", // sm | md | lg | xl | 2xl
  },
  overflowVisible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "close"]);

const widthClass = computed(() => {
  const map = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
  };
  return map[props.width] || map.sm;
});

const titleClass = computed(() => {
  const map = {
    default: "text-[#1F2A37]",
    danger: "text-red-600",
    warning: "text-amber-600",
    info: "text-blue-600",
  };
  return map[props.type] || map.default;
});

const modalStyle = computed(() => {
  if (props.borderColor) {
    return {
      borderTop: `8px solid ${props.borderColor}`,
    };
  }
  return {};
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      bus.emit("close-all-selects");
    }
  },
);

const close = () => {
  emit("update:modelValue", false);
  emit("close");
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}
</style>
