<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Table from "@/components/ui/Table.vue";
import Select from "@/components/ui/Select.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Icon from "@/components/ui/Icon.vue";
import Pagination from "@/components/ui/Pagination.vue";
import { auditLogService } from "@/services/auditLogs";
import DateRangePicker from "@/components/ui/DateRangePicker.vue";
// import AuditLogDetailsModal from "./AuditLogDetailsModal.vue";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();

const route = useRoute();
const router = useRouter();

// State
const logs = ref([]);
const statistics = ref(null);
const loading = ref(false);
const loadingStats = ref(false);
const currentTab = ref(route.query.tab || "list");

// Watch currentTab and update URL query
watch(currentTab, (newTab) => {
  router.push({
    query: {
      ...route.query,
      tab: newTab,
    },
  });
});

// Pagination
const page = ref(1);
const perPage = ref(10);
const total = ref(0);

// Filters
const filters = ref({
  search: "",
  event: "",
  model: "",
  user_id: "",
  ip_address: "",
  date_from: "",
  date_to: "",
  period: "",
});

const statsFilters = ref({
  period: "",
  date_from: "",
  date_to: "",
});

const periodOptions = computed(() => [
  { label: t("auditLogs.periods.custom"), value: "custom" },
  { label: t("auditLogs.periods.today"), value: "today" },
  { label: t("auditLogs.periods.yesterday"), value: "yesterday" },
  { label: t("auditLogs.periods.thisWeek"), value: "this_week" },
  { label: t("auditLogs.periods.thisMonth"), value: "this_month" },
  { label: t("auditLogs.periods.lastMonth"), value: "last_month" },
  { label: t("auditLogs.periods.thisYear"), value: "this_year" },
]);

const eventOptions = ref([]);
const modelOptions = ref([]);

// Details Modal
// const showDetailsModal = ref(false);
const selectedLog = ref(null);

const breadcrumbItems = computed(() => [
  { label: t("sidebar.logs"), to: "/audit-logs" },
  { label: t("auditLogs.title") },
]);

const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

const loadLogs = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...filters.value,
    };

    const response = await auditLogService.list(params);

    const data = response.data || response;

    logs.value = data.audit_logs || [];

    if (data.pagination) {
      total.value = data.pagination.total;
      page.value = data.pagination.current_page;
      perPage.value = data.pagination.per_page;
    } else {
      total.value = logs.value.length;
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const loadStatistics = async () => {
  loadingStats.value = true;
  try {
    const response = await auditLogService.getStatistics(statsFilters.value);
    statistics.value = response.data?.statistics || response;
  } catch (e) {
    console.warn("Stats failed to load", e);
  } finally {
    loadingStats.value = false;
  }
};

const loadFilters = async () => {
  try {
    const response = await auditLogService.getFilters();
    const data = response.data?.filters || response;
    if (data && data.events) {
      eventOptions.value = data.events?.map((e) => ({
        label: lang.value === "ar" ? e.label_ar : e.label_en,
        value: e.value,
      }));
      modelOptions.value = data.models?.map((m) => ({
        label: lang.value === "ar" ? m.label_ar : m.label_en,
        value: m.value,
      }));
    }
  } catch (e) {
    console.warn("Filters failed to load", e);
  }
};

const applyFilters = () => {
  if (currentTab.value === "list") {
    page.value = 1;
    loadLogs();
  } else {
    loadStatistics();
  }
};

const resetFilters = () => {
  if (currentTab.value === "list") {
    filters.value = {
      search: "",
      event: "",
      model: "",
      user_id: "",
      ip_address: "",
      date_from: "",
      date_to: "",
      period: "",
    };
  } else {
    statsFilters.value = {
      period: "",
      date_from: "",
      date_to: "",
    };
  }
  applyFilters();
};

const changePage = (newPage) => {
  page.value = newPage;
  loadLogs();
};

// const openDetails = (log) => {
//   selectedLog.value = log;
//   showDetailsModal.value = true;
// };

const setTab = (tab) => {
  currentTab.value = tab;
};

const formatDate = (dateString, format = "full") => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (format === "time") {
    return date.toLocaleTimeString(lang.value === "ar" ? "ar-EG" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleString(lang.value === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "event", label: t("auditLogs.fields.event") },
  { key: "model", label: t("auditLogs.fields.model") },
  { key: "user", label: t("auditLogs.fields.user") },
  { key: "ip_address", label: t("auditLogs.fields.ipAddress") },
  { key: "created_at", label: t("auditLogs.fields.createdAt") },
  // { key: "actions", label: t("branches.fields.actions"), cellClass: "w-10" },
]);

const getEventColor = (event) => {
  const map = {
    created: "#1B8354", // primary
    updated: "#175CD3", // blue
    deleted: "#B42318", // red
    login_success: "#027A48",
    login_failed: "#B42318",
  };
  return map[event] || "#384250";
};

onMounted(() => {
  loadLogs();
  loadStatistics();
  loadFilters();
});

watch(
  () => filters.value.period,
  (newVal) => {
    if (newVal !== "custom") {
      filters.value.date_from = "";
      filters.value.date_to = "";
    }
  },
);

watch(
  () => statsFilters.value.period,
  (newVal) => {
    if (newVal !== "custom") {
      statsFilters.value.date_from = "";
      statsFilters.value.date_to = "";
    }
  },
);
</script>

<template>
  <section class="space-y-6">
    <!-- <Breadcrumb :items="breadcrumbItems" /> -->

    <header
      class="flex flex-wrap gap-x-10 gap-y-5 items-center justify-between no-print"
    >
      <h1 class="text-[20px] font-[600] text-[#000000]">
        {{ t("auditLogs.title") }}
      </h1>

      <div class="flex items-center">
        <button
          v-for="tab in ['list', 'statistics']"
          :key="tab"
          @click="setTab(tab)"
          class="py-3 px-6 relative transition-all cursor-pointer"
          :class="currentTab === tab ? 'text-[#161616]' : 'text-[#384250]'"
        >
          <span class="font-medium">{{ t(`auditLogs.${tab}Title`) }}</span>

          <!-- Bottom Indicator -->
          <div
            v-if="currentTab === tab"
            class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] rounded-full"
          >
            <div
              class="h-full w-[81px] bg-[#1B8354] rounded-full mx-auto"
            ></div>
          </div>
          <div
            v-else
            class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] rounded-full m-auto"
          ></div>
        </button>
      </div>
    </header>

    <!-- Filters Section (Custom for each tab) -->
    <Card class="no-print">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("auditLogs.filters.title") }}
          </h2>
        </div>
      </template>

      <!-- List Tab Filters -->
      <div
        v-if="currentTab === 'list'"
        class="mb-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
      >
        <Select
          v-model="filters.period"
          :options="periodOptions"
          :label="t('auditLogs.filters.period')"
          size="md"
        />
        <DateRangePicker
          v-if="filters.period === 'custom'"
          v-model:startDate="filters.date_from"
          v-model:endDate="filters.date_to"
          :label="t('overtimeRequests.placeholders.date')"
          :placeholder="t('overtimeRequests.placeholders.selectDateRange')"
          size="md"
        />
        <Select
          v-model="filters.event"
          :options="[...eventOptions]"
          :label="t('auditLogs.filters.event')"
          size="md"
        />

        <Select
          v-model="filters.model"
          :options="[...modelOptions]"
          :label="t('auditLogs.filters.model')"
          size="md"
        />

        <Input
          v-model="filters.ip_address"
          :label="t('auditLogs.filters.ipAddress')"
          placeholder="127.0.0.1"
        >
          <template #suffix>
            <SvgIcon name="search" />
          </template>
        </Input>
      </div>

      <!-- Statistics Tab Filters -->
      <div
        v-else-if="currentTab === 'statistics'"
        class="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-end"
      >
        <Select
          v-model="statsFilters.period"
          :options="periodOptions"
          :label="t('auditLogs.filters.period')"
          size="md"
        />
        <DateRangePicker
          v-if="statsFilters.period === 'custom'"
          v-model:startDate="statsFilters.date_from"
          v-model:endDate="statsFilters.date_to"
          :label="t('overtimeRequests.placeholders.date')"
          :placeholder="t('overtimeRequests.placeholders.selectDateRange')"
          size="md"
        />
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="ghost" size="md" @click="resetFilters" class="md:w-26">
          {{ t("roles.resetFilters") }}
        </Button>
        <Button
          variant="primary"
          size="md"
          @click="applyFilters"
          :loading="loading || loadingStats"
          class="md:w-26"
        >
          <template #prefix>
            <SvgIcon name="search" v-if="!loading && !loadingStats" />
          </template>
          {{ t("common.search") }}
        </Button>
      </div>
    </Card>

    <!-- Tab Content -->
    <div v-if="currentTab === 'statistics'" class="space-y-8 mb-10">
      <div
        v-if="statistics"
        class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <Card class="!p-5 bg-white border-l-4 border-l-[#0E5F4A]">
          <p class="text-md text-gray-500 mb-1">
            {{ t("auditLogs.stats.totalLogs") }}
          </p>
          <div class="flex items-end">
            <h3 class="text-2xl font-bold text-[#161616] text-end w-full">
              {{ statistics.total_logs }}
            </h3>
          </div>
        </Card>

        <Card
          class="!p-5 bg-white border-l-4 border-l-[#0E5F4A]"
          v-for="(count, key) in statistics.by_event"
          :key="key"
        >
          <p class="text-md text-gray-500 mb-1">
            {{ t(`auditLogs.stats.${key}`) }}
          </p>

          <div class="flex items-end justify-between">
            <h3 class="text-2xl font-bold text-[#161616] text-end w-full">
              {{ count }}
            </h3>
          </div>
        </Card>
      </div>

      <div
        v-if="!statistics && !loadingStats"
        class="bg-white p-20 text-center rounded-xl border border-gray-200"
      >
        <SvgIcon name="logs" class="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <p class="text-gray-500">{{ t("common.no_results") }}</p>
      </div>
    </div>

    <!-- Content Tabs -->
    <div v-else-if="currentTab === 'list'">
      <Card>
        <template #header>
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("auditLogs.listTitle") }}
          </h2>
        </template>

        <Table
          :loading="loading"
          :items="logs"
          :headers="tableHeaders"
          :page="page"
          :total-pages="totalPages"
          :loading-text="t('common.loading')"
          :empty-text="t('common.no_results')"
          @change-page="changePage"
        >
          <template #cell-index="{ index }">
            {{ (page - 1) * perPage + index + 1 }}
          </template>

          <template #cell-event="{ item }">
            <div class="flex flex-col">
              <div class="flex gap-1 items-center">
                <span
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: getEventColor(item.event) }"
                >
                </span>
                <span>
                  {{ item.event_label?.[lang] || item.event }}
                </span>
              </div>
              <span
                class="text-[11px] text-gray-500 line-clamp-1 truncate w-40 ms-2"
                :title="item.description?.[lang]"
              >
                {{ item.description?.[lang] }}
              </span>
            </div>
          </template>

          <template #cell-model="{ item }">
            <div class="flex flex-col">
              <span>{{ item.model_label?.[lang] || item.model }}</span>
              <span class="text-[10px] text-gray-400" v-if="item.model_id"
                >ID: {{ item.model_id }}</span
              >
            </div>
          </template>

          <template #cell-user="{ item }">
            <div class="flex items-center gap-2" v-if="item.user">
              <span>{{ item.user?.name || "---" }}</span>
            </div>
            <span v-else class="text-gray-400">---</span>
          </template>

          <template #cell-ip_address="{ item }">
            <span>{{ item?.metadata?.ip_address || "---" }}</span>
          </template>

          <template #cell-created_at="{ item }">
            <div>
              <span>{{ formatDate(item.created_at) }}</span>
            </div>
          </template>

          <!-- <template #cell-actions="{ item }">
            <button
              class="cursor-pointer"
              @click="openDetails(item)"
              v-tooltip="{
                title: t('common.actionTooltips.view.title')
              }"
            >
              <SvgIcon name="eye" classes="w-8 h-8" />
            </button>
          </template> -->
        </Table>
      </Card>
    </div>
  </section>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
