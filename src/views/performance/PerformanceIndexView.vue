<template>
  <section class="space-y-6">
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <h2 class="lg:text-[25px] text-[14px] font-[600]">
        {{ t("sidebar.performanceCharter") }}
      </h2>
      <div class="flex gap-2">
        <Button
          v-if="!userRoles?.isEmployee && isCurrentYearSelected"
          variant="primary"
          icon="plus"
          size="md"
          @click="addCharter"
        >
          {{ t("performance.add_charter") }}
        </Button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <Card class="relative no-print" v-if="!userRoles?.isEmployee">
      <template #header>
        <h2 class="lg:text[20px] text-[16px] font-[600] text-[#333333]">
          {{ t("performance.statistics.title") }}
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
                <SvgIcon name="total_complaints" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">
                  {{ t("performance.statistics.total") }}
                </span>
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
                <SvgIcon name="drafted_complaints" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">
                  {{ t("performance.statistics.draft") }}
                </span>
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
                <SvgIcon name="posted_complaints" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">
                  {{ t("performance.statistics.accept") }}
                </span>
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
                <SvgIcon name="expired_complaints" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">
                  {{ t("performance.statistics.refused") }}
                </span>
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
                <SvgIcon name="total_complaints" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">
                  {{ t("performance.statistics.pending") }}
                </span>
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
          {{ t("performance.search.title") }}
        </h2>
      </template>

      <div class="grid xl:grid-cols-4 md:grid-cols-3 gap-4 items-end">
        <Input
          v-model="searchFilters.search"
          :placeholder="t('performance.search.placeholder')"
          :label="t('performance.search.charters')"
          size="md"
        >
          <template #suffix>
            <Icon name="magnifyingGlass" size="lg" class="text-[#0E5F4A]" />
          </template>
        </Input>

        <Input
          v-if="!userRoles.isEmployee"
          v-model="searchFilters.employee_name"
          :placeholder="t('performance.search.employee')"
          :label="t('performance.search.employee')"
          size="md"
        >
          <template #suffix>
            <Icon name="magnifyingGlass" size="lg" class="text-[#0E5F4A]" />
          </template>
        </Input>

        <Select
          v-if="!userRoles.isEmployee"
          v-model="searchFilters.type"
          :options="typeOptions"
          :label="t('performance.search.charter_type')"
          :placeholder="t('performance.search.charter_type')"
          searchable
          size="md"
        />

        <Select
          v-model="searchFilters.status"
          :options="statusOptions"
          :placeholder="t('performance.search.charter_status')"
          :label="t('performance.search.charter_status')"
          size="md"
        />

        <Input
          v-model="searchFilters.last_edit_date"
          :label="t('performance.search.charter_date')"
          size="md"
          type="date"
        >
          <template #suffix>
            <Icon name="calendar" size="lg" class="text-[#0E5F4A]" />
          </template>
        </Input>

        <Select
          v-if="!userRoles.isEmployee"
          v-model="searchFilters.year"
          :options="years"
          :label="t('evaluation.search.year')"
          :placeholder="t('evaluation.search.year')"
          :clearable="false"
          size="md"
        />
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
          <div class="flex justify-between items-center w-full no-print">
            <h2 class="text-[16px] font-[600] text-[#333333]">
              {{ t("sidebar.performanceCharter") }}
            </h2>
          </div>
        </template>

        <Table
          :loading="loading"
          :items="charters"
          :headers="tableHeaders"
          :page="page"
          :total-pages="totalPages"
          :loading-text="t('common.loading')"
          :empty-text="t('performance.empty')"
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

          <!-- FOR HEADER CHECKBOX -->
          <template #header-index>
            <input
              type="checkbox"
              :checked="isAllSelected"
              :indeterminate.prop="isIndeterminate"
              @change="toggleSelectAll"
              class="w-4 h-4 cursor-pointer"
            />
          </template>

          <!-- FOR ROW CHECKBOX -->
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

          <!-- JOB TITLE -->
          <template #cell-jobTitle="{ item }">
            {{ item.employee.job_title || "--" }}
          </template>

          <!-- Last Edit Date -->
          <template
            v-if="
              userRoles?.isManager ||
              userRoles?.isSuperAdmin ||
              userRoles?.isAdmin ||
              appliedFilters?.last_edit_date
            "
            #cell-last_edit_date="{ item }"
          >
            {{ formatDate(item.last_edit_date) || "--" }}
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

          <!-- Year
          <template #cell-year="{ item }">
            {{ item.year || "--" }}
          </template> -->

          <!-- Actions -->
          <template #cell-actions="{ item }">
            <div class="flex items-center gap-2">
              <!-- View -->
              <button
                class="hover:opacity-75 transition-opacity cursor-pointer text-[#6C737F]"
                v-tooltip="{
                  title: t('common.actionTooltips.view.title', {
                    target: t('performance.entityName'),
                  }),
                  content: t('common.actionTooltips.view.content', {
                    target: t('performance.entityName'),
                    name: item.employee.name,
                  }),
                }"
                @click="goToView(item)"
              >
                <SvgIcon name="eye" />
              </button>

              <!-- Edit -->
              <button
                v-if="
                  isCurrentYearSelected &&
                  (item.status == 'draft' || item.status == 'rejected') &&
                  (userRoles.isManager || userRoles.isSuperAdmin)
                "
                class="hover:opacity-75 transition-opacity cursor-pointer text-[#6C737F]"
                @click="goToEdit(item)"
                v-tooltip="{
                  title: t('common.actionTooltips.edit.title', {
                    target: t('performance.entityName'),
                  }),
                  content: t('common.actionTooltips.edit.content', {
                    target: t('performance.entityName'),
                    name: item.employee.name,
                  }),
                }"
              >
                <SvgIcon name="edit" />
              </button>

              <!-- EXPORT: Show inline if old year OR for non-managers -->
              <button
                v-if="!isCurrentYearSelected || !userRoles.isManager"
                class="hover:opacity-75 transition-opacity cursor-pointer text-[#6C737F]"
                @click="exportToExcel([item])"
                v-tooltip="{
                  title: t('performance.export.title', {
                    target: t('performance.entityName'),
                  }),
                  content: t('performance.export.content', {
                    target: t('performance.entityName'),
                    name: item.employee.name,
                  }),
                }"
              >
                <SvgIcon name="export" />
              </button>

              <!-- Dropdown -->
              <Menu
                v-if="hasAnyAction(item)"
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
                      class="absolute w-[160px] rounded-[4px] bg-white shadow-lg z-[9999] p-1"
                    >
                      <!-- ACCEPT (Shown for anyone who can see the menu and status is pending) -->
                      <MenuItem
                        v-if="
                          isCurrentYearSelected &&
                          item.can_accept &&
                          [
                            'pending_employee',
                            'pending_higher_admin',
                            'pending_hr',
                            'pending_admin',
                          ].includes(item.status)
                        "
                      >
                        <button
                          @click="handleAcceptCharter(item)"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
                        >
                          {{ t("performance.modals.accept") }}
                        </button>
                      </MenuItem>
                      <!-- REJECT (Shown for anyone who can see the menu and status is pending) -->
                      <MenuItem
                        v-if="
                          isCurrentYearSelected &&
                          item.can_reject &&
                          [
                            'pending_employee',
                            'pending_higher_admin',
                            'pending_hr',
                            'pending_admin',
                          ].includes(item.status)
                        "
                      >
                        <button
                          @click="handleRejectCharter(item)"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
                        >
                          {{ t("performance.modals.reject") }}
                        </button>
                      </MenuItem>
                      <!-- EXPORT -->
                      <MenuItem
                        v-if="userRoles.isManager || userRoles.isSuperAdmin"
                      >
                        <button
                          @click="exportToExcel([item])"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
                        >
                          {{ t("common.export") }}
                        </button>
                      </MenuItem>

                      <!-- SEND -->
                      <MenuItem
                        v-if="
                          isCurrentYearSelected &&
                          (userRoles.isManager || userRoles.isSuperAdmin) &&
                          item.status == 'draft'
                        "
                      >
                        <button
                          @click="handleSendCharter(item)"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
                        >
                          {{ t("performance.modals.send") }}
                        </button>
                      </MenuItem>
                    </MenuItems>
                  </transition>
                </Teleport>
              </Menu>
            </div>
          </template>
        </Table>
        <div class="flex gap-2 mt-5 justify-end" v-if="selectedIds.length > 0">
          <!-- Manager/Admin: bulk Send -->
          <template v-if="userRoles.isManager || userRoles.isAdmin">
            <Button
              v-if="isCurrentYearSelected"
              variant="primary"
              size="md"
              @click="bulkSendCharters"
              :disabled="!canBulkSend"
            >
              {{ t("performance.modals.send") }} ({{ selectedIds.length }})
            </Button>
          </template>

          <!-- HR/Employee/Admin: bulk Reject -->
          <template v-else>
            <Button
              v-if="isCurrentYearSelected"
              variant="danger"
              class="!bg-[#FEE4E2AB] border-2 !border-[#D92D20] !text-[#D92D20] hover:!bg-[#FEE4E2] hover:!border-[#B42318] hover:!text-[#B42318] transition-colors duration-200"
              size="md"
              @click="handleRejectAllSelected"
              :disabled="!canBulkReject"
            >
              {{ t("performance.modals.reject") }} ({{ selectedIds.length }})
            </Button>
          </template>
        </div>
      </Card>
    </div>
    <!-- Reject Modal -->
    <Modal
      v-model="showRejectModal"
      :title="t('performance.modals.reject')"
      type="danger"
      width="md"
    >
      <div class="space-y-4 pt-4">
        <Textarea
          v-model="rejectReason"
          :placeholder="t('performance.modals.rejectPlaceholder')"
          :label="t('performance.modals.reason')"
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
import Textarea from "@/components/ui/Textarea.vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import Icon from "@/components/ui/Icon.vue";
import { useAppToast } from "@/composables/useAppToast";
import performanceService from "@/services/performance";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import * as XLSX from "xlsx";
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

const showRejectModal = ref(false);
const rejectReason = ref("");
const selectedCharter = ref(null);
const submittingReject = ref(false);

// HANDLE THE TYPE OF THE USER
const userRoles = computed(() => {
  const roles = user.value?.roles || [];
  const isSuperAdmin = roles.includes("super-admin");
  const isAdmin = roles.includes("admin") || isSuperAdmin;
  const isHR = roles.includes("hr-employee") || isSuperAdmin;
  const isManager = roles.includes("manager") || isSuperAdmin;
  const isEmployee = !isAdmin && !isHR && !isManager;

  return { isAdmin, isHR, isManager, isEmployee, isSuperAdmin };
});

// HANDLE THE SELECTED IDS
const selectedIds = ref([]);

const currentYear = new Date().getFullYear();
const searchFilters = ref({
  search: "",
  employee_name: "",
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

  // Manager/SuperAdmin actions: Export, Send, Accept/Reject
  if (userRoles.value.isManager || userRoles.value.isSuperAdmin) {
    return true; // They always have Export in current year
  }

  // Non-manager actions (Employee/Admin/HR): Accept/Reject (if pending)
  if (
    !userRoles.value.isManager &&
    [
      "pending_employee",
      "pending_higher_admin",
      "pending_admin",
      "pending_hr",
      "pending_hr",
    ].includes(item.status)
  )
    return true;

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

// Table Headers - ONLY fields that exist in your data
const tableHeaders = computed(() => {
  let headers = [];

  // Non-employee roles (admin, manager, superAdmin, etc.)
  if (!userRoles.value.isEmployee) {
    headers = [
      { key: "index", label: "", sortable: false },
      {
        key: "employee",
        label: t("performance.chartersList.employee"),
        sortable: true,
      },
      {
        key: "jobTitle",
        label: t("performance.chartersList.job_title"),
        sortable: true,
      },
      {
        key: "type",
        label: t("performance.chartersList.charter_type"),
        sortable: true,
      },
      {
        key: "status",
        label: t("performance.chartersList.charter_status"),
        sortable: true,
      },
      {
        key: "actions",
        label: t("performance.chartersList.actions"),
        sortable: false,
      },
    ];

    // Manager only → add last_edit_date
    // Manager/Admin or if filtered → add last_edit_date
    if (
      userRoles.value.isManager ||
      userRoles.value.isSuperAdmin ||
      userRoles.value.isAdmin ||
      appliedFilters.value.last_edit_date
    ) {
      headers.splice(3, 0, {
        key: "last_edit_date",
        label: t("performance.chartersList.last_edit_date"),
        sortable: true,
      });
    }
  }
  // Employee
  else {
    headers = [
      { key: "index", label: "", sortable: false },
      {
        key: "year",
        label: t("performance.chartersList.year"),
        sortable: true,
      },
      {
        key: "status",
        label: t("performance.chartersList.charter_status"),
        sortable: true,
      },
      {
        key: "actions",
        label: t("performance.chartersList.actions"),
        sortable: false,
      },
    ];

    if (appliedFilters.value.last_edit_date) {
      headers.splice(2, 0, {
        key: "last_edit_date",
        label: t("performance.chartersList.last_edit_date"),
        sortable: true,
      });
    }
  }

  return headers;
});

// ==============> HANDLE SORTING - UPDATED
const handleSort = (key) => {
  // Columns that should NOT trigger sorting
  if (key === "index" || key === "actions") return;

  // Map table keys to API fields
  const sortFieldMap = {
    employee: "employee",
    jobTitle: "job_title",
    last_edit_date: "last_edit_date",
    type: "type",
    status: "status",
  };

  const apiKey = sortFieldMap[key];

  if (!apiKey) return;

  if (appliedFilters.value.sort_by === apiKey) {
    // toggle direction
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

// HANDLE IF ALL IS SELECTED
const isAllSelected = computed(() => {
  return (
    charters.value.length > 0 &&
    charters.value.every((item) => selectedIds.value.includes(item.id))
  );
});

const isIndeterminate = computed(() => {
  return selectedIds.value.length > 0 && !isAllSelected.value;
});

const toggleSelectAll = (e) => {
  if (e.target.checked) {
    selectedIds.value = charters.value.map((item) => item.id);
  } else {
    selectedIds.value = [];
  }
};

// =============> BULK ACTION CHECKS
const canBulkSend = computed(() => {
  if (selectedIds.value.length === 0) return false;
  return selectedIds.value.every((id) => {
    const item = charters.value.find((c) => c.id === id);
    return item && item.status === "draft";
  });
});

const canBulkReject = computed(() => {
  if (selectedIds.value.length === 0) return false;
  return selectedIds.value.every((id) => {
    const item = charters.value.find((c) => c.id === id);
    return (
      item &&
      [
        "pending_employee",
        "pending_higher_admin",
        "pending_admin",
        "pending_hr",
      ].includes(item.status)
    );
  });
});

const canBulkAccept = computed(() => canBulkReject.value);

// Filter Options
const typeOptions = computed(() => [
  {
    label: t("performance.types.managerial"),
    value: "managerial",
  },
  {
    label: t("performance.types.standard"),
    value: "standard",
  },
]);

const statusOptions = ref([
  { label: t("performance.statusOptions.draft"), value: "draft" },
  {
    label: t("performance.statusOptions.pending_employee"),
    value: "pending_employee",
  },
  { label: t("performance.statusOptions.pending_hr"), value: "pending_hr" },
  {
    label: t("performance.statusOptions.pending_higher_admin"),
    value: "pending_higher_admin",
  },
  { label: t("performance.statusOptions.accepted"), value: "accepted" },
  { label: t("performance.statusOptions.rejected"), value: "rejected" },
  // { label: t("performance.statusOptions.archived"), value: "archived" },
]);

const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

// ===============> HANDLE THE DATE FORMAT
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ==================> HANDLE THE MEMO DROPDOWN
const dropdownStyle = ref({
  top: "0px",
  left: "0px",
});

const setDropdownPosition = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  dropdownStyle.value = {
    top: rect.bottom + window.scrollY + "px",
    left: rect.left + window.scrollX + "px",
  };
};

// ================> HANDLE LOADING THE PERFORMANCE CHARTERS
const loadPerformanceCharters = async () => {
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
    if (appliedFilters.value.employee_name)
      params.employee = appliedFilters.value.employee_name;
    if (appliedFilters.value.status)
      params.status = appliedFilters.value.status;
    if (appliedFilters.value.type) params.type = appliedFilters.value.type;
    if (appliedFilters.value.year) params.year = appliedFilters.value.year;
    if (appliedFilters.value.last_edit_date)
      params.last_edit_date = appliedFilters.value.last_edit_date;

    const response = await performanceService.list(params);

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

// ===============> APPLY THE FILTERS
const applyFilters = () => {
  appliedFilters.value = { ...searchFilters.value };
  page.value = 1;
  loadPerformanceCharters();
};

// ================> RESET FILTERS
const resetFilters = () => {
  searchFilters.value = {
    search: "",
    employee_name: "",
    status: "",
    type: "",
    year: currentYear.toString(),
    last_edit_date: "",
    sort_by: "last_edit_date",
    sort_direction: "desc",
  };
  applyFilters();
};

// =================> HANDLE CHANGE PAGE IN PAGINATION
const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  loadPerformanceCharters();
};

// HANDLE SEND THE CHARTER
const handleSendCharter = async (item) => {
  try {
    const response = await performanceService.handleSendCharter(item.id);
    if (response) {
      toast.success(t("performance.messages.sent"));
      await loadPerformanceCharters();
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

// HANDLE ACCEPT THE CHARTER
const handleAcceptCharter = async (item) => {
  try {
    const response = await performanceService.handleAcceptCharter(item.id);
    if (response) {
      toast.success(t("performance.messages.accepted"));
      await loadPerformanceCharters();
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const bulkSendCharters = async () => {
  if (!selectedIds.value.length) return;

  loading.value = true;
  try {
    const response = await performanceService.bulkSendCharters(
      selectedIds.value,
    );
    if (response) {
      toast.success(t("performance.messages.sentAll"));
      selectedIds.value = [];
      await loadPerformanceCharters();
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

// HANDLE REJECT THE CHARTER
const handleRejectCharter = (item) => {
  selectedCharter.value = item;
  rejectReason.value = "";
  showRejectModal.value = true;
};

const confirmReject = async () => {
  if (!selectedCharter.value || !rejectReason.value.trim()) return;

  submittingReject.value = true;
  try {
    const response = await performanceService.handleRejectCharter(
      selectedCharter.value.id,
      rejectReason.value,
    );

    if (response) {
      toast.success(t("performance.messages.rejected"));
      showRejectModal.value = false;
      selectedCharter.value = null;
      rejectReason.value = "";
      await loadPerformanceCharters();
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    submittingReject.value = false;
  }
};

// HANDLE EXPORT THE CHARTER IN EXCEL FILE
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
        const res = await performanceService.getById(item.id);
        const charter = res.data;

        if (!charter) continue;

        const wsData = [];

        // =========================
        // TITLE
        // =========================
        wsData.push(["Performance Charter Report"], []);

        // =========================
        // HEADER INFO
        // =========================
        wsData.push(
          ["Employee", charter.employee?.name || "--"],
          ["Job Title", charter.employee?.job_title || "--"],
          ["Employee Number", charter.employee?.employee_number || "--"],
          ["Agency", charter.agency?.name || "--"],
          ["Department", charter.department?.name || "--"],
          ["Assessor", charter.assessor?.name || "--"],
          ["Type", charter.type_name || "--"],
          ["Status", charter.status_name || "--"],
          ["Total Targets Weight", (charter.total_targets_weight || 0) + " %"],
          [
            "Total Competencies Weight",
            (charter.total_competencies_weight || 0) + " %",
          ],
          [],
        );

        // =========================
        // TARGETS
        // =========================
        wsData.push(["Targets"]);
        wsData.push([
          "#",
          "Target Name",
          "Measurement Standard",
          "Weight",
          "Expected Results",
        ]);

        (charter.targets || []).forEach((t, i) => {
          wsData.push([
            i + 1,
            t.name || "--",
            t.measurement_standard === "summary"
              ? "Summary"
              : t.measurement_standard === "reports"
                ? "Reports"
                : t.measurement_standard || "--",
            (t.weight || 0) + " %",
            t.expected_results || "--",
          ]);
        });

        wsData.push(
          [],
          ["Total Targets Weight", (charter.total_targets_weight || 0) + " %"],
          [],
        );

        // =========================
        // COMPETENCIES
        // =========================
        wsData.push(["Competencies"]);
        wsData.push([
          "#",
          "Competency",
          "Weight",
          "Description",
          "Required Level",
        ]);

        (charter.competencies || []).forEach((c, ci) => {
          const descriptions = c.competency_descriptions || [];

          if (!descriptions.length) {
            wsData.push([
              ci + 1,
              c.name || "--",
              (c.weight || 0) + " %",
              "--",
              "--",
            ]);
          } else {
            descriptions.forEach((d) => {
              wsData.push([
                ci + 1,
                c.name || "--",
                (c.weight || 0) + " %",
                d.description || "--",
                d.level || "--",
              ]);
            });
          }
        });

        wsData.push(
          [],
          [
            "Total Competencies Weight",
            (charter.total_competencies_weight || 0) + " %",
          ],
          [],
        );

        // =========================
        // SIGNATURES
        // =========================
        wsData.push(
          ["Signatures"],
          [
            "Date",
            new Date(charter.created_at || Date.now()).toLocaleDateString(
              "en-US",
              { month: "2-digit", day: "2-digit", year: "numeric" },
            ),
          ],
          ["Employee", charter.employee_signature || "--"],
          ["Manager", charter.manager_signature || "--"],
          ["HR", charter.hr_signature || "--"],
          ["Higher Admin", charter.higher_admin_signature || "--"],
        );

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // =========================
        // BASIC STYLING
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

        // Column widths
        ws["!cols"] = wsData[0].map((_, i) => ({
          wch: Math.max(
            ...wsData.map((r) => (r[i] ? r[i].toString().length : 10)),
          ),
        }));

        XLSX.utils.book_append_sheet(
          wb,
          ws,
          `Charter-${charter.employee?.name?.slice(0, 10) || item.id}`,
        );
      } catch (err) {
        console.error("Export error for item:", item.id, err);
      }
    }

    const firstName = dataToExport[0];
    const res = await performanceService.getById(firstName.id);
    const fileName =
      dataToExport.length === 1
        ? `charter_${safeName(res.data?.employee?.name || "employee")}`
        : `charters_${dataToExport.length}_employees`;

    XLSX.writeFile(wb, `${fileName}_${Date.now()}.xlsx`);
  } catch (err) {
    console.error(err);
    toast.error("Export failed");
  }
};

// HANDLE GO TO VIEW SINGLE CHARTER
const goToView = (item) => {
  const path = isEn.value
    ? `/en/performance/${item.id}`
    : `/performance/${item.id}`;
  router.push(path);
};

// HANDLE GO TO EDIT SINGLE CHARTER
const goToEdit = (item) => {
  const path = isEn.value
    ? `/en/performance/${item.id}/edit`
    : `/performance/${item.id}/edit`;
  router.push(path);
};

// HANDLE GO TO NEW NEW SINGLE CHARTER
const addCharter = () => {
  const path = isEn.value ? `/en/performance/add` : `/performance/add`;
  router.push(path);
};

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("attendance.auth"))?.user;

  if (userRoles.value.isManager || userRoles.value.isAdmin) {
    const response = await performanceService.listStatistics();
    statistics.value = response?.data;
  }

  await loadPerformanceCharters();
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
