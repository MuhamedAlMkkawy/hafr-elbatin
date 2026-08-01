<script setup>
import { ref, computed, watch, onMounted } from "vue";
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

import { leaveRequestsService } from "@/services/leaveRequests";
const toast = useAppToast();
const props = defineProps({
  show: Boolean,
  request: Object,
  leaveTypes: Array,
  employees: Array,
  scope: String,
  saving: Boolean,
});

const emit = defineEmits(["close", "save"]);

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const authStore = useAuthStore();


const currentBalance = ref(null);
const loadingBalance = ref(false);
const calculatingDuration = ref(false);

const schema = toTypedSchema(
  yup.object({
    employee_id: yup
      .string()
      .test("is-required", t("leaveRequests.fields.employeeName") + " " + t("common.required"), (val) => {
        if (authStore.isEmployee) return true;
        return !!val;
      }),

    leave_type_id: yup
      .string()
      .required(t("leaveRequests.fields.leaveType") + " " + t("common.required")),

    from_date: yup
      .string()
      .required(t("leaveRequests.fields.fromDate") + " " + t("common.required")),

    to_date: yup
      .string()
      .required(t("leaveRequests.fields.toDate") + " " + t("common.required"))
      .test(
        "is-after-from",
        t("leaveRequests.messages.toDateAfterFrom") || "To date must be after from date",
        function (value) {
          const { from_date } = this.parent;
          if (!from_date || !value) return true;
          return new Date(value) >= new Date(from_date);
        }
      ),

    reason: yup.string().nullable().optional(),

    duration_days: yup
      .number()
      .required()
      .min(
        1,
        t("leaveRequests.messages.durationError") || "Duration must be at least 1 day"
      ),
  })
);

const {
  handleSubmit: validateAndSubmit,
  errors,
  resetForm,
  setValues,
} = useForm({
  validationSchema: schema,
  initialValues: {
    employee_id: "",
    leave_type_id: "",
    from_date: "",
    to_date: "",
    reason: "",
    duration_days: 0,
  },
});

const { value: employee_id } = useField("employee_id");
const { value: leave_type_id } = useField("leave_type_id");
const { value: from_date } = useField("from_date");
const { value: to_date } = useField("to_date");
const { value: reason } = useField("reason");
const { value: duration_days } = useField("duration_days");

const employeesOptions = computed(() => {
  return (props.employees || []).map((emp) => ({
    label: emp.name,
    value: emp.id,
  }));
});

const leaveTypesOptions = computed(() => {
  return props.leaveTypes.map((type) => ({
    label: lang.value === 'ar' ? type.name_ar : type.name,
    value: type.id,
  }));
});

const loadBalance = async () => {
  if (!employee_id.value || !leave_type_id.value) {
    currentBalance.value = null;
    return;
  }
  loadingBalance.value = true;
  try {
    const response = await leaveRequestsService.getBalance(employee_id.value);
    const balance = response.data?.balances?.find(b => b.leave_type_id == leave_type_id.value);
    currentBalance.value = balance || null;
  } catch (error) {
    console.error(error);
  } finally {
    loadingBalance.value = false;
  }
};

const calculateDuration = async () => {
  if (!employee_id.value || !from_date.value || !to_date.value) {
    duration_days.value = 0;
    return;
  }
  calculatingDuration.value = true;
  try {
    const response = await leaveRequestsService.calculateDuration({
      employee_id: employee_id.value,
      from_date: from_date.value,
      to_date: to_date.value,
    });
    // The calculate-days endpoint returns total_days
    duration_days.value = response.data?.leave_days || 0;
  } catch (error) {
    console.error(error);
    duration_days.value = 0;
  } finally {
    calculatingDuration.value = false;
  }
};

watch([employee_id, leave_type_id], () => {
  loadBalance();
});

watch([employee_id, from_date, to_date], () => {
  if (employee_id.value && from_date.value && to_date.value) {
    calculateDuration();
  }
});

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    if (props.request) {
      setValues({
        employee_id: props.request.employee?.id || props.request.employee_id || "",
        leave_type_id: props.request.leave_type?.id || props.request.leave_type_id || "",
        from_date: props.request.from_date || "",
        to_date: props.request.to_date || "",
        reason: props.request.reason || "",
        duration_days: props.request.duration_days || 0,
      });
    } else {
      resetForm();
      // Set employee_id automatically for employees or "own" scope requests
      if ((authStore.isEmployee || props.scope === 'own') && authStore.user?.id) {
        employee_id.value = authStore.user.id;
      }
    }
  }
}, { immediate: true });

const onSubmit = validateAndSubmit((values) => {
  if (currentBalance.value && values.duration_days > currentBalance.value.remaining_days) {
    toast.error(t("leaveRequests.messages.balanceInsufficient"));
    return;
  }
  emit("save", values);
});

const handleClose = () => {
  emit("close");
};
</script>

<template>
  <Modal
    :model-value="show"
    :title="request ? t('leaveRequests.modals.editTitle') : t('leaveRequests.modals.addTitle')"
    @close="handleClose"
    width="xl"
  >
    <div class="space-y-6 py-4">
      <!-- Employee Filter -->
      <!-- :disabled="!isAdmin" -->
      <Select
        v-if="!authStore.isEmployee && scope !== 'own'"
        v-model="employee_id"
        :options="employeesOptions"
        :label="t('leaveRequests.fields.employeeName')"
        :placeholder="t('leaveRequests.placeholders.selectEmployee')"
        :error="errors.employee_id"
        required
        filterable
        size="md"
      />

      <!-- Leave Type -->
      <div class="space-y-2">
        <Select
          v-model="leave_type_id"
          :options="leaveTypesOptions"
          :label="t('leaveRequests.fields.leaveType')"
          :placeholder="t('leaveRequests.placeholders.selectLeaveType')"
          :error="errors.leave_type_id"
          required
          size="md"
        />
        <div v-if="currentBalance" class="flex items-center gap-2 text-[14px] text-[#384250]">
          <SvgIcon name="hint" />
          <span>{{ t('leaveRequests.balanceTitle') }}: {{ currentBalance.remaining_days }} {{ t('leaveRequests.balance.days') }}</span>
        </div>
      </div>

      <!-- Dates -->
      <div class="grid grid-cols-1 gap-4">
        <Input
          v-model="from_date"
          type="date"
          :label="t('leaveRequests.fields.fromDate')"
          :error="errors.from_date"
          required
          size="md"
        />
        <Input
          v-model="to_date"
          type="date"
          :label="t('leaveRequests.fields.toDate')"
          :error="errors.to_date"
          required
          size="md"
        />
      </div>

      <!-- Duration -->
      <div class="space-y-2">
        <Input
          v-model="duration_days"
          :label="t('leaveRequests.fields.duration')"
          :error="errors.duration_days"
          readonly
          size="md"
          :loading="calculatingDuration"
        />
        <p class="text-[14px] text-[#384250] flex items-center gap-2">
          <SvgIcon name="hint" />
          {{ t('leaveRequests.modals.daysHint') }}
        </p>
      </div>

      <!-- Reason -->
      <Textarea
        v-model="reason"
        :label="t('leaveRequests.fields.reason')"
        :placeholder="t('leaveRequests.placeholders.reason')"
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
          {{ t("common.sendRequest") }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
