<template>
  <div class="space-y-6" :dir="isRtl ? 'rtl' : 'ltr'">
    <Card>
      <!-- Top Header: Title and Filter Toggle -->
      <template #header>
        <div class="flex items-center justify-between no-print">
          <h1 class="text-[16px] font-[600] text-[#333333]">
            {{ $t("dailyAttendance.statistics.title") }}
          </h1>
          <button
            @click="isFiltersVisible = !isFiltersVisible"
            class="p-2 bg-[#0E5F4A] text-white rounded-lg hover:bg-opacity-90 transition flex items-center gap-2 cursor-pointer"
          >
            <SvgIcon name="filter" />
          </button>
        </div>
      </template>

      <!-- Filters Section (Collapsible) -->
      <Card
        v-if="isFiltersVisible"
        class="p-6 transition-all duration-300 no-print"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{
              $t("employees.placeholders.departmentOrSection")
            }}</label>
            <Select
              v-model="filters.department_id"
              :options="departmentOptions"
              :placeholder="$t('employees.placeholders.departmentOrSection')"
              :clearable="true"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{
              $t("common.date")
            }}</label>
            <!-- <Input
              v-model="filters.date"
              type="date"
              :placeholder="$t('common.date')"
            /> -->
            <DateRangePicker
              v-model:startDate="filters.from_date"
              v-model:endDate="filters.to_date"
            />
          </div>
        </div>
        <div class="mt-6 flex gap-3 justify-end">
          <Button
            variant="ghost"
            size="md"
            @click="resetFilters"
            class="md:w-26"
          >
            {{ $t("roles.resetFilters") }}
          </Button>
          <Button
            variant="primary"
            size="md"
            @click="applyFilters"
            :loading="loading"
            class="md:w-26"
          >
            {{ $t("common.search") }}
          </Button>
        </div>
      </Card>

      <!-- Summary Cards -->
      <div
        v-if="loading"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <div
          v-for="i in 5"
          :key="i"
          class="p-4 border border-[#F1F7F5] bg-[#F8FBFA] rounded-xl h-[120px] flex flex-col justify-between"
        >
          <div class="flex items-center gap-2">
            <Skeleton width="w-8" height="h-8" radius="rounded-lg" />
            <Skeleton width="w-32" height="h-4" />
          </div>
          <Skeleton width="w-20" height="h-8" />
        </div>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Total Attendance -->
        <Card
          class="!p-4 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group min-h-[120px]"
        >
          <div class="flex items-center justify-start gap-2 mb-1">
            <div class="flex items-center justify-center">
              <SvgIcon name="group" />
            </div>
            <p class="text-[14px] font-[500] text-[#4D5761]">
              {{ $t("dashboard.summary_total_attendance") }}
            </p>
          </div>
          <div class="flex items-baseline gap-1 mt-2">
            <span class="text-[14px] text-[#6C737F]"
              >{{ summary.total_employees || 0 }}/</span
            >
            <span class="text-[24px] font-bold text-[#111827]">{{
              summary.total_attendance || 0
            }}</span>
          </div>
        </Card>

        <!-- Total Absent -->
        <Card
          class="!p-4 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group min-h-[120px]"
        >
          <div class="flex items-center justify-start gap-2 mb-1">
            <div class="flex items-center justify-center">
              <SvgIcon name="absence" />
            </div>
            <p class="text-[14px] font-[500] text-[#4D5761]">
              {{ $t("dashboard.summary_total_absent") }}
            </p>
          </div>
          <div class="mt-2 text-[24px] font-bold text-[#111827]">
            {{ summary.total_absent || 0 }}
          </div>
        </Card>

        <!-- Total Late -->
        <Card
          class="!p-4 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group min-h-[120px]"
        >
          <div class="flex items-center justify-start gap-2 mb-1">
            <div class="flex items-center justify-center">
              <SvgIcon name="late" />
            </div>
            <p class="text-[14px] font-[500] text-[#4D5761]">
              {{ isRtl ? "إجمالي التأخيرات" : "Total Late" }}
            </p>
          </div>
          <div class="mt-2 text-[24px] font-bold text-[#111827]">
            {{ summary.total_late || 0 }}
          </div>
        </Card>

        <!-- Overtime Workers -->
        <Card
          class="!p-4 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group min-h-[120px]"
        >
          <div class="flex items-center justify-start gap-2 mb-1">
            <div class="flex items-center justify-center">
              <SvgIcon name="overtime" />
            </div>
            <p class="text-[14px] font-[500] text-[#4D5761]">
              {{
                isRtl ? "إجمالي ساعات العمل الإضافي" : "Total Overtime Hours"
              }}
            </p>
          </div>
          <div class="mt-2 text-[24px] font-bold text-[#111827]">
            {{ summary.total_overtime_hours || 0 }}
          </div>
        </Card>

        <!-- Pending Requests -->
        <Card
          class="!p-4 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group min-h-[120px]"
        >
          <div class="flex items-center justify-start gap-2 mb-1">
            <div class="flex items-center justify-center">
              <SvgIcon name="pending" />
            </div>
            <p class="text-[14px] font-[500] text-[#4D5761]">
              {{ $t("dashboard.summary_total_requests_pending") }}
            </p>
          </div>
          <div class="mt-2 text-[24px] font-bold text-[#111827]">
            {{ summary.total_requests_pending || 0 }}
          </div>
        </Card>
      </div>
    </Card>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Right (or left in RTL): Monthly Attendance Trend -->
      <div class="lg:col-span-2 space-y-6">
        <Card v-if="loading">
          <template #header>
            <div class="flex items-center justify-between">
              <Skeleton width="w-40" height="h-5" />
              <Skeleton width="w-24" height="h-10" />
            </div>
          </template>
          <div class="p-6">
            <Skeleton width="w-full" height="h-[300px]" />
          </div>
        </Card>
        <Card v-else class="h-full">
          <template #header>
            <div class="flex items-center justify-between no-print">
              <h2 class="text-[16px] font-[600] text-[#333333]">
                {{ $t("dashboard.attendance_summary") }}
              </h2>
              <Menu as="div" class="relative inline-block text-left">
                <MenuButton as="template">
                  <Button variant="primary" size="md">
                    <SvgIcon name="export" />
                    <span class="ms-1 me-2">{{ $t("employees.export") }}</span>
                    <SvgIcon name="down" />
                  </Button>
                </MenuButton>

                <transition
                  enter-active-class="transition duration-100 ease-out"
                  enter-from-class="transform scale-95 opacity-0"
                  enter-to-class="transform scale-100 opacity-100"
                  leave-active-class="transition duration-75 ease-in"
                  leave-from-class="transform scale-100 opacity-100"
                  leave-to-class="transform scale-95 opacity-0"
                >
                  <MenuItems
                    class="absolute right-0 mt-2 w-30 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50 text-start"
                  >
                    <div class="px-1 py-1">
                      <MenuItem v-slot="{ active }">
                        <button
                          @click="handleExport('pdf', 'monthly')"
                          :class="[
                            active
                              ? 'bg-[#0E5F4A] text-white'
                              : 'text-[#384250]',
                            'cursor-pointer mb-1 group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                          ]"
                        >
                          PDF
                        </button>
                      </MenuItem>
                      <MenuItem v-slot="{ active }">
                        <button
                          @click="handleExport('excel', 'monthly')"
                          :class="[
                            active
                              ? 'bg-[#0E5F4A] text-white'
                              : 'text-[#384250]',
                            'cursor-pointer mb-1 group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                          ]"
                        >
                          Excel
                        </button>
                      </MenuItem>
                    </div>
                  </MenuItems>
                </transition>
              </Menu>
            </div>
          </template>

          <div class="flex items-center justify-end px-4 py-2">
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#0E5F4A]"></span>
                <span class="text-[13px] font-[500] text-[#4D5761]">{{
                  isRtl ? "حضور" : "Present"
                }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#54C08A]"></span>
                <span class="text-[13px] font-[500] text-[#4D5761]">{{
                  isRtl ? "غياب" : "Absent"
                }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]"></span>
                <span class="text-[13px] font-[500] text-[#4D5761]">{{
                  isRtl ? "تأخير" : "Late"
                }}</span>
              </div>
            </div>
          </div>

          <div :class="isRtl ? 'rtl-chart' : 'ltr-chart'" class="p-4">
            <apexchart
              type="bar"
              height="338"
              :options="monthlyStatisticsOptions"
              :series="monthlyStatisticsSeries"
            />
          </div>
        </Card>
      </div>
      <!-- Left (or right in RTL): Latest Requests -->
      <div class="lg:col-span-1 space-y-6">
        <Card v-if="loading" class="overflow-hidden">
          <template #header>
            <div class="flex items-center justify-between">
              <Skeleton width="w-32" height="h-5" />
              <Skeleton width="w-16" height="h-4" />
            </div>
          </template>
          <div class="p-4 space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <Skeleton width="w-full" height="h-16" radius="rounded-xl" />
              <Skeleton width="w-full" height="h-16" radius="rounded-xl" />
              <Skeleton width="w-full" height="h-16" radius="rounded-xl" />
            </div>
            <div v-for="i in 3" :key="i" class="space-y-2">
              <div class="flex justify-between">
                <Skeleton width="w-24" height="h-3" />
                <Skeleton width="w-20" height="h-6" radius="rounded-full" />
              </div>
              <Skeleton width="w-40" height="h-4" />
            </div>
          </div>
        </Card>
        <Card v-else class="overflow-hidden h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-[16px] font-[600] text-[#333333]">
                {{
                  isRtl ? "طلبات الإجازات والأذونات الأخيرة" : "Latest Requests"
                }}
              </h2>
              <router-link
                to="/requests/leave"
                class="text-[13px] text-[#0E5F4A] font-[500] hover:underline"
              >
                {{ isRtl ? "عرض جميع الطلبات" : "View All" }}
              </router-link>
            </div>
          </template>

          <div class="px-4 pb-4 pt-1" v-if="latestRequests.length">
            <div class="grid grid-cols-3 gap-3">
              <div
                class="bg-[#F8FBFA] border border-[#F1F7F5] rounded-xl p-3 text-center transition-all duration-300 group"
              >
                <p class="text-[11px] font-[500] text-[#4D5761] mb-1">
                  {{ isRtl ? "تمت الموافقة" : "Approved" }}
                </p>
                <p class="text-[20px] font-bold text-[#0E5F4A] leading-tight">
                  {{ requestCounts.approved }}
                </p>
              </div>
              <div
                class="bg-[#F8FBFA] border border-[#F1F7F5] rounded-xl p-3 text-center transition-all duration-300 group"
              >
                <p class="text-[11px] font-[500] text-[#4D5761] mb-1">
                  {{ isRtl ? "مرفوضة" : "Rejected" }}
                </p>
                <p class="text-[20px] font-bold text-[#0E5F4A] leading-tight">
                  {{ requestCounts.rejected }}
                </p>
              </div>
              <div
                class="bg-[#F8FBFA] border border-[#F1F7F5] rounded-xl p-3 text-center transition-all duration-300 group"
              >
                <p class="text-[11px] font-[500] text-[#4D5761] mb-1">
                  {{ isRtl ? "قيد الانتظار" : "Pending" }}
                </p>
                <p class="text-[20px] font-bold text-[#0E5F4A] leading-tight">
                  {{ requestCounts.pending }}
                </p>
              </div>
            </div>
          </div>

          <div
            class="divide-y divide-gray-100 max-h-[500px] overflow-y-auto custom-scrollbar"
          >
            <div
              v-if="!latestRequests.length"
              class="p-8 text-center text-[#6C737F]"
            >
              <img
                src="@/assets/images/no_results.png"
                alt="no_results"
                class="mx-1 max-w-[201px] max-h-[163px] mb-3 mx-auto"
              />
            </div>
            <div
              v-for="request in latestRequests"
              :key="request.id"
              class="p-4 hover:bg-[#F8FBFA] transition-colors"
            >
              <div class="flex items-center justify-between mb-2">
                <div
                  class="flex items-center gap-1.5 text-[11px] text-[#6C737F]"
                >
                  <SvgIcon name="clock_sm" size="14" />
                  <span>{{
                    formatDate(request.from_date || request.date)
                  }}</span>
                </div>
                <span
                  class="px-2 py-0.5 rounded-full text-[12px] font-[500] flex items-center gap-1.5"
                  :class="getStatusColor(request.status)"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {{
                    request.status_label?.includes("messages.")
                      ? $t(request.status_label)
                      : request.status_label
                  }}
                </span>
              </div>
              <h3
                class="text-[14px] font-[600] text-[#111827] leading-tight flex items-center justify-between"
              >
                <span>{{ request.employee?.name || "-" }}</span>
                <!-- <div class="flex gap-2">
                  <button
                    @click.stop="handleApprove(request.id)"
                    class="cursor-pointer"
                    v-tooltip="
                      t('common.actionTooltips.approve.title', { target: '' })
                    "
                  >
                    <SvgIcon name="accept" />
                  </button>
                  <button
                    @click.stop="handleReject(request.id)"
                    class="cursor-pointer"
                    v-tooltip="
                      t('common.actionTooltips.reject.title', { target: '' })
                    "
                  >
                    <SvgIcon name="reject" />
                  </button>
                </div> -->
              </h3>
              <p class="text-[12px] text-[#6C737F] mt-1">
                {{ request.type_label }}
                {{ request.duration ? `(${request.duration})` : "" }}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- Third Row: Donut Charts -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Overall Attendance Breakdown -->
      <Card v-if="loading">
        <template #header>
          <Skeleton width="w-48" height="h-5" />
        </template>
        <div class="p-10 flex justify-center">
          <Skeleton width="w-48" height="h-48" radius="rounded-full" />
        </div>
      </Card>
      <Card v-else>
        <template #header>
          <div class="flex items-center gap-2">
            <h2 class="text-[16px] font-[600] text-[#333333]">
              {{ isRtl ? "ملخص الاجازات" : "Leave Summary" }}
            </h2>
            <div
              class="px-2 py-0.5 bg-[#E7EFED] text-[#0E5F4A] rounded-full text-[12px] font-[500] border border-[#0E5F4A]"
            >
              {{ formattedCurrentDateBadge }}
            </div>
          </div>
        </template>
        <div :class="isRtl ? 'rtl-chart' : 'ltr-chart'" class="py-4">
          <apexchart
            v-if="hasAttendanceData"
            type="donut"
            height="350"
            :options="attendanceBreakdownOptions"
            :series="attendanceBreakdownSeries"
          />
          <div v-else class="py-12 text-center text-[#6C737F]">
            <img
              src="@/assets/images/no_results.png"
              alt="no_results"
              class="mx-auto max-w-[201px] max-h-[163px] mb-3"
            />
          </div>
        </div>
      </Card>

      <!-- Overall Permissions Breakdown -->
      <Card v-if="loading">
        <template #header>
          <Skeleton width="w-48" height="h-5" />
        </template>
        <div class="p-10 flex justify-center">
          <Skeleton width="w-48" height="h-48" radius="rounded-full" />
        </div>
      </Card>
      <Card v-else>
        <template #header>
          <div class="flex items-center gap-2">
            <h2 class="text-[16px] font-[600] text-[#333333]">
              {{ isRtl ? "ملخص الأذونات" : "Permissions Summary" }}
            </h2>
            <div
              class="px-2 py-0.5 bg-[#E7EFED] text-[#0E5F4A] rounded-full text-[12px] font-[500] border border-[#0E5F4A]"
            >
              {{ formattedCurrentDateBadge }}
            </div>
          </div>
        </template>
        <div :class="isRtl ? 'rtl-chart' : 'ltr-chart'" class="py-4">
          <apexchart
            v-if="hasPermissionsData"
            type="donut"
            height="350"
            :options="permissionsBreakdownOptions"
            :series="permissionsBreakdownSeries"
          />
          <div v-else class="py-12 text-center text-[#6C737F]">
            <img
              src="@/assets/images/no_results.png"
              alt="no_results"
              class="mx-auto max-w-[201px] max-h-[163px] mb-3"
            />
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import Card from "@/components/ui/Card.vue";
import Select from "@/components/ui/Select.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Skeleton from "@/components/ui/Skeleton.vue";
import hrDashboardService from "@/services/hrDashboard.js";
import { useAuthStore } from "@/stores/auth";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";
import { useToast } from "vue-toastification";
import DateRangePicker from "../ui/DateRangePicker.vue";

const { t, locale } = useI18n();
const isRtl = computed(() => locale.value === "ar");
const authStore = useAuthStore();
const toast = useToast();

const loading = ref(true);
const isFiltersVisible = ref(false);
const summary = ref({});
const attendanceBreakdown = ref([]);
const permissionsBreakdown = ref([]);
const monthlyTrend = ref([]);
const monthlyStatistics = ref([]);
const latestRequests = ref([]);
const accessibleDepartments = ref([]);

const filters = reactive({
  department_id: null,
  date: new Date().toISOString().split("T")[0],
  from_date: "",
  to_date: "",
});

const departmentOptions = computed(() =>
  accessibleDepartments.value.map((d) => ({
    label: isRtl.value ? d.name_ar : d.name,
    value: d.id,
  })),
);

const formattedCurrentDateBadge = computed(() => {
  const dateToFormat = filters.date
    ? new Date(
        filters.date.split("-")[0],
        filters.date.split("-")[1] - 1,
        filters.date.split("-")[2],
      )
    : new Date();

  const dayName = dateToFormat.toLocaleDateString(
    locale.value === "ar" ? "ar-EG" : "en-US",
    { weekday: "long" },
  );
  const day = dateToFormat.getDate();
  const monthName = dateToFormat.toLocaleDateString(
    locale.value === "ar" ? "ar-EG" : "en-US",
    { month: "long" },
  );
  return `${dayName} - ${day} ${monthName}`;
});

const requestCounts = computed(() => {
  return {
    pending: latestRequests.value.filter((r) => r.status === "pending").length,
    approved: latestRequests.value.filter((r) => r.status === "approved")
      .length,
    rejected: latestRequests.value.filter((r) => r.status === "rejected")
      .length,
  };
});

const fetchData = async () => {
  loading.value = true;
  const params = {
    department_id: filters.department_id,
  };

  if (filters.from_date && filters.to_date) {
    params.from_date = filters.from_date;
    params.to_date = filters.to_date;
  } else {
    params.date = filters.date;
  }
  try {
    // We can fetch initial lists and then data
    if (accessibleDepartments.value.length === 0) {
      const deptsRes = await hrDashboardService.getDashboardDepartments();
      const resData = deptsRes.data;
      accessibleDepartments.value = Array.isArray(resData)
        ? resData
        : resData?.data || resData?.departments || [];
    }

    const res = await hrDashboardService.getDashboard(params);
    const data = res.data.data;

    summary.value = data.summary || {};
    attendanceBreakdown.value = data.attendance_breakdown || [];
    permissionsBreakdown.value = data.permissions_breakdown || [];
    monthlyTrend.value = data.monthly_trend || [];
    monthlyStatistics.value = data.monthly_statistics || [];
    latestRequests.value = data.latest_requests || [];

    if (data.accessible_departments) {
      accessibleDepartments.value = data.accessible_departments;
    }
  } catch (error) {
    console.error("Error fetching HR dashboard data:", error);
    toast.error(t("common.error"));
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  fetchData();
};

const resetFilters = () => {
  filters.department_id = null;
  // filters.date = null;
  filters.from_date = null;
  filters.to_date = null;
  fetchData();
};

const handleApprove = async (id) => {
  // In a real app, there would be an endpoint for this.
  // Given the prompt doesn't specify HR-specific approve endpoints,
  // we use a generic placeholder or the manager dashboard service if applicable.
  toast.info("Approving request " + id);
};

const handleReject = async (id) => {
  toast.info("Rejecting request " + id);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toISOString().split("T")[0];
};

const getStatusColor = (status) => {
  switch (status) {
    case "approved":
      return "text-[#085D3A] bg-[#ECFDF3]";
    case "pending":
      return "text-[#B54708] bg-[#FFFAEB]";
    case "rejected":
      return "text-[#B42318] bg-[#FEF3F2]";
    default:
      return "text-[#4D5761] bg-[#E5E7EB]";
  }
};

// --- Chart Options & Series ---

const monthlyStatisticsSeries = computed(() => [
  {
    name: isRtl.value ? "حضور" : "Present",
    data: monthlyStatistics.value.map((d) => d.present || 0),
  },
  {
    name: isRtl.value ? "غياب" : "Absent",
    data: monthlyStatistics.value.map((d) => parseInt(d.absent) || 0),
  },
  {
    name: isRtl.value ? "تأخير" : "Late",
    data: monthlyStatistics.value.map((d) => d.late || 0),
  },
]);

const monthlyStatisticsOptions = computed(() => ({
  chart: {
    type: "bar",
    stacked: true,
    toolbar: { show: false },
    fontFamily: "inherit",
    rtl: isRtl.value,
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: "32px",
      borderRadius: 4,
    },
  },
  colors: ["#0E5F4A", "#54C08A", "#E5E7EB"],
  dataLabels: { enabled: false },
  xaxis: {
    categories: monthlyStatistics.value.map((d) =>
      isRtl.value ? d.month_name_ar : d.month_name,
    ),
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: { formatter: (val) => val.toFixed(0) },
  },
  legend: { show: false },
  grid: { borderColor: "#f1f1f1" },
  tooltip: { theme: "light" },
  states: {
    hover: {
      filter: { type: "none" },
    },
    active: {
      filter: { type: "none" },
    },
  },
}));

const attendanceBreakdownSeries = computed(() => {
  return attendanceBreakdown.value.map((item) => item.count);
});

const attendanceBreakdownOptions = computed(() => ({
  labels: attendanceBreakdown.value.map((item) => item.status_label),
  colors: ["#0E5F4A", "#1B8354", "#54C08A", "#B8EACB", "#E7EFED"],
  chart: { type: "donut", fontFamily: "inherit", rtl: isRtl.value },
  dataLabels: { enabled: false },
  legend: {
    position: "bottom",
    markers: { radius: 12, shape: "circle" },
    onItemHover: {
      highlightDataSeries: false,
    },
  },
  stroke: { show: false },
  plotOptions: {
    pie: { donut: { size: "58%" } },
  },
  states: {
    hover: {
      filter: { type: "none" },
    },
    active: {
      filter: { type: "none" },
    },
  },
}));

const permissionsBreakdownSeries = computed(() => {
  return permissionsBreakdown.value.map((item) => item.count);
});

const permissionsBreakdownOptions = computed(() => ({
  labels: permissionsBreakdown.value.map(
    (item) => `${item.type_label} (${item.status_label})`,
  ),
  colors: ["#074D31", "#0E5F4A", "#1B8354", "#54C08A", "#B8EACB"],
  chart: { type: "donut", fontFamily: "inherit", rtl: isRtl.value },
  dataLabels: { enabled: false },
  legend: {
    position: "bottom",
    markers: { radius: 12, shape: "circle" },
    onItemHover: {
      highlightDataSeries: false,
    },
  },
  stroke: { show: false },
  plotOptions: {
    pie: { donut: { size: "58%" } },
  },
  states: {
    hover: {
      filter: { type: "none" },
    },
    active: {
      filter: { type: "none" },
    },
  },
}));

const hasAttendanceData = computed(() =>
  attendanceBreakdownSeries.value.some((v) => v > 0),
);

const hasPermissionsData = computed(() =>
  permissionsBreakdownSeries.value.some((v) => v > 0),
);

const formatValue = (val) =>
  val === null || val === undefined || val === "" ? "-" : val;

const handleExport = async (format, chartType) => {
  let data = [];
  let fileName = "";
  let headers = [];

  if (chartType === "monthly") {
    fileName = "attendance_monthly_summary";
    headers = [
      t("common.date"),
      isRtl.value ? "حضور" : "Present",
      isRtl.value ? "غياب" : "Absent",
      isRtl.value ? "تأخير" : "Late",
    ];
    data = monthlyStatistics.value.map((d) => ({
      [headers[0]]: formatValue(isRtl.value ? d.month_name_ar : d.month_name),
      [headers[1]]: formatValue(d.present),
      [headers[2]]: formatValue(d.absent),
      [headers[3]]: formatValue(d.late),
    }));
  } else {
    // Default global summary
    fileName = "dashboard_summary";
    headers = [t("common.field"), t("common.value")];
    data = [
      {
        [t("common.field")]: t("dashboard.summary_total_attendance"),
        [t("common.value")]: formatValue(summary.value.total_attendance),
      },
      {
        [t("common.field")]: t("dashboard.summary_total_absent"),
        [t("common.value")]: formatValue(summary.value.total_absent),
      },
      {
        [t("common.field")]: isRtl.value ? "إجمالي التأخيرات" : "Total Late",
        [t("common.value")]: formatValue(summary.value.total_late),
      },
      {
        [t("common.field")]: isRtl.value
          ? "إجمالي ساعات العمل الإضافي"
          : "Total Overtime Hours",
        [t("common.value")]: formatValue(summary.value.total_overtime_hours),
      },
      {
        [t("common.field")]: t("dashboard.summary_total_requests_pending"),
        [t("common.value")]: formatValue(summary.value.total_requests_pending),
      },
    ];
  }

  if (format === "excel") {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${fileName}_${new Date().getTime()}.xlsx`);
  } else if (format === "pdf") {
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });

    try {
      const regularFontRes = await fetch(IBMPlexSansArabicRegular);
      const regularFontBuffer = await regularFontRes.arrayBuffer();
      const boldFontRes = await fetch(IBMPlexSansArabicBold);
      const boldFontBuffer = await boldFontRes.arrayBuffer();

      doc.addFileToVFS(
        "IBMPlexSansArabic-Regular.ttf",
        arrayBufferToBase64(regularFontBuffer),
      );
      doc.addFont(
        "IBMPlexSansArabic-Regular.ttf",
        "IBMPlexSansArabic",
        "normal",
      );
      doc.addFileToVFS(
        "IBMPlexSansArabic-Bold.ttf",
        arrayBufferToBase64(boldFontBuffer),
      );
      doc.addFont("IBMPlexSansArabic-Bold.ttf", "IBMPlexSansArabic", "bold");

      doc.setFont("IBMPlexSansArabic", "normal");

      const isArabic = isRtl.value;
      let pdfHeaders = [...headers];
      let rows = data.map((item) => Object.values(item));

      if (isArabic) {
        pdfHeaders = pdfHeaders.reverse();
        rows = rows.map((r) => r.reverse());
      }

      // Draw Header with Title and Dates (if applicable)
      let pdfTitle = "";
      if (chartType === "monthly") {
        pdfTitle = isArabic
          ? "ملخص الحضور الشهري"
          : t("dashboard.attendance_summary");
      } else {
        pdfTitle = isArabic ? "ملخص عام للوحة التحكم" : "Dashboard Summary";
      }

      drawPdfHeader(doc, authStore, isArabic, pdfTitle, filters.date);

      autoTable(doc, {
        startY: pdfTitle ? 52 : 45,
        head: [pdfHeaders],
        body: rows,
        styles: {
          font: "IBMPlexSansArabic",
          fontStyle: "normal",
          halign: isArabic ? "right" : "left",
          fontSize: 9,
        },
        headStyles: {
          fillColor: [14, 95, 74],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        margin: { top: 45, bottom: 25 },
        didParseCell: (data) => {
          data.cell.styles.font = "IBMPlexSansArabic";
          if (data.section === "head") {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      // Draw Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawPdfFooter(doc, authStore, i, totalPages, isArabic);
      }

      doc.save(`${fileName}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast.error(t("common.error"));
    }
  }
};

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
:deep(.apexcharts-legend-text) {
  color: #384250 !important;
  font-size: 14px !important;
}
:deep(.apexcharts-xaxis-label),
:deep(.apexcharts-yaxis-label) {
  fill: #384250 !important;
  font-size: 14px !important;
}
:deep(.rtl-chart .apexcharts-legend-series) {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 8px;
}
:deep(.ltr-chart .apexcharts-legend-series) {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
:deep(.apexcharts-canvas),
:deep(.apexcharts-svg) {
  outline: none !important;
}
</style>
