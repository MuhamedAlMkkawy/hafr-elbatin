<template>
  <section class="space-y-6">
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <h2 class="lg:text-[25px] text-[20px] font-[600]">
        {{ t("sidebar.performanceAppraisal") }}
      </h2>
    </div>

    <!-- Statistics Cards: Manager only (Image 1) -->
    <!-- <Card
      class="relative no-print"
      v-if=userRoles.isManager
    >
      <template #header>
        <h2 class="lg:text-[20px] text-[16px] font-[600] text-[#333333]">
          {{ t("appraisal.statistics.title") }}
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
            1024: { slidesPerView: 5 },
          }"
          class="statistics-swiper w-full"
          :dir="lang == 'ar' ? 'rtl' : 'ltr'"
          :key="lang"
        >
          <swiper-slide>
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="total_complaints" />
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
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="drafted_complaints" />
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
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="posted_complaints" />
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
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="expired_complaints" />
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
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="total_complaints" />
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
    </Card> -->

    <!-- Search Filtering -->
    <Card class="no-print">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("evaluation.search.title") }}
        </h2>
      </template>

      <div class="grid xl:grid-cols-4 md:grid-cols-3 gap-4 items-end">
        <!-- Manager: search charters + employee name + charter type + charter status + last edit date (Image 1) -->
        <template v-if="userRoles.isManager || userRoles.isSuperAdmin">
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
            v-if="userRoles?.isSuperAdmin"
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

          <!--          <Input
            v-model="searchFilters.last_edit_date"
            :label="t('evaluation.search.charter_date')"
            size="md"
            type="date"
          >
            <template #suffix>
              <Icon name="calendar" size="lg" class="text-[#0E5F4A]" />
            </template>
          </Input>
-->
          <Select
            v-model="searchFilters.year"
            :options="years"
            :label="t('evaluation.search.year')"
            :placeholder="t('evaluation.search.year')"
            :clearable="false"
            size="md"
          />
        </template>

        <!-- HR/Admin: search charters + employee name + charter type + charter status (Image 2) -->
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
        <Button variant="ghost" size="md" class="md:w-26" @click="resetFilters">
          {{ t("common.reset") }}
        </Button>
        <Button
          variant="primary"
          size="md"
          class="md:w-26"
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
            {{ t("sidebar.performanceAppraisal") }}
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

              <!-- Export icon (show inline if old year OR for roles that don't have it in dropdown) -->
              <button
                v-if="
                  !isCurrentYearSelected ||
                  !(userRoles.isManager || userRoles.isSuperAdmin)
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

              <!-- Evaluate (Manager only, draft status) -->
              <button
                v-if="item.can_evaluate"
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
                <SvgIcon name="evaluate" class="scale-[120%]" />
              </button>

              <!-- Evaluate (Manager only, draft status) -->
              <!-- <button
                v-if="userRoles.isManager && item.status == 'draft'"
                class="hover:opacity-75 transition-opacity cursor-pointer text-[#6C737F]"
                @click="goToEvaluate(item)"
                v-tooltip="{
                  title: t('common.actionTooltips.evaluate.title', {
                    target: t('evaluation.entityName'),
                  }),
                  content: t('common.actionTooltips.evaluate.content', {
                    target: t('evaluation.entityName'),
                    name: item.employee?.name,
                  }),
                }"
              >
                <SvgIcon name="evaluate" />
              </button> -->

              <Menu
                v-slot="{ open }"
                as="div"
                class="relative inline-block text-left"
              >
                <MenuButton
                  @click="setDropdownPosition"
                  v-if="
                    item?.can_accept ||
                    item?.can_reject ||
                    item?.can_evaluate ||
                    item?.can_send ||
                    item?.can_edit
                  "
                  class="flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
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
                      <!-- Export -->
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

                      <!-- Super Admin Evaluate -->
                      <MenuItem v-if="item?.can_evaluate">
                        <button
                          @click="goToEvaluate(item)"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
                        >
                          {{ t("evaluation.modals.evaluate") }}
                        </button>
                      </MenuItem>

                      <!-- EDIT -->
                      <MenuItem v-if="item?.can_edit">
                        <button
                          @click="goToEdit(item)"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
                        >
                          <span class="ml-2">{{ t("common.edit") }}</span>
                        </button>
                      </MenuItem>

                      <!-- Send -->
                      <MenuItem v-if="item?.can_send">
                        <button
                          @click="handleSendEvaluation(item)"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
                        >
                          {{ t("evaluation.modals.send") }}
                        </button>
                      </MenuItem>

                      <!-- Accept -->
                      <MenuItem v-if="item?.can_accept">
                        <button
                          @click="handleAcceptEvaluation(item)"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
                        >
                          {{ t("evaluation.modals.accept") }}
                        </button>
                      </MenuItem>

                      <!-- Reject -->
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
          <template v-if="userRoles.isManager">
            <Button
              v-if="isCurrentYearSelected"
              variant="primary"
              size="md"
              @click="bulkSendEvaluations"
              :disabled="!canBulkSend"
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
              :disabled="!canBulkAccept"
            >
              {{ t("evaluation.modals.accept") }} ({{ selectedIds.length }})
            </Button>
            <Button
              v-if="isCurrentYearSelected"
              variant="danger"
              class="!bg-[#FEE4E2AB] border-2 !border-[#D92D20] !text-[#D92D20] hover:!bg-[#FEE4E2] hover:!border-[#B42318] hover:!text-[#B42318] transition-colors duration-200"
              size="md"
              @click="handleRejectAllSelected"
              :disabled="!canBulkReject"
            >
              {{ t("evaluation.modals.reject") }} ({{ selectedIds.length }})
            </Button>
          </template>
        </div>
      </Card>
    </div>

    <!-- Rejection Modal -->
    <Modal
      v-model="isRejectModalOpen"
      :title="t('evaluation.modals.rejectTitle')"
      type="danger"
      width="md"
    >
      <div class="space-y-4 pt-4">
        <Textarea
          v-model="rejectionReason"
          :label="t('evaluation.modals.rejectReason')"
          :placeholder="t('evaluation.modals.rejectReasonPlaceholder')"
          rows="4"
          required
        />
      </div>
      <template #footer>
        <div class="flex gap-2">
          <Button variant="ghost" @click="closeRejectModal">
            {{ t("common.cancel") }}
          </Button>
          <Button
            variant="danger"
            :loading="isSubmittingRejection"
            :disabled="!rejectionReason || rejectionReason.trim().length < 3"
            @click="confirmRejection"
          >
            {{ t("common.confirm") }}
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
import * as XLSX from "xlsx";
import generalEvaluationService from "@/services/general-evaluation";
import Textarea from "@/components/ui/Textarea.vue";
import Modal from "@/components/ui/Modal.vue";

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

// =============> REJECTION MODAL STATE
const isRejectModalOpen = ref(false);
const rejectionReason = ref("");
const formToReject = ref(null); // Can be a single item or an array for bulk rejection
const isBulkRejection = ref(false);

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

const years = computed(() => {
  const startYear = 2024;
  const yearsArr = [];
  for (let y = currentYear; y >= startYear; y--) {
    yearsArr.push({ label: y.toString(), value: y.toString() });
  }
  return yearsArr;
});

const isCurrentYearSelected = computed(
  () => Number(appliedFilters.value.year) === currentYear,
);

// Removed automatic watch on year filter as per user request

const hasAnyAction = (item) => {
  if (!isCurrentYearSelected.value) return false;

  // Logic matches the internal MenuItems v-if conditions
  if (!userRoles.value.isEmployee) {
    // Actions: Export (if manager), Evaluate (if SuperAdmin & draft), Send (if draft), Accept/Reject (if pending)
    if (userRoles.value.isManager) return true;
    if (userRoles.value.isSuperAdmin && item.status === "draft") return true;
    if (item.status === "draft") return true;
    if (!["accepted", "rejected", "draft"].includes(item.status)) return true;
  } else {
    // Employee actions: Accept/Reject (if pending)
    if (!["accepted", "rejected"].includes(item.status)) return true;
  }
  return false;
};

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
  if (userRoles.value.isManager || userRoles.value.isAdmin) {
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

  // Sync searchFilters to match sorting if needed
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

// =============> BULK ACTION CHECKS
const canBulkSend = computed(() => {
  if (selectedIds.value.length === 0) return false;
  return selectedIds.value.every((id) => {
    const item = charters.value.find((c) => c.id === id);
    return item && item.status === "draft";
  });
});

const canBulkAccept = computed(() => {
  if (selectedIds.value.length === 0) return false;
  return selectedIds.value.every((id) => {
    const item = charters.value.find((c) => c.id === id);
    return item && !["accepted", "rejected"].includes(item.status);
  });
});

const canBulkReject = computed(() => canBulkAccept.value);

// =============> FILTER OPTIONS
const typeOptions = computed(() => [
  {
    label: t("evaluation.types.managerial"),
    value: "managerial",
  },
  {
    label: t("evaluation.types.standard"),
    value: "standard",
  },
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

    const response = await generalEvaluationService.list(params);

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
// HANDLE SEND SINGLE EVALUATION
const handleSendEvaluation = async (item) => {
  try {
    const response = await generalEvaluationService.handleSendEvaluation(
      item.id,
    );
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

// HANDLE ACCEPT SINGLE EVALUATION
const handleAcceptEvaluation = async (item) => {
  try {
    const response = await generalEvaluationService.handleAcceptEvaluation(
      item.id,
    );
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

// HANDLE REJECT SINGLE EVALUATION
const handleRejectEvaluation = (item) => {
  formToReject.value = item;
  isBulkRejection.value = false;
  rejectionReason.value = "";
  isRejectModalOpen.value = true;
};

// CONFIRM REJECTION (Single or Bulk)
const confirmRejection = async () => {
  if (!rejectionReason.value.trim()) {
    toast.warning(t("evaluation.messages.reasonRequired"));
    return;
  }

  loading.value = true;
  try {
    if (isBulkRejection.value) {
      const response = await generalEvaluationService.bulkRejectEvaluations(
        formToReject.value,
        rejectionReason.value,
      );
      if (response) {
        toast.success(t("evaluation.messages.rejectAll"));
        selectedIds.value = [];
      }
    } else {
      const response = await generalEvaluationService.handleRejectEvaluation(
        formToReject.value.id,
        rejectionReason.value,
      );
      if (response) {
        toast.success(t("evaluation.messages.rejected"));
        await loadPerformanceEvaluations();
      }
    }
    isRejectModalOpen.value = false;
    await loadPerformanceEvaluations();
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const closeRejectModal = () => {
  isRejectModalOpen.value = false;
  formToReject.value = null;
  rejectionReason.value = "";
};

// HANDLE SEND SELECTED EVALUATIONS
const bulkSendEvaluations = async () => {
  try {
    const response = await generalEvaluationService.bulkSendEvaluations(
      selectedIds.value,
    );
    if (response) {
      toast.success(t("evaluation.messages.sent"));
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
    const response = await generalEvaluationService.bulkAcceptEvaluations(
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
    const response = await generalEvaluationService.bulkRejectEvaluations(
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

    for (const item of dataToExport) {
      try {
        // =============> FETCH FULL DETAIL for this item
        const res = await generalEvaluationService.getById(item.id);
        const evalData = res?.data;

        if (!evalData) continue;

        // =============> EXTRACT ALL FIELDS (mirrors the detail page exactly)
        const emp = evalData.employee || {};

        const revisionType = evalData.revision_type || "--";
        const readiness = evalData.readiness_for_promotion || "--";
        const periodFrom = evalData.evaluation_start_date || "--";
        const periodTo = evalData.evaluation_end_date || "--";
        const evaluationDate = evalData.evaluation_date || "--";
        const managerNote = evalData.manager_note || "--";

        const ratingDetails = (evalData.rating_details || []).map((row) => ({
          rating: row.rating ?? "--",
          label: row.label || `Grade ${row.rating}`,
          grades: row.grades || "--",
          justification: row.justification || "--",
          supporting_document: row.supporting_document || "--",
        }));

        const strengths = evalData.strengths || [];
        const development = evalData.development_areas || [];
        const maxGapLength = Math.max(strengths.length, development.length, 1);

        const gapRows = Array.from({ length: maxGapLength }, (_, i) => ({
          strengths: strengths[i] || "--",
          development_areas: development[i] || "--",
        }));

        // =============> BUILD WORKSHEET ROWS (aoa = array of arrays)
        const wsData = [];

        // ----- TITLE -----
        wsData.push(
          [t("sidebar.performanceAppraisal") || "Performance Appraisal Report"],
          [],
        );

        // ----- EMPLOYEE INFO -----
        wsData.push(
          [t("performance.chartersList.employee"), emp.name || "--"],
          [t("performance.chartersList.job_title"), emp.rank || "--"],
          [t("performance.form.employee_number"), emp.employee_number || "--"],
          [
            t("performance.form.agency"),
            emp.organizational_unit?.[`name_${lang.value}`] ||
              emp.organizational_unit?.name ||
              "--",
          ],
          [
            t("performance.form.department"),
            emp.department?.[`name_${lang.value}`] ||
              emp.department?.name ||
              "--",
          ],
          [t("performance.form.assessor"), emp.manager?.name || "--"],
          [],
        );

        // ----- EVALUATION INFO -----
        wsData.push(
          [t("evaluation.evaluation_form.evaluation_type"), revisionType],
          [t("evaluation.evaluation_form.eligibility"), readiness],
          [t("evaluation.evaluation_form.period_from"), periodFrom],
          [t("evaluation.evaluation_form.period_to"), periodTo],
          [t("evaluation.evaluation_form.evaluation_date"), evaluationDate],
          [],
        );

        // ----- PERFORMANCE RATINGS TABLE -----
        wsData.push(
          [
            t("evaluation.evaluation_form.employee_performance_table") ||
              "Performance Ratings",
          ],
          [
            t("evaluation.evaluation_form.col_grade") || "Grade",
            t("evaluation.evaluation_form.col_description") || "Description",
            t("evaluation.evaluation_form.col_score") || "Score",
            t("evaluation.evaluation_form.col_reasons") || "Justification",
            t("evaluation.evaluation_form.col_documents") ||
              "Supporting Document",
          ],
        );

        ratingDetails.forEach((row) => {
          wsData.push([
            row.rating,
            row.label,
            row.grades,
            row.justification,
            row.supporting_document,
          ]);
        });

        wsData.push([]);

        // ----- GAP ANALYSIS -----
        wsData.push([
          t("evaluation.evaluation_form.gap_strengths") || "Strengths",
          t("evaluation.evaluation_form.gap_development") ||
            "Development Areas",
        ]);

        gapRows.forEach((gap) => {
          wsData.push([gap.strengths, gap.development_areas]);
        });

        wsData.push([]);

        // ----- MANAGER NOTES -----
        wsData.push(
          [t("evaluation.evaluation_form.notes") || "Notes"],
          [managerNote],
          [],
        );

        // ----- SIGNATURES -----
        wsData.push(
          [t("evaluation.evaluation_form.signatures.title") || "Signatures"],
          [
            t("evaluation.evaluation_form.signatures.employee") || "Employee",
            t("evaluation.evaluation_form.signatures.manager") || "Manager",
            t("evaluation.evaluation_form.signatures.hr") || "HR",
          ],
          [
            evalData.employee_signature || "--",
            evalData.manager_signature || "--",
            evalData.higher_admin_signature || "--",
          ],
        );

        // =============> CREATE WORKSHEET
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Auto column widths
        const numCols = Math.max(...wsData.map((r) => r.length));
        ws["!cols"] = Array.from({ length: numCols }, (_, colIdx) => ({
          wch: Math.max(
            18,
            ...wsData.map((row) =>
              row[colIdx] != null ? row[colIdx].toString().length + 2 : 10,
            ),
          ),
        }));

        // Sheet name: sanitized, max 31 chars
        const sheetName = safeName(
          (emp.name || `item-${item.id}`).slice(0, 28),
        );

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      } catch (err) {
        console.error(`Export error for item ${item.id}:`, err);
        toast.warning(`Could not export: ${item.employee?.name || item.id}`);
      }
    }

    // =============> WRITE FILE ONCE after all sheets are ready
    if (wb.SheetNames.length === 0) {
      toast.error("No data could be exported");
      return;
    }

    const fileName =
      dataToExport.length === 1
        ? `appraisal_${safeName(dataToExport[0].employee?.name || "employee")}`
        : `appraisals_${dataToExport.length}_employees`;

    XLSX.writeFile(
      wb,
      `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );

    toast.success(t("evaluation.messages.exported") || "Exported successfully");
  } catch (err) {
    console.error(err);
    toast.error("Export failed");
  }
};

// =============> NAVIGATION
const goToView = (item) => {
  const prefix = isEn.value ? "/en" : "";
  router.push(`${prefix}/${item?.employee?.id}/general-evaluate`);
  window.sessionStorage.setItem("evaluation_action", "view");
};
// =============> NAVIGATION
const goToEdit = (item) => {
  const prefix = isEn.value ? "/en" : "";
  router.push(`${prefix}/${item?.employee?.id}/general-evaluate`);
  window.sessionStorage.setItem("evaluation_action", "edit");
};
const goToEvaluate = (item) => {
  const prefix = isEn.value ? "/en" : "";
  router.push(`${prefix}/${item?.employee?.id}/general-evaluate`);
  window.sessionStorage.setItem("evaluation_action", "evaluate");
};

// =============> MOUNT
onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("attendance.auth"))?.user;

  if (userRoles.value.isManager || userRoles.value.isAdmin) {
    const response = await generalEvaluationService.listStatistics();
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
