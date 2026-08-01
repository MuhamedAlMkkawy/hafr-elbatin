<template>
  <div class="space-y-6">
    <!-- Top Actions -->
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <h2 class="text-[18px] font-[600]">
        {{ t("holidays.title") }}
      </h2>
      <div class="flex gap-2">
        <Button variant="primary" icon="plus" size="md" @click="openAddModal">
          {{ t("holidays.addHoliday") }}
        </Button>
      </div>
    </div>

    <!-- Search Card -->
    <Card>
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("holidays.searchTitle") }}
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <Input
          v-model="filters.search"
          :label="t('holidays.fields.holidayName')"
          :placeholder="t('holidays.placeholders.holidayName')"
          size="md"
          clearable
        >
          <template #suffix>
            <SvgIcon name="search" />
          </template>
        </Input>

        <DateRangePicker
          v-model:startDate="filters.date_from"
          v-model:endDate="filters.date_to"
          :label="t('holidays.fields.date')"
        />
      </div>

      <div class="flex gap-2 mt-5 justify-end">
        <Button
          class="md:w-26"
          variant="ghost"
          size="md"
          @click="resetFilters"
        >
          {{ t("roles.resetFilters") }}
        </Button>
        <Button
          class="md:w-26"
          variant="primary"
          size="md"
          @click="applyFilters"
        >
          {{ t("common.search") }}
        </Button>
      </div>
    </Card>

    <!-- Table Card -->
    <Card>
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("holidays.listTitle") }}
        </h2>
      </template>

      <Table
        :loading="loading"
        :items="holidays"
        :headers="tableHeaders"
        :page="page"
        :total-pages="totalPages"
        :loading-text="t('common.loading')"
        :empty-text="t('common.no_results')"
        @change-page="changePage"
      >
        <template #header-name="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-all cursor-pointer"
              :class="[
                filters.sort_by === 'name_en' || filters.sort_by === 'name_ar'
                  ? 'text-primary'
                  : 'text-gray-400',
                (filters.sort_by === 'name_en' ||
                  filters.sort_by === 'name_ar') &&
                filters.sort_direction === 'desc'
                  ? 'rotate-180'
                  : '',
              ]"
              @click="handleSort(lang === 'ar' ? 'name_ar' : 'name_en')"
            />
          </div>
        </template>

        <template #header-start_date="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-all cursor-pointer"
              :class="[
                filters.sort_by === 'start_date'
                  ? 'text-primary'
                  : 'text-gray-400',
                filters.sort_by === 'start_date' &&
                filters.sort_direction === 'desc'
                  ? 'rotate-180'
                  : '',
              ]"
              @click="handleSort('start_date')"
            />
          </div>
        </template>

        <template #header-end_date="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-all cursor-pointer"
              :class="[
                filters.sort_by === 'end_date'
                  ? 'text-primary'
                  : 'text-gray-400',
                filters.sort_by === 'end_date' &&
                filters.sort_direction === 'desc'
                  ? 'rotate-180'
                  : '',
              ]"
              @click="handleSort('end_date')"
            />
          </div>
        </template>

        <template #cell-index="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>

        <template #cell-name="{ item }">
          {{ lang === "ar" ? item.name_ar : item.name_en }}
        </template>

        <template #cell-start_date="{ item }">
          {{ formatDate(item.start_date) }}
        </template>

        <template #cell-end_date="{ item }">
          {{ formatDate(item.end_date) }}
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center gap-2">
            <button
              class="cursor-pointer"
              @click="openViewModal(item)"
              v-tooltip="{
                title: t('common.actionTooltips.view.title', {
                  target: t('holidays.entityName'),
                }),
                content: t('common.actionTooltips.view.content', {
                  target: t('holidays.entityName'),
                  name: lang === 'ar' ? item.name_ar : item.name_en,
                }),
              }"
            >
              <SvgIcon name="eye" classes="w-8 h-8 text-[#1B8354]" />
            </button>
            <button
              class="cursor-pointer"
              @click="openEditModal(item)"
              :disabled="!item.is_editable"
              :class="{ 'opacity-50 cursor-not-allowed': !item.is_editable }"
              v-tooltip="{
                title: t('common.actionTooltips.edit.title', {
                  target: t('holidays.entityName'),
                }),
                content: t('common.actionTooltips.edit.content', {
                  target: t('holidays.entityName'),
                  name: lang === 'ar' ? item.name_ar : item.name_en,
                }),
              }"
            >
              <SvgIcon name="edit" classes="w-8 h-8 text-[#161616]" />
            </button>
            <button
              class="cursor-pointer"
              @click="openDeleteModal(item)"
              :disabled="!item.is_deletable"
              :class="{ 'opacity-50 cursor-not-allowed': !item.is_deletable }"
              v-tooltip="{
                title: t('common.actionTooltips.delete.title', {
                  target: t('holidays.entityName'),
                }),
                content: t('common.actionTooltips.delete.content', {
                  target: t('holidays.entityName'),
                  name: lang === 'ar' ? item.name_ar : item.name_en,
                }),
              }"
            >
              <SvgIcon name="trash" classes="w-8 h-8 text-[#D92D20]" />
            </button>
          </div>
        </template>
        <template #no-data>
          {{ t("common.no_results") }}
        </template>
      </Table>
    </Card>

    <!-- Holiday Form Modal -->
    <HolidayFormModal
      v-model="showFormModal"
      :mode="formMode"
      :holiday-data="selectedHoliday"
      @saved="loadHolidays"
    />

    <!-- Holiday Details Modal -->
    <HolidayDetailsModal
      v-model="showDetailsModal"
      :holiday-data="selectedHoliday"
      @edit="openEditModalFromDetails"
    />

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model="showDeleteConfirm"
      width="md"
      icon="error"
      border-color="#e76d62"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("holidays.modals.deleteTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("holidays.messages.confirmDelete") }}
        </p>
      </div>
      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button
            class="w-full bg-[#FEF3F2] !text-[#B42318] border-none hover:bg-[#FDE4E2]"
            size="md"
            @click="confirmDelete"
            :loading="deleting"
          >
            {{ t("common.delete") }}
          </Button>
          <Button
            variant="ghost"
            class="w-full"
            size="md"
            @click="showDeleteConfirm = false"
          >
            {{ t("common.cancel") }}
          </Button>
        </div>
      </template>
    </Modal>
  </div>
  <!-- Pagination -->
  <div
    v-if="totalPages > 1"
    class="flex items-center justify-center gap-4 px-5 py-6 border-t border-gray-100"
  >
    <Pagination
      :model-value="page"
      :total-pages="totalPages"
      @update:model-value="$emit('change-page', $event)"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";
import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Table from "@/components/ui/Table.vue";
import Modal from "@/components/ui/Modal.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import HolidayFormModal from "./HolidayFormModal.vue";
import HolidayDetailsModal from "./HolidayDetailsModal.vue";
import { holidayService } from "@/services/holidays";
import { useAuthStore } from "@/stores/auth";
import Pagination from "@/components/ui/Pagination.vue";
import DateRangePicker from "@/components/ui/DateRangePicker.vue";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();
const authStore = useAuthStore();

const holidays = ref([]);
const loading = ref(false);
const deleting = ref(false);

const showFormModal = ref(false);
const showDetailsModal = ref(false);
const formMode = ref("add");
const selectedHoliday = ref(null);

const showDeleteConfirm = ref(false);
const itemToDelete = ref(null);

const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

const filters = ref({
  search: "",
  date_from: "",
  date_to: "",
  sort_by: "start_date",
  sort_direction: "desc",
});

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "name", label: t("holidays.fields.holidayName") },
  { key: "start_date", label: t("holidays.fields.startDate") },
  { key: "end_date", label: t("holidays.fields.endDate") },
  { key: "actions", label: t("holidays.fields.actions"), cellClass: "w-32" },
]);

const loadHolidays = async () => {
  if (!authStore.hasPermission("holiday.view")) return;
  loading.value = true;
  try {
    const params = {
      page: page.value,
      current_page: page.value,
      per_page: perPage.value,
      search: filters.value.search,
      date_from: filters.value.date_from,
      date_to: filters.value.date_to,
      sort_by: filters.value.sort_by,
      sort_direction: filters.value.sort_direction,
    };
    const response = await holidayService.getAll(params);

    if (response.data?.holidays) {
      holidays.value = response.data.holidays;
      total.value =
        response.data.pagination?.total || response.data.holidays?.length;
      if (response.data.pagination?.per_page) {
        perPage.value = response.data.pagination.per_page;
      }
      if (response.data.pagination?.current_page) {
        page.value = response.data.pagination.current_page;
      }
    }
    // Check for standard response structure: { data: [...], meta: { total: X } }
    else if (response.data && Array.isArray(response.data)) {
      holidays.value = response.data;
      total.value = response.meta?.total || response.data.length;
      if (response.meta?.per_page) {
        perPage.value = response.meta.per_page;
      }
      if (response.meta?.current_page) {
        page.value = response.meta.current_page;
      }
    } else {
      holidays.value = Array.isArray(response) ? response : [];
      total.value = response.length || 0;
    }
  } catch (error) {
    console.error(error);
    toast.error(error);
  } finally {
    loading.value = false;
  }
};

const handleSort = (key) => {
  if (filters.value.sort_by === key) {
    filters.value.sort_direction =
      filters.value.sort_direction === "asc" ? "desc" : "asc";
  } else {
    filters.value.sort_by = key;
    filters.value.sort_direction = "asc";
  }
  applyFilters();
};

const applyFilters = () => {
  page.value = 1;
  loadHolidays();
};

const resetFilters = () => {
  filters.value = {
    search: "",
    date_from: "",
    date_to: "",
    sort_by: "start_date",
    sort_direction: "desc",
  };
  applyFilters();
};

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  loadHolidays();
};

const openAddModal = () => {
  formMode.value = "add";
  selectedHoliday.value = null;
  showFormModal.value = true;
};

const openEditModal = (item) => {
  if (!item.is_editable && item.is_editable !== undefined) {
    toast.error(t("holidays.messages.cannotEditPastMonth"));
    return;
  }
  formMode.value = "edit";
  selectedHoliday.value = item;
  showFormModal.value = true;
};

const openViewModal = (item) => {
  selectedHoliday.value = item;
  showDetailsModal.value = true;
};

const openEditModalFromDetails = (item) => {
  showDetailsModal.value = false;
  openEditModal(item);
};

const openDeleteModal = (item) => {
  if (!item.is_deletable && item.is_deletable !== undefined) {
    toast.error(t("holidays.messages.cannotDeletePastMonth"));
    return;
  }
  itemToDelete.value = item;
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!itemToDelete.value) return;
  deleting.value = true;
  try {
    await holidayService.delete(itemToDelete.value.id);
    toast.success(t("holidays.messages.deleted"));
    showDeleteConfirm.value = false;
    loadHolidays();
  } catch (error) {
    toast.error(error);
  } finally {
    deleting.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  // Use getUTC methods to avoid timezone shift if the date was string-parsed as UTC
  // which is common for "YYYY-MM-DD" formatted strings.
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const day = String(isDateOnly ? date.getUTCDate() : date.getDate()).padStart(2, "0");
  const month = String(isDateOnly ? date.getUTCMonth() + 1 : date.getMonth() + 1).padStart(2, "0");
  const year = isDateOnly ? date.getUTCFullYear() : date.getFullYear();
  return `${month}/${day}/${year}`;
};

onMounted(() => {
  loadHolidays();
});
</script>
