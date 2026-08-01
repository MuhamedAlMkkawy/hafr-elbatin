<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import Card from "@/components/ui/Card.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import Button from "@/components/ui/Button.vue";
import Table from "@/components/ui/Table.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import performanceService from "@/services/performance";
import { useAppToast } from "@/composables/useAppToast";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const isEn = computed(() => route.path.startsWith("/en"));

const charterId = route.params.id;
const charter = ref(null);
const loading = ref(true);
const currentStep = ref(1);

const breadcrumbItems = computed(() => {
  const base = isEn.value ? "/en/performance/charter" : "/performance/charter";
  return [
    { label: t("sidebar.performance"), to: base },
    { label: t("sidebar.performanceCharter"), to: base },
    { label: charter.value?.type_name || t("performance.entityName") },
    {
      label:
        currentStep.value === 1
          ? t("performance.stepper.targets")
          : currentStep.value === 2
            ? t("performance.stepper.competencies")
            : t("performance.stepper.review"),
    },
  ];
});

const steps = computed(() => [
  { id: 1, label: t("performance.stepper.targets") },
  { id: 2, label: t("performance.stepper.competencies") },
  { id: 3, label: t("performance.stepper.review") },
]);

const fetchCharter = async () => {
  loading.value = true;
  try {
    const response = await performanceService.getById(charterId);
    charter.value = response.data;
  } catch (error) {
    console.error("Error fetching charter:", error);
    toast.error(t("common.error"));
  } finally {
    loading.value = false;
  }
};

const nextStep = () => {
  if (currentStep.value < 3) currentStep.value++;
};

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const goToStep = (step) => {
  if (step < currentStep.value || true) {
    // Allow jumping for now in view mode
    currentStep.value = step;
  }
};

const targetHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "name", label: t("performance.form.target_name") },
  {
    key: "measurement_standard",
    label: t("performance.form.measurement_standard"),
  },
  { key: "weight", label: t("performance.form.weight") },
  { key: "expected_results", label: t("performance.form.expected_results") },
]);

const competencyHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "name", label: t("performance.form.competency") },
  { key: "weight", label: t("performance.form.weight") },
  {
    key: "competency_descriptions",
    label: t("performance.form.behavioral_description"),
  },
  { key: "required_level", label: t("performance.form.desc_level") },
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
    key: "higher_admin",
    label: t("performance.form.higher_admin_signature") || "توقيع سعادة الأمين",
    headerClass: "w-1/3 text-center",
  },
  {
    key: "manager",
    label: t("performance.form.manager_signature") || "توقيع المدير المقيم",
    headerClass: "w-1/3 text-center",
  },
  {
    key: "hr",
    label:
      t("performance.form.hr_signature") || "توقيع مدير عام الموارد البشرية",
    headerClass: "w-1/3 text-center",
  },
]);

onMounted(() => {
  fetchCharter();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <Card v-if="loading" class="flex justify-center items-center py-20">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </Card>

    <div v-else-if="charter" class="space-y-6">
      <!-- Charter Header Info -->
      <h2 class="text-xl font-bold mb-6 text-[#1F2A37]">
        {{ t("sidebar.performanceCharter") }}
      </h2>
      <Card v-if="charter" class="!p-8 !bg-white">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-18">
          <!-- Column 1 -->
          <div class="space-y-4">
            <div class="flex items-center pb-2">
              <label class="text-[12px] text-[#6C737F] font-[500] w-[170px]">{{
                t("performance.chartersList.employee")
              }}</label>
              <p class="text-[16px] text-[#384250] font-bold">
                {{ charter.employee?.name || "--" }}
              </p>
            </div>
            <div class="flex items-center pb-2">
              <label class="text-[12px] text-[#6C737F] font-[500] w-[170px]">{{
                t("performance.chartersList.job_title")
              }}</label>
              <p class="text-[16px] text-[#384250] font-bold">
                {{ charter.employee?.job_title || "--" }}
              </p>
            </div>
            <div class="flex items-center pb-2">
              <label class="text-[12px] text-[#6C737F] font-[500] w-[170px]">{{
                t("performance.form.employee_number")
              }}</label>
              <p class="text-[16px] text-[#384250] font-bold">
                {{ charter.employee?.employee_number || "--" }}
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
                {{ charter.agency?.name || charter.department?.name || "--" }}
              </p>
            </div>
            <div class="flex items-center pb-2">
              <label class="text-[12px] text-[#6C737F] font-[500] w-[170px]">{{
                t("performance.form.department")
              }}</label>
              <p class="text-[16px] text-[#384250] font-bold">
                {{ charter.department?.name || "--" }}
              </p>
            </div>
            <div class="flex items-center pb-2">
              <label class="text-[12px] text-[#6C737F] font-[500] w-[170px]">{{
                t("performance.form.assessor")
              }}</label>
              <p class="text-[16px] text-[#384250] font-bold">
                {{ charter.assessor?.name || "--" }}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <!-- Stepper Progress -->
      <Card class="!py-4">
        <div class="flex items-center justify-center mx-auto relative">
          <!-- Connector Line -->
          <div
            class="absolute left-0 right-0 h-[2px] bg-[#D2D6DB] -z-0"
            style="top: 24px"
          ></div>
          <div
            class="absolute left-0 h-[2px] bg-primary transition-all duration-300 -z-0"
            :style="{
              top: '24px',
              width:
                currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
            }"
          ></div>

          <div
            v-for="step in steps"
            :key="step.id"
            class="flex flex-col relative z-10 mt-1.5"
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
      <transition name="fade" mode="out-in">
        <div :key="currentStep">
          <!-- Step 1: Targets -->
          <div v-if="currentStep === 1 || currentStep === 3" class="space-y-6">
            <Card>
              <template #header>
                <div class="flex justify-between items-center w-full">
                  <h3 class="text-lg font-semibold text-[#1F2A37]">
                    {{ t("performance.stepper.targets") }}
                  </h3>
                </div>
              </template>

              <div class="overflow-hidden rounded-xl border border-[#D2D6DB]">
                <table
                  class="min-w-full divide-y divide-[#D2D6DB] border-separate border-spacing-0"
                >
                  <thead class="bg-[#F9FAFB]">
                    <tr>
                      <th
                        class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] w-12 text-center"
                      >
                        #
                      </th>
                      <th
                        class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB]"
                      >
                        {{ t("performance.form.target_name") }}
                      </th>
                      <th
                        class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB]"
                      >
                        {{ t("performance.form.measurement_standard") }}
                      </th>
                      <th
                        class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] w-32 text-center"
                      >
                        {{ t("performance.form.weight") }}
                      </th>
                      <th
                        class="px-4 py-4 text-sm font-bold text-gray-900 border-b border-[#D2D6DB]"
                      >
                        {{ t("performance.form.expected_results") }}
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-[#D2D6DB]">
                    <tr v-for="(item, index) in charter.targets" :key="index">
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
                        class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] text-center"
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
                    <tr v-if="charter.targets?.length">
                      <td
                        colspan="2"
                        class="px-6 py-6 text-sm font-bold text-gray-700 text-start"
                      >
                        {{ t("evaluation.chartersList.total") }}
                      </td>
                      <td
                        class="px-6 py-6 text-lg font-black text-gray-900 text-start"
                      >
                        {{ charter.total_targets_weight }} %
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>

          <!-- Step 2: Competencies -->
          <div
            v-if="currentStep === 2 || currentStep === 3"
            :class="{ 'mt-6': currentStep === 3 }"
            class="space-y-6"
          >
            <Card>
              <template #header>
                <div class="flex justify-between items-center w-full">
                  <h3 class="text-lg font-bold text-[#1F2A37]">
                    {{ t("performance.stepper.competencies") }}
                  </h3>
                  <Button
                    v-if="currentStep === 3 && false"
                    variant="primary"
                    size="sm"
                    class="!bg-[#0E5F4A]"
                  >
                    {{ t("common.add") }}
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
                        class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] w-12 text-center"
                      >
                        #
                      </th>
                      <th
                        class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB]"
                      >
                        {{ t("performance.form.competency") }}
                      </th>
                      <th
                        class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] w-32 text-center"
                      >
                        {{ t("performance.form.weight") }}
                      </th>
                      <th
                        class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] text-center"
                      >
                        {{ t("performance.form.behavioral_description") }}
                      </th>
                      <th
                        class="px-4 py-4 text-sm font-bold text-gray-900 border-b border-[#D2D6DB] w-48 text-center"
                      >
                        {{ t("performance.form.required_level") }}
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-[#D2D6DB]">
                    <template
                      v-for="(comp, cIdx) in charter.competencies"
                      :key="cIdx"
                    >
                      <tr
                        v-for="(desc, dIdx) in comp.competency_descriptions"
                        :key="dIdx"
                      >
                        <!-- Spanned columns -->
                        <td
                          v-if="dIdx === 0"
                          :rowspan="comp.competency_descriptions.length"
                          class="px-4 py-4 text-sm text-gray-500 border-e border-b border-[#D2D6DB] text-center align-middle"
                        >
                          {{ cIdx + 1 }}
                        </td>
                        <td
                          v-if="dIdx === 0"
                          :rowspan="comp.competency_descriptions.length"
                          class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] align-middle"
                        >
                          {{ comp.name }}
                        </td>
                        <td
                          v-if="dIdx === 0"
                          :rowspan="comp.competency_descriptions.length"
                          class="px-4 py-4 text-sm text-gray-900 border-e border-b border-[#D2D6DB] text-center align-middle"
                        >
                          {{ comp.weight }} %
                        </td>

                        <!-- Regular columns -->
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
                    <tr>
                      <td
                        colspan="2"
                        class="px-6 py-6 text-sm font-bold text-gray-700 text-start"
                      >
                        {{ t("evaluation.chartersList.total") }}
                      </td>
                      <td
                        class="px-6 py-6 text-lg font-black text-gray-900 text-start"
                      >
                        {{ charter.total_competencies_weight }} %
                      </td>
                      <td colspan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex items-center mt-8 no-print gap-2 justify-end">
            <Button
              v-if="currentStep > 1"
              variant="secondary"
              @click="prevStep"
              class="!px-10"
            >
              {{ t("performance.form.previous") }}
            </Button>
            <div v-else></div>

            <div class="flex gap-4">
              <Button
                v-if="currentStep < 3"
                variant="primary"
                @click="nextStep"
                class="!px-10"
              >
                {{ t("performance.form.next") }}
              </Button>
              <!-- <Button 
                v-if="currentStep === 3" 
                variant="secondary" 
                @click="router.push(isEn ? '/en/performance/charter' : '/performance/charter')"
              >
                 {{ t("common.back") }}
              </Button> -->
            </div>
          </div>

          <!-- Signatures Section -->
          <div class="mt-6">
            <Card>
              <div class="space-y-4">
                <h3
                  class="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4"
                >
                  {{ t("performance.form.signatures") }}
                </h3>

                <div class="space-y-0">
                  <Table
                    :headers="signatureHeaders1"
                    :items="[
                      {
                        date: new Date(
                          charter?.created_at || Date.now(),
                        ).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric',
                        }),
                      },
                    ]"
                    wrapper-class="!rounded-b-none !border-b-0"
                  >
                    <template #cell-date="{ item }">
                      <div>
                        {{ item.date }}
                      </div>
                    </template>
                    <template #cell-seal>
                      <div class="py-2 px-10"></div>
                    </template>
                    <template #cell-employee>
                      <div class="py-4">
                        {{ charter?.employee_signature || "--" }}
                      </div>
                    </template>
                  </Table>

                  <Table
                    :headers="signatureHeaders2"
                    :items="[{}]"
                    wrapper-class="!rounded-t-none"
                  >
                    <template #cell-higher_admin>
                      <div class="py-4">
                        {{ charter?.higher_admin_signature || "--" }}
                      </div>
                    </template>
                    <template #cell-manager>
                      <div class="py-4">
                        {{ charter?.manager_signature || "--" }}
                      </div>
                    </template>
                    <template #cell-hr>
                      <div class="py-4">
                        {{ charter?.hr_signature || "--" }}
                      </div>
                    </template>
                  </Table>
                </div>
              </div>
            </Card>
          </div>

          <!-- REJECTION Section -->
          <div class="mt-6" v-if="charter?.rejection_reason">
            <Card>
              <div class="space-y-4">
                <h3
                  class="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4"
                >
                  {{ t("evaluation.modals.rejectReason") }}
                </h3>

                <div class="space-y-0">
                  <p
                    class="bg-[#F3F4F6] rounded-[4px] text-[16px] font-[400] text-[#161616] p-2"
                  >
                    {{ charter?.rejection_reason }}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:deep(.table-container) {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
}

:deep(th) {
  background-color: #f9fafb;
  color: #4d5761;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem 1.5rem;
}

:deep(td) {
  padding: 1rem 1.5rem;
  font-size: 0.875rem;
  color: #1f2a37;
  border-top: 1px solid #f3f4f6;
}
</style>
