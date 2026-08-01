<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  holidayData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "edit"]);

const { t, locale } = useI18n();
const lang = computed(() => locale.value);

const close = () => {
  emit("update:modelValue", false);
};

const handleEdit = () => {
  emit("edit", props.holidayData);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  // Use getUTC methods to avoid timezone shift if the date was string-parsed as UTC
  // which is common for "YYYY-MM-DD" formatted strings.
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const day = String(isDateOnly ? date.getUTCDate() : date.getDate()).padStart(2, "0");
  const month = String(isDateOnly ? date.getUTCMonth() + 1 : date.getMonth() + 1).padStart(2, "0");
  const year = isDateOnly ? date.getUTCFullYear() : date.getFullYear();
  return `${month}/${day}/${year}`;
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="t('holidays.modals.viewTitle')"
    width="md"
    @update:model-value="close"
  >
    <div v-if="holidayData" class="py-8 px-2">
      <div class="space-y-6">
        <!-- Holiday Name Arabic -->
        <div class="flex items-center">
          <div class="w-[170px]">
            <span class="text-[12px] font-[500] text-[#6C737F]">{{
              t("holidays.fields.nameAr")
            }}</span>
          </div>
          <div>
            <h3 class="text-[16px] font-[600] text-[#384250]">
              {{ holidayData.name_ar || "-" }}
            </h3>
          </div>
        </div>

        <!-- Holiday Name English -->
        <div class="flex items-center">
          <div class="w-[170px]">
            <span class="text-[12px] font-[500] text-[#6C737F]">{{
              t("holidays.fields.nameEn")
            }}</span>
          </div>
          <div>
            <h4 class="text-[16px] font-[600] text-[#384250]">
              {{ holidayData.name_en || "-" }}
            </h4>
          </div>
        </div>

        <!-- Start Date -->
        <div class="flex items-center">
          <div class="w-[170px]">
            <span class="text-[12px] font-[500] text-[#6C737F]">{{
              t("holidays.fields.startDate")
            }}</span>
          </div>
          <div>
            <span class="text-[16px] font-[600] text-[#384250]">
              {{ formatDate(holidayData.start_date) }}
            </span>
          </div>
        </div>

        <!-- End Date -->
        <div class="flex items-center">
          <div class="w-[170px]">
            <span class="text-[12px] font-[500] text-[#6C737F]">{{
              t("holidays.fields.endDate")
            }}</span>
          </div>
          <div>
            <span class="text-[16px] font-[600] text-[#384250]">
              {{ formatDate(holidayData.end_date) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button variant="secondary" @click="close">
          {{ t("common.cancel") }}
        </Button>
        <Button
          variant="primary"
          @click="handleEdit"
          :disabled="!holidayData?.is_editable"
        >
          {{ t("common.edit") }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
