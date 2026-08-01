<template>
  <Modal
    v-model="model"
    :title="title"
    width="xl"
  >
    <div class="flex items-center justify-center py-2">
      <div class="relative group">
        <img
          :src="imageUrl"
          class="max-w-full max-h-[70vh] rounded-lg shadow-sm object-contain border border-gray-100 transition-all"
          alt="Selfie Preview"
        />
        <!-- Subtle Overlay on Hover (Optional, keeping it calm) -->
        <div class="absolute inset-0 bg-black/5 rounded-lg pointer-events-none"></div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-end w-full">
        <Button variant="secondary" @click="close" class="!px-8">
          {{ t("common.close") }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Modal from '@/components/ui/Modal.vue';
import Button from '@/components/ui/Button.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);
const { t } = useI18n();

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const close = () => {
  model.value = false;
};
</script>

<style scoped>
</style>