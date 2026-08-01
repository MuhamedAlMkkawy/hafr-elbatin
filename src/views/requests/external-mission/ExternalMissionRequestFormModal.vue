<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="handleClose"
    :title="
      request
        ? t('externalMissions.modals.editTitle')
        : t('externalMissions.modals.addTitle')
    "
    width="xl"
  >
    <div class="space-y-4 py-4">
      <Select
        v-if="!authStore.isEmployee && scope !== 'own'"
        v-model="employee_id"
        :options="employeesOptions"
        :label="t('externalMissions.fields.employeeName')"
        :placeholder="t('externalMissions.placeholders.selectEmployee')"
        :error="errors.employee_id"
        required
        searchable
        size="md"
        :disabled="!!request"
      />

      <Input
        v-model="title"
        :label="t('externalMissions.fields.title')"
        :placeholder="t('externalMissions.placeholders.title')"
        :error="errors.title"
        required
        size="md"
      />

      <div class="grid grid-cols-1 gap-4">
        <Input
          v-model="from_date"
          type="date"
          :label="t('externalMissions.fields.fromDate')"
          :error="errors.from_date"
          required
          size="md"
        >
          <template #suffix>
            <SvgIcon name="date_calender" />
          </template>
        </Input>

        <Input
          v-model="to_date"
          type="date"
          :label="t('externalMissions.fields.toDate')"
          :error="errors.to_date"
          required
          size="md"
        >
          <template #suffix>
            <SvgIcon name="date_calender" />
          </template>
        </Input>
      </div>

      <div class="space-y-3">
        <Input
          v-model="total_days"
          :label="t('externalMissions.fields.totalDays')"
          readonly
          size="md"
        />
        <p class="text-[14px] text-[#384250] flex items-center gap-2">
          <SvgIcon name="hint" />
          {{ t("externalMissions.modals.daysHint") }}
        </p>
      </div>

      <Input
        v-model="address"
        :label="t('externalMissions.fields.address')"
        :placeholder="t('externalMissions.placeholders.address')"
        :error="errors.address"
        size="md"
      />

      <Textarea
        v-model="description"
        :label="t('externalMissions.fields.description')"
        :placeholder="t('externalMissions.placeholders.description')"
        :error="errors.description"
        size="md"
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
          :loading="loading"
          @click="onSubmit"
        >
          {{ t("common.send") }}
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
import Icon from "@/components/ui/Icon.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { useAuthStore } from "@/stores/auth";
import { employeeService } from "@/services/employees";
import { externalMissionsService } from "@/services/externalMissions";

const props = defineProps({
  modelValue: Boolean,
  request: Object,
  loading: Boolean,
  scope: String,
});

const emit = defineEmits(["update:modelValue", "save"]);

const { t } = useI18n();

const authStore = useAuthStore();
const employees = ref([]);
const loadingEmployees = ref(false);
const calculatingDays = ref(false);

const schema = toTypedSchema(
  yup.object({
    employee_id: yup
      .string()
      .test(
        "is-required",
        t("externalMissions.fields.employeeName") + " " + t("common.required"),
        (val) => {
          if (authStore.isEmployee || props.scope === "own") return true;
          return !!val;
        },
      ),
    title: yup
      .string()
      .required(
        t("externalMissions.fields.title") + " " + t("common.required"),
      ),
    from_date: yup
      .string()
      .required(
        t("externalMissions.fields.fromDate") + " " + t("common.required"),
      ),
    to_date: yup
      .string()
      .required(
        t("externalMissions.fields.toDate") + " " + t("common.required"),
      ),
    address: yup.string().nullable().optional(),
    description: yup.string().nullable().optional(),
    total_days: yup.number().optional(),
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
    title: "",
    from_date: "",
    to_date: "",
    address: "",
    description: "",
    total_days: 0,
  },
});

const { value: employee_id } = useField("employee_id");
const { value: title } = useField("title");
const { value: from_date } = useField("from_date");
const { value: to_date } = useField("to_date");
const { value: address } = useField("address");
const { value: description } = useField("description");
const { value: total_days } = useField("total_days");

const employeesOptions = computed(() => {
  return employees.value.map((emp) => ({
    label: emp.name,
    value: emp.id,
  }));
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

const calculateWorkingDays = async () => {
  if (!employee_id.value || !from_date.value || !to_date.value) {
    total_days.value = 0;
    return;
  }

  calculatingDays.value = true;
  try {
    const response = await externalMissionsService.calculateDays({
      employee_id: employee_id.value,
      from_date: from_date.value,
      to_date: to_date.value,
    });
    total_days.value = response.data?.total_days || 0;
  } catch (error) {
    console.error("Error calculating days:", error);
    total_days.value = 0;
  } finally {
    calculatingDays.value = false;
  }
};

watch([employee_id, from_date, to_date], () => {
  if (employee_id.value && from_date.value && to_date.value) {
    calculateWorkingDays();
  }
});

onMounted(() => {
  loadEmployees();
});

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return;

    if (props.request) {
      setValues({
        employee_id:
          props.request.employee?.id || props.request.employee_id || "",
        title: props.request.title || "",
        from_date: props.request.from_date || "",
        to_date: props.request.to_date || "",
        address: props.request.address || "",
        description: props.request.description || "",
        total_days: props.request.total_days || 0,
      });
    } else {
      resetForm();

      // ensure employees are loaded first
      if (employees.value.length === 0) {
        await loadEmployees();
      }

      // find current employee in options (IMPORTANT)
      const currentEmployee = employees.value.find(
        (emp) => emp.id === authStore.user?.id,
      );

      setValues({
        employee_id: currentEmployee?.id || "",
      });
    }

    if (props.scope !== "own" && employees.value.length === 0) {
      loadEmployees();
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
