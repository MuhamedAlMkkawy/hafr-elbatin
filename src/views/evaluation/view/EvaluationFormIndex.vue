<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import Card from "@/components/ui/Card.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Table from "@/components/ui/Table.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Select from "@/components/ui/Select.vue";
import evaluationService from "@/services/evaluation";
import { useAppToast } from "@/composables/useAppToast";
import { useForm, Field } from "vee-validate";
import { useAuthStore } from "@/stores/auth";
import * as yup from "yup";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const auth = useAuthStore();
const isEn = computed(() => route.path.startsWith("/en"));

const evaluationId = route.params.id;
const loading = ref(true);
const saving = ref(false);
const currentStep = ref(1);

const evaluation = ref(null);

const isSupervisory = computed(() => {
  // const roles = evaluation.value?.employee?.roles || [];
  // if (roles.length === 0) return evaluation.value?.type === "managerial";
  // if (roles.length === 1 && roles.includes("employee")) return false;
  // return true;
  if (evaluation?.value?.type == "managerial") return true;
  return false;
});

const breadcrumbItems = computed(() => {
  const base = isEn.value
    ? "/en/performance/evaluation"
    : "/performance/evaluation";
  const typeLabel = isSupervisory.value
    ? t("evaluation.form.supervisory_title")
    : t("evaluation.form.non_supervisory_title");
  return [
    { label: t("sidebar.performance"), to: base },
    { label: typeLabel, to: base },
    { label: evaluation.value?.employee?.name || "--" },
  ];
});

const steps = computed(() => [
  { id: 1, label: t("evaluation.stepper.targets") || "الأهداف" },
  { id: 2, label: t("evaluation.stepper.competencies") || "الجدارات" },
  { id: 3, label: t("evaluation.stepper.review") || "المراجعة" },
]);

const targetHeaders = computed(() => [
  { key: "index", label: "#", headerClass: "w-12 text-center border-b" },
  {
    key: "name",
    label: t("performance.form.target_name"),
    headerClass: "border-b",
  },
  {
    key: "measurement_standard",
    label: t("performance.form.measurement_standard"),
    headerClass: "w-32 border-b",
  },
  {
    key: "weight",
    label: t("performance.form.weight"),
    headerClass: "w-24 text-center border-b",
  },
  {
    key: "expected_result",
    label: t("evaluation.form.expected_result"),
    headerClass: "w-32 text-center border-b",
  },
  {
    key: "actual_result",
    label: t("evaluation.form.actual_result"),
    headerClass: "w-32 text-center border-b",
  },
  { key: "difference", label: t("evaluation.form.difference") },
  {
    key: "score",
    label: t("evaluation.form.score"),
    headerClass: "w-24 text-center border-b",
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
    key: "assessor",
    label: t("performance.form.assessor_signature"),
    headerClass: "w-1/3 text-center",
  },
  {
    key: "hr",
    label: t("performance.form.hr_signature"),
    headerClass: "w-1/3 text-center",
  },
  {
    key: "higher_admin",
    label:
      t("performance.form.higher_admin_signature") || "توقيع الإدارة العليا",
    headerClass: "w-1/3 text-center",
  },
]);

const competencyHeaders = computed(() => {
  const headers = [
    { key: "index", label: "#", headerClass: "w-12 text-center border-b" },
    {
      key: "name",
      label: t("performance.form.competency"),
      headerClass: "border-b text-start",
    },
    {
      key: "weight",
      label: t("performance.form.weight"),
      headerClass: "w-24 text-center border-b",
    },
    {
      key: "descriptions",
      label: t("performance.form.behavioral_description"),
      headerClass: "border-b text-start",
    },
    // {
    //   key: "actual_result",
    //   label: currentStep.value === 2 ? "المستوى الفعلي" : "المستوى الفعلي",
    //   headerClass: "w-40 text-center border-b",
    // },
    // {
    //   key: "expected_result",
    //   label: "المستوى المستهدف",
    //   headerClass: "w-32 text-center border-b font-bold",
    // },
    {
      key: "actual_result",
      label: t("performance.form.actual_level"),
      headerClass: "w-40 text-center border-b",
    },
    {
      key: "expected_result",
      label: t("performance.form.expected_level"),
      headerClass: "w-32 text-center border-b font-bold",
    },
    {
      key: "score",
      label: t("performance.form.final_evaluation"),
      headerClass: "w-32 text-center border-b text-primary font-black",
    },
  ];

  // if (isSupervisory.value) {
  //   headers.push({
  //     key: "score",
  //     label: t("performance.form.final_evaluation"),
  //     headerClass: "w-32 text-center border-b text-primary font-black",
  //   });
  // }

  return headers;
});

const levelOptions = [1, 2, 3, 4, 5].map((l) => ({
  label: String(l),
  value: l,
}));

// =============> CALCULATIONS
const calculateResult = (actual, expected) => {
  if (!expected || expected === 0) return 1;
  const ratio = actual / expected;
  if (ratio > 1) return 5;
  if (ratio >= 0.9) return 4;
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
};

const processedTargets = computed(() => {
  if (!evaluation.value?.targets) return [];
  return evaluation.value.targets.map((t) => {
    const score = calculateResult(t.actual_result, t.expected_result);
    return {
      ...t,
      difference:
        (Number(t.actual_result) || 0) - (Number(t.expected_result) || 0),
      score: score,
    };
  });
});

const totalTargetsScore = computed(() => {
  const targets = processedTargets.value;
  if (!targets.length) return 0;
  const sum = targets.reduce((acc, t) => acc + t.score, 0);
  return (sum / targets.length).toFixed(2);
});

const processedCompetencies = computed(() => {
  if (!evaluation.value?.competencies) return [];
  return evaluation.value.competencies.map((c) => {
    let score = Number(c.actual_result) || 0;
    if (isSupervisory.value) {
      // Supervisory Model mapping
      score = calculateResult(c.actual_result, c.expected_result);
    }
    return {
      ...c,
      score: score,
    };
  });
});

// const totalCompetenciesScore = computed(() => {
//   const comps = processedCompetencies.value;
//   if (!comps.length) return 0;
//   const sum = comps.reduce((acc, c) => acc + (Number(c.score) || 0), 0);
//   return (sum / comps.length).toFixed(2);
// });

const totalCompetenciesScore = computed(() => {
  if (!evaluation.value?.competencies) return 0;

  let values = [];

  evaluation.value.competencies.forEach((comp) => {
    const descriptions =
      comp.performance_charter_item?.competency_descriptions || [];

    descriptions.forEach((desc, dIdx) => {
      const rating = comp.ratings?.[dIdx];

      if (rating !== null && rating !== undefined) {
        if (isSupervisory.value) {
          // Supervisory: map using formula
          values.push(calculateResult(rating, desc?.level));
        } else {
          // Non-supervisory: direct rating
          values.push(Number(rating));
        }
      }
    });
  });

  if (!values.length) return 0;

  const avg = values.reduce((acc, val) => acc + val, 0) / values.length;

  return avg.toFixed(2);
});

const overallScore = computed(() => {
  const tScore = Number(totalTargetsScore.value) || 0;
  const cScore = Number(totalCompetenciesScore.value) || 0;
  const score = (0.3 * tScore + 0.7 * cScore).toFixed(2);
  return score;
});

// =============> DATA FETCHING
const fetchEvaluation = async () => {
  loading.value = true;
  try {
    const response = await evaluationService.getById(evaluationId);
    const data = response.data;

    // Initialize description ratings for competencies
    if (data.competencies) {
      data.competencies.forEach((comp) => {
        const descCount =
          comp.performance_charter_item?.competency_descriptions?.length || 0;
        if (!comp.ratings || comp.ratings.length !== descCount) {
          // If no ratings yet, or length mismatch, initialize with current actual_result or null
          comp.ratings = new Array(descCount).fill(comp.actual_result || null);
        }
      });
    }

    evaluation.value = data;
  } catch (error) {
    console.error("Error fetching evaluation:", error);
    toast.error(error?.response?.data?.message || error?.message);
  } finally {
    loading.value = false;
  }
};

const updateCompActualResult = (comp) => {
  if (!comp.ratings || comp.ratings.length === 0) return;
  const filledRatings = comp.ratings.filter((r) => r !== null);
  if (filledRatings.length === 0) {
    comp.actual_result = 0;
  } else {
    const sum = filledRatings.reduce((acc, r) => acc + r, 0);
    comp.actual_result = Math.round((sum / filledRatings.length) * 10) / 10;
  }
};

const handleSave = async () => {
  saving.value = true;
  try {
    const payload = {
      manager_signature: auth.user?.name || evaluation.value.manager_signature,
      evaluations: [
        ...evaluation.value.targets.map((t) => ({
          item_id: t.id,
          actual_result: t.actual_result,
          expected_result: t.expected_result,
          comment: t.manager_comment || "",
        })),
        ...evaluation.value.competencies.map((c) => ({
          item_id: c.id,
          actual_result: c.actual_result,
          expected_result: c.expected_result,
          comment: c.manager_comment || "",
        })),
      ],
    };
    await evaluationService.evaluate(evaluationId, payload);
    toast.success(t("common.success"));
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    saving.value = false;
  }
};

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const confirmSubmit = async () => {
  saving.value = true;
  try {
    await handleSave();
    await evaluationService.handleSendEvaluation(evaluationId);
    toast.success(t("evaluation.messages.sent"));
    router.push(
      isEn.value ? "/en/performance/evaluation" : "/performance/evaluation",
    );
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchEvaluation();
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
      <h1 class="text-[20px] font-[600] text-[#000000] px-1 uppercase">
        {{
          isSupervisory
            ? t("evaluation.form.supervisory_title")
            : t("evaluation.form.non_supervisory_title")
        }}
      </h1>

      <!-- Header Info Card -->
      <Card v-if="evaluation" class="!p-8 !bg-white !border-gray-100">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
          <!-- Column 1 -->
          <div class="space-y-4">
            <div class="flex items-center pb-2">
              <label class="text-[12px] text-[#6C737F] font-[500] w-[170px]">{{
                t("performance.chartersList.employee")
              }}</label>
              <p class="text-[16px] text-[#384250] font-bold">
                {{ evaluation.employee?.name || "--" }}
              </p>
            </div>
            <div class="flex items-center pb-2">
              <label class="text-[12px] text-[#6C737F] font-[500] w-[170px]">{{
                t("performance.chartersList.job_title")
              }}</label>
              <p class="text-[16px] text-[#384250] font-bold">
                {{ evaluation.employee?.job_title || "--" }}
              </p>
            </div>
            <div class="flex items-center pb-2">
              <label class="text-[12px] text-[#6C737F] font-[500] w-[170px]">{{
                t("performance.form.employee_number")
              }}</label>
              <p class="text-[16px] text-[#384250] font-bold">
                {{ evaluation.employee?.employee_number || "--" }}
              </p>
            </div>
          </div>
          <!-- Column 2 -->
          <div class="space-y-4">
            <div class="flex items-center pb-2">
              <label class="text-[12px] text-[#6C737F] font-[500] w-[170px]">{{
                t("performance.form.agency")
              }}</label>
              <p class="text-[16px] text-[#384250] font-bold">
                {{ evaluation.agency?.name || "--" }}
              </p>
            </div>
            <div class="flex items-center pb-2">
              <label class="text-[12px] text-[#6C737F] font-[500] w-[170px]">{{
                t("performance.form.department")
              }}</label>
              <p class="text-[16px] text-[#384250] font-bold">
                {{ evaluation.department?.name || "--" }}
              </p>
            </div>
            <div class="flex items-center pb-2">
              <label class="text-[12px] text-[#6C737F] font-[500] w-[170px]">{{
                t("performance.form.assessor")
              }}</label>
              <p class="text-[16px] text-[#384250] font-bold">
                {{ evaluation.manager_signature || "--" }}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <!-- Stepper Progress -->
      <Card class="!py-4">
        <div class="flex items-center mx-auto relative">
          <!-- Connector Line -->
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
            class="flex flex-col items-center relative z-10 mt-1.5 flex-1"
            :class="{
              'items-start': step.id === 1,
              'items-center': step.id === 2,
              'items-end': step.id === 3,
            }"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center border-[2px] border-[#0E5F4A] mb-2 transition-all duration-300 cursor-pointer"
              @click="currentStep = step.id"
              :class="[
                currentStep === step.id
                  ? 'bg-[#0E5F4A] border-[#0E5F4A] text-white'
                  : 'bg-white border-[#0E5F4A] text-[#0E5F4A]',
              ]"
            >
              <span class="text-[16px] font-[500]">{{ step.id }}</span>
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
              <h3 class="text-[16px] font-[600] text-[#333333]">
                {{ t("evaluation.stepper.targets") }}
              </h3>
            </template>

            <Table :items="evaluation.targets" :headers="targetHeaders">
              <template #cell-index="{ index }">
                {{ index + 1 }}
              </template>
              <template #cell-name="{ item }">
                <span>{{ item.performance_charter_item?.name || "--" }}</span>
              </template>
              <template #cell-measurement_standard="{ item }">
                {{
                  item.performance_charter_item?.measurement_standard || "--"
                }}
              </template>
              <template #cell-weight="{ item }">
                {{ item.performance_charter_item?.weight }}%
              </template>
              <template #cell-expected_result="{ item }">
                {{ item.expected_result }}
              </template>
              <template #cell-actual_result="{ item }">
                <Input
                  v-model="item.actual_result"
                  type="number"
                  size="sm"
                  class="text-center mx-auto w-24"
                />
              </template>
              <template #cell-difference="{ item }">
                <span>
                  {{
                    (Number(item.actual_result) || 0) /
                    (Number(item.expected_result) || 0)
                  }}
                </span>
              </template>
              <template #cell-score="{ item }">
                <span>
                  {{
                    calculateResult(item.actual_result, item.expected_result)
                  }}
                </span>
              </template>

              <template #footer>
                <tr>
                  <td
                    colspan="3"
                    class="p-4 font-[600] text-[16px] text-[#161616] text-start"
                  >
                    {{ t("evaluation.form.total_targets_weight") }}
                  </td>
                  <td class="p-4 text-[20px] font-[600] text-[#161616]">
                    100%
                  </td>
                  <td
                    colspan="3"
                    class="p-4 font-[600] text-[16px] text-[#161616] text-start"
                  >
                    {{ t("evaluation.form.total_targets_score") }}
                  </td>
                  <td
                    class="p-4 text-[20px] text-[#161616] text-start font-[600]"
                  >
                    {{ totalTargetsScore }}
                  </td>
                </tr>
              </template>
            </Table>
          </Card>
        </div>

        <!-- Step 2: Competencies -->
        <div v-if="currentStep === 2" class="space-y-6">
          <Card>
            <template #header>
              <h3 class="text-[16px] font-[600] text-[#333333]">
                {{ t("evaluation.stepper.competencies") }}
              </h3>
            </template>

            <Table
              :headers="competencyHeaders"
              :items="evaluation.competencies"
            >
              <template #body="{ items }">
                <template v-for="(comp, cIdx) in items" :key="cIdx">
                  <tr
                    v-for="(desc, dIdx) in comp.performance_charter_item
                      ?.competency_descriptions"
                    :key="dIdx"
                  >
                    <!-- Spanned columns -->
                    <td
                      v-if="dIdx === 0"
                      :rowspan="
                        comp.performance_charter_item?.competency_descriptions
                          .length
                      "
                      class="px-4 py-4 text-sm text-gray-500 border-e border-b border-[#D2D6DB] text-center align-middle"
                    >
                      {{ cIdx + 1 }}
                    </td>
                    <td
                      v-if="dIdx === 0"
                      :rowspan="
                        comp.performance_charter_item?.competency_descriptions
                          .length
                      "
                      class="px-4 py-4 text-sm text-[#161616] border-e border-b border-[#D2D6DB] align-middle"
                    >
                      {{ comp.performance_charter_item?.name }}
                    </td>
                    <td
                      v-if="dIdx === 0"
                      :rowspan="
                        comp.performance_charter_item?.competency_descriptions
                          .length
                      "
                      class="px-4 py-4 text-sm text-[#161616] border-e border-b border-[#D2D6DB] align-middle"
                    >
                      {{ comp.performance_charter_item?.weight }} %
                    </td>

                    <!-- Regular columns -->
                    <td
                      class="p-4 text-[16px] text[#161616] border-e border-b border-[#D2D6DB] leading-relaxed"
                    >
                      {{ desc?.description }}
                    </td>
                    <td
                      class="px-4 py-4 text-sm text-[#161616] border-e border-b border-[#D2D6DB] align-middle"
                    >
                      <Select
                        v-model="comp.ratings[dIdx]"
                        :options="levelOptions"
                        @update:modelValue="updateCompActualResult(comp)"
                        :insideTable="true"
                        size="sm"
                        class="w-24 mx-auto"
                      />
                    </td>
                    <td
                      class="px-4 py-4 text-sm text-[#161616] border-e border-b border-[#D2D6DB] align-middle"
                    >
                      {{ desc?.level }}
                    </td>
                    <td
                      class="px-4 py-4 text-sm text-primary border-b border-[#D2D6DB] align-middle text-center"
                    >
                      <!-- {{ calculateResult(comp.actual_result, comp.expected_result) }} -->
                      {{
                        isSupervisory
                          ? calculateResult(comp.ratings[dIdx], desc?.level)
                          : comp.ratings[dIdx]
                      }}
                    </td>
                  </tr>
                </template>
              </template>
              <template #footer>
                <tr>
                  <td
                    colspan="2"
                    class="p-4 font-[600] text-[16px] text-[#161616] text-start"
                  >
                    {{ t("evaluation.form.total_competencies_weight") }}
                  </td>
                  <td
                    class="p-4 text-[20px] font-[600] text-[#161616] text-center"
                  >
                    100%
                  </td>
                  <td
                    class="p-4 font-[600] text-[16px] text-[#161616] text-start"
                  >
                    {{ t("evaluation.form.total_competencies_score") }}
                  </td>
                  <td
                    :colspan="isSupervisory ? 3 : 2"
                    class="px-4 py-6 text-center text-[20px] font-[600]"
                  >
                    {{ totalCompetenciesScore }}
                  </td>
                </tr>
              </template>
            </Table>
          </Card>
        </div>

        <!-- Step 3: Review -->
        <div v-if="currentStep === 3" class="space-y-8">
          <!-- Targets Review Card -->
          <Card>
            <template #header>
              <h3 class="text-[16px] font-[600] text-[#333333]">
                {{ t("performance.stepper.targets") }}
              </h3>
            </template>

            <Table :items="evaluation.targets" :headers="targetHeaders">
              <template #cell-index="{ index }">
                {{ index + 1 }}
              </template>
              <template #cell-name="{ item }">
                <span>{{ item.performance_charter_item?.name || "--" }}</span>
              </template>
              <template #cell-measurement_standard="{ item }">
                {{
                  item.performance_charter_item?.measurement_standard || "--"
                }}
              </template>
              <template #cell-weight="{ item }">
                {{ item.performance_charter_item?.weight }}%
              </template>
              <template #cell-expected_result="{ item }">
                {{ item.expected_result }}
              </template>
              <template #cell-actual_result="{ item }">
                <span>{{ item.actual_result || "--" }}</span>
              </template>
              <template #cell-difference="{ item }">
                <span>
                  {{
                    (Number(item.actual_result) || 0) /
                    (Number(item.expected_result) || 0)
                  }}
                </span>
              </template>
              <template #cell-score="{ item }">
                <span>
                  {{
                    calculateResult(item.actual_result, item.expected_result)
                  }}
                </span>
              </template>

              <template #footer>
                <tr>
                  <td
                    colspan="3"
                    class="p-4 font-[600] text-[16px] text-[#161616] text-start"
                  >
                    {{ t("evaluation.form.total_targets_weight") }}
                  </td>
                  <td
                    class="p-4 text-[20px] font-[600] text-[#161616] text-center"
                  >
                    100%
                  </td>
                  <td
                    colspan="3"
                    class="p-4 font-[600] text-[16px] text-[#161616] text-start"
                  >
                    {{ t("evaluation.form.total_targets_score") }}
                  </td>
                  <td class="px-4 py-6 text-center text-[20px] font-[600]">
                    {{ totalTargetsScore }}
                  </td>
                </tr>
              </template>
            </Table>
          </Card>

          <!-- Competencies Review Card -->
          <Card>
            <template #header>
              <h3 class="text-[16px] font-[600] text-[#333333]">
                {{ t("performance.stepper.competencies") }}
              </h3>
            </template>

            <Table
              :headers="competencyHeaders"
              :items="evaluation.competencies"
            >
              <template #body="{ items }">
                <template v-for="(comp, cIdx) in items" :key="cIdx">
                  <tr
                    v-for="(desc, dIdx) in comp.performance_charter_item
                      ?.competency_descriptions"
                    :key="dIdx"
                  >
                    <!-- Spanned columns -->
                    <td
                      v-if="dIdx === 0"
                      :rowspan="
                        comp.performance_charter_item?.competency_descriptions
                          .length
                      "
                      class="px-4 py-4 text-sm text-gray-500 border-e border-b border-[#D2D6DB] text-center align-middle"
                    >
                      {{ cIdx + 1 }}
                    </td>
                    <td
                      v-if="dIdx === 0"
                      :rowspan="
                        comp.performance_charter_item?.competency_descriptions
                          .length
                      "
                      class="px-4 py-4 text-sm text-[#161616] border-e border-b border-[#D2D6DB] align-middle"
                    >
                      {{ comp.performance_charter_item?.name }}
                    </td>
                    <td
                      v-if="dIdx === 0"
                      :rowspan="
                        comp.performance_charter_item?.competency_descriptions
                          .length
                      "
                      class="px-4 py-4 text-sm text-[#161616] border-e border-b border-[#D2D6DB] align-middle"
                    >
                      {{ comp.performance_charter_item?.weight }} %
                    </td>

                    <!-- Regular columns -->
                    <td
                      class="p-4 text-[16px] text[#161616] border-e border-b border-[#D2D6DB] leading-relaxed"
                    >
                      {{ desc?.description }}
                    </td>
                    <td
                      class="px-4 py-4 text-sm text-[#161616] border-e border-b border-[#D2D6DB] align-middle"
                    >
                      <div class="flex items-center justify-center">
                        <span v-if="comp.ratings && comp.ratings[dIdx]">
                          {{ comp.ratings[dIdx] }}
                        </span>
                        <span v-else class="text-gray-400">--</span>
                      </div>
                    </td>
                    <td
                      class="px-4 py-4 text-sm text-[#161616] border-e border-b border-[#D2D6DB] align-middle"
                    >
                      {{ desc?.level }}
                    </td>
                    <!-- v-if="isSupervisory" -->
                    <td
                      class="px-4 py-4 text-sm text-primary border-b border-[#D2D6DB] align-middle"
                    >
                      <!-- {{
                        calculateResult(
                          comp.actual_result,
                          comp.expected_result,
                        )
                      }} -->
                      {{
                        isSupervisory
                          ? calculateResult(comp.ratings[dIdx], desc?.level)
                          : comp.ratings[dIdx]
                      }}
                    </td>
                  </tr>
                </template>
              </template>
              <template #footer>
                <tr>
                  <td
                    colspan="2"
                    class="p-4 font-[600] text-[16px] text-[#161616] text-start"
                  >
                    {{ t("evaluation.form.total_competencies_weight") }}
                  </td>
                  <td
                    class="p-4 text-[20px] font-[600] text-[#161616] text-center"
                  >
                    100%
                  </td>
                  <td
                    class="p-4 font-[600] text-[16px] text-[#161616] text-start"
                  >
                    {{ t("evaluation.form.total_competencies_score") }}
                  </td>
                  <td
                    :colspan="isSupervisory ? 3 : 2"
                    class="px-4 py-6 text-center text-[20px] font-[600]"
                  >
                    {{ totalCompetenciesScore }}
                  </td>
                </tr>
              </template>
            </Table>
          </Card>

          <!-- Overall Score Card -->
          <Card class="!p-2 !m-0">
            <div class="flex items-center gap-20 !bg-[#F3F4F6] p-4 rounded-lg">
              <div class="text-[#161616] font-[600] text-[18px]">
                {{ t("evaluation.form.overall_score_label") }}
              </div>
              <div class="text-[24px] font-[600] text-[#161616] leading-none">
                {{ overallScore }}
              </div>
            </div>
          </Card>

          <!-- Signatures Section -->
          <!-- <Card>
            <div class="space-y-4">
              <h3
                class="text-xl font-bold text-[#161616] border-b border-gray-100 pb-4"
              >
                {{ t("performance.form.signatures") }}
              </h3>

              <div class="space-y-0 text-center">
                <Table
                  :headers="signatureHeaders1"
                  :items="[
                    {
                      date: new Date(
                        evaluation?.created_at || Date.now(),
                      ).toLocaleDateString('en-GB'),
                    },
                  ]"
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
                    <div class="py-6 border-b border-gray-200 mt-2 mx-10"></div>
                  </template>
                </Table>

                <Table
                  :headers="signatureHeaders2"
                  :items="[{}]"
                  wrapper-class="!rounded-t-none"
                >
                  <template #cell-assessor>
                    <div class="text-center font-bold text-[#161616] py-4">
                      {{ (auth.user?.name || evaluation.manager_signature) || "--" }}
                    </div>
                  </template>
                  <template #cell-hr>
                    <div class="py-6 border-b border-gray-200 mt-2 mx-10"></div>
                  </template>
                  <template #cell-higher_admin>
                    <div class="py-6 border-b border-gray-200 mt-2 mx-10"></div>
                  </template>
                </Table>
              </div>
            </div>
          </Card> -->
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex items-center mt-8 gap-2 justify-end no-print">
        <Button
          v-if="currentStep > 1"
          variant="secondary"
          @click="prevStep"
          class="!px-10"
        >
          {{ t("performance.form.previous") }}
        </Button>
        <Button
          v-if="currentStep < 3"
          variant="primary"
          @click="nextStep"
          :loading="saving"
          class="!px-10"
        >
          {{ t("performance.form.next") }}
        </Button>
        <Button
          v-else
          variant="primary"
          @click="confirmSubmit"
          :loading="saving"
          class="!px-10 !bg-[#0E5F4A]"
        >
          {{ t("common.send") }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
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

table tr:last-child td:first-child {
  border-bottom-left-radius: 12px;
}
table tr:last-child td:last-child {
  border-bottom-right-radius: 12px;
}

:deep(.input-container input:disabled) {
  background-color: white !important;
  opacity: 1 !important;
  color: var(--color-primary, #0e5f4a) !important;
  font-weight: 800 !important;
  font-size: 1.125rem !important;
  text-align: center;
}
</style>
