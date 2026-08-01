<template>
  <div class="space-y-6">
    <!-- Top Actions -->
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <h2 class="text-[18px] font-[600]">
        {{ t("leaveTypes.title") }}
      </h2>
    </div>

    <!-- Search Card -->
    <Card>
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("leaveTypes.searchTitle") }}
        </h2>
      </template>

      <div class="grid grid-cols-1 gap-4 items-end">
        <Input
          v-model="filters.search"
          :label="t('leaveTypes.fields.leaveName')"
          :placeholder="t('leaveTypes.placeholders.leaveName')"
          size="md"
          clearable
        >
          <template #suffix>
            <SvgIcon name="search" />
          </template>
        </Input>
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
          {{ t("leaveTypes.listTitle") }}
        </h2>
      </template>

      <Table
        :loading="loading"
        :items="leaveTypes"
        :headers="tableHeaders"
        :page="page"
        :total-pages="totalPages"
        :loading-text="t('common.loading')"
        :empty-text="t('common.no_results')"
        @change-page="changePage"
      >
        <template #header-index="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-all cursor-pointer"
              :class="[
                filters.sort_by === 'id' ? 'text-primary' : 'text-gray-400',
                filters.sort_by === 'id' && filters.sort_direction === 'desc'
                  ? 'rotate-180'
                  : '',
              ]"
              @click="handleSort('id')"
            />
          </div>
        </template>

        <template #header-name="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-all cursor-pointer"
              :class="[
                filters.sort_by === 'name' || filters.sort_by === 'name_ar'
                  ? 'text-primary'
                  : 'text-gray-400',
                (filters.sort_by === 'name' || filters.sort_by === 'name_ar') &&
                filters.sort_direction === 'desc'
                  ? 'rotate-180'
                  : '',
              ]"
              @click="handleSort(lang === 'ar' ? 'name_ar' : 'name')"
            />
          </div>
        </template>

        <template #header-default_days="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-all cursor-pointer"
              :class="[
                filters.sort_by === 'default_days'
                  ? 'text-primary'
                  : 'text-gray-400',
                filters.sort_by === 'default_days' &&
                filters.sort_direction === 'desc'
                  ? 'rotate-180'
                  : '',
              ]"
              @click="handleSort('default_days')"
            />
          </div>
        </template>

        <template #cell-index="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>

        <template #cell-name="{ item }">
          {{ lang === "ar" ? item.name_ar : item.name }}
        </template>

        <template #cell-default_days="{ item }">
          {{ item.default_days }}
        </template>

        <template #no-data>
          {{ t("common.no_results") }}
        </template>
      </Table>
    </Card>
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
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Pagination from "@/components/ui/Pagination.vue";
import { leaveTypeService } from "@/services/leaveTypes";
import { useAuthStore } from "@/stores/auth";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();
const authStore = useAuthStore();

const leaveTypes = ref([]);
const loading = ref(false);

const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

const filters = ref({
  search: "",
  sort_by: locale.value === "ar" ? "name_ar" : "name",
  sort_direction: "asc",
});

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "name", label: t("leaveTypes.fields.leaveType") },
  { key: "default_days", label: t("leaveTypes.fields.balance") },
]);

const loadLeaveTypes = async () => {
  if (!authStore.hasPermission("leave_type.view")) return;
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      search: filters.value.search,
      sort_by: filters.value.sort_by,
      sort_direction: filters.value.sort_direction,
    };
    const response = await leaveTypeService.getAll(params);

    // Prepare pagination and data
    const data = response.data || response;
    if (data?.leave_types) {
      leaveTypes.value = data.leave_types;
    } else if (Array.isArray(data)) {
      leaveTypes.value = data;
    } else {
      leaveTypes.value = Array.isArray(response) ? response : [];
    }

    const pagination =
      response.pagination || response.meta || data?.pagination || data?.meta;
    if (pagination) {
      total.value = pagination.total || leaveTypes.value.length;
      if (pagination.per_page) perPage.value = pagination.per_page;
    } else {
      total.value = leaveTypes.value.length;
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
  loadLeaveTypes();
};

const resetFilters = () => {
  filters.value = {
    search: "",
    sort_by: "id",
    sort_direction: "asc",
  };
  applyFilters();
};

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  loadLeaveTypes();
};

onMounted(() => {
  loadLeaveTypes();
});
</script>
