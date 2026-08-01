<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    width="lg"
    :title="t('shifts.modals.viewTitle')"
  >
    <div v-if="shift" class="space-y-4 py-0">
      <div class="flex flex-col">
        <div class="flex items-center py-3">
          <span class="text-sm text-[#6C737F] w-[150px]">{{
            t("shifts.fields.nameAr")
          }}</span>
          <span class="text-base font-bold text-[#384250]">{{
            shift.name_ar
          }}</span>
        </div>
        <div class="flex items-center py-3">
          <span class="text-sm text-[#6C737F] w-[150px]">{{
            t("shifts.fields.nameEn")
          }}</span>
          <span class="text-base font-bold text-[#384250]">{{
            shift.name
          }}</span>
        </div>
        <div class="flex items-center py-3">
          <span class="text-sm text-[#6C737F] w-[150px]">{{
            t("shifts.fields.department")
          }}</span>
          <span class="text-base font-bold text-[#384250]">
            {{
              locale === "ar"
                ? shift.department?.name_ar
                : shift.department?.name
            }}
          </span>
        </div>
        <div class="flex items-center py-3">
          <span class="text-sm text-[#6C737F] w-[150px]">{{
            t("shifts.fields.type")
          }}</span>
          <span class="text-base font-bold text-[#384250]">
            {{ t(`shifts.types.${shift.type}`) }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <Button variant="primary" class="px-8" @click="$emit('edit', shift)">
          {{ t("common.edit") }}
        </Button>
        <Button
          variant="secondary"
          class="px-8"
          @click="$emit('update:modelValue', false)"
        >
          {{ t("common.cancel") }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";

const props = defineProps({
  modelValue: Boolean,
  shift: Object,
});

defineEmits(["update:modelValue", "edit"]);

const { t, locale } = useI18n();
</script>
