<script setup>
import { ref, watch, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { toTypedSchema } from "@vee-validate/yup";
import { useAppToast } from "@/composables/useAppToast";
import { useAuthStore } from "@/stores/auth";

import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import Textarea from "@/components/ui/Textarea.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import DatePicker from "@/components/ui/DatePicker.vue";
import TimePicker from "@/components/ui/TimePicker.vue";

import { permissionRequestsService } from "@/services/permissionRequests";

const toast = useAppToast();
const props = defineProps({
  show: Boolean,
  request: Object,
  employees: Array,
  scope: String,
  saving: Boolean,
});

const emit = defineEmits(["close", "save"]);

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const authStore = useAuthStore();

const schema = computed(() => toTypedSchema(
  yup.object({
    employee_id: yup
      .string()
      .nullable()
      .test("is-required", t("permissionRequests.fields.employeeName") + " " + t("common.required"), (val) => {
        if (authStore.isEmployee || props.scope === "own") return true;
        return !!val;
      }),

    date: yup
      .string()
      .required(t("permissionRequests.fields.date") + " " + t("common.required")),

    from_time: yup
      .string()
      .required(t("permissionRequests.fields.fromTime") + " " + t("common.required")),

    to_time: yup
      .string()
      .required(t("permissionRequests.fields.toTime") + " " + t("common.required"))
      .test(
        "is-after-from",
        t("permissionRequests.messages.toTimeAfterFrom") || "To time must be after from time",
        function (value) {
          const { from_time } = this.parent;
          if (!from_time || !value) return true;
          
          const [fromH, fromM] = from_time.split(':').map(Number);
          const [toH, toM] = value.split(':').map(Number);
          
          const fromInMinutes = fromH * 60 + fromM;
          const toInMinutes = toH * 60 + toM;
          
          return toInMinutes > fromInMinutes;
        }
      ),

    duration_minutes: yup
      .number()
      .required()
      .min(1, t("permissionRequests.messages.durationError")),

    reason: yup.string().nullable().optional(),
  })
));

const {
  handleSubmit: validateAndSubmit,
  errors,
  resetForm,
  setValues,
  setFieldValue,
} = useForm({
  validationSchema: schema,
  initialValues: {
    employee_id: "",
    date: "",
    from_time: "",
    to_time: "",
    duration_minutes: 0,
    reason: "",
  },
});

const { value: employee_id } = useField("employee_id");
const { value: date } = useField("date");
const { value: from_time } = useField("from_time");
const { value: to_time } = useField("to_time");
const { value: duration_minutes } = useField("duration_minutes");
const { value: reason } = useField("reason");

const balance = ref(null);
const loadingBalance = ref(false);

const isEdit = computed(() => !!props.request?.id);

const employeesOptions = computed(() => {
  return (props.employees || []).map((emp) => ({
    label: emp.name,
    value: emp.id,
  }));
});

// Calculate duration in minutes
const durationMinutes = computed(() => {
  if (!from_time.value || !to_time.value) return 0;
  
  const [fromH, fromM] = from_time.value.split(':').map(Number);
  const [toH, toM] = to_time.value.split(':').map(Number);
  
  const fromInMinutes = fromH * 60 + fromM;
  const toInMinutes = toH * 60 + toM;
  
  const diff = toInMinutes - fromInMinutes;
  return diff > 0 ? diff : 0;
});

const durationFormatted = computed(() => {
  if (durationMinutes.value < 0) return "00:00";
  const hours = Math.floor(durationMinutes.value / 60);
  const minutes = durationMinutes.value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

const fetchBalance = async () => {
  if (!employee_id.value || !date.value) {
    balance.value = null;
    return;
  }

  loadingBalance.value = true;
  try {
    const month = date.value.substring(0, 7); // YYYY-MM
    const response = await permissionRequestsService.getBalance(employee_id.value, month);
    balance.value = response.data?.balance || null;
  } catch (error) {
    console.error("Error fetching balance:", error);
  } finally {
    loadingBalance.value = false;
  }
};

watch([employee_id, date], fetchBalance);

watch(durationMinutes, (newVal) => {
  setFieldValue("duration_minutes", newVal);
});

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    if (props.request) {
      setValues({
        employee_id: props.request.employee?.id || props.request.employee_id || "",
        date: props.request.date || "",
        from_time: props.request.from_time || "",
        to_time: props.request.to_time || "",
        duration_minutes: props.request.duration_minutes || 0,
        reason: props.request.reason || "",
      });
    } else {
      resetForm();
      if ((authStore.isEmployee || props.scope === 'own') && authStore.user?.id) {
        employee_id.value = authStore.user.id;
      }
    }
  }
}, { immediate: true });

const onSubmit = validateAndSubmit((values) => {
  emit("save", values);
});

const handleClose = () => {
  emit("close");
};
</script>

<template>
  <Modal
    :model-value="show"
    :title="isEdit ? t('permissionRequests.modals.editTitle') : t('permissionRequests.modals.addTitle')"
    @close="handleClose"
    width="xl"
  >
    <div class="space-y-4">
      <!-- Employee Filter -->
      <Select
        v-if="!authStore.isEmployee && scope !== 'own'"
        v-model="employee_id"
        :options="employeesOptions"
        :label="t('permissionRequests.fields.employeeName')"
        :placeholder="t('permissionRequests.placeholders.selectEmployee')"
        :error="errors.employee_id"
        required
        filterable
        size="md"
      />

      <!-- Date and Balance Info -->
      <div class="space-y-2">
        <DatePicker
          v-model="date"
          :label="t('permissionRequests.fields.date')"
          :placeholder="t('permissionRequests.placeholders.date')"
          :error="errors.date"
          required
          size="md"
        />
      </div>

      <!-- Times -->
      <div class="grid grid-cols-1 gap-4">
        <TimePicker
          v-model="from_time"
          :label="t('permissionRequests.fields.fromTime')"
          :placeholder="t('permissionRequests.placeholders.fromTime')"
          :error="errors.from_time"
          required
          size="md"
        />

        <TimePicker
          v-model="to_time"
          :label="t('permissionRequests.fields.toTime')"
          :placeholder="t('permissionRequests.placeholders.toTime')"
          :error="errors.to_time"
          required
          size="md"
        />
      </div>

      <!-- Duration -->
      <div class="space-y-2">
        <Input
          :model-value="durationFormatted"
          :label="t('permissionRequests.fields.duration')"
          :error="errors.duration_minutes"
          readonly
          size="md"
        />
        <div v-if="balance" class="flex items-center gap-2 text-[14px] text-[#384250]">
          <SvgIcon name="hint" />
          <span>
            {{ t('permissionRequests.modals.currentBalanceHint', { balance: `${Math.floor(balance.remaining_monthly_minutes / 60)} ${t('permissionRequests.balance.hours')} ${balance.remaining_monthly_minutes % 60} ${t('permissionRequests.balance.minutes')}` }) }}
          </span>
        </div>
      </div>

      <!-- Reason -->
      <Textarea
        v-model="reason"
        :label="t('permissionRequests.fields.reason')"
        :placeholder="t('permissionRequests.placeholders.reason')"
        :error="errors.reason"
        size="md"
        rows="3"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <Button variant="secondary" size="md" @click="handleClose">
          {{ t("common.cancel") }}
        </Button>
        <Button
          variant="primary"
          size="md"
          :loading="saving"
          @click="onSubmit"
        >
          {{ isEdit ? t('common.update') : t('common.sendRequest') }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

