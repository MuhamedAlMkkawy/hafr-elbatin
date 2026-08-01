<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { toTypedSchema } from "@vee-validate/yup";

import { useRoute } from "vue-router";
import Modal from "@/components/ui/Modal.vue";
import Select from "@/components/ui/Select.vue";
import Button from "@/components/ui/Button.vue";
import Icon from "@/components/ui/Icon.vue";
import Table from "@/components/ui/Table.vue";
import api from "@/services/api";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  shift: {
    type: Object,
    default: null,
  },
  schedule: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const { t, locale } = useI18n();
const route = useRoute();

const isEdit = computed(() => !!props.schedule);

const shiftName = computed(() => {
  if (!props.shift) return "";
  return locale.value === "ar" ? props.shift.name_ar : props.shift.name;
});

const schema = toTypedSchema(
  yup.object({
    year: yup
      .number()
      .nullable()
      .transform((value, originalValue) =>
        originalValue === "" || isNaN(value) ? null : value,
      )
      .required(t("shifts.modals.schedules.messages.yearRequired")),
    working_days: yup
      .array()
      .min(1, t("shifts.modals.schedules.messages.workingDaysRequired"))
      .required(t("shifts.modals.schedules.messages.workingDaysRequired")),
    morning: yup
      .number()
      .nullable()
      .transform((value, originalValue) =>
        originalValue === "" || isNaN(value) ? null : value,
      )
      .required(t("shifts.modals.schedules.messages.employeeRequired")),
    evening: yup
      .number()
      .nullable()
      .transform((value, originalValue) =>
        originalValue === "" || isNaN(value) ? null : value,
      )
      .required(t("shifts.modals.schedules.messages.employeeRequired")),
    night: yup
      .number()
      .nullable()
      .transform((value, originalValue) =>
        originalValue === "" || isNaN(value) ? null : value,
      )
      .required(t("shifts.modals.schedules.messages.employeeRequired")),
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
    year: null,
    working_days: [],
    morning: null,
    evening: null,
    night: null,
  },
});

const { value: year } = useField("year");
const { value: working_days } = useField("working_days");
const { value: morning } = useField("morning");
const { value: evening } = useField("evening");
const { value: night } = useField("night");

const employees = ref([]);
const loadingEmployees = ref(false);

const onSubmit = validateAndSubmit((values) => {
  const payload = {
    shift_id: props.shift.id,
    year: values.year,
    working_days: values.working_days,
    assignments: [
      { period: "morning", employee_id: values.morning },
      { period: "evening", employee_id: values.evening },
      { period: "night", employee_id: values.night },
    ],
  };

  emit("save", payload);
});

const fetchEmployees = async () => {
  const departmentId = route.query.department_id || props.shift?.department_id;
  if (!departmentId) return;

  loadingEmployees.value = true;
  try {
    const response = await api.get("/employees", {
      params: {
        paginate: false,
        department_id: departmentId,
        work_system_type: "shift",
      },
    });
    employees.value = response.data?.data ?? response.data ?? [];
  } catch (error) {
    console.error("Failed to fetch employees:", error);
  } finally {
    loadingEmployees.value = false;
  }
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      fetchEmployees();
      if (props.schedule) {
        setValues({
          year: props.schedule.year,
          working_days: [...(props.schedule.working_days ?? [])],
          morning:
            props.schedule.assignments?.find((a) => a.period === "morning")
              ?.employee?.id ?? null,
          evening:
            props.schedule.assignments?.find((a) => a.period === "evening")
              ?.employee?.id ?? null,
          night:
            props.schedule.assignments?.find((a) => a.period === "night")
              ?.employee?.id ?? null,
        });
      } else {
        resetForm();
      }
    }
  },
);

const close = () => {
  emit("update:modelValue", false);
};

const dayOptions = computed(() => [
  { label: t("common.days.saturday"), value: "saturday" },
  { label: t("common.days.sunday"), value: "sunday" },
  { label: t("common.days.monday"), value: "monday" },
  { label: t("common.days.tuesday"), value: "tuesday" },
  { label: t("common.days.wednesday"), value: "wednesday" },
  { label: t("common.days.thursday"), value: "thursday" },
  { label: t("common.days.friday"), value: "friday" },
]);

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    years.push({ label: i.toString(), value: i });
  }
  return years;
});

const baseEmployeeOptions = computed(() => {
  const options =
    employees.value?.map((e) => ({ label: e.name, value: e.id })) || [];

  // If editing, add current assigned employees to options if not present
  if (props.schedule?.assignments) {
    props.schedule.assignments.forEach((assignment) => {
      if (
        assignment.employee &&
        !options.find((opt) => opt.value === assignment.employee.id)
      ) {
        options.push({
          label: assignment.employee.name,
          value: assignment.employee.id,
        });
      }
    });
  }

  return options;
});

const getFilteredOptions = (period) => {
  const otherValues = [];
  if (period !== "morning" && morning.value) otherValues.push(morning.value);
  if (period !== "evening" && evening.value) otherValues.push(evening.value);
  if (period !== "night" && night.value) otherValues.push(night.value);

  return baseEmployeeOptions.value.filter(
    (opt) => !otherValues.includes(opt.value),
  );
};

const headers = computed(() => [
  { key: "period", label: t("shifts.modals.schedules.fields.period") },
  {
    key: "employee",
    label: t("shifts.modals.schedules.fields.employee"),
    headerClass: "text-center",
  },
]);

const tableItems = ["morning", "evening", "night"].map((period) => ({
  period,
}));

const getAssignmentValue = (period) => {
  if (period === "morning") return morning.value;
  if (period === "evening") return evening.value;
  if (period === "night") return night.value;
};

const setAssignmentValue = (period, val) => {
  if (period === "morning") morning.value = val;
  if (period === "evening") evening.value = val;
  if (period === "night") night.value = val;
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="
      isEdit
        ? t('shifts.modals.schedules.editSchedule') + ' - ' + shiftName
        : t('shifts.modals.schedules.addSchedule') + ' - ' + shiftName
    "
    width="xl"
    @update:model-value="close"
  >
    <form class="space-y-6 py-2" @submit.prevent="onSubmit">
      <div class="grid grid-cols-1 gap-4">
        <!-- Year -->
        <Select
          v-model="year"
          :label="t('shifts.modals.schedules.fields.year')"
          :options="yearOptions"
          :placeholder="t('shifts.modals.schedules.placeholders.year')"
          :error="errors.year"
          required
          :disabled="isEdit"
          :class="isEdit ? 'cursor-not-allowed' : ''"
        />

        <!-- Working Days -->
        <Select
          v-model="working_days"
          :label="t('shifts.modals.schedules.fields.workingDays')"
          :options="dayOptions"
          :error="errors.working_days"
          multiple
          required
        />
      </div>

      <!-- Assignments Table -->
      <div>
        <Table :headers="headers" :items="tableItems">
          <template #cell-period="{ item }">
            <span class="font-semibold text-[#344054]">
              {{ t(`workSystems.shifts.${item.period}`) }}
            </span>
          </template>

          <template #cell-employee="{ item }">
            <div class="px-2">
              <Select
                :model-value="getAssignmentValue(item.period)"
                @update:model-value="setAssignmentValue(item.period, $event)"
                :options="getFilteredOptions(item.period)"
                :placeholder="
                  t('shifts.modals.schedules.placeholders.selectEmployee')
                "
                size="sm"
                searchable
                :error="errors[item.period]"
                insideTable
              />
            </div>
          </template>
        </Table>
      </div>
    </form>

    <template #footer>
      <div class="flex gap-2 justify-end mt-4">
        <Button
          variant="secondary"
          class="px-6"
          @click="close"
        >
          {{ t("common.cancel") }}
        </Button>
        <Button
          variant="primary"
          class="px-6"
          :loading="loading"
          @click="onSubmit"
        >
          {{ t("common.saveAndSend") }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<style scoped></style>
