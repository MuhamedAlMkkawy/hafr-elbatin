<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import Card from "@/components/ui/Card.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Textarea from "@/components/ui/Textarea.vue";
import Table from "@/components/ui/Table.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Select from "@/components/ui/Select.vue";
import Modal from "@/components/ui/Modal.vue";
import performanceService from "@/services/performance";
import { employeeService } from "@/services/employees";
import { useAppToast } from "@/composables/useAppToast";
import { useAuthStore } from "@/stores/auth";
import { useForm, useFieldArray, Field, ErrorMessage } from "vee-validate";
import * as yup from "yup";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const authStore = useAuthStore();
const isEn = computed(() => route.path.startsWith("/en"));

const isEdit = computed(() => !!route.params.id);
const charterId = route.params.id;
const loading = ref(false);
const saving = ref(false);
const currentStep = ref(1);

const form = ref({
  employee_id: null,
  year: new Date().getFullYear(),
  targets: [
    { name: "", measurement_standard: "", weight: "", expected_results: "" },
    { name: "", measurement_standard: "", weight: "", expected_results: "" },
    { name: "", measurement_standard: "", weight: "", expected_results: "" },
    { name: "", measurement_standard: "", weight: "", expected_results: "" },
    { name: "", measurement_standard: "", weight: "", expected_results: "" },
    { name: "", measurement_standard: "", weight: "", expected_results: "" },
  ],
  competencies: [],
});

const employeeInfo = ref(null);
const employeesList = ref([]);
const showAssignModal = ref(false);
const selectedEmployees = ref([]);
const showSendModal = ref(false);
const selectedSendEmployee = ref(null);
const showCompetencyModal = ref(false);
const editingCompIdx = ref(-1);
const tempCompetency = ref({
  name: "",
  weight: null,
  descriptions: [
    { description: "", level: null },
    { description: "", level: null },
  ],
});

const addTempDesc = () => {
  tempCompetency.value.descriptions.push({ description: "", level: null });
};

const measurementOptions = computed(() => [
  { label: t("performance.form.summary_standard"), value: "summary" },
  { label: t("performance.form.reports_standard"), value: "reports" },
]);

const levelOptions = [1, 2, 3, 4, 5].map((l) => ({
  label: String(l),
  value: l,
}));

const breadcrumbItems = computed(() => {
  const base = isEn.value ? "/en/performance/charter" : "/performance/charter";
  return [
    { label: t("sidebar.performance"), to: base },
    { label: t("sidebar.performanceCharter"), to: base },
    {
      label: t("performance.form.charter_supervisory_breadcrumb"),
    },
  ];
});

const steps = computed(() => [
  { id: 1, label: t("performance.stepper.targets") },
  { id: 2, label: t("performance.stepper.competencies") },
  { id: 3, label: t("performance.stepper.review") },
]);

const targetHeaders = computed(() => [
  { key: "index", label: "#", headerClass: "w-12 text-center" },
  { key: "name", label: t("performance.form.target_name") },
  {
    key: "measurement_standard",
    label: t("performance.form.measurement_standard"),
    headerClass: "w-48",
  },
  {
    key: "weight",
    label: t("performance.form.weight"),
    headerClass: "w-40 text-center",
  },
  { key: "expected_results", label: t("performance.form.expected_results") },
]);

const filteredTargets = computed(() =>
  (form.value.targets || []).filter((t) => t.name?.trim()),
);

const competencyHeaders = computed(() => [
  { key: "index", label: "#", headerClass: "w-12 border-b" },
  {
    key: "name",
    label: t("performance.form.competency"),
    headerClass: "border-b",
  },
  {
    key: "weight",
    label: t("performance.form.weight"),
    headerClass: "w-40 text-center border-b",
  },
  {
    key: "descriptions",
    label: t("performance.form.behavioral_description"),
    headerClass: "border-b",
  },
  {
    key: "level",
    label: t("performance.form.desc_level"),
    headerClass: "w-32 text-center border-b",
  },
  { key: "actions", label: t("common.actions"), headerClass: "w-24 border-b" },
]);

const tempCompetencyHeaders = computed(() => [
  {
    key: "description",
    label:
      t("performance.form.behavioral_description") || "الوصف السلوكي للجدارات",
    headerClass: "text-center w-[60%]",
  },
  {
    key: "level",
    label: t("performance.form.required_level"),
    headerClass: "text-center",
  },
]);

const signatureHeaders1 = computed(() => [
  {
    key: "date",
    label: t("performance.form.date"),
    headerClass: "w-1/4 text-center",
  },
  {
    key: "seal",
    label: t("performance.form.seal"),
    headerClass: "w-1/2 text-center",
  },
  {
    key: "employee",
    label: t("performance.form.employee_signature"),
    headerClass: "w-1/4 text-center",
  },
]);

const signatureHeaders2 = computed(() => [
  {
    key: "secretary",
    label: t("performance.form.higher_admin_signature"),
    headerClass: "w-1/3 text-center",
  },
  {
    key: "assessor",
    label: t("performance.form.assessor_signature"),
    headerClass: "w-1/3 text-center",
  },
  {
    key: "hr",
    label: t("performance.form.hr_signature"),
    headerClass: "w-1/3 text-center",
  },
]);

const fetchInitialData = async () => {
  try {
    const empRes = await employeeService.list({ paginate: false });
    employeesList.value = (empRes.data || []).map((e) => ({
      label: e.name,
      value: e.id,
    }));
  } catch (e) {
    console.error(e);
  }
};

const fetchCharter = async () => {
  if (!isEdit.value) return;
  loading.value = true;
  try {
    const response = await performanceService.getById(charterId);
    const data = response.data;
    form.value = {
      ...data,
      targets: data.targets?.length
        ? [
            ...data.targets,
            ...Array(Math.max(0, 6 - data.targets.length))
              .fill(null)
              .map(() => ({
                name: "",
                measurement_standard: "",
                weight: "",
                expected_results: "",
              })),
          ]
        : form.value.targets,
      competencies: data.competencies?.length
        ? data.competencies.map((c) => ({
            ...c,
            descriptions:
              c.competency_descriptions?.map((d) => ({
                description: d.description,
                level: c.level || 1,
              })) || [],
          }))
        : [],
    };
    employeeInfo.value = data.employee;
    resetForm({ values: form.value });
  } catch (error) {
    console.error("Error fetching charter:", error);
    toast.error(t("common.error"));
  } finally {
    loading.value = false;
  }
};

const openCompetencyModal = (idx = -1) => {
  if (idx === -1) {
    tempCompetency.value = {
      name: "",
      weight: null,
      descriptions: [
        { description: "", level: null },
        { description: "", level: null },
      ],
    };
    editingCompIdx.value = -1;
  } else {
    tempCompetency.value = JSON.parse(
      JSON.stringify(form.value.competencies[idx]),
    );
    editingCompIdx.value = idx;
  }
  showCompetencyModal.value = true;
};

const saveCompetency = () => {
  if (!tempCompetency.value.name || !tempCompetency.value.weight) {
    toast.error(t("common.required_fields"));
    return;
  }
  const validDescriptions = tempCompetency.value.descriptions.filter(
    (d) => d.description.trim() && d.level,
  );
  if (validDescriptions.length < 2) {
    toast.error(
      t("performance.form.behavioral_description_min_2") ||
        "يجب إضافة وصفين سلوكيين على الأقل",
    );
    return;
  }
  tempCompetency.value.descriptions = validDescriptions;

  if (editingCompIdx.value === -1) {
    form.value.competencies.push({ ...tempCompetency.value });
  } else {
    form.value.competencies[editingCompIdx.value] = { ...tempCompetency.value };
  }
  showCompetencyModal.value = false;
};

const removeCompetency = (index) => {
  form.value.competencies.splice(index, 1);
};

const removeTempDesc = (idx) => {
  tempCompetency.value.descriptions.splice(idx, 1);
};

const totalTargetsWeight = computed(() => {
  return (form.value.targets || []).reduce(
    (sum, t) => sum + (Number(t.weight) || 0),
    0,
  );
});

const totalCompetenciesWeight = computed(() => {
  return form.value.competencies.reduce(
    (sum, c) => sum + (Number(c.weight) || 0),
    0,
  );
});

const prepareItemsPayload = () => {
  return {
    targets: (form.value.targets || [])
      .filter((t) => t.name)
      .map((t) => ({
        ...t,
        weight: Number(t.weight) || 0,
      })),
    competencies: form.value.competencies.map((c) => ({
      ...c,
      weight: Number(c.weight) || 0,
      descriptions: c.descriptions.map((d) => ({
        ...d,
        level: Number(d.level) || 1,
      })),
    })),
  };
};

const handleSaveItems = async () => {
  if (isEdit.value) {
    saving.value = true;
    try {
      const payload = prepareItemsPayload();
      const response = await performanceService.updateItems(charterId, payload);
      if (response.success) {
        toast.success(t("common.success"));
      }
    } catch (e) {
      currentStep.value--;
      toast.error(e?.response?.data?.message || t("common.error"));
    } finally {
      saving.value = false;
    }
  }
};

const handleSend = async () => {
  // const { valid } = await validate();
  // if (!valid) return;

  if (totalTargetsWeight.value !== 100) {
    toast.error(t("performance.form.weight_error_100"));
    return;
  }
  if (totalCompetenciesWeight.value !== 100) {
    toast.error(t("performance.form.weight_error_100"));
    return;
  }
  showSendModal.value = true;
};

const confirmSend = async () => {
  const targetId = isEdit.value ? charterId : selectedSendEmployee.value;

  if (!targetId && !selectedEmployees?.value) {
    toast.error(t("performance.form.employee_required"));
    return;
  }

  saving.value = true;
  try {
    const payload = prepareItemsPayload();
    if (route.params.id) {
      // Update items - using targetId which might be employeeId in Add mode as per request
      await performanceService.updateItems(targetId, {
        send: true,
        ...payload,
      });
    } else {
      // Finally send/publish
      await performanceService.assign({
        employee_ids: selectedEmployees?.value,
        send: true,
        ...payload,
      });
    }

    toast.success(t("performance.messages.sent"));
    showSendModal.value = false;
    router.push(
      isEn.value ? "/en/performance/charter" : "/performance/charter",
    );
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.message);
  } finally {
    saving.value = false;
  }
};

const handleAssign = async () => {
  if (!selectedEmployees.value.length) {
    toast.error(t("performance.messages.selectEmployees"));
    return;
  }
  if (
    totalTargetsWeight.value !== 100 ||
    totalCompetenciesWeight.value !== 100
  ) {
    toast.error(t("performance.form.weight_error_100"));
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...prepareItemsPayload(),
      employee_ids: selectedEmployees.value,
    };
    await performanceService.assign(payload);
    toast.success(t("common.success"));
    showAssignModal.value = false;
    router.push(
      isEn.value ? "/en/performance/charter" : "/performance/charter",
    );
  } catch (e) {
    toast.error(e.response?.data?.message || t("common.error"));
  } finally {
    saving.value = false;
  }
};

const nextStep = async () => {
  if (currentStep.value < 3) {
    if (currentStep.value === 1) {
      const { valid } = await validate();
      if (!valid) return;
      if (totalTargetsWeight.value !== 100) {
        toast.error(t("performance.form.weight_error_100"));
        return;
      }
      await handleSaveItems();
    }
    if (currentStep.value === 2) {
      if (form.value.competencies.length === 0) {
        toast.error(t("performance.form.competency_required"));
        return;
      }
      if (totalCompetenciesWeight.value !== 100) {
        toast.error(t("performance.form.weight_error_100"));
        return;
      }
      await handleSaveItems();
    }
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const goToStep = async (stepId) => {
  if (stepId > currentStep.value) {
    if (currentStep.value === 1) {
      const { valid } = await validate();
      if (!valid) return;
      if (totalTargetsWeight.value !== 100) {
        toast.error(t("performance.form.weight_error_100"));
        return;
      }
    }
    if (stepId === 3) {
      if (form.value.competencies.length === 0) {
        toast.error(t("performance.form.competency_required"));
        return;
      }
      if (totalCompetenciesWeight.value !== 100) {
        toast.error(t("performance.form.weight_error_100"));
        return;
      }
    }
  }
  currentStep.value = stepId;
};

const schema = yup.object({
  targets: yup.array().of(
    yup.object({
      name: yup
        .string()
        .test("is-required", t("validation.fieldRequired"), function (value) {
          const index = this.path.match(/targets\[(\d+)\]/)?.[1];
          if (index !== undefined && parseInt(index) < 4) {
            return !!value;
          }
          return true;
        }),
      measurement_standard: yup
        .string()
        .test("is-required", t("validation.fieldRequired"), function (value) {
          const index = this.path.match(/targets\[(\d+)\]/)?.[1];
          if (index !== undefined && parseInt(index) < 4) {
            return !!value;
          }
          return true;
        }),
      weight: yup
        .mixed()
        .test("is-required", t("validation.fieldRequired"), function (value) {
          const index = this.path.match(/targets\[(\d+)\]/)?.[1];
          if (index !== undefined && parseInt(index) < 4) {
            return value !== null && value !== undefined && value !== "";
          }
          return true;
        }),
      expected_results: yup
        .string()
        .test("is-required", t("validation.fieldRequired"), function (value) {
          const index = this.path.match(/targets\[(\d+)\]/)?.[1];
          if (index !== undefined && parseInt(index) < 4) {
            return !!value;
          }
          return true;
        }),
    }),
  ),
});

const { errors, validate, values, resetForm } = useForm({
  validationSchema: schema,
  initialValues: form.value,
  keepValues: true,
});

// Sync values to form.value
// Removed the watch as it conflicts with direct v-model binding on form.value.targets in Step 1 table
// and can cause data loss when fields unmount.

onMounted(() => {
  fetchInitialData();
  fetchCharter();
});
</script>

<template>
  <div class="space-y-6">
    <Breadcrumb :items="breadcrumbItems" />

    <Card v-if="loading" class="flex justify-center items-center py-20">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </Card>

    <div v-else class="space-y-6">
      <!-- Page Title -->
      <h1 class="text-[20px] font-[600] text-[#000000] px-1">
        {{ t("performance.form.charter_supervisory_breadcrumb") }}
      </h1>

      <!-- Header Info -->
      <Card
        v-if="employeeInfo"
        class="!p-8 !bg-white !shadow-sm !border-gray-100"
      >
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12"
        >
          <!-- Column 1 -->
          <div class="space-y-4">
            <div
              class="flex items-center justify-between border-b border-gray-50 pb-2"
            >
              <label class="text-[13px] text-gray-400 font-medium">{{
                t("performance.chartersList.employee")
              }}</label>
              <p class="text-[14px] text-gray-900 font-bold">
                {{ employeeInfo.name || "--" }}
              </p>
            </div>
            <div
              class="flex items-center justify-between border-b border-gray-50 pb-2"
            >
              <label class="text-[13px] text-gray-400 font-medium">{{
                t("performance.chartersList.job_title")
              }}</label>
              <p class="text-[14px] text-gray-900 font-bold">
                {{ employeeInfo.job_title || "--" }}
              </p>
            </div>
            <div
              class="flex items-center justify-between border-b border-gray-50 pb-2"
            >
              <label class="text-[13px] text-gray-400 font-medium">{{
                t("performance.form.employee_number")
              }}</label>
              <p class="text-[14px] text-gray-900 font-bold">
                {{ employeeInfo.employee_number || "--" }}
              </p>
            </div>
          </div>
          <!-- Column 2 -->
          <div class="space-y-4">
            <div
              class="flex items-center justify-between border-b border-gray-50 pb-2"
            >
              <label class="text-[13px] text-gray-400 font-medium">{{
                t("performance.form.agency")
              }}</label>
              <p class="text-[14px] text-gray-900 font-bold">
                {{ form.agency?.name || "--" }}
              </p>
            </div>
            <div
              class="flex items-center justify-between border-b border-gray-50 pb-2"
            >
              <label class="text-[13px] text-gray-400 font-medium">{{
                t("performance.form.department")
              }}</label>
              <p class="text-[14px] text-gray-900 font-bold">
                {{ form.department?.name || "--" }}
              </p>
            </div>
            <div
              class="flex items-center justify-between border-b border-gray-50 pb-2"
            >
              <label class="text-[13px] text-gray-400 font-medium">{{
                t("common.year")
              }}</label>
              <p class="text-[14px] text-gray-900 font-bold">
                {{ form.year || "--" }}
              </p>
            </div>
          </div>
          <!-- Column 3 -->
          <div class="space-y-4">
            <div
              class="flex items-center justify-between border-b border-gray-50 pb-2"
            >
              <label class="text-[13px] text-gray-400 font-medium">{{
                t("performance.form.assessor")
              }}</label>
              <p class="text-[14px] text-gray-900 font-bold">
                {{ form.assessor?.name || "--" }}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <!-- Stepper -->
      <Card class="!py-4">
        <div class="flex items-center justify-center mx-auto relative">
          <div
            class="absolute left-0 right-0 h-[2px] bg-[#D2D6DB] -z-0"
            style="top: 24px"
          ></div>
          <div
            class="absolute left-0 h-0.5 bg-primary transition-all duration-300 -z-0"
            :style="{
              top: '24px',
              width:
                currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
            }"
          ></div>

          <div
            v-for="step in steps"
            :key="step.id"
            class="flex flex-col items-center relative z-10 mt-1.5"
            :class="{
              'items-start': step.id === 1,
              'items-center': step.id === 2,
              'items-end': step.id === 3,
              'flex-1': true,
            }"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center border-[2px] border-[#0E5F4A] mb-2 transition-all duration-300 cursor-pointer"
              @click="goToStep(step.id)"
              :class="[
                currentStep === step.id
                  ? 'bg-[#0E5F4A] border-[#0E5F4A] text-white'
                  : 'bg-white border-[#0E5F4A] text-[#0E5F4A]',
              ]"
            >
              <span
                class="text-[16px] font-[500]"
                :class="
                  currentStep === step.id ? 'text-white' : 'text-[#0E5F4A]'
                "
                >{{ step.id }}</span
              >
            </div>
            <span class="text-[16px] font-[500] text-[#1F2A37]">
              {{ step.label }}
            </span>
          </div>
        </div>
      </Card>

      <!-- Step Content -->
      <div class="animate-fade-in">
        <!-- Step 1: Targets -->
        <div v-if="currentStep === 1" class="space-y-6">
          <Card>
            <template #header>
              <div class="flex justify-between items-center w-full">
                <h3 class="text-[16px] font-[600] text-[#333333]">
                  {{ t("performance.stepper.targets") }}
                </h3>
              </div>
            </template>

            <div class="overflow-hidden rounded-xl border border-gray-100">
              <Table :headers="targetHeaders" :items="form.targets">
                <template #header-measurement_standard="{ header }">
                  <div class="flex items-center gap-2">
                    {{ header.label }}
                  </div>
                </template>

                <template #cell-index="{ index }">
                  <span class="text-gray-400 font-bold">{{ index + 1 }}</span>
                </template>

                <template #cell-name="{ item, index }">
                  <Field
                    v-model="item.name"
                    v-slot="{ field }"
                    :name="`targets[${index}].name`"
                  >
                    <Input
                      v-bind="field"
                      :placeholder="
                        t('performance.form.add_target_name_placeholder')
                      "
                      :error="errors[`targets[${index}].name`]"
                    />
                  </Field>
                </template>

                <template #cell-measurement_standard="{ item, index }">
                  <Field
                    v-model="item.measurement_standard"
                    v-slot="{ field }"
                    :name="`targets[${index}].measurement_standard`"
                  >
                    <Select
                      v-bind="field"
                      :model-value="field.value"
                      :insideTable="true"
                      @update:model-value="field.handleChange"
                      :options="measurementOptions"
                      :placeholder="t('performance.form.measurement_standard')"
                      :error="errors[`targets[${index}].measurement_standard`]"
                    />
                  </Field>
                </template>

                <template #cell-weight="{ item, index }">
                  <Field
                    v-model="item.weight"
                    v-slot="{ field }"
                    :name="`targets[${index}].weight`"
                  >
                    <Input
                      v-bind="field"
                      type="number"
                      min="0"
                      max="100"
                      onwheel="this.blur()"
                      :error="errors[`targets[${index}].weight`]"
                    >
                      <template #suffix>
                        <SvgIcon name="percent" />
                      </template>
                    </Input>
                  </Field>
                </template>

                <template #cell-expected_results="{ item, index }">
                  <Field
                    v-model="item.expected_results"
                    v-slot="{ field }"
                    :name="`targets[${index}].expected_results`"
                  >
                    <Input
                      v-bind="field"
                      :placeholder="
                        t('performance.form.add_expected_results_placeholder')
                      "
                      :error="errors[`targets[${index}].expected_results`]"
                    />
                  </Field>
                </template>
              </Table>

              <!-- Custom Footer for Total Weight -->
              <div
                class="border border-t-transparent rounded-b-[12px] border-[#D2D6DB] px-6 py-6 flex gap-20 items-center"
              >
                <div class="space-y-1">
                  <div class="text-base font-bold text-gray-900">
                    {{ t("performance.form.total_weight_label") }}
                  </div>
                  <div class="flex items-center gap-2 text-[11px] font-medium">
                    <SvgIcon name="hint" />
                    {{ t("performance.form.weight_hint_100") }}
                  </div>
                </div>
                <Input
                  disabled
                  v-model="totalTargetsWeight"
                  :class="
                    totalTargetsWeight === 100
                      ? 'text-green-600'
                      : 'text-red-500'
                  "
                  class="text-lg font-black !w-28"
                >
                  <template #suffix>
                    <SvgIcon name="percent" />
                  </template>
                </Input>
              </div>
            </div>
          </Card>
        </div>

        <!-- Step 2: Competencies -->
        <div v-if="currentStep === 2" class="space-y-6">
          <Card>
            <template #header>
              <div class="flex justify-between items-center w-full">
                <h1 class="text-[16px] font-[600] text-[#333333]">
                  {{ t("performance.stepper.competencies") }}
                </h1>
                <Button
                  variant="primary"
                  size="md"
                  @click="openCompetencyModal()"
                >
                  {{ t("performance.form.add_competency") }}
                </Button>
              </div>
            </template>

            <div class="overflow-hidden rounded-xl border border-[#D2D6DB]">
              <table
                class="min-w-full divide-y divide-[#D2D6DB] border-separate border-spacing-0"
              >
                <thead class="bg-[#F9FAFB]">
                  <tr>
                    <th
                      v-for="header in competencyHeaders"
                      :key="header.key"
                      class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] text-center"
                      :class="header.headerClass"
                    >
                      {{ header.label }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-[#D2D6DB]">
                  <template v-if="!form.competencies.length">
                    <tr>
                      <td
                        :colspan="competencyHeaders.length"
                        class="px-4 py-10 text-center text-gray-400 text-sm"
                      >
                        <div
                          class="h-[304px] flex flex-col items-center justify-center text-[#6C737F]"
                        >
                          <img
                            src="@/assets/images/no_results.png"
                            alt="no_results"
                            class="mx-1 max-w-[201px] max-h-[163px] mb-3"
                          />
                          <Button
                            variant="primary"
                            size="md"
                            @click="openCompetencyModal()"
                            class="mt-2"
                          >
                            {{ t("performance.form.add_competency") }}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  </template>
                  <template
                    v-for="(comp, cIdx) in form.competencies"
                    :key="cIdx"
                  >
                    <tr v-for="(desc, dIdx) in comp.descriptions" :key="dIdx">
                      <td
                        v-if="dIdx === 0"
                        :rowspan="comp.descriptions.length"
                        class="px-4 py-4 text-sm text-gray-500 border-e border-b border-[#D2D6DB] text-center align-middle"
                      >
                        {{ cIdx + 1 }}
                      </td>
                      <td
                        v-if="dIdx === 0"
                        :rowspan="comp.descriptions.length"
                        class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] align-middle"
                      >
                        {{ comp.name }}
                      </td>
                      <td
                        v-if="dIdx === 0"
                        :rowspan="comp.descriptions.length"
                        class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] text-center align-middle"
                      >
                        {{ comp.weight }} %
                      </td>
                      <td
                        class="px-4 py-4 text-sm text-gray-600 border-e border-b border-[#D2D6DB] leading-relaxed"
                      >
                        {{ desc?.description }}
                      </td>
                      <td
                        class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] text-center font-semibold"
                      >
                        {{ desc?.level }}
                      </td>
                      <td
                        v-if="dIdx === 0"
                        :rowspan="comp.descriptions.length"
                        class="px-4 py-4 text-sm border-b border-[#D2D6DB] text-center align-middle"
                      >
                        <div class="flex items-center justify-center gap-2">
                          <button
                            @click="openCompetencyModal(cIdx)"
                            class="text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
                            v-tooltip="{
                              title: t('common.edit'),
                            }"
                          >
                            <SvgIcon name="edit" />
                          </button>
                          <button
                            @click="removeCompetency(cIdx)"
                            class="text-red-300 hover:text-red-500 transition-colors cursor-pointer"
                            v-tooltip="{
                              title: t('common.delete'),
                            }"
                          >
                            <SvgIcon name="trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
                <tfoot>
                  <tr v-if="form.competencies.length" class="bg-white">
                    <td
                      colspan="2"
                      class="px-6 py-6 text-[16px] font-bold text-[#161616] text-start"
                    >
                      {{ t("evaluation.chartersList.total") }}
                    </td>
                    <td
                      class="px-6 py-6 text-[20px] font-bold text-[#161616] text-start"
                    >
                      {{ totalCompetenciesWeight }} %
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>

        <!-- Step 3: Review -->
        <div v-if="currentStep === 3" class="space-y-6">
          <!-- Targets Review Card -->
          <Card>
            <template #header>
              <h3 class="text-[16px] font-[600] text-[#333333]">
                {{ t("performance.stepper.targets") }}
              </h3>
            </template>

            <div class="overflow-hidden rounded-xl border border-[#D2D6DB]">
              <table
                class="min-w-full divide-y divide-[#D2D6DB] border-separate border-spacing-0"
              >
                <thead class="bg-[#F9FAFB]">
                  <tr>
                    <th
                      v-for="header in targetHeaders"
                      :key="header.key"
                      class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] text-center"
                      :class="header.headerClass"
                    >
                      {{ header.label }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-[#D2D6DB]">
                  <tr v-for="(item, index) in filteredTargets" :key="index">
                    <td
                      class="px-4 py-4 text-sm text-gray-500 border-e border-b border-[#D2D6DB] text-center"
                    >
                      {{ index + 1 }}
                    </td>
                    <td
                      class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB]"
                    >
                      {{ item.name }}
                    </td>
                    <td
                      class="px-4 py-4 text-sm text-gray-600 border-e border-b border-[#D2D6DB]"
                    >
                      {{
                        item.measurement_standard === "summary"
                          ? t("performance.form.summary_standard")
                          : item.measurement_standard === "reports"
                            ? t("performance.form.reports_standard")
                            : item.measurement_standard
                      }}
                    </td>
                    <td
                      class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] text-center font-bold"
                    >
                      {{ item.weight }} %
                    </td>
                    <td
                      class="px-4 py-4 text-sm text-gray-600 border-b border-[#D2D6DB]"
                    >
                      {{ item.expected_results }}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr v-if="filteredTargets.length" class="bg-gray-50">
                    <td
                      colspan="3"
                      class="px-6 py-6 text-sm font-bold text-gray-700 text-start"
                    >
                      {{ t("evaluation.chartersList.total") }}
                    </td>
                    <td
                      class="px-6 py-6 text-lg font-black text-gray-900 text-start"
                    >
                      {{ totalTargetsWeight }} %
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          <!-- Competencies Review Card -->
          <Card>
            <template #header>
              <h3 class="text-[16px] font-[600] text-[#333333]">
                {{ t("performance.stepper.competencies") }}
              </h3>
            </template>

            <div class="overflow-hidden rounded-xl border border-[#D2D6DB]">
              <table
                class="min-w-full divide-y divide-[#D2D6DB] border-separate border-spacing-0"
              >
                <thead class="bg-[#F9FAFB]">
                  <tr>
                    <th
                      v-for="header in competencyHeaders.filter(
                        (h) => h.key !== 'actions',
                      )"
                      :key="header.key"
                      class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] text-center"
                      :class="header.headerClass"
                    >
                      {{ header.label }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-[#D2D6DB]">
                  <template
                    v-for="(comp, cIdx) in form.competencies"
                    :key="cIdx"
                  >
                    <tr v-for="(desc, dIdx) in comp.descriptions" :key="dIdx">
                      <td
                        v-if="dIdx === 0"
                        :rowspan="comp.descriptions.length"
                        class="px-4 py-4 text-sm text-gray-500 border-e border-b border-[#D2D6DB] text-center align-middle"
                      >
                        {{ cIdx + 1 }}
                      </td>
                      <td
                        v-if="dIdx === 0"
                        :rowspan="comp.descriptions.length"
                        class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] align-middle"
                      >
                        {{ comp.name }}
                      </td>
                      <td
                        v-if="dIdx === 0"
                        :rowspan="comp.descriptions.length"
                        class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] text-center align-middle"
                      >
                        {{ comp.weight }} %
                      </td>
                      <td
                        class="px-4 py-4 text-sm text-gray-600 border-e border-b border-[#D2D6DB] leading-relaxed"
                      >
                        {{ desc?.description }}
                      </td>
                      <td
                        class="px-4 py-4 text-sm text-gray-900 border-b border-[#D2D6DB] text-center font-semibold"
                      >
                        {{ desc?.level }}
                      </td>
                    </tr>
                  </template>
                </tbody>
                <tfoot>
                  <tr v-if="form.competencies.length" class="bg-gray-50">
                    <td
                      colspan="2"
                      class="px-6 py-6 text-sm font-bold text-gray-700 text-start"
                    >
                      {{ t("evaluation.chartersList.total") }}
                    </td>
                    <td
                      class="px-6 py-6 text-lg font-black text-gray-900 text-start"
                    >
                      {{ totalCompetenciesWeight }} %
                    </td>
                    <td colspan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <!-- Navigation Footer -->
      <div class="flex gap-2 items-center justify-end mt-8 p-4 no-print">
        <Button
          v-if="currentStep > 1 && currentStep < 3"
          variant="secondary"
          @click="prevStep"
          class="!px-8 border !border-gray-200 hover:!bg-gray-50 transition-all font-semibold"
        >
          {{ t("performance.form.previous") }}
        </Button>
        <div v-else></div>

        <div class="flex gap-3">
          <Button
            v-if="currentStep < 3"
            variant="primary"
            @click="nextStep"
            class="!px-10 font-bold"
          >
            {{ t("performance.form.next") }}
          </Button>

          <template v-if="currentStep === 3">
            <Button variant="secondary" @click="prevStep">
              {{ t("performance.form.previous") }}
            </Button>

            <Button
              variant="outline"
              @click="handleSend"
              :loading="saving"
              class="bg-[#E7EFED] !border !border-[#0E5F4A] !text-[#0E5F4A] hover:!bg-[#DDE6E4]"
            >
              {{ t("performance.modals.send") }}
            </Button>

            <Button
              v-if="authStore.isManager || authStore.isAdmin"
              variant="primary"
              @click="showAssignModal = true"
              :loading="saving"
            >
              {{ t("common.assignToEmployee") }}
            </Button>
          </template>
        </div>
      </div>

      <!-- Signatures Section -->
      <!-- <Card v-if="currentStep === 3">
        <div class="space-y-4">
          <h3
            class="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4"
          >
            {{ t("performance.form.signatures") }}
          </h3>

          <div class="space-y-0">
            <Table
              :headers="signatureHeaders1"
              :items="[{ date: new Date().toLocaleDateString('en-GB') }]"
              wrapper-class="!rounded-b-none !border-b-0"
            >
              <template #cell-date="{ item }">
                <div class="text-center font-bold text-gray-500 py-4">
                  {{ item.date }}
                </div>
              </template>
              <template #cell-seal>
                <div class="py-2 px-10"></div>
              </template>
              <template #cell-employee>
                <div class="py-2 px-10">
                  <Input
                    :placeholder="t('performance.form.placeholder')"
                  />
                </div>
              </template>
            </Table>

            <Table
              :headers="signatureHeaders2"
              :items="[{}]"
              wrapper-class="!rounded-t-none"
            >
              <template #cell-secretary>
                <div class="py-4 px-10">
                  <Input
                    :placeholder="t('performance.form.placeholder')"
                  />
                </div>
              </template>
              <template #cell-assessor>
                <div class="py-4 px-10">
                  <Input
                    :placeholder="t('performance.form.placeholder')"
                  />
                </div>
              </template>
              <template #cell-hr>
                <div class="py-4 px-10">
                  <Input
                    :placeholder="t('performance.form.placeholder')"
                  />
                </div>
              </template>
            </Table>
          </div>
        </div>
      </Card> -->
    </div>

    <Modal
      width="xl"
      v-model="showCompetencyModal"
      :title="t('performance.form.add_competency')"
      title-class="!text-center !w-full !font-bold !text-xl"
      overflow-visible
    >
      <div class="space-y-6">
        <!-- Competency Name -->
        <div class="space-y-1.5">
          <Input
            v-model="tempCompetency.name"
            :placeholder="t('performance.form.add_competency_placeholder')"
            :label="t('performance.form.competency_name')"
            required
          />
        </div>

        <!-- Competency Weight -->
        <div class="space-y-1.5">
          <div class="relative">
            <Input
              v-model="tempCompetency.weight"
              type="number"
              min="0"
              max="100"
              onwheel="this.blur()"
              :placeholder="t('performance.form.add_weight_placeholder')"
              :label="t('performance.form.weight')"
              required
            >
              <template #suffix>
                <div>
                  <SvgIcon name="percent" />
                </div>
              </template>
            </Input>
          </div>
        </div>

        <!-- Behavioral Descriptions Sub-Table -->
        <Table
          :headers="tempCompetencyHeaders"
          :items="tempCompetency.descriptions"
        >
          <template #cell-description="{ item }">
            <Input
              v-model="item.description"
              :placeholder="t('performance.form.placeholder')"
              class="!mb-0 !border-0 !shadow-none !bg-transparent text-center"
            />
          </template>

          <template #cell-level="{ item, index }">
            <div class="flex items-center gap-2">
              <Select
                v-model="item.level"
                :options="levelOptions"
                :insideTable="true"
                class="!mb-0 !border-0 !shadow-none !bg-transparent w-full text-center"
                :placeholder="t('common.select')"
              >
                <template #value-item="{ option }">
                  <div class="flex items-center justify-center w-full gap-2">
                    <span>{{ option.label }}</span>
                    <span class="text-xs text-gray-400">{{
                      t("performance.form.desc_level")
                    }}</span>
                  </div>
                </template>
              </Select>
              <button
                @click="removeTempDesc(index)"
                v-if="tempCompetency.descriptions.length > 2"
                class="cursor-pointer"
              >
                <SvgIcon name="trash" />
              </button>
            </div>
          </template>
        </Table>

        <div class="flex justify-end">
          <div
            @click="addTempDesc"
            class="mb-3 text-[#0E5F4A] text-[14px] font-[500] flex items-center gap-1 hover:underline cursor-pointer w-fit"
          >
            <SvgIcon name="add" />
            {{ t("performance.form.add_description") }}
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2 justify-end w-full pt-2 items-end">
          <Button variant="secondary" @click="showCompetencyModal = false">
            {{ t("common.cancel") }}
          </Button>
          <Button variant="primary" @click="saveCompetency">
            {{ t("common.save") }}
          </Button>
        </div>
      </template>
    </Modal>

    <Modal
      width="xl"
      v-model="showAssignModal"
      :title="t('performance.form.assign_charter')"
      overflow-visible
    >
      <div class="space-y-6">
        <!-- <div
          class="bg-blue-50 p-4 rounded-lg border border-blue-200 flex gap-3"
        >
          <SvgIcon name="hint" />
          <div>
            <h4 class="text-blue-900 font-bold text-sm">
              {{ t("performance.form.assign_hint_title") }}
            </h4>
            <p class="text-blue-700 text-xs mt-0.5">
              {{ t("performance.form.assign_hint_desc") }}
            </p>
          </div>
        </div> -->
        <Select
          v-model="selectedEmployees"
          :options="employeesList"
          :label="t('performance.form.employee')"
          multiple
          searchable
          required
          :placeholder="t('performance.form.employee')"
        />
      </div>

      <template #footer>
        <div class="flex gap-3 justify-end w-full">
          <Button variant="ghost" @click="showAssignModal = false">{{
            t("common.cancel")
          }}</Button>
          <Button
            variant="primary"
            @click="handleAssign"
            :loading="saving"
            class="!bg-[#0E5F4A] !px-10"
            >{{ t("performance.form.assign_charter") }}</Button
          >
        </div>
      </template>
    </Modal>

    <!-- Send Charter Modal -->
    <Modal
      width="xl"
      v-model="showSendModal"
      :title="t('performance.modals.send')"
      overflow-visible
    >
      <div class="space-y-6">
        <!-- Confirmation mode (Edit) -->
        <div
          v-if="isEdit && employeeInfo"
          class="bg-[#F8FBFA] p-6 rounded-xl border border-[#E7EFED] flex flex-col items-center text-center gap-4"
        >
          <div
            class="w-16 h-16 bg-[#0E5F4A14] rounded-full flex items-center justify-center"
          >
            <SvgIcon name="evaluate" class="text-[#0E5F4A]" />
          </div>
          <div class="space-y-1">
            <h3 class="text-lg font-bold text-gray-900">
              {{ t("performance.modals.send") }}
            </h3>
            <p class="text-gray-500 text-[14px]">
              {{
                t("performance.messages.confirmSendTo") ||
                "هل أنت متأكد من إرسال هذا الميثاق لـ"
              }}
              <span class="text-[#0E5F4A] font-bold">{{
                employeeInfo.name
              }}</span
              >؟
            </p>
          </div>
        </div>

        <!-- Selection mode (Add) -->
        <div v-else class="space-y-4">
          <Select
            v-model="selectedEmployees"
            :options="employeesList"
            :label="t('performance.form.employee')"
            multiple
            searchable
            required
            :placeholder="t('performance.form.employee')"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex gap-3 justify-end w-full">
          <Button
            variant="ghost"
            @click="showSendModal = false"
            class="!px-8 border-gray-300 text-gray-700 font-bold"
          >
            {{ t("common.cancel") }}
          </Button>
          <Button
            variant="primary"
            @click="confirmSend"
            :loading="saving"
            class="!bg-[#0E5F4A] !px-10 font-bold"
          >
            {{ t("performance.modals.send") }}
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(th) {
  padding: 1rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

:deep(td) {
  padding: 1rem 1.5rem;
}
</style>
