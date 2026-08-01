<template>
  <section class="space-y-6">
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <h2 class="lg:text-[25px] text-[20px] font-[600]">
        {{ t("sidebar.performanceEvaluation") }}
      </h2>
    </div>

    <!-- Statistics Cards: Manager only (Image 1) -->
    <Card
      class="relative no-print"
      v-if="
        userRoles.isManager || userRoles?.isSuperAdmin || userRoles.isSuperAdmin
      "
    >
      <template #header>
        <h2 class="lg:text-[20px] text-[16px] font-[600] text-[#333333]">
          {{ t("evaluation.statistics.title") }}
        </h2>
      </template>

      <div class="relative">
        <swiper
          :modules="[Autoplay]"
          :space-between="12"
          :loop="true"
          :autoplay="{
            delay: 2000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }"
          :breakpoints="{
            0: { slidesPerView: 1 },
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1220: { slidesPerView: 4 },
            1440: { slidesPerView: 5 },
          }"
          class="statistics-swiper w-full"
          :dir="lang == 'ar' ? 'rtl' : 'ltr'"
          :key="lang"
        >
          <swiper-slide>
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px] w-full"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="total_evaluations" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                  t("evaluation.statistics.total")
                }}</span>
              </div>
              <span class="text-[#1F2A37] font-[600] text-[24px]">{{
                statistics?.total
              }}</span>
            </Card>
          </swiper-slide>

          <swiper-slide>
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px] w-full"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="drafted_evaluations" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                  t("evaluation.statistics.draft")
                }}</span>
              </div>
              <span class="text-[#1F2A37] font-[600] text-[24px]">{{
                statistics?.draft
              }}</span>
            </Card>
          </swiper-slide>

          <swiper-slide>
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px] w-full"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="accepted_evaluations" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                  t("evaluation.statistics.accept")
                }}</span>
              </div>
              <span class="text-[#1F2A37] font-[600] text-[24px]">{{
                statistics?.accepted
              }}</span>
            </Card>
          </swiper-slide>

          <swiper-slide>
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px] w-full"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="rejected_evaluations" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                  t("evaluation.statistics.refused")
                }}</span>
              </div>
              <span class="text-[#1F2A37] font-[600] text-[24px]">{{
                statistics?.rejected
              }}</span>
            </Card>
          </swiper-slide>

          <swiper-slide>
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px] w-full"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="pending_evaluations" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                  t("evaluation.statistics.pending")
                }}</span>
              </div>
              <span class="text-[#1F2A37] font-[600] text-[24px]">{{
                statistics?.pending
              }}</span>
            </Card>
          </swiper-slide>
        </swiper>
      </div>
    </Card>

    <!-- Search Filtering -->
    <Card class="no-print">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("evaluation.search.title") }}
        </h2>
      </template>

      <div class="grid xl:grid-cols-4 md:grid-cols-3 gap-4 items-end">
        <!-- Manager: search charters + employee name + charter type + charter status + last edit date (Image 1) -->
        <template
          v-if="
            userRoles.isManager ||
            userRoles?.isSuperAdmin ||
            userRoles.isSuperAdmin
          "
        >
          <Input
            v-model="searchFilters.search"
            :placeholder="t('evaluation.search.placeholder')"
            :label="t('evaluation.search.charters')"
            size="md"
          >
            <template #suffix>
              <Icon name="magnifyingGlass" size="lg" class="text-[#0E5F4A]" />
            </template>
          </Input>

          <Input
            v-if="userRoles?.isManager || userRoles?.isSuperAdmin"
            v-model="searchFilters.employee"
            :placeholder="t('evaluation.search.employee')"
            :label="t('evaluation.search.employee')"
            size="md"
          >
            <template #suffix>
              <Icon name="magnifyingGlass" size="lg" class="text-[#0E5F4A]" />
            </template>
          </Input>

          <Select
            v-model="searchFilters.type"
            :options="typeOptions"
            :label="t('evaluation.search.charter_type')"
            :placeholder="t('evaluation.search.charter_type')"
            searchable
            size="md"
          />

          <Select
            v-model="searchFilters.status"
            :options="statusOptions"
            :placeholder="t('evaluation.search.charter_status')"
            :label="t('evaluation.search.charter_status')"
            size="md"
          />

          <Input
            v-model="searchFilters.last_edit_date"
            :label="t('evaluation.search.charter_date')"
            size="md"
            type="date"
          >
            <template #suffix>
              <Icon name="calendar" size="lg" class="text-[#0E5F4A]" />
            </template>
          </Input>

          <Select
            v-model="searchFilters.year"
            :options="years"
            :label="t('evaluation.search.year')"
            :placeholder="t('evaluation.search.year')"
            :clearable="false"
            size="md"
          />
        </template>

        <!-- HR/Admin/SuperAdmin: search charters + employee name + charter type + charter status (Image 2) -->
        <template v-else-if="!userRoles.isEmployee">
          <Input
            v-model="searchFilters.search"
            :placeholder="t('evaluation.search.placeholder')"
            :label="t('evaluation.search.charters')"
            size="md"
          >
            <template #suffix>
              <Icon name="magnifyingGlass" size="lg" class="text-[#0E5F4A]" />
            </template>
          </Input>

          <Input
            v-model="searchFilters.employee"
            :placeholder="t('evaluation.search.employee')"
            :label="t('evaluation.search.employee')"
            size="md"
          >
            <template #suffix>
              <Icon name="magnifyingGlass" size="lg" class="text-[#0E5F4A]" />
            </template>
          </Input>

          <Select
            v-model="searchFilters.type"
            :options="typeOptions"
            :label="t('evaluation.search.charter_type')"
            :placeholder="t('evaluation.search.charter_type')"
            searchable
            size="md"
          />

          <Select
            v-model="searchFilters.status"
            :options="statusOptions"
            :placeholder="t('evaluation.search.charter_status')"
            :label="t('evaluation.search.charter_status')"
            size="md"
          />

          <Select
            v-model="searchFilters.year"
            :options="years"
            :label="t('evaluation.search.year')"
            :placeholder="t('evaluation.search.year')"
            :clearable="false"
            size="md"
          />
        </template>

        <!-- Employee: year + status (Image 3) -->
        <template v-else>
          <Select
            v-model="searchFilters.year"
            :options="years"
            :label="t('evaluation.search.year')"
            :placeholder="t('evaluation.search.year')"
            :clearable="false"
            size="md"
          />

          <Select
            v-model="searchFilters.status"
            :options="statusOptions"
            :placeholder="t('evaluation.search.charter_status')"
            :label="t('evaluation.search.charter_status')"
            size="md"
          />
        </template>
      </div>

      <div class="flex gap-2 mt-5 justify-end">
        <Button variant="ghost" class="md:w-26" size="md" @click="resetFilters">
          {{ t("common.reset") }}
        </Button>
        <Button
          variant="primary"
          class="md:w-26"
          size="md"
          @click="applyFilters"
        >
          {{ t("common.search") }}
        </Button>
      </div>
    </Card>

    <!-- Charters List -->
    <div id="print-area">
      <Card class="print:!border-none print:!shadow-none no-print">
        <template #header>
          <h2 class="text-[16px] font-[600] text-[#333333] no-print">
            {{ t("sidebar.performanceEvaluation") }}
          </h2>
        </template>

        <Table
          :loading="loading"
          :items="charters"
          :headers="tableHeaders"
          :page="page"
          :total-pages="totalPages"
          :loading-text="t('common.loading')"
          :empty-text="t('evaluation.empty')"
          @change-page="changePage"
        >
          <!-- Sortable Headers -->
          <template
            v-for="header in tableHeaders.filter((h) => h.sortable)"
            :key="header.key"
            #[`header-${header.key}`]
          >
            <div
              class="flex items-center gap-2 select-none justify-between cursor-pointer"
              @click="handleSort(header.key)"
            >
              {{ header.label }}
              <SvgIcon
                name="sort"
                classes="w-4 h-4 transition-colors"
                :class="
                  appliedFilters.sort_by === header.key
                    ? 'text-primary'
                    : 'text-gray-400'
                "
              />
            </div>
          </template>

          <!-- Header Checkbox -->
          <template #header-index>
            <input
              type="checkbox"
              :checked="isAllSelected"
              :indeterminate.prop="isIndeterminate"
              @change="toggleSelectAll"
              class="w-4 h-4 cursor-pointer"
            />
          </template>

          <!-- Row Checkbox -->
          <template #cell-index="{ item }">
            <input
              type="checkbox"
              :value="item.id"
              v-model="selectedIds"
              class="w-4 h-4 cursor-pointer"
            />
          </template>

          <!-- Employee -->
          <template #cell-employee="{ item }">
            {{ item.employee?.name || "--" }}
          </template>

          <!-- Job Title -->
          <template #cell-jobTitle="{ item }">
            {{ item.employee?.job_title || "--" }}
          </template>

          <!-- Last Edit Date (Manager only) -->
          <template #cell-last_edit_date="{ item }">
            {{ formatDate(item.last_edit_date) || "--" }}
          </template>

          <!-- Year (Employee only) -->
          <template #cell-year="{ item }">
            {{ item.year || "--" }}
          </template>

          <!-- Type -->
          <template #cell-type="{ item }">
            <span
              class="text-[14px] font-[500] text-[#0E5F4A] bg-[#82aba040] rounded-full h-[fit-content] py-[2px] px-[8px] border border-[#E7EFED/5]"
            >
              {{ item.type_name || "--" }}
            </span>
          </template>

          <!-- Status -->
          <template #cell-status="{ item }">
            <span
              class="inline-flex items-center gap-1.5 text-[14px] font-[500] px-3 py-0.5 rounded-full flex-shrink-0"
              :class="{
                'bg-[#ECFDF3] text-[#065F46]': item.status === 'accepted',
                'bg-[#E5E7EB] text-[#1F2A37]': item.status === 'draft',
                'bg-[#FFFAEB] text-[#93370D]':
                  item.status === 'pending_employee' ||
                  item.status === 'pending_higher_admin' ||
                  item.status == 'pending_hr' ||
                  item.status == 'pending_admin',
                'bg-[#FEE2E2] text-[#B91C1C]': item.status === 'rejected',
              }"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-[#065F46]': item.status === 'accepted',
                  'bg-[#4D5761]': item.status === 'draft',
                  'bg-[#93370D]':
                    item.status === 'pending_employee' ||
                    item.status === 'pending_higher_admin' ||
                    item.status == 'pending_hr' ||
                    item.status == 'pending_admin',
                  'bg-[#B91C1C]': item.status === 'rejected',
                }"
              />
              {{ item.status_name }}
            </span>
          </template>

          <!-- Actions -->
          <template #cell-actions="{ item }">
            <div class="flex items-center gap-2">
              <!-- View -->
              <button
                class="hover:opacity-75 transition-opacity cursor-pointer text-[#6C737F]"
                @click="goToView(item)"
                v-tooltip="{
                  title: t('common.actionTooltips.view.title', {
                    target: t('evaluation.entityName'),
                  }),
                  content: t('common.actionTooltips.view.content', {
                    target: t('evaluation.entityName'),
                    name: item.employee?.name,
                  }),
                }"
              >
                <SvgIcon name="eye" />
              </button>

              <!-- Evaluate (Manager only, draft status) -->
              <button
                v-if="
                  isCurrentYearSelected &&
                  (userRoles.isManager ||
                    userRoles?.isSuperAdmin ||
                    userRoles.isSuperAdmin) &&
                  item.status === 'draft'
                "
                class="hover:opacity-75 transition-opacity cursor-pointer text-[#6C737F]"
                @click="goToEvaluate(item)"
                v-tooltip="{
                  title: t('common.actionTooltips.evaluate.title', {
                    target: t('evaluation.evaluationName'),
                  }),
                  content: t('common.actionTooltips.evaluate.content', {
                    target: t('evaluation.evaluationName'),
                    name: item.employee?.name,
                  }),
                }"
              >
                <SvgIcon name="evaluate" />
              </button>

              <!-- EXPORT: Show inline if old year OR for roles that don't have it in dropdown -->
              <button
                v-if="
                  !isCurrentYearSelected ||
                  !userRoles.isManager ||
                  userRoles?.isSuperAdmin
                "
                class="hover:opacity-75 transition-opacity cursor-pointer text-[#6C737F]"
                @click="exportToExcel([item])"
                v-tooltip="{
                  title: t('evaluation.export.title', {
                    target: t('evaluation.entityName'),
                  }),
                  content: t('evaluation.export.content', {
                    target: t('evaluation.entityName'),
                    name: item.employee?.name,
                  }),
                }"
              >
                <SvgIcon name="export" />
              </button>

              <!-- v-if="hasAnyAction(item)" -->
              <Menu
                v-slot="{ open }"
                as="div"
                class="relative inline-block text-left"
              >
                <MenuButton
                  v-if="
                    item?.can_accept ||
                    item?.can_reject ||
                    item?.can_evaluate ||
                    item?.can_send ||
                    item?.can_edit
                  "
                  @click="setDropdownPosition"
                  class="flex items-center text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                >
                  <SvgIcon name="dots" />
                </MenuButton>

                <Teleport to="body">
                  <transition
                    enter-active-class="transition duration-100 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-75 ease-in"
                    leave-from-class="transform scale-100 opacity-100"
                    leave-to-class="transform scale-95 opacity-0"
                  >
                    <MenuItems
                      v-show="open"
                      static
                      :style="dropdownStyle"
                      class="absolute w-[160px] rounded-[4px] bg-white shadow-lg z-[9999] p-1 border border-gray-100"
                    >
                      <MenuItem
                        v-if="userRoles.isManager || userRoles?.isSuperAdmin"
                      >
                        <button
                          @click="exportToExcel([item])"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
                        >
                          {{ t("common.export") }}
                        </button>
                      </MenuItem>
                      <MenuItem v-if="item.can_send">
                        <button
                          @click="handleSendEvaluation(item)"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
                        >
                          {{ t("evaluation.modals.send") }}
                        </button>
                      </MenuItem>

                      <MenuItem v-if="item?.can_edit">
                        <button
                          @click="goToEdit(item)"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
                        >
                          <span class="ml-2">{{ t("common.edit") }}</span>
                        </button>
                      </MenuItem>

                      <!-- Accept/Reject for non-employees -->
                      <MenuItem v-if="item?.can_accept">
                        <button
                          @click="handleAcceptEvaluation(item)"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
                        >
                          {{ t("evaluation.modals.accept") }}
                        </button>
                      </MenuItem>
                      <MenuItem v-if="item?.can_reject">
                        <button
                          @click="handleRejectEvaluation(item)"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
                        >
                          {{ t("evaluation.modals.reject") }}
                        </button>
                      </MenuItem>
                    </MenuItems>
                  </transition>
                </Teleport>
              </Menu>
            </div>
          </template>
        </Table>

        <!-- Bulk Actions Footer -->
        <div class="flex gap-2 mt-5 justify-end" v-if="selectedIds.length > 0">
          <!-- Manager: bulk Send -->
          <template
            v-if="
              userRoles.isManager ||
              userRoles?.isSuperAdmin ||
              userRoles.isSuperAdmin
            "
          >
            <Button
              v-if="isCurrentYearSelected"
              variant="primary"
              size="md"
              @click="bulkSendEvaluations"
            >
              {{ t("evaluation.modals.send") }} ({{ selectedIds.length }})
            </Button>
          </template>

          <!-- HR/Admin/Employee: bulk Accept + Reject -->
          <template v-else>
            <Button
              v-if="isCurrentYearSelected"
              variant="primary"
              size="md"
              @click="handleBulkAccept"
            >
              {{ t("evaluation.modals.accept") }} ({{ selectedIds.length }})
            </Button>
            <Button
              v-if="isCurrentYearSelected"
              variant="danger"
              class="!bg-[#FEE4E2AB] border-2 !border-[#D92D20] !text-[#D92D20] hover:!bg-[#FEE4E2] hover:!border-[#B42318] hover:!text-[#B42318] transition-colors duration-200"
              size="md"
              @click="handleRejectAllSelected"
            >
              {{ t("evaluation.modals.reject") }} ({{ selectedIds.length }})
            </Button>
          </template>
        </div>
      </Card>
    </div>
    <!-- Reject Modal -->
    <Modal
      v-model="showRejectModal"
      :title="t('evaluation.modals.rejectTitle')"
      type="danger"
      width="md"
    >
      <div class="space-y-4 pt-4">
        <Textarea
          v-model="rejectReason"
          :placeholder="t('evaluation.modals.rejectReasonPlaceholder')"
          :label="t('evaluation.modals.rejectReason')"
          rows="4"
          required
        />
      </div>
      <template #footer>
        <div class="flex gap-2">
          <Button variant="ghost" @click="showRejectModal = false">
            {{ t("common.cancel") }}
          </Button>
          <Button
            variant="danger"
            :loading="submittingReject"
            :disabled="!rejectReason || rejectReason.trim().length < 3"
            @click="confirmReject"
          >
            {{ t("common.save") }}
          </Button>
        </div>
      </template>
    </Modal>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import Card from "@/components/ui/Card.vue";
import Table from "@/components/ui/Table.vue";
import Button from "@/components/ui/Button.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import Icon from "@/components/ui/Icon.vue";
import { useAppToast } from "@/composables/useAppToast";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import Textarea from "@/components/ui/Textarea.vue";
import Modal from "@/components/ui/Modal.vue";
import * as XLSX from "xlsx";
import evaluationService from "@/services/evaluation";
import { useEvaluationScoring } from "@/composables/useEvaluationScoring";

const {
  processTargets,
  processCompetencies,
  getAverage,
  getOverallScore,
  isSupervisoryEval,
} = useEvaluationScoring();

const toast = useAppToast();
const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const lang = computed(() => locale.value);
const isEn = computed(() => route.path.startsWith("/en"));

const charters = ref([]);
const statistics = ref([]);
const loading = ref(true);
const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const user = ref(null);

// =============> ACTIONS STATE
const showRejectModal = ref(false);
const rejectReason = ref("");
const selectedCharter = ref(null);
const submittingReject = ref(false);

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

  return { isAdmin, isHR, isManager, isSuperAdmin, isEmployee };
});

// =============> SELECTED IDS
const selectedIds = ref([]);

const currentYear = new Date().getFullYear();
const searchFilters = ref({
  search: "",
  employee: "",
  status: "",
  type: "",
  year: currentYear.toString(),
  last_edit_date: "",
  sort_by: "last_edit_date",
  sort_direction: "desc",
});

const appliedFilters = ref({ ...searchFilters.value });

// Removed automatic watch on year filter as per user request
const hasAnyAction = (item) => {
  if (!isCurrentYearSelected.value) return false;

  // Non-employee actions (Manager, Admin, HR, SuperAdmin)
  if (!userRoles.value.isEmployee) {
    if (userRoles.value.isManager) return true; // Always has Export
    if (item.status === "draft") return true; // Send
    if (!["accepted", "rejected", "draft"].includes(item.status)) return true; // Accept/Reject
  } else {
    // Employee actions: Accept/Reject
    if (!["accepted", "rejected"].includes(item.status)) return true;
  }
  return false;
};

const isCurrentYearSelected = computed(
  () => Number(appliedFilters.value.year) === currentYear,
);

const years = computed(() => {
  const startYear = 2024;
  const yearsArr = [];
  for (let y = currentYear; y >= startYear; y--) {
    yearsArr.push({ label: y.toString(), value: y.toString() });
  }
  return yearsArr;
});

// =============> TABLE HEADERS per role
// Image 1 (Manager): checkbox | employee | job title | last_edit_date | type | status | actions
// Image 2 (HR/Admin): checkbox | employee | job title | type | status | actions  (no last_edit_date)
// Image 3 (Employee): checkbox | year | status | actions
const tableHeaders = computed(() => {
  if (userRoles.isEmployee) {
    return [
      { key: "index", label: "", sortable: false },
      {
        key: "year",
        label: t("evaluation.chartersList.year"),
        sortable: true,
      },
      {
        key: "status",
        label: t("evaluation.chartersList.charter_status"),
        sortable: true,
      },
      {
        key: "actions",
        label: t("evaluation.chartersList.actions"),
        sortable: false,
      },
    ];
  }

  const base = [
    { key: "index", label: "", sortable: false },
    {
      key: "employee",
      label: t("evaluation.chartersList.employee"),
      sortable: true,
    },
    {
      key: "jobTitle",
      label: t("evaluation.chartersList.job_title"),
      sortable: true,
    },
  ];

  // Manager gets last_edit_date column
  if (userRoles.value.isManager || userRoles.value.isSuperAdmin) {
    base.push({
      key: "last_edit_date",
      label: t("evaluation.chartersList.last_edit_date"),
      sortable: true,
    });
  }

  base.push(
    {
      key: "type",
      label: t("evaluation.chartersList.charter_type"),
      sortable: true,
    },
    {
      key: "status",
      label: t("evaluation.chartersList.charter_status"),
      sortable: true,
    },
    {
      key: "actions",
      label: t("evaluation.chartersList.actions"),
      sortable: false,
    },
  );

  return base;
});

// =============> SORTING
const handleSort = (key) => {
  if (key === "index" || key === "actions") return;

  const sortFieldMap = {
    employee: "employee_name",
    jobTitle: "job_title",
    last_edit_date: "last_edit_date",
    type: "type",
    status: "status",
    year: "year",
  };

  const apiKey = sortFieldMap[key];
  if (!apiKey) return;

  if (appliedFilters.value.sort_by === apiKey) {
    appliedFilters.value.sort_direction =
      appliedFilters.value.sort_direction === "asc" ? "desc" : "asc";
  } else {
    appliedFilters.value.sort_by = apiKey;
    appliedFilters.value.sort_direction = "asc";
  }

  // Sync searchFilters
  searchFilters.value.sort_by = appliedFilters.value.sort_by;
  searchFilters.value.sort_direction = appliedFilters.value.sort_direction;

  applyFilters();
};

// =============> SELECT ALL
const isAllSelected = computed(
  () =>
    charters.value.length > 0 &&
    charters.value.every((item) => selectedIds.value.includes(item.id)),
);

const isIndeterminate = computed(
  () => selectedIds.value.length > 0 && !isAllSelected.value,
);

const toggleSelectAll = (e) => {
  selectedIds.value = e.target.checked
    ? charters.value.map((item) => item.id)
    : [];
};

// =============> FILTER OPTIONS
const typeOptions = ref([
  { label: t("evaluation.types.standard"), value: "standard" },
  { label: t("evaluation.types.managerial"), value: "managerial" },
]);

const statusOptions = ref([
  { label: t("evaluation.statusOptions.draft"), value: "draft" },
  {
    label: t("evaluation.statusOptions.pending_employee"),
    value: "pending_employee",
  },
  {
    label: t("evaluation.statusOptions.pending_admin"),
    value: "pending_admin",
  },
  { label: t("evaluation.statusOptions.accepted"), value: "accepted" },
  { label: t("evaluation.statusOptions.rejected"), value: "rejected" },
  // { label: t("evaluation.statusOptions.archived"), value: "archived" },
]);

const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

// =============> DATE FORMAT
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

// =============> DROPDOWN POSITIONING
const dropdownStyle = ref({ top: "0px", left: "0px" });

const setDropdownPosition = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  dropdownStyle.value = {
    top: rect.bottom + window.scrollY + "px",
    left: rect.left + window.scrollX + "px",
  };
};

// =============> LOAD DATA
const loadPerformanceEvaluations = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      sort_by: appliedFilters.value.sort_by,
      sort_direction: appliedFilters.value.sort_direction,
    };

    if (appliedFilters.value.search)
      params.search = appliedFilters.value.search;
    if (appliedFilters.value.employee)
      params.employee = appliedFilters.value.employee;
    if (appliedFilters.value.status)
      params.status = appliedFilters.value.status;
    if (appliedFilters.value.type) params.type = appliedFilters.value.type;
    if (appliedFilters.value.year) params.year = appliedFilters.value.year;
    if (appliedFilters.value.last_edit_date)
      params.last_edit_date = appliedFilters.value.last_edit_date;

    const response = await evaluationService.list(params);

    if (Array.isArray(response.data)) {
      charters.value = response.data;
      total.value = response.meta?.total || response.data.length;
    } else if (response.data?.data) {
      charters.value = response.data.data;
      total.value = response.data.meta?.total || response.data.data.length;
    } else {
      charters.value = [];
      total.value = 0;
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  appliedFilters.value = { ...searchFilters.value };
  page.value = 1;
  loadPerformanceEvaluations();
};

const resetFilters = () => {
  searchFilters.value = {
    search: "",
    employee: "",
    status: "",
    type: "",
    year: currentYear.toString(),
    last_edit_date: "",
    sort_by: "last_edit_date",
    sort_direction: "desc",
  };
  applyFilters();
};

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  loadPerformanceEvaluations();
};

// =============> ACTIONS
const handleSendEvaluation = async (item) => {
  try {
    const response = await evaluationService.handleSendEvaluation(item.id);
    if (response) {
      toast.success(t("evaluation.messages.sent"));
      await loadPerformanceEvaluations();
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const handleAcceptEvaluation = async (item) => {
  try {
    const response = await evaluationService.handleAcceptEvaluation(item.id);
    if (response) {
      toast.success(t("evaluation.messages.accepted"));
      await loadPerformanceEvaluations();
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const handleRejectEvaluation = (item) => {
  selectedCharter.value = item;
  rejectReason.value = "";
  showRejectModal.value = true;
};

const confirmReject = async () => {
  if (!selectedCharter.value || !rejectReason.value.trim()) return;

  submittingReject.value = true;
  try {
    const response = await evaluationService.handleRejectEvaluation(
      selectedCharter.value.id,
      rejectReason.value,
    );
    if (response) {
      toast.success(t("evaluation.messages.rejected"));
      showRejectModal.value = false;
      await loadPerformanceEvaluations();
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    submittingReject.value = false;
  }
};

const bulkSendEvaluations = async () => {
  try {
    const response = await evaluationService.bulkSendEvaluations(
      selectedIds.value,
    );
    if (response) {
      toast.success(t("evaluation.messages.sentAll"));
      selectedIds.value = [];
      await loadPerformanceEvaluations();
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

// BULK ACCEPT SELECTED
const handleBulkAccept = async () => {
  try {
    const response = await evaluationService.bulkAcceptEvaluations(
      selectedIds.value,
    );
    if (response) {
      toast.success(t("evaluation.messages.acceptAll"));
      selectedIds.value = [];
      await loadPerformanceEvaluations();
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

// BULK REJECT SELECTED
const handleRejectAllSelected = async () => {
  try {
    const response = await evaluationService.bulkRejectEvaluations(
      selectedIds.value,
    );
    if (response) {
      toast.success(t("evaluation.messages.rejectAll"));
      selectedIds.value = [];
      await loadPerformanceEvaluations();
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const calculateResult = (actual, expected) => {
  if (!expected || expected === 0) return 1;

  const ratio = actual / expected;

  if (ratio > 1) return 5;
  if (ratio >= 0.9) return 4;
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.6) return 2;

  return 1;
};

const exportToExcel = async (items = []) => {
  try {
    const dataToExport =
      selectedIds.value.length > 0
        ? charters.value.filter((item) => selectedIds.value.includes(item.id))
        : items;

    if (!dataToExport.length) {
      toast.warning(t("common.noDataToExport") || "No data to export");
      return;
    }

    const wb = XLSX.utils.book_new();

    const safeName = (name = "report") =>
      name
        .toString()
        .trim()
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, "_");

    const {
      processTargets,
      getAverage,
      getCompetenciesAverage, // use this instead of getAverage(processedComps)
      getOverallScore,
      isSupervisoryEval,
      calculateResult,
    } = useEvaluationScoring();

    for (const item of dataToExport) {
      try {
        const res = await evaluationService.getById(item.id);
        const evalData = res.data;

        if (!evalData) continue;

        const isSupervisory = isSupervisoryEval(evalData);

        // Initialize ratings exactly like the view page does
        if (evalData.competencies) {
          evalData.competencies.forEach((comp) => {
            const descCount =
              comp.performance_charter_item?.competency_descriptions?.length ||
              0;
            if (!comp.ratings || comp.ratings.length !== descCount) {
              comp.ratings = new Array(descCount).fill(
                comp.actual_result || null,
              );
            }
          });
        }

        const wsData = [];

        // =========================
        // PROCESS TARGETS
        // =========================
        const processedTargets = processTargets(evalData.targets || []);
        const totalTargets = getAverage(processedTargets);

        // Use flat per-description average — matches the UI's totalCompetenciesScore
        const totalComps = getCompetenciesAverage(evalData, isSupervisory);

        const overall = getOverallScore(totalTargets, totalComps);

        // =========================
        // TITLE
        // =========================
        wsData.push(["Employee Evaluation Report"], []);

        // =========================
        // HEADER INFO
        // =========================
        wsData.push(
          ["Employee", evalData.employee?.name || "--"],
          ["Job Title", evalData.employee?.job_title || "--"],
          ["Employee Number", evalData.employee?.employee_number || "--"],
          ["Agency", evalData.agency?.name || "--"],
          ["Department", evalData.department?.name || "--"],
          [],
        );

        // =========================
        // TARGETS
        // =========================
        wsData.push(["Targets"]);
        wsData.push([
          "#",
          "Target",
          "Measurement",
          "Weight",
          "Expected",
          "Actual",
          "Difference",
          "Score",
        ]);

        processedTargets.forEach((t, i) => {
          wsData.push([
            i + 1,
            t.performance_charter_item?.name || "--",
            t.performance_charter_item?.measurement_standard || "--",
            `${t.performance_charter_item?.weight || 0}%`,
            t.expected_result ?? "--",
            t.actual_result ?? "--",
            // Match the UI: actual/expected ratio, not subtraction
            t.expected_result
              ? (
                  (Number(t.actual_result) || 0) /
                  (Number(t.expected_result) || 1)
                ).toFixed(2)
              : "--",
            t.score,
          ]);
        });

        wsData.push([], ["Total Targets Score", totalTargets.toFixed(2)], []);

        // =========================
        // COMPETENCIES
        // One row per description, exactly like the UI template
        // =========================
        wsData.push(["Competencies"]);

        // Headers — conditionally include "Score" column for supervisory (matches UI)
        const compHeaders = [
          "#",
          "Competency",
          "Weight",
          "Description",
          "Actual Level",
          "Target Level",
        ];
        if (isSupervisory) compHeaders.push("Score");
        wsData.push(compHeaders);

        evalData.competencies?.forEach((comp, cIdx) => {
          const descriptions =
            comp.performance_charter_item?.competency_descriptions || [];

          if (!descriptions.length) {
            // Fallback: no descriptions
            const row = [
              cIdx + 1,
              comp.performance_charter_item?.name || "--",
              `${comp.performance_charter_item?.weight || 0}%`,
              "--",
              comp.actual_result ?? "--",
              "--",
            ];
            if (isSupervisory) row.push("--");
            wsData.push(row);
          } else {
            descriptions.forEach((desc, dIdx) => {
              const rating =
                (comp.ratings && comp.ratings[dIdx]) ||
                comp.actual_result ||
                "--";

              // Matches UI: actual level shown, desc.level as target
              const row = [
                dIdx === 0 ? cIdx + 1 : "", // # only on first description row (like rowspan)
                dIdx === 0 ? comp.performance_charter_item?.name || "--" : "", // name only on first
                dIdx === 0
                  ? `${comp.performance_charter_item?.weight || 0}%`
                  : "", // weight only on first
                typeof desc === "string" ? desc : desc?.description || "--",
                rating,
                desc?.level ?? "--",
              ];

              if (isSupervisory) {
                // Matches UI: calculateResult(comp.ratings[dIdx], desc?.level)
                const scoreVal =
                  rating !== "--" ? calculateResult(rating, desc?.level) : "--";
                row.push(scoreVal);
              }

              wsData.push(row);
            });
          }
        });

        wsData.push(
          [],
          ["Total Competencies Score", totalComps.toFixed(2)],
          [],
        );

        // =========================
        // OVERALL
        // =========================
        wsData.push(["Overall Score", overall.toFixed(2)], []);

        // =========================
        // SIGNATURES
        // =========================
        wsData.push(
          ["Signatures"],
          ["Employee", evalData.employee_signature || "--"],
          ["Manager", evalData.manager_signature || "--"],
          ["HR", evalData.hr_signature || "--"],
          ["Higher Admin", evalData.higher_admin_signature || "--"],
        );

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // =========================
        // STYLING
        // =========================
        const range = XLSX.utils.decode_range(ws["!ref"]);

        for (let R = range.s.r; R <= range.e.r; R++) {
          for (let C = range.s.c; C <= range.e.c; C++) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellRef]) continue;

            ws[cellRef].s = {
              border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" },
              },
            };
          }
        }

        // Auto column widths with a minimum of 10
        ws["!cols"] = Array.from({ length: range.e.c + 1 }, (_, colIdx) => ({
          wch: Math.max(
            10,
            ...wsData.map((row) =>
              row[colIdx] != null ? row[colIdx].toString().length : 0,
            ),
          ),
        }));

        const fileName =
          dataToExport.length === 1
            ? `evaluation_${safeName(evalData.employee?.name || "employee")}`
            : `evaluations_${dataToExport.length}_employees`;

        XLSX.utils.book_append_sheet(
          wb,
          ws,
          `Eval-${evalData.employee?.name?.slice(0, 10) || item.id}`,
        );

        XLSX.writeFile(wb, `${fileName}_${Date.now()}.xlsx`);
      } catch (err) {
        console.error("Export error for item:", item.id, err);
        toast.error(`Export failed for ${item.id}`);
      }
    }
  } catch (err) {
    console.error(err);
    toast.error("Export failed");
  }
};

// const exportToExcel = async (items = []) => {
//   try {
//     const dataToExport =
//       selectedIds.value.length > 0
//         ? charters.value.filter((item) => selectedIds.value.includes(item.id))
//         : items;

//     if (!dataToExport.length) {
//       toast.warning(t("common.noDataToExport") || "No data to export");
//       return;
//     }

//     const wb = XLSX.utils.book_new();

//     const safeName = (name = "report") =>
//       name
//         .toString()
//         .trim()
//         .replace(/[\\/:*?"<>|]/g, "")
//         .replace(/\s+/g, "_");

//     // Shared scoring logic
//     const {
//       processTargets,
//       processCompetencies,
//       getAverage,
//       getOverallScore,
//       isSupervisoryEval,
//     } = useEvaluationScoring();

//     for (const item of dataToExport) {
//       try {
//         const res = await evaluationService.getById(item.id);
//         const evalData = res.data;

//         if (!evalData) continue;

//         const isSupervisory = isSupervisoryEval(evalData);

//         const wsData = [];

//         // =========================
//         // PROCESS DATA (SAME AS UI)
//         // =========================
//         const processedTargets = processTargets(evalData.targets || []);

//         const processedComps = processCompetencies(
//           evalData.competencies || [],
//           isSupervisory,
//         );

//         const totalTargets = getAverage(processedTargets);
//         const totalComps = getAverage(processedComps);
//         const overall = getOverallScore(totalTargets, totalComps);

//         // =========================
//         // TITLE
//         // =========================
//         wsData.push(["Employee Evaluation Report"], []);

//         // =========================
//         // HEADER INFO
//         // =========================
//         wsData.push(
//           ["Employee", evalData.employee?.name || "--"],
//           ["Job Title", evalData.employee?.job_title || "--"],
//           ["Employee Number", evalData.employee?.employee_number || "--"],
//           ["Agency", evalData.agency?.name || "--"],
//           ["Department", evalData.department?.name || "--"],
//           [],
//         );

//         // =========================
//         // TARGETS
//         // =========================
//         wsData.push(["Targets"]);
//         wsData.push([
//           "#",
//           "Target",
//           "Measurement",
//           "Weight",
//           "Expected",
//           "Actual",
//           "Difference",
//           "Score",
//         ]);

//         processedTargets.forEach((t, i) => {
//           wsData.push([
//             i + 1,
//             t.performance_charter_item?.name || "--",
//             t.performance_charter_item?.measurement_standard || "--",
//             `${t.performance_charter_item?.weight || 0}%`,
//             t.expected_result ?? "--",
//             t.actual_result ?? "--",
//             t.difference,
//             t.score,
//           ]);
//         });

//         wsData.push([], ["Total Targets Score", totalTargets.toFixed(2)], []);

//         // =========================
//         // COMPETENCIES
//         // =========================
//         wsData.push(["Competencies"]);
//         wsData.push([
//           "#",
//           "Competency",
//           "Weight",
//           "Description",
//           "Actual",
//           "Expected",
//           "Score",
//         ]);

//         processedComps.forEach((c, i) => {
//           const descriptions =
//             c.performance_charter_item?.competency_descriptions || [];

//           if (!descriptions.length) {
//             wsData.push([
//               i + 1,
//               c.performance_charter_item?.name || "--",
//               `${c.performance_charter_item?.weight || 0}%`,
//               "--",
//               c.actual_result ?? "--",
//               c.expected_result ?? "--",
//               c.score,
//             ]);
//           } else {
//             descriptions.forEach((desc) => {
//               wsData.push([
//                 i + 1,
//                 c.performance_charter_item?.name || "--",
//                 `${c.performance_charter_item?.weight || 0}%`,
//                 typeof desc === "string" ? desc : desc?.description || "--",
//                 c.actual_result ?? "--",
//                 c.expected_result ?? "--",
//                 c.score,
//               ]);
//             });
//           }
//         });

//         wsData.push(
//           [],
//           ["Total Competencies Score", totalComps.toFixed(2)],
//           [],
//         );

//         // =========================
//         // OVERALL
//         // =========================
//         wsData.push(["Overall Score", overall.toFixed(2)], []);

//         // =========================
//         // SIGNATURES
//         // =========================
//         wsData.push(
//           ["Signatures"],
//           ["Employee", evalData.employee_signature || "--"],
//           ["Manager", evalData.manager_signature || "--"],
//           ["HR", evalData.hr_signature || "--"],
//           ["Higher Admin", evalData.higher_admin_signature || "--"],
//         );

//         const ws = XLSX.utils.aoa_to_sheet(wsData);

//         // =========================
//         // BASIC STYLING
//         // =========================
//         const range = XLSX.utils.decode_range(ws["!ref"]);

//         for (let R = range.s.r; R <= range.e.r; R++) {
//           for (let C = range.s.c; C <= range.e.c; C++) {
//             const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
//             if (!ws[cellRef]) continue;

//             ws[cellRef].s = {
//               border: {
//                 top: { style: "thin" },
//                 bottom: { style: "thin" },
//                 left: { style: "thin" },
//                 right: { style: "thin" },
//               },
//             };
//           }
//         }

//         // Column widths
//         ws["!cols"] = wsData[0].map((_, i) => ({
//           wch: Math.max(
//             ...wsData.map((r) => (r[i] ? r[i].toString().length : 10)),
//           ),
//         }));

//         const fileName =
//           dataToExport.length === 1
//             ? `evaluation_${safeName(evalData.employee?.name || "employee")}`
//             : `evaluations_${dataToExport.length}_employees`;

//         XLSX.utils.book_append_sheet(
//           wb,
//           ws,
//           `Eval-${evalData.employee?.name?.slice(0, 10) || item.id}`,
//         );

//         XLSX.writeFile(wb, `${fileName}_${Date.now()}.xlsx`);
//       } catch (err) {
//         console.error("Export error:", err);
//       }
//     }
//   } catch (err) {
//     console.error(err);
//     toast.error("Export failed");
//   }
// };

// =============> NAVIGATION
const goToView = (item) => {
  const prefix = isEn.value ? "/en" : "";
  router.push(`${prefix}/performance/evaluation/${item.id}`);
};
const goToEdit = (item) => {
  const prefix = isEn.value ? "/en" : "";
  router.push(`${prefix}/performance/evaluation/${item.id}/edit`);
};
const goToEvaluate = (item) => {
  const prefix = isEn.value ? "/en" : "";
  router.push(`${prefix}/performance/evaluation/${item.id}/evaluate`);
};

// =============> MOUNT
onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("attendance.auth"))?.user;
  if (userRoles.value.isManager || userRoles.value.isSuperAdmin) {
    const response = await evaluationService.listStatistics();
    statistics.value = response?.data;
  }

  await loadPerformanceEvaluations();
});

watch(
  () => searchFilters.value.year,
  (val, oldVal) => {
    if (!val) {
      searchFilters.value.year = oldVal;
    }
  },
);
</script>

<style scoped>
.order-1 {
  order: 1;
}
.order-2 {
  order: 2;
}
@media (min-width: 1024px) {
  .lg\:order-1 {
    order: 1;
  }
  .lg\:order-2 {
    order: 2;
  }
}
</style>
