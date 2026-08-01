<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { toTypedSchema } from "@vee-validate/yup";

import Modal from "@/components/ui/Modal.vue";
import Input from "@/components/ui/Input.vue";
import Button from "@/components/ui/Button.vue";
import Textarea from "@/components/ui/Textarea.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { holidayService } from "@/services/holidays";
import { useAppToast } from "@/composables/useAppToast";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  holidayData: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: "add",
  },
});

const emit = defineEmits(["update:modelValue", "saved"]);

const { t, locale } = useI18n();
const toast = useAppToast();
const loading = ref(false);

const isEdit = computed(() => props.mode === "edit");

const schema = toTypedSchema(
  yup.object({
    name_ar: yup
      .string()
      .required(t("holidays.validation.nameArRequired"))
      .min(2, t("validation.nameRange"))
      .max(30, t("validation.nameRange"))
      .matches(
        /^[\u0600-\u06FF0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\u2013\u2014]+$/,
        t("validation.arabicOnly"),
      ),
    name_en: yup
      .string()
      .required(t("holidays.validation.nameEnRequired"))
      .min(2, t("validation.nameRange"))
      .max(30, t("validation.nameRange"))
      .matches(
        /^[a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\u2013\u2014]+$/,
        t("validation.englishOnly"),
      ),
    start_date: yup
      .string()
      .required(t("holidays.validation.startDateRequired"))
      .test(
        "not-past-month",
        t("holidays.validation.startDatePastMonth"),
        function (value) {
          if (!value || isEdit.value) return true;
          const date = new Date(value);
          const now = new Date();
          const currentMonthFirstDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
          );
          return date >= currentMonthFirstDay;
        },
      ),
    end_date: yup
      .string()
      .required(t("holidays.validation.endDateRequired"))
      .test(
        "after-start",
        t("holidays.validation.endDateBeforeStartDate"),
        function (value) {
          const { start_date } = this.parent;
          if (!value || !start_date) return true;
          return new Date(value) >= new Date(start_date);
        },
      ),
  }),
);

const {
  handleSubmit: validateAndSubmit,
  errors,
  resetForm,
  setValues,
} = useForm({
  validationSchema: schema,
  initialValues: {
    name_ar: "",
    name_en: "",
    start_date: "",
    end_date: "",
  },
});

const { value: name_ar } = useField("name_ar");
const { value: name_en } = useField("name_en");
const { value: start_date } = useField("start_date");
const { value: end_date } = useField("end_date");

const daysCount = computed(() => {
  if (!start_date.value || !end_date.value) return 0;
  const start = new Date(start_date.value);
  const end = new Date(end_date.value);
  if (end < start) return 0;
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
});

watch(
  () => props.holidayData,
  (newData) => {
    if (newData) {
      setValues({
        name_ar: newData.name_ar || "",
        name_en: newData.name_en || "",
        start_date: newData.start_date ? newData.start_date.split(/[T ]/)[0] : "",
        end_date: newData.end_date ? newData.end_date.split(/[T ]/)[0] : "",
      });
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
  },
);

const close = () => {
  emit("update:modelValue", false);
};

const onSubmit = validateAndSubmit(async (values) => {
  loading.value = true;
  try {
    const payload = {
      ...values,
      start_date: values.start_date ? values.start_date.split(/[T ]/)[0] : values.start_date,
      end_date: values.end_date ? values.end_date.split(/[T ]/)[0] : values.end_date,
    };
    if (isEdit.value) {
      await holidayService.update(props.holidayData.id, payload);
      toast.success(t("holidays.messages.updated"));
    } else {
      await holidayService.create(payload);
      toast.success(t("holidays.messages.created"));
    }
    emit("saved");
    close();
  } catch (error) {
    toast.error(error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="
      isEdit ? t('holidays.modals.editTitle') : t('holidays.modals.addTitle')
    "
    width="xl"
    @update:model-value="close"
  >
    <form class="space-y-4 py-2" @submit.prevent="onSubmit">
      <div class="grid grid-cols-1 gap-4">
        <Input
          v-model="name_ar"
          :label="t('holidays.fields.nameAr')"
          :placeholder="t('holidays.placeholders.holidayName')"
          :error="errors.name_ar"
          required
        />
        <Input
          v-model="name_en"
          :label="t('holidays.fields.nameEn')"
          :placeholder="t('holidays.placeholders.holidayName')"
          :error="errors.name_en"
          required
        />
      </div>

      <div class="grid grid-cols-1 gap-4">
        <Input
          v-model="start_date"
          type="date"
          :label="t('holidays.fields.startDate')"
          :placeholder="t('holidays.placeholders.startDate')"
          :error="errors.start_date"
          required
        >
          <template #suffix>
            <SvgIcon name="calender_icon" />
          </template>
        </Input>
        <Input
          v-model="end_date"
          type="date"
          :label="t('holidays.fields.endDate')"
          :placeholder="t('holidays.placeholders.endDate')"
          :error="errors.end_date"
          required
        >
          <template #suffix>
            <SvgIcon name="calender_icon" />
          </template>
        </Input>
      </div>

      <div
        v-if="daysCount > 0"
        class="flex items-center gap-2 text-[14px] text-[#384250]"
      >
        <SvgIcon name="holiday_info" classes="w-4 h-4 text-[#1B8354]" />
        <span>
          {{ t("holidays.fields.totalDays") }}: {{ daysCount }}
          {{ t("common.day_singular") }}
        </span>
      </div>
    </form>

    <template #footer>
      <div class="flex gap-2 min-w-[30%] mt-4">
        <Button variant="secondary" class="flex-1" @click="close">
          {{ t("common.cancel") }}
        </Button>
        <Button
          variant="primary"
          class="flex-1"
          :loading="loading"
          @click="onSubmit"
        >
          {{ t("common.save") }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
