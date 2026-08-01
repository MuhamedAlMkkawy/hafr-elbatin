<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-[18px] font-[600] text-[#000000]">
        {{ t("requestsSettings.permissions.title") }}
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
              v-model="max_monthly_permission_hours"
              :label="t('requestsSettings.permissions.maxMonthlyHours')"
              :error="errors.max_monthly_permission_hours"
              required
            />
          </div>

          <div class="space-y-1">
            <DurationPicker
              v-model="max_daily_permission_hours"
              :label="t('requestsSettings.permissions.maxDailyHours')"
              :error="errors.max_daily_permission_hours"
              required
            />
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
    max_monthly_permission_hours: yup
      .string()
      .required(t("validation.fieldRequired"))
      .test("valid-time", t("validation.fieldRequired"), (val) => val && val !== ":"),
    max_daily_permission_hours: yup
      .string()
      .required(t("validation.fieldRequired"))
      .test("valid-time", t("validation.fieldRequired"), (val) => val && val !== ":")
      .test(
        "max-daily-le-max-monthly",
        t("requestsSettings.messages.maxDailyExceedsMaxMonthly"),
        function (val) {
          const { max_monthly_permission_hours } = this.parent;
          if (!val || !max_monthly_permission_hours) return true;
          return timeToMinutes(val) <= timeToMinutes(max_monthly_permission_hours);
        }
      ),
  })
);

const { handleSubmit: validateAndSubmit, errors, setValues, meta, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    max_monthly_permission_hours: "",
    max_daily_permission_hours: "",
  },
});

const { value: max_monthly_permission_hours } = useField("max_monthly_permission_hours");
const { value: max_daily_permission_hours } = useField("max_daily_permission_hours");

const fetchSettings = async (showLoader = true) => {
  if (!authStore.hasPermission("excusal_setting.view")) return;
  if (showLoader) initialLoading.value = true;
  try {
    const response = await requestsSettingsService.getPermissions();
    if (response.success && response.data.settings) {
      const { max_monthly_permission_hours, max_daily_permission_hours } =
        response.data.settings;
      resetForm({
        values: {
          max_monthly_permission_hours: minutesToTimeString(max_monthly_permission_hours),
          max_daily_permission_hours: minutesToTimeString(max_daily_permission_hours),
        },
      });
    }
  } catch (error) {
    console.error("Failed to fetch permission settings:", error);
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
      max_monthly_permission_hours: timeToMinutes(values.max_monthly_permission_hours),
      max_daily_permission_hours: timeToMinutes(values.max_daily_permission_hours),
    };
    const response = await requestsSettingsService.updatePermissions(payload);
    if (response.success) {
      toast.success(t("requestsSettings.messages.permissionsSaved"));
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
<style>
@media (max-width: 1424px) and (min-width: 1100px) {
  .smallLabels .select-label {
    font-size: 12px !important;
  }
}
</style>