<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="handleClose"
    :title="
      request
        ? t('missingPunchRequests.modals.editTitle')
        : t('missingPunchRequests.modals.addTitle')
    "
    width="xl"
  >
    <div class="space-y-4 py-4">
      <Select
        v-if="!authStore.isEmployee && scope !== 'own'"
        v-model="employee_id"
        :options="employeesOptions"
        :label="t('missingPunchRequests.fields.employeeName')"
        :placeholder="t('missingPunchRequests.placeholders.selectEmployee')"
        :error="errors.employee_id"
        required
        searchable
        size="md"
        :disabled="!!request"
      />

      <Input
        v-model="date"
        type="date"
        :label="t('missingPunchRequests.fields.date')"
        :error="errors.date"
        required
        size="md"
      >
        <template #suffix>
          <SvgIcon name="date_calender" />
        </template>
      </Input>

      <div class="grid grid-cols-1 gap-4">
        <Input
          v-model="check_in_time"
          type="time"
          :label="t('missingPunchRequests.fields.checkIn')"
          :error="errors.check_in_time"
          size="md"
        >
          <template #suffix>
            <SvgIcon name="clock" />
          </template>
        </Input>
        <Input
          v-model="check_out_time"
          type="time"
          :label="t('missingPunchRequests.fields.checkOut')"
          :error="errors.check_out_time"
          size="md"
        >
          <template #suffix>
            <SvgIcon name="clock" />
          </template>
        </Input>
      </div>

      <Textarea
        v-model="reason"
        :label="t('missingPunchRequests.fields.reason')"
        :placeholder="t('missingPunchRequests.placeholders.reason')"
        :error="errors.reason"
        size="md"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <Button variant="ghost" size="md" @click="handleClose">
          {{ t("common.cancel") }}
        </Button>
        <Button
          variant="primary"
          size="md"
          :loading="loading"
          @click="onSubmit"
        >
          {{ t("common.sendRequest") }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { toTypedSchema } from "@vee-validate/yup";

import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import Textarea from "@/components/ui/Textarea.vue";
import { employeeService } from "@/services/employees";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { useAuthStore } from "@/stores/auth";

const props = defineProps({
  modelValue: Boolean,
  request: Object,
  loading: Boolean,
  scope: String,
});

const emit = defineEmits(["update:modelValue", "save"]);

const { t } = useI18n();
const authStore = useAuthStore();
const user = ref();
const employees = ref([]);
const loadingEmployees = ref(false);

const schema = toTypedSchema(
  yup.object({
    employee_id: yup
      .string()
      .test(
        "is-required",
        t("missingPunchRequests.fields.employeeName") +
          " " +
          t("common.required"),
        (val) => {
          if (authStore.isEmployee || props.scope === "own") return true;
          return !!val;
        },
      ),
    date: yup
      .string()
      .required(
        t("missingPunchRequests.fields.date") + " " + t("common.required"),
      ),
    check_in_time: yup
      .string()
      .test(
        "atLeastOneTime",
        t("missingPunchRequests.validation.atLeastOneTime"),
        function (value) {
          return !!(value || this.parent.check_out_time);
        },
      ),
    check_out_time: yup
      .string()
      .test(
        "atLeastOneTime",
        t("missingPunchRequests.validation.atLeastOneTime"),
        function (value) {
          return !!(value || this.parent.check_in_time);
        },
      ),
    reason: yup.string().nullable().optional(),
  }),
);

const {
  handleSubmit: validateAndSubmit,
  errors,
  resetForm,
  setValues,
} = useForm({
  validationSchema: schema,
  validateOnModelUpdate: true,
  initialValues: {
    employee_id: "",
    date: "",
    check_in_time: "",
    check_out_time: "",
    reason: "",
  },
});

const { value: employee_id } = useField("employee_id");
const { value: date } = useField("date");
const { value: check_in_time } = useField("check_in_time");
const { value: check_out_time } = useField("check_out_time");
const { value: reason } = useField("reason");

const employeesOptions = computed(() => {
  const options = employees.value.map((emp) => ({
    label: emp.name,
    value: emp.id,
  }));

  // If user is admin and not in the list, add them so their name shows up if selected
  if (authStore.isAdmin && authStore.user?.id) {
    const isPresent = employees.value.some(
      (emp) => String(emp.id) === String(authStore.user?.id),
    );
    if (!isPresent) {
      options.unshift({
        label: authStore.user.name,
        value: authStore.user.id,
      });
    }
  }

  return options;
});

const loadEmployees = async () => {
  loadingEmployees.value = true;
  try {
    const response = await employeeService.list({ paginate: false });
    employees.value = response.data || [];
  } catch (error) {
    console.error("Error loading employees:", error);
  } finally {
    loadingEmployees.value = false;
  }
};

onMounted(() => {
  loadEmployees();
});

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return;

    // always load employees first
    if (employees.value.length === 0) {
      await loadEmployees();
    }

    if (props.request) {
      setValues({
        employee_id:
          props.request.employee?.id || props.request.employee_id || "",
        date: props.request.date,
        check_in_time: props.request.check_in_time || "",
        check_out_time: props.request.check_out_time || "",
        reason: props.request.reason || "",
      });
    } else {
      resetForm();

      //  FIND employee by auth user id (using string comparison to handle any type mismatches)
      const currentEmployee = employees.value.find(
        (emp) => String(emp.id) === String(authStore.user?.id),
      );

      setValues({
        employee_id: currentEmployee?.id || (authStore.isAdmin ? authStore.user?.id : ""),
      });
    }
  },
);

const onSubmit = validateAndSubmit((values) => {
  emit("save", values);
});

const handleClose = () => {
  emit("update:modelValue", false);
};
</script>
