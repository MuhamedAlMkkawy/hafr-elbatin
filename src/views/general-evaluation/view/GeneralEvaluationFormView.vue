<template>
  <section class="space-y-5" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
    <!-- BREADCRUMB -->
    <Breadcrumb :items="breadcrumbItems" />

    <!-- Page Title -->
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <h2 class="lg:text-[22px] text-[16px] font-[700] text-[#1F2A37]">
        {{ t("evaluation.notStandard.title") }}
      </h2>
    </div>

    <!-- Employee Info Card -->
    <Card v-if="employee" class="!p-8 !bg-white">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-18">
        <div class="space-y-4">
          <div class="flex items-center pb-2">
            <label class="text-[14px] text-[#6C737F] font-[500] w-[170px]">{{
              t("performance.chartersList.employee")
            }}</label>
            <p class="text-[16px] text-[#384250] font-bold">
              {{ employee?.name || "--" }}
            </p>
          </div>
          <div class="flex items-center pb-2">
            <label class="text-[14px] text-[#6C737F] font-[500] w-[170px]">{{
              t("performance.chartersList.job_title")
            }}</label>
            <p class="text-[16px] text-[#384250] font-bold">
              {{ employee?.rank || "--" }}
            </p>
          </div>
          <div class="flex items-center pb-2">
            <label class="text-[14px] text-[#6C737F] font-[500] w-[170px]">{{
              t("performance.form.employee_number")
            }}</label>
            <p class="text-[16px] text-[#384250] font-bold">
              {{ employee?.employee_number || "--" }}
            </p>
          </div>
        </div>
        <div class="space-y-4">
          <div class="flex items-center pb-2">
            <label class="text-[14px] text-[#6C737F] font-[500] w-[170px]">{{
              t("performance.form.agency")
            }}</label>
            <p class="text-[16px] text-[#384250] font-bold">
              {{ employee?.organizational_unit?.[`name_${lang}`] || "--" }}
            </p>
          </div>
          <div class="flex items-center pb-2">
            <label class="text-[14px] text-[#6C737F] font-[500] w-[170px]">{{
              t("performance.form.department")
            }}</label>
            <p class="text-[16px] text-[#384250] font-bold">
              {{ employee?.department?.[`name_${lang}`] || "--" }}
            </p>
          </div>
          <div class="flex items-center pb-2">
            <label class="text-[14px] text-[#6C737F] font-[500] w-[170px]">{{
              t("performance.form.assessor")
            }}</label>
            <p class="text-[16px] text-[#384250] font-bold">
              {{ employee?.manager?.name || "--" }}
            </p>
          </div>
        </div>
      </div>
    </Card>

    <!-- Evaluation Period & Type Card -->
    <Card class="!p-6 !bg-white">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex gap-10">
          <label class="text-[16px] text-[#6C737F] font-[500] block mb-3">{{
            t("evaluation.evaluation_form.evaluation_type")
          }}</label>
          <div
            class="flex flex-col items-start gap-6"
            v-if="!(userRoles.isEmployee || action == 'view')"
          >
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="revision_type"
                value="yearly"
                class="hidden"
              />
              <span
                class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                :class="
                  revision_type === 'yearly'
                    ? 'border-[#0E5F4A]'
                    : 'border-[#D2D6DB]'
                "
              >
                <span
                  v-if="revision_type === 'yearly'"
                  class="w-4 h-4 rounded-full bg-[#0E5F4A]"
                ></span>
              </span>
              <span
                class="text-[16px] font-[500] text-[#384250]"
                @click="revision_type = 'yearly'"
                >{{ t("evaluation.evaluation_form.annual") }}</span
              >
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="revision_type"
                value="half_yearly"
                class="hidden"
              />
              <span
                class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                :class="
                  revision_type === 'half_yearly'
                    ? 'border-[#0E5F4A]'
                    : 'border-[#D2D6DB]'
                "
              >
                <span
                  v-if="revision_type === 'half_yearly'"
                  class="w-4 h-4 rounded-full bg-[#0E5F4A]"
                ></span>
              </span>
              <span
                class="text-[16px] font-[500] text-[#384250]"
                @click="revision_type = 'half_yearly'"
                >{{ t("evaluation.evaluation_form.semi_annual") }}</span
              >
            </label>
          </div>
          <div
            v-else
            class="text-[16px] font-[500] text-[#0E5F4A] bg-[#82aba040] rounded-full h-[fit-content] py-[4px] border border-[#E7EFED/5] px-[12px]"
          >
            {{ revision_type }}
          </div>
        </div>
        <!-- RATING -->
        <div class="flex gap-10">
          <label class="text-[16px] text-[#6C737F] font-[500] block mb-3">{{
            t("evaluation.evaluation_form.eligibility")
          }}</label>
          <div
            class="flex flex-col gap-6"
            v-if="!(userRoles.isEmployee || action == 'view')"
          >
            <label
              class="flex items-center gap-2 cursor-pointer"
              @click="readiness_for_promotion = 'ready'"
            >
              <span
                class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                :class="
                  readiness_for_promotion === 'ready'
                    ? 'border-[#0E5F4A]'
                    : 'border-[#D2D6DB]'
                "
              >
                <span
                  v-if="readiness_for_promotion === 'ready'"
                  class="w-4 h-4 rounded-full bg-[#0E5F4A]"
                ></span>
              </span>
              <span class="text-[16px] font-[500] text-[#384250]">{{
                t("evaluation.evaluation_form.eligible")
              }}</span>
            </label>
            <label
              class="flex items-center gap-2 cursor-pointer"
              @click="readiness_for_promotion = 'not_ready'"
            >
              <span
                class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                :class="
                  readiness_for_promotion === 'not_ready'
                    ? 'border-[#0E5F4A]'
                    : 'border-[#D2D6DB]'
                "
              >
                <span
                  v-if="readiness_for_promotion === 'not_ready'"
                  class="w-4 h-4 rounded-full bg-[#0E5F4A]"
                ></span>
              </span>
              <span class="text-[16px] font-[500] text-[#384250]">{{
                t("evaluation.evaluation_form.not_eligible")
              }}</span>
            </label>
            <label
              class="flex items-center gap-2 cursor-pointer"
              @click="readiness_for_promotion = 'in_probation'"
            >
              <span
                class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                :class="
                  readiness_for_promotion === 'in_probation'
                    ? 'border-[#0E5F4A]'
                    : 'border-[#D2D6DB]'
                "
              >
                <span
                  v-if="readiness_for_promotion === 'in_probation'"
                  class="w-4 h-4 rounded-full bg-[#0E5F4A]"
                ></span>
              </span>
              <span class="text-[16px] font-[500] text-[#384250]">{{
                t("evaluation.evaluation_form.in_probation")
              }}</span>
            </label>
          </div>
          <div
            v-else
            class="text-[16px] font-[500] text-[#0E5F4A] bg-[#82aba040] rounded-full h-[fit-content] py-[4px] border border-[#E7EFED/5] px-[12px]"
          >
            {{ readiness_for_promotion }}
          </div>
        </div>
      </div>
      <!-- INPUTS -->
      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-6 border-t border-[#F3F4F6]"
        v-if="!(userRoles.isEmployee || action == 'view')"
      >
        <div>
          <label class="text-[14px] text-[#6C737F] font-[500] block mb-2">{{
            t("evaluation.evaluation_form.period_from")
          }}</label>
          <Input
            type="date"
            v-model="periodFrom"
            class="w-full rounded-lg text-[14px] text-[#384250] focus:outline-none focus:border-[#0E5F4A] transition !bg-transparent"
          >
            <template #suffix>
              <SvgIcon name="calendar" />
            </template>
          </Input>
        </div>
        <div>
          <label class="text-[14px] text-[#6C737F] font-[500] block mb-2">{{
            t("evaluation.evaluation_form.period_to")
          }}</label>
          <Input
            type="date"
            v-model="periodTo"
            class="w-full rounded-lg text-[14px] text-[#384250] focus:outline-none focus:border-[#0E5F4A] transition !bg-transparent"
          >
            <template #suffix>
              <SvgIcon name="calendar" />
            </template>
          </Input>
        </div>
        <div>
          <label class="text-[14px] text-[#6C737F] font-[500] block mb-2">{{
            t("evaluation.evaluation_form.evaluation_date")
          }}</label>
          <Input
            type="date"
            v-model="evaluationDate"
            class="w-full rounded-lg text-[14px] text-[#384250] focus:outline-none focus:border-[#0E5F4A] transition !bg-transparent"
          >
            <template #suffix>
              <SvgIcon name="calendar" />
            </template>
          </Input>
        </div>
      </div>
      <div class="grid grid-cols-2" v-else>
        <div class="flex gap-4">
          <h4 class="flex gap-2 text-[16px] text-[#384250] font-[600]">
            <span class="font-[500] text-[#6C737F]">{{
              t("evaluation.evaluation_form.period_from")
            }}</span>
            {{ periodFrom || "---" }}
          </h4>
          <h4 class="flex gap-2 text-[16px] text-[#384250] font-[600]">
            <span class="font-[500] text-[#6C737F]">{{
              t("evaluation.evaluation_form.period_to")
            }}</span>
            {{ periodTo || "---" }}
          </h4>
        </div>

        <div class="flex gap-4">
          <h4 class="flex gap-2 text-[16px] text-[#384250] font-[600]">
            <span class="font-[500] text-[#6C737F]">{{
              t("evaluation.evaluation_form.evaluation_date")
            }}</span>
            {{ evaluationDate || "---" }}
          </h4>
        </div>
      </div>
    </Card>

    <!-- Form Fill Instructions -->
    <Card class="!p-4">
      <div class="flex items-center gap-2">
        <span class="text-[#0E5F4A]"><SvgIcon name="info" /></span>
        <p class="text-[16px] text-[#0E5F4A] font-[500]">
          {{ t("evaluation.evaluation_form.fill_instructions") }}
        </p>
      </div>
    </Card>

    <!-- Employee Performance Evaluation Table -->
    <Card>
      <template #header>
        <h3 class="text-[16px] font-[500] text-[#1F2A37]">
          {{ t("evaluation.evaluation_form.employee_performance_table") }}
        </h3>
      </template>
      <div class="rounded-xl">
        <Table
          :items="sortedRows"
          :headers="tableHeaders"
          :loading="false"
          :page="1"
          :total-pages="1"
        >
          <!-- Header -->
          <template #header-label>
            <div
              class="flex items-center justify-center gap-2 cursor-pointer"
              @click="handleSort('label')"
            >
              {{ t("evaluation.evaluation_form.col_description") }}
              <SvgIcon
                name="sort"
                class="w-4 h-4"
                :class="
                  filters.sort_by === 'label' ? 'text-primary' : 'text-gray-400'
                "
              />
            </div>
          </template>

          <!-- rating -->
          <template #cell-rating="{ item }">
            <div class="text-center font-bold text-[#1F2A37]">
              {{ item.rating || "---" }}
            </div>
          </template>

          <!-- label -->
          <template #cell-label="{ item }">
            <div class="text-center text-[#384250]">
              {{ item.label || "---" }}
            </div>
          </template>

          <!-- justification header -->
          <template #header-justification>
            <div class="flex items-center justify-start gap-1">
              <span class="text-[#B42318]">*</span>
              <span>{{ t("evaluation.evaluation_form.col_reasons") }}</span>
            </div>
          </template>

          <!-- supporting_document header -->
          <template #header-supporting_document>
            <div class="flex items-center justify-start gap-1">
              <span class="text-[#B42318]">*</span>
              <span>{{ t("evaluation.evaluation_form.col_documents") }}</span>
            </div>
          </template>

          <!-- grades -->
          <template #cell-grades="{ item }">
            <Input
              :disabled="userRoles.isEmployee || action == 'view'"
              v-model="item.grades"
              type="text"
              size="sm"
              :placeholder="t('evaluation.evaluation_form.placeholder_notes')"
              class="w-full rounded-lg px-4 py-2 text-[14px] text-[#000] bg-[#F3F4F6]"
            />
          </template>

          <!-- justification -->
          <template #cell-justification="{ item }">
            <Input
              :disabled="userRoles.isEmployee || action == 'view'"
              v-model="item.justification"
              type="text"
              :placeholder="t('evaluation.evaluation_form.placeholder_reasons')"
              size="sm"
              class="w-full rounded-lg px-4 py-2 text-[14px] text-[#000] bg-[#F3F4F6]"
            />
          </template>

          <!-- supporting_document -->
          <template #cell-supporting_document="{ item }">
            <Input
              :disabled="userRoles.isEmployee || action == 'view'"
              v-model="item.supporting_document"
              type="text"
              :placeholder="t('evaluation.evaluation_form.placeholder_notes')"
              size="sm"
              class="w-full rounded-lg px-4 py-2 text-[14px] text-[#000] bg-[#F3F4F6]"
            />
          </template>
        </Table>
      </div>
    </Card>

    <!-- Gap Points Section -->
    <Card class="!p-5 overflow-hidden">
      <div class="overflow-hidden rounded-xl border border-[#D2D6DB]">
        <table class="min-w-full border-separate border-spacing-0">
          <thead class="bg-white">
            <tr>
              <th
                class="px-6 py-6 text-[16px] font-[600] text-[#384250] text-start border-e border-b border-[#D2D6DB] w-1/2 bg-[#F3F4F6]"
              >
                {{ t("evaluation.evaluation_form.gap_strengths") }}
              </th>
              <th
                class="px-6 py-6 text-[16px] font-[600] text-[#384250] text-start border-b border-[#D2D6DB] w-1/2 bg-[#F3F4F6]"
              >
                {{ t("evaluation.evaluation_form.gap_development") }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white">
            <tr v-for="(gap, index) in gapRows" :key="index">
              <td class="px-4 py-3 border-e border-b border-[#D2D6DB]">
                <input
                  :disabled="userRoles.isEmployee || action == 'view'"
                  v-model="gap.strengths"
                  type="text"
                  :placeholder="t('evaluation.evaluation_form.placeholder_gap')"
                  class="w-full rounded-lg px-3 py-2 text-[14px] text-[#384250] focus:outline-none focus:border-[#0E5F4A] transition bg-[#F3F4F6] placeholder-[#9CA3AF] border-0"
                />
              </td>
              <td class="px-4 py-3 border-b border-[#D2D6DB]">
                <input
                  :disabled="userRoles.isEmployee || action == 'view'"
                  v-model="gap.development_areas"
                  type="text"
                  :placeholder="t('evaluation.evaluation_form.placeholder_gap')"
                  class="w-full rounded-lg px-3 py-2 text-[14px] text-[#384250] focus:outline-none focus:border-[#0E5F4A] transition bg-[#F3F4F6] placeholder-[#9CA3AF] border-0"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Remarks / Notes -->
    <Card class="relative overflow-hidden">
      <h3
        class="absolute top-0 right-0 w-full text-[20px] font-[500] text-[#1F2A37] mb-[8px] px-5 py-[12px] bg-[#F3F4F6]"
      >
        {{ t("evaluation.evaluation_form.notes") }}
      </h3>
      <textarea
        :disabled="userRoles.isEmployee || action == 'view'"
        v-model="manager_note"
        rows="4"
        :placeholder="t('evaluation.evaluation_form.placeholder_remarks')"
        class="w-full mt-12 border border-[#D2D6DB] rounded-xl px-4 py-3 text-[14px] text-[#384250] focus:outline-none max-h-[100px] h-[100px] focus:border-[#0E5F4A] transition resize-none bg-[#F3F4F6] placeholder-[#9CA3AF]"
      ></textarea>
    </Card>
    <!-- REJECTION Section -->
    <div class="mt-6" v-if="employee?.rejection_reason">
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
              {{ employee?.rejection_reason }}
            </p>
          </div>
        </div>
      </Card>
    </div>

    <!-- Action Buttons -->
    <div
      class="flex items-center gap-3 justify-end"
      v-if="!userRoles?.isEmployee"
    >
      <Button
        @click="handleReject"
        class="px-[28px] py-[8px] bg-[#FEE4E2AB] !text-[#D92D20] text-[16px] font-[500] rounded-lg border border-[#D92D20] hover:bg-red-50 transition"
      >
        {{ t("evaluation.evaluation_form.reject") }}
      </Button>
      <Button
        @click="handleApprove"
        class="px-[28px] py-[8px] bg-[#0E5F4A] text-white text-[16px] font-[500] rounded-lg border border-[#0E5F4A] hover:bg-[#0a4a39] transition"
      >
        {{ t("evaluation.evaluation_form.approve") }}
      </Button>
    </div>

    <!-- Signatures Card -->
    <Card v-if="userRoles?.isEmployee">
      <template #header>
        <h3 class="text-[16px] font-[700] text-[#1F2A37]">
          {{ t("evaluation.evaluation_form.signatures.title") }}
        </h3>
      </template>
      <div class="overflow-hidden rounded-xl border border-[#D2D6DB]">
        <table class="min-w-full border-separate border-spacing-0">
          <thead class="bg-[#F9FAFB]">
            <tr>
              <th
                class="px-4 py-3 text-sm text-gray-700 font-[600] border-e border-b border-[#D2D6DB] w-1/4 text-center"
              >
                {{ t("evaluation.evaluation_form.signatures.employee") }}
              </th>
              <th
                class="px-4 py-3 text-sm text-gray-700 font-[600] border-e border-b border-[#D2D6DB] w-1/2 text-center"
              >
                {{ t("evaluation.evaluation_form.signatures.manager") }}
              </th>
              <th
                class="px-4 py-3 text-sm text-gray-700 font-[600] border-b border-[#D2D6DB] w-1/4 text-center"
              >
                {{ t("evaluation.evaluation_form.signatures.hr") }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                class="px-4 py-6 text-center text-sm text-gray-500 font-bold border-e border-[#D2D6DB]"
              >
                {{ data?.employee_signature || "---" }}
              </td>
              <td
                class="px-4 py-6 text-center text-sm text-gray-500 font-bold border-e border-[#D2D6DB]"
              >
                {{ data?.manager_signature || "---" }}
              </td>
              <td class="px-4 py-6 text-center text-sm text-gray-500 font-bold">
                {{ data?.higher_admin_signature || "---" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Instructions Modal -->
    <Modal
      v-model="showInstructions"
      :title="t('evaluation.evaluation_form.instructions.title')"
      :cancel-text="t('evaluation.evaluation_form.instructions.cancel')"
      width="lg"
      v-if="!(userRoles.isEmployee || action == 'view')"
    >
      <div class="overflow-hidden rounded-xl border border-[#D2D6DB] mb-2">
        <table class="min-w-full border-separate border-spacing-0">
          <tbody>
            <tr v-for="(item, index) in instructions" :key="index" class="">
              <td
                class="px-4 py-4 bg-[#F3F4F6] text-[14px] text-[#384250] w-10 text-start font-[600] text-[#6C737F] border-b border-[#D2D6DB] last:border-0"
              >
                {{ index + 1 }}
              </td>
              <td
                class="px-4 py-4 text-[14px] text-[#384250] text-start !border-b !border-[#D2D6DB]"
              >
                {{ item }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import Card from "@/components/ui/Card.vue";
import Input from "@/components/ui/Input.vue";
import employeeService from "@/services/employees";
import { useRoute, useRouter } from "vue-router";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Table from "@/components/ui/Table.vue";
import Button from "@/components/ui/Button.vue";
import generalEvaluationService from "@/services/general-evaluation";
import { useAppToast } from "@/composables/useAppToast";
import Modal from "@/components/ui/Modal.vue";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const route = useRoute();
const router = useRouter();
const data = ref([]);
const employee = ref(null);
const toast = useAppToast();
const loading = ref(true);

// ####################### MODAL
const showInstructions = ref(true);

const instructions = computed(() => [
  t("evaluation.evaluation_form.instructions.step1"),
  t("evaluation.evaluation_form.instructions.step2"),
  t("evaluation.evaluation_form.instructions.step3"),
]);

// ####################### Breadcrumb
const breadcrumbItems = computed(() => {
  const prefix = locale.value === "en" ? "/en" : "";
  return [
    { label: t("sidebar.performance"), to: `${prefix}/performance` },
    { label: t("sidebar.performanceAppraisal") },
  ];
});

const user = ref();
const action = ref();
// =============> ROLE COMPUTATION
// Derived from the authenticated user's roles array.
// Roles priority: super-admin > admin > hr > manager > employee (default)
const userRoles = computed(() => {
  const roles = user.value?.roles || [];
  const isSuperAdmin = roles.includes("super-admin");
  const isAdmin = roles.includes("admin");
  const isHR = roles.includes("hr-employee");
  const isManager = roles.includes("manager");
  // Employee = anyone who is NOT admin, super-admin, hr, or manager
  const isEmployee = !isAdmin && !isHR && !isManager && !isSuperAdmin;

  return { isAdmin, isHR, isManager, isEmployee, isSuperAdmin };
});

// ####################### Sort
const filters = ref({ sort_by: "", sort_order: "asc" });

const handleSort = (key) => {
  if (filters.value.sort_by === key) {
    filters.value.sort_order =
      filters.value.sort_order === "asc" ? "desc" : "asc";
  } else {
    filters.value.sort_by = key;
    filters.value.sort_order = "asc";
  }
};

// ####################### Performance Table

const tableHeaders = computed(() => [
  {
    key: "rating",
    label: t("evaluation.evaluation_form.col_grade"),
    sortable: false,
    thClass: "text-center w-16",
    tdClass: "text-center",
  },
  {
    key: "label",
    label: t("evaluation.evaluation_form.col_description"),
    sortable: true,
    thClass: "text-center",
    tdClass: "text-center",
  },
  {
    key: "grades",
    label: t("evaluation.evaluation_form.col_score"),
    sortable: false,
    thClass: "text-center w-1/4",
    tdClass: "w-1/4",
  },
  {
    key: "justification",
    label: t("evaluation.evaluation_form.col_reasons"),
    sortable: false,
    thClass: "text-center w-1/4",
    tdClass: "w-1/4",
  },
  {
    key: "supporting_document",
    label: t("evaluation.evaluation_form.col_documents"),
    sortable: false,
    thClass: "text-center w-1/4",
    tdClass: "w-1/4",
  },
]);

const sortedRows = ref([
  {
    rating: 5,
    label: t("evaluation.evaluation_form.grades.5"),
    grades: "",
    justification: "",
    supporting_document: "",
  },
  {
    rating: 4,
    label: t("evaluation.evaluation_form.grades.4"),
    grades: "",
    justification: "",
    supporting_document: "",
  },
  {
    rating: 3,
    label: t("evaluation.evaluation_form.grades.3"),
    grades: "",
    justification: "",
    supporting_document: "",
  },
  {
    rating: 2,
    label: t("evaluation.evaluation_form.grades.2"),
    grades: "",
    justification: "",
    supporting_document: "",
  },
  {
    rating: 1,
    label: t("evaluation.evaluation_form.grades.1"),
    grades: "",
    justification: "",
    supporting_document: "",
  },
]);

// ####################### Form State
const revision_type = ref("yearly");
const readiness_for_promotion = ref("ready");
const periodFrom = ref("");
const periodTo = ref("");
const evaluationDate = ref("");
const manager_note = ref("");

// ####################### Gap Rows
const gapRows = ref([
  { strengths: "", development_areas: "" },
  { strengths: "", development_areas: "" },
  { strengths: "", development_areas: "" },
  { strengths: "", development_areas: "" },
]);

// ####################### Validation
const validateForm = () => {
  if (!revision_type.value) return "evaluation.validation.revision_type";
  if (!readiness_for_promotion.value) return "evaluation.validation.readiness";
  if (!periodFrom.value) return "evaluation.validation.period_from";
  if (!periodTo.value) return "evaluation.validation.period_to";
  if (!evaluationDate.value) return "evaluation.validation.evaluation_date";
  if (!manager_note.value?.trim()) return "evaluation.validation.manager_note";

  // Table validation
  for (const row of sortedRows.value) {
    if (!row.grades) return "evaluation.validation.grades";
    if (!row.justification) return "evaluation.validation.justification";
    if (!row.supporting_document)
      return "evaluation.validation.supporting_document";
  }

  // Gap validation
  for (const row of gapRows.value) {
    if (!row.strengths) return "evaluation.validation.strengths";
    if (!row.development_areas) return "evaluation.validation.development";
  }

  return null;
};

// ####################### Actions
const handleApprove = async () => {
  const errorKey = validateForm();

  if (errorKey) {
    toast.error(t(errorKey));
    return;
  }

  try {
    const payload = {
      revision_type: revision_type.value,
      readiness_for_promotion: readiness_for_promotion.value,
      evaluation_start_date: periodFrom.value,
      evaluation_end_date: periodTo.value,
      evaluation_date: evaluationDate.value,
      manager_note: manager_note.value,
      rating_details: sortedRows.value,
      strengths: gapRows.value.map((r) => r.strengths),
      development_areas: gapRows.value.map((r) => r.development_areas),
    };

    const response = await generalEvaluationService.handleEvaluateEmployee(
      route.params.id,
      payload,
    );

    if (response?.data) {
      router.push({ name: "appraisal" });
      toast.success(response?.message || t("evaluation.messages.sent"));
    }
  } catch (e) {
    console.error(e);
    toast.error(t("evaluation.messages.error"));
  }
};
const handleReject = () => router.go(-1);

// ####################### Fetch Employee
// onMounted(async () => {
//   user.value = JSON.parse(localStorage.getItem("attendance.auth"))?.user;
//   action.value = sessionStorage.getItem("evaluation_action");

//   const response = await employeeService.getById(route.params.id);
//   if(response?.data){
//     employee.value = response?.data?.employee;
//     data.value = response?.data;
//   }

//   // ===================== Evaluation Data
//   const employeeEvaluation = await generalEvaluationService.getById(
//     route.params.id,
//   );

//   const data = employeeEvaluation?.data;

//   if (!data) return;

//   // Top fields
//   revision_type.value = data.revision_type || "";
//   readiness_for_promotion.value = data.readiness_for_promotion || "";

//   periodFrom.value = data.evaluation_start_date || "";
//   periodTo.value = data.evaluation_end_date || "";
//   evaluationDate.value = data.evaluation_date || "";

//   manager_note.value = data.manager_note || "";

//   // Table (rating_details)
//   sortedRows.value = (data.rating_details || []).map((row) => ({
//     rating: row.rating,
//     label: row.label || t(`evaluation.evaluation_form.grades.${row.rating}`),
//     grades: row.grades || "",
//     justification: row.justification || "",
//     supporting_document: row.supporting_document || "",
//   }));

//   // Gap rows (merge strengths + development)
//   const strengths = data.strengths || [];
//   const development = data.development_areas || [];

//   const maxLength = Math.max(
//     strengths.length,
//     development.length,
//     4, // minimum rows
//   );

//   gapRows.value = Array.from({ length: maxLength }, (_, i) => ({
//     strengths: strengths[i] || "",
//     development_areas: development[i] || "",
//   }));
// });

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("attendance.auth"))?.user;
  action.value = sessionStorage.getItem("evaluation_action");

  const response = await employeeService.getById(route.params.id);

  if (response?.data) {
    employee.value = response?.data?.employee;
    data.value = response?.data; // keep your ref safe here
  }

  // ===================== Evaluation Data
  const employeeEvaluation = await generalEvaluationService.getById(
    route.params.id,
  );

  const evaluationData = employeeEvaluation?.data;

  if (!evaluationData) return;

  // Top fields
  revision_type.value = evaluationData.revision_type || "";
  readiness_for_promotion.value = evaluationData.readiness_for_promotion || "";

  periodFrom.value = evaluationData.evaluation_start_date || "";
  periodTo.value = evaluationData.evaluation_end_date || "";
  evaluationDate.value = evaluationData.evaluation_date || "";

  manager_note.value = evaluationData.manager_note || "";

  // Table (rating_details)
  sortedRows.value = (evaluationData.rating_details || []).map((row) => ({
    rating: row.rating,
    label: row.label || t(`evaluation.evaluation_form.grades.${row.rating}`),
    grades: row.grades || "",
    justification: row.justification || "",
    supporting_document: row.supporting_document || "",
  }));

  // Gap rows
  const strengths = evaluationData.strengths || [];
  const development = evaluationData.development_areas || [];

  const maxLength = Math.max(strengths.length, development.length, 4);

  gapRows.value = Array.from({ length: maxLength }, (_, i) => ({
    strengths: strengths[i] || "",
    development_areas: development[i] || "",
  }));
});
</script>
