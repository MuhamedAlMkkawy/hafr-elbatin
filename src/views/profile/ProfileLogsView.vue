<template>
  <section class="space-y-6">
    <!-- Header -->
    <header
      class="flex flex-wrap gap-x-10 gap-y-5 items-center justify-between no-print"
    >
      <h1 class="text-[20px] font-[600] text-[#000000]">
        {{ t("profile.activityLog.title") }}
      </h1>
    </header>

    <!-- Filters Section -->
    <Card class="no-print">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("auditLogs.filters.title") }}
          </h2>
        </div>
      </template>

      <div class="mb-5 flex items-center w-full gap-4 items-end">
        <Select
          v-model="statsFilters.period"
          :options="periodOptions"
          :label="t('auditLogs.filters.period')"
          size="md"
          class="flex-grow-1"
          />
          <DateRangePicker
          v-if="statsFilters.period === 'custom'"
          class="flex-grow-1"
          v-model:startDate="statsFilters.date_from"
          v-model:endDate="statsFilters.date_to"
          :label="t('overtimeRequests.placeholders.date')"
          :placeholder="t('overtimeRequests.placeholders.selectDateRange')"
          size="md"
        />
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="ghost" size="md" @click="resetFilters">
          {{ t("roles.resetFilters") }}
        </Button>
        <Button
          variant="primary"
          size="md"
          @click="applyFilters"
          :loading="loading"
        >
          <template #prefix>
            <SvgIcon name="search" v-if="!loading" />
          </template>
          {{ t("common.search") }}
        </Button>
      </div>
    </Card>

    <!-- Activity Logs Table -->
    <Card>
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("profile.activityLog.title") }}
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
              ></span>
              <span>{{ item.event_label?.[lang] || item.event }}</span>
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
            <span class="text-[10px] text-gray-400" v-if="item.model_id">
              ID: {{ item.model_id }}
            </span>
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
      </Table>
    </Card>
  </section>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";
import { useAuthStore } from "@/stores/auth";

import Card from "@/components/ui/Card.vue";
import Table from "@/components/ui/Table.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Select from "@/components/ui/Select.vue";
import DateRangePicker from "@/components/ui/DateRangePicker.vue";
import Button from "@/components/ui/Button.vue";
import profileService from "@/services/profile";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();
const authStore = useAuthStore();

// State
const logs = ref([]);
const loading = ref(false);
const page = ref(1);
const perPage = ref(10);
const total = ref(0);

// Filters
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

const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

// Table Headers
const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "event", label: t("auditLogs.fields.event") },
  { key: "user", label: t("auditLogs.fields.user") },
  { key: "created_at", label: t("auditLogs.fields.createdAt") },
]);

// Event Colors
const getEventColor = (event) => {
  const map = {
    created: "#1B8354",
    updated: "#175CD3",
    deleted: "#B42318",
    login_success: "#027A48",
    login_failed: "#B42318",
  };
  return map[event] || "#384250";
};

// Load Logs
const loadLogs = async () => {
  loading.value = true;
  try {
    const payload = {
      period: statsFilters.value.period,
      date_from: statsFilters.value.date_from,
      date_to: statsFilters.value.date_to,
      page: page.value,
      user_id: authStore.user?.id,
    };
    const response = await profileService.getProfileTimeLine(payload);
    if (response) logs.value = response?.data?.timeline || [];

    if (response?.pagination) {
      total.value = response.pagination.total;
      page.value = response.pagination.current_page;
      perPage.value = response.pagination.per_page;
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

// Pagination
const changePage = (newPage) => {
  page.value = newPage;
  loadLogs();
};

// Reset Filters
const resetFilters = () => {
  statsFilters.value = {
    period: "",
    date_from: "",
    date_to: "",
  };
  loadLogs();
};

// Apply Filters
const applyFilters = () => {
  page.value = 1;
  loadLogs();
};

// Format Date
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

// Watchers
watch(
  () => statsFilters.value.period,
  (newVal) => {
    if (newVal !== "custom") {
      statsFilters.value.date_from = "";
      statsFilters.value.date_to = "";
    }
  },
);

onMounted(() => {
  loadLogs();
});
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
