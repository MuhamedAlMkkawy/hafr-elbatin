<template>
  <section class="space-y-6">
    <Breadcrumb :items="breadcrumbItems" />
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <h2 class="text-[14px] font-[600]">
        {{ t("sidebar.supportComplaints") }}
      </h2>
      <div class="flex gap-2">
        <Button
          variant="primary"
          icon="plus"
          size="md"
          v-if="authStore?.hasPermission('internal_memo.create')"
          @click="addMemo"
        >
          {{ t("supportComplaints.add_complaint") }}
        </Button>
      </div>
    </div>
    <!-- ==============================> Performance Indicators (Statistics) -->
    <Card
      class="relative no-print"
      v-if="authStore?.hasPermission('internal_memo.statistics')"
    >
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("supportComplaints.title") }}
        </h2>
      </template>

      <div class="relative">
        <swiper
          :modules="[Autoplay]"
          :slides-per-view="'auto'"
          :space-between="12"
          :loop="true"
          :autoplay="{
            delay: 2000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }"
          class="statistics-swiper w-full"
          :dir="lang == 'ar' ? 'rtl' : 'ltr'"
          :key="lang"
        >
          <swiper-slide class="!w-[25%]">
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="total_complaints" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                  t("supportComplaints.statistics.total")
                }}</span>
              </div>
              <span class="text-[#1F2A37] font-[600] text-[24px]">
                {{ memos?.statistics?.total }}
              </span>
            </Card>
          </swiper-slide>

          <swiper-slide class="!w-[25%]">
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="posted_complaints" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                  t("supportComplaints.statistics.posted")
                }}</span>
              </div>
              <span class="text-[#1F2A37] font-[600] text-[24px]">
                {{ memos?.statistics?.published }}
              </span>
            </Card>
          </swiper-slide>

          <swiper-slide class="!w-[25%]">
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="drafted_complaints" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                  t("supportComplaints.statistics.drafted")
                }}</span>
              </div>
              <span class="text-[#1F2A37] font-[600] text-[24px]">
                {{ memos?.statistics?.draft }}
              </span>
            </Card>
          </swiper-slide>

          <swiper-slide class="!w-[25%]">
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="expired_complaints" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                  t("supportComplaints.statistics.expired")
                }}</span>
              </div>
              <span class="text-[#1F2A37] font-[600] text-[24px]">
                {{ memos?.statistics?.expired }}
              </span>
            </Card>
          </swiper-slide>
        </swiper>
      </div>
    </Card>

    <!-- ==============================> Search Filtering -->
    <Card class="no-print">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("supportComplaints.search.title") }}
        </h2>
      </template>

      <div class="grid xl:grid-cols-4 md:grid-cols-3 gap-4 items-end">
        <!-- Search in complaints -->
        <Input
          v-model="filters.search"
          :placeholder="t('supportComplaints.search.placeholder')"
          :label="t('supportComplaints.search.complaints')"
          size="md"
        >
          <template #suffix>
            <Icon name="magnifyingGlass" size="lg" class="text-[#0E5F4A]" />
          </template>
        </Input>

        <!-- Date -->
        <Input
          v-model="filters.date"
          :label="t('supportComplaints.search.date')"
          size="md"
          type="date"
        >
          <template #suffix>
            <Icon name="calendar" size="lg" class="text-[#0E5F4A]" />
          </template>
        </Input>

        <!-- التصنيف -->
        <Select
          v-model="filters.classification"
          :options="classificationOptions"
          :label="t('supportComplaints.search.classification')"
          :placeholder="t('supportComplaints.search.classification')"
          searchable
          v-if="user?.roles?.includes('employee')"
          size="md"
        />

        <!-- Post Status - Update the v-model binding -->
        <Select
          v-if="!user?.roles?.includes('employee')"
          v-model="filters.publish_status"
          :options="postStatusOptions"
          :placeholder="t('supportComplaints.search.post_status')"
          :label="t('supportComplaints.search.post_status')"
          size="md"
        />

        <!-- Complaint Status - Update the v-model binding -->
        <Select
          v-if="!user?.roles?.includes('employee')"
          v-model="filters.memo_status"
          :options="complaintStatusOptions"
          :placeholder="t('supportComplaints.search.complaint_status')"
          :label="t('supportComplaints.search.complaint_status')"
          size="md"
        />
      </div>

      <div class="flex gap-2 mt-5 justify-end">
        <Button variant="ghost" size="md" @click="resetFilters" class="md:w-26">
          {{ t("common.reset") }}
        </Button>
        <Button
          variant="primary"
          size="md"
          @click="applyFilters"
          class="md:w-26"
        >
          {{ t("common.search") }}
        </Button>
      </div>
    </Card>

    <!-- ==============================> Complaints List -->
    <!-- List Card -->
    <div id="print-area">
      <Card class="print:!border-none print:!shadow-none no-print">
        <template #header>
          <h2 class="text-[16px] font-[600] text-[#333333] no-print">
            {{ t("supportComplaints.memosList.title") }}
          </h2>
        </template>

        <Table
          :loading="loading"
          :items="memos.internal_memos"
          :headers="tableHeaders"
          :page="page"
          :total-pages="totalPages"
          :loading-text="t('common.loading')"
          :empty-text="t('supportComplaints.empty')"
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
                  filters.sort_by === header.key
                    ? 'text-primary'
                    : 'text-gray-400'
                "
              />
            </div>
          </template>

          <!-- Index -->
          <template #cell-index="{ index }">
            {{ (page - 1) * perPage + index + 1 }}
          </template>

          <!-- Memo Number -->
          <template #cell-memo_number="{ item }">
            {{ item.memo_number || "--" }}
          </template>

          <!-- Publisher -->
          <template #cell-publisher="{ item }">
            {{ item.publisher?.name || "--" }}
          </template>

          <!-- Department -->
          <template #cell-manager="{ item }">
            {{ item.target_entity?.[`name_${lang}`] || "--" }}
          </template>

          <!-- Subject -->
          <template #cell-subject="{ item }">
            {{ item.subject || "--" }}
          </template>

          <!-- Date -->
          <template #cell-date="{ item }">
            {{ formatDate(item.publish_date) || "--" }}
          </template>

          <!-- Category -->
          <template #cell-category="{ item }">
            <span
              v-if="item?.classification_label"
              class="text-[14px] font-[500] text-[#0E5F4A] bg-[#82aba040] rounded-full h-[fit-content] py-[2px] px-[8px] border border-[#E7EFED/5]"
            >
              {{ item.classification_label }}
            </span>
            <span v-else>--</span>
          </template>

          <!-- Publish Status -->
          <template #cell-publish_status="{ item }">
            <span
              class="inline-flex items-center gap-1.5 text-[14px] font-[500] px-3 py-0.5 rounded-full flex-shrink-0"
              :class="{
                'bg-[#ECFDF3] text-[#065F46]':
                  item.publish_status === 'published',
                'bg-[#E5E7EB] text-[#1F2A37]': item.publish_status === 'draft',
                'bg-[#FEE2E2] text-[#B91C1C]':
                  item.publish_status === 'expired',
              }"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-[#065F46]': item.publish_status === 'published',
                  'bg-[#4D5761]': item.publish_status === 'draft',
                  'bg-[#B91C1C]': item.publish_status === 'expired',
                }"
              />
              {{ item.publish_status_label }}
            </span>
          </template>

          <!-- Memo Status -->
          <template #cell-memo_status="{ item }">
            <Toggle
              :model-value="item.memo_status === 'active' ? true : false"
              :loading="togglingId === item.id"
              :disabled="togglingId === item.id"
              @change="openToggle(item)"
            />
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
                    target: t('supportComplaints.entityName'),
                  }),
                  content: t('common.actionTooltips.view.content', {
                    target: t('supportComplaints.entityName'),
                    name: item.memo_number,
                  }),
                }"
              >
                <SvgIcon name="eye" />
              </button>

              <!-- Edit -->
              <template v-if="item.available_actions?.includes('edit')">
                <button
                  class="hover:opacity-75 transition-opacity cursor-pointer text-[#6C737F]"
                  @click="goToEdit(item)"
                  v-tooltip="{
                    title: t('common.actionTooltips.edit.title', {
                      target: t('supportComplaints.entityName'),
                    }),
                    content: t('common.actionTooltips.edit.content', {
                      target: t('supportComplaints.entityName'),
                      name: item.memo_number,
                    }),
                  }"
                >
                  <SvgIcon name="edit" />
                </button>
              </template>

              <!-- Dropdown -->
              <Menu
                v-if="item.available_actions?.length > 1"
                v-slot="{ open }"
                as="div"
                class="relative inline-block text-left"
              >
                <MenuButton
                  @click="setDropdownPosition"
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
                      class="absolute w-[140px] rounded-[4px] bg-white shadow-lg z-[9999] p-1"
                    >
                      <MenuItem
                        v-if="item.available_actions.includes('publish')"
                      >
                        <button
                          @click="handlePublish(item)"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
                        >
                          {{ t("supportComplaints.modals.publish") }}
                        </button>
                      </MenuItem>

                      <MenuItem
                        v-if="item.available_actions.includes('delete')"
                      >
                        <button
                          @click="handleDelete(item)"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
                        >
                          {{ t("supportComplaints.modals.delete") }}
                        </button>
                      </MenuItem>
                    </MenuItems>
                  </transition>
                </Teleport>
              </Menu>
            </div>
          </template>
        </Table>
      </Card>
    </div>
    <div class="flex flex-col lg:flex-row gap-6"></div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, Teleport } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, RouterView, RouterLink, useRouter } from "vue-router";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import Card from "@/components/ui/Card.vue";
import Table from "@/components/ui/Table.vue";
import Button from "@/components/ui/Button.vue";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import Icon from "@/components/ui/Icon.vue";
import { memoService } from "@/services/memos";
import Toggle from "@/components/ui/Toggle.vue";
import { useAppToast } from "@/composables/useAppToast";
import { useAuthStore } from "@/stores/auth";

// GET THE USER DATA FROM THE STORAGE
let user = ref();

const toast = useAppToast();
const authStore = useAuthStore();
const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const lang = computed(() => locale.value);
const memos = ref([]);
const togglingId = ref(null);
const showToggleConfirm = ref(false);
const memoToToggle = ref(null);
const loading = ref(true);
const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const printEmployees = ref([]);
const isPrinting = ref(false);

// ================> HANDLE THE BRADCRUMB
const breadcrumbItems = computed(() => {
  const prefix = locale.value === "en" ? "/en" : "";
  const items = [
    {
      label: t("sidebar.support"),
    },
    {
      label: t("sidebar.supportComplaints"),
    },
  ];
  return items;
});

// ==============> HANDLE THE FILTERING SEARCH
const filters = ref({
  search: "",
  date: "",
  publish_status: "",
  memo_status: "",
  classification: "",
  sort_by: "publish_date",
  sort_direction: "desc",
});

// Publish Status Options
const postStatusOptions = ref([
  { label: t("supportComplaints.status.draft"), value: "draft" },
  { label: t("supportComplaints.status.posted"), value: "posted" },
  // { label: t("supportComplaints.status.pending"), value: "pending" },
  { label: t("supportComplaints.status.expired"), value: "expired" },
]);

// Complaint Status Options
const complaintStatusOptions = ref([
  { label: t("supportComplaints.status.active"), value: "active" },
  { label: t("supportComplaints.status.inactive"), value: "inactive" },
]);

// Calculate total pages
const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

// ==============> HANDLE SORTING - UPDATED
const handleSort = (key) => {
  // Map table keys to API field names
  const sortFieldMap = {
    memo_number: "memo_number",
    publisher: "publisher_name",
    manager: "department",
    subject: "subject",
    date: "publish_date",
    category: "classification",
    publish_status: "publish_status",
    memo_status: "memo_status",
  };

  const apiKey = sortFieldMap[key] || key;

  if (filters.value.sort_by === apiKey) {
    // Toggle direction if clicking the same column
    filters.value.sort_direction =
      filters.value.sort_direction === "asc" ? "desc" : "asc";
  } else {
    // New column, set to asc
    filters.value.sort_by = apiKey;
    filters.value.sort_direction = "asc";
  }

  // Apply filters with new sorting
  applyFilters();
};

// ==============> HANDLE THE CLASSIFICATIONS OPTIONS
const classificationOptions = ref([]);

// ==============> LOAD COMPLAINTS
const loadComplaints = async () => {
  if (!authStore.hasPermission("internal_memo.view")) return;
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      sort_by: filters.value.sort_by,
      sort_direction: filters.value.sort_direction,
    };

    // Add search filters
    if (filters.value.search) params.search = filters.value.search;

    // Date filter
    if (filters.value.date) {
      params.publish_date = filters.value.date;
    }

    // Status filters
    if (filters.value.publish_status) {
      params.publish_status = filters.value.publish_status;
    }

    if (filters.value.memo_status) {
      params.memo_status = filters.value.memo_status;
    }
    let response;
    if (user.value.roles?.includes("employee")) {
      response = await memoService.employeeList(params);
    } else {
      response = await memoService.list(params);
    }
    memos.value = response.data || [];

    total.value = response.data?.pagination?.total ?? memos.value.length;
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  page.value = 1;
  loadComplaints();
};

const resetFilters = () => {
  filters.value.search = "";
  filters.value.date = "";
  filters.value.publish_status = "";
  filters.value.memo_status = "";
  filters.value.classification = "";
  filters.value.sort_by = "publish_date";
  filters.value.sort_direction = "desc";
  applyFilters();
};

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  loadComplaints();
};

// ====================> HANDLE THE MEMO STATUS TOGGLE
const confirmToggle = async () => {
  if (!memoToToggle.value) return;

  const originalState = memoToToggle.value.memo_status;
  togglingId.value = memoToToggle.value.id;
  try {
    await memoService.toggleStatus(memoToToggle.value.id);
    memoToToggle.value.memo_status =
      originalState === "active" ? "inactive" : "active";
    toast.success(
      memoToToggle.value.memo_status === "active"
        ? t("supportComplaints.messages.activated")
        : t("supportComplaints.messages.deactivated"),
    );
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    togglingId.value = null;
    memoToToggle.value = null;
  }
};

const openToggle = (memo) => {
  memoToToggle.value = memo;
  confirmToggle();
};

// ====================> HANDLE THE TABLE - UPDATED
const tableHeaders = computed(() => [
  { key: "index", label: "#", sortable: false },
  {
    key: "memo_number",
    label: t("supportComplaints.memosList.memo_number"),
    sortable: true,
  },
  {
    key: "publisher",
    label: t("supportComplaints.memosList.publisher"),
    sortable: true,
  },
  {
    key: "manager",
    label: t("supportComplaints.memosList.manager"),
    sortable: true,
  },
  {
    key: "subject",
    label: t("supportComplaints.memosList.subject"),
    sortable: true,
  },
  { key: "date", label: t("supportComplaints.memosList.data"), sortable: true },
  {
    key: "category",
    label: t("supportComplaints.memosList.category"),
    sortable: true,
  },
  {
    key: "publish_status",
    label: t("supportComplaints.memosList.publish_status"),
    sortable: true,
  },
  {
    key: "memo_status",
    label: t("supportComplaints.memosList.memo_status"),
    sortable: true,
  },
  {
    key: "actions",
    label: t("supportComplaints.memosList.actions"),
    sortable: false,
  },
]);

// HANDLE THE FORMAT OF THE DATE
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
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

const isEn = computed(() => route.path.startsWith("/en"));
const basePath = computed(() => (isEn.value ? "/en/support" : "/support"));

// HANDLE VIEW THE SINGLE MEMO
const goToView = (item) => {
  router.push(`${basePath?.value}/memos/${item.id}`);
};

// HANDLE EDIT THE SINGLE MEMO
const goToEdit = (item) => {
  router.push(`${basePath?.value}/${item.id}/edit`);
};

// HANDLE ADD NEW MEMO
const addMemo = () => {
  router.push(`${basePath?.value}/add_memo`);
};

// HANDLE PUBLISH THE MEMO
const handlePublish = async (item) => {
  loading.value = true;
  try {
    const response = await memoService.handlePublish(item?.id);
    if (response?.success) {
      toast.success(response?.message);
      await loadComplaints();
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

// HANDLE DELETE THE MEMO
const handleDelete = async (item) => {
  loading.value = true;
  try {
    const response = await memoService.handleDelete(item.id);
    toast.success(
      response.success
        ? t("supportComplaints.messages.deleted")
        : t("supportComplaints.messages.unDeleted"),
    );
    await loadComplaints();
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

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

onMounted(async () => {
  if (authStore.hasPermission("internal_memo.view")) {
    const classifications = await memoService.getClassifications();
    classificationOptions.value = classifications?.data?.classifications || [];
  }

  user.value = JSON.parse(localStorage.getItem("attendance.auth"))?.user;
  await loadComplaints();
});
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
