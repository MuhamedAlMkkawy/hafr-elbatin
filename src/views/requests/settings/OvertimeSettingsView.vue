<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-[18px] font-[600] text-[#000000]">
        {{ t("requestsSettings.overtime.title") }}
      </h2>
    </div>

    <Card>
      <div v-if="initialLoading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>
      <form v-else @submit.prevent="handleSubmit" class="space-y-6 smallLabels">
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div class="space-y-1">
            <DurationPicker
              v-model="overtime_threshold"
              :label="t('requestsSettings.overtime.requiredHours')"
              :error="errors.overtime_threshold"
              required
            />
            <div class="flex items-center gap-2 mt-2">
              <SvgIcon name="hint" class="w-8" />
              <p class="text-[14px] text-[#384250]">
                {{ t("requestsSettings.overtime.requiredHoursHint") }}
              </p>
            </div>
          </div>

          <div class="space-y-1">
            <DurationPicker
              v-model="overtime_duration"
              :label="t('requestsSettings.overtime.overtimeHours')"
              :error="errors.overtime_duration"
              required
            />
            <div class="flex items-center gap-2 mt-2">
              <SvgIcon name="hint" class="w-8" />
              <p class="text-[14px] text-[#384250]">
                {{ t("requestsSettings.overtime.overtimeHoursHint") }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex gap-3 justify-end pt-4">
          <Button
            @click="handleCancel"
            type="button"
            variant="secondary"
            class="w-32"
            :disabled="!meta.dirty || submitting"
          >
            {{ t("common.cancel") }}
          </Button>
          <Button
            variant="primary"
            :loading="submitting"
            type="submit"
            class="w-32"
          >
            {{ t("common.save") }}
          </Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { toTypedSchema } from "@vee-validate/yup";
import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import DurationPicker from "@/components/ui/DurationPicker.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { requestsSettingsService } from "@/services/requestsSettings";
import { useAppToast } from "@/composables/useAppToast";
import { useAuthStore } from "@/stores/auth";

const { t } = useI18n();
const toast = useAppToast();
const authStore = useAuthStore();
const submitting = ref(false);
const initialLoading = ref(true);

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, mins] = timeStr.split(":").map(Number);
  return hours * 60 + (mins || 0);
};

const minutesToTimeString = (mins) => {
  if (mins === null || mins === undefined) return "";
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const schema = toTypedSchema(
  yup.object({
    overtime_threshold: yup
      .string()
      .required(t("validation.fieldRequired"))
      .test("valid-time", t("validation.fieldRequired"), (val) => val && val !== ":"),
    overtime_duration: yup
      .string()
      .required(t("validation.fieldRequired"))
      .test("valid-time", t("validation.fieldRequired"), (val) => val && val !== ":"),
  })
);

const { handleSubmit: validateAndSubmit, errors, setValues, meta, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    overtime_threshold: "",
    overtime_duration: "",
  },
});

const { value: overtime_threshold } = useField("overtime_threshold");
const { value: overtime_duration } = useField("overtime_duration");

const fetchSettings = async (showLoader = true) => {
  if (!authStore.hasPermission("overtime_setting.view")) return;
  if (showLoader) initialLoading.value = true;
  try {
    const response = await requestsSettingsService.getOvertime();
    if (response.success && response.data) {
      resetForm({
        values: {
          overtime_threshold: minutesToTimeString(response.data.overtime_threshold),
          overtime_duration: minutesToTimeString(response.data.overtime_duration),
        },
      });
    }
  } catch (error) {
    console.error("Failed to fetch overtime settings:", error);
  } finally {
    if (showLoader) initialLoading.value = false;
  }
};

const handleCancel = () => {
  resetForm();
};

const handleSubmit = validateAndSubmit(async (values) => {
  submitting.value = true;
  try {
    const payload = {
      overtime_threshold: timeToMinutes(values.overtime_threshold),
      overtime_duration: timeToMinutes(values.overtime_duration),
    };
    const response = await requestsSettingsService.updateOvertime(payload);
    if (response.success) {
      toast.success(t("requestsSettings.messages.overtimeSaved"));
      await fetchSettings(false);
    }
  } catch (error) {
    toast.error(t("requestsSettings.messages.validationError"));
  } finally {
    submitting.value = false;
  }
});

onMounted(() => {
  fetchSettings();
});
</script>
