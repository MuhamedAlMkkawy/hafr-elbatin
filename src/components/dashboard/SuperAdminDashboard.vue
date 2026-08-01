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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{
              $t("branches.fields.name")
            }}</label>
            <Select
              v-model="filters.branch_id"
              :options="branchOptions"
              :placeholder="$t('branches.fields.name')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{
              $t("employees.placeholders.departmentOrSection")
            }}</label>
            <Select
              v-model="filters.department_id"
              :options="departmentOptions"
              :placeholder="$t('employees.placeholders.departmentOrSection')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{
              $t("common.date")
            }}</label>
            <DateRangePicker
              v-model:startDate="filters.from_date"
              v-model:endDate="filters.to_date"
              :placeholder="$t('common.date')"
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
          class="p-3 border border-[#F1F7F5] bg-[#F8FBFA] rounded-lg h-[100px] flex flex-col justify-between"
        >
          <div class="flex items-center gap-2 mb-2">
            <Skeleton width="w-8" height="h-8" radius="rounded-lg" />
            <Skeleton width="w-32" height="h-4" />
          </div>
          <Skeleton width="w-20" height="h-8" />
        </div>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Total Attendance -->
        <Card
          class="!p-3 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group"
        >
          <div class="flex items-center justify-start gap-2 mb-1">
            <div>
              <SvgIcon name="group" />
            </div>
            <div class="space-y-1">
              <p class="text-[14px] font-[500] text-[#1F2A37]">
                {{ $t("dashboard.summary_total_attendance") }}
              </p>
            </div>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-[16px] text-[#6C737F]"
              >{{ summary.total_employees || 0 }} /</span
            >
            <span class="text-[24px] font-bold text-[#1F2A37]">{{
              summary.total_attendance || 0
            }}</span>
          </div>
        </Card>

        <!-- Total Absent -->
        <Card
          class="!p-3 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group"
        >
          <div class="flex items-center justify-start gap-2 mb-1">
            <div>
              <SvgIcon name="absence" />
            </div>
            <p class="text-[14px] font-[500] text-[#1F2A37]">
              {{ $t("dashboard.summary_total_absent") }}
            </p>
          </div>
          <span class="text-[24px] font-bold text-[#1F2A37]">{{
            summary.total_absent || 0
          }}</span>
        </Card>

        <!-- Total Late -->
        <Card
          class="!p-3 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group"
        >
          <div class="flex items-center justify-start gap-2 mb-1">
            <div>
              <SvgIcon name="late" />
            </div>
            <p class="text-[14px] font-[500] text-[#1F2A37]">
              {{ $t("dashboard.summary_total_late") }}
            </p>
          </div>
          <span class="text-[24px] font-bold text-[#1F2A37]">{{
            summary.total_late || 0
          }}</span>
        </Card>

        <!-- Overtime Workers -->
        <Card
          class="!p-3 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group"
        >
          <div class="flex items-center justify-start gap-2 mb-1">
            <div>
              <SvgIcon name="overtime" />
            </div>
            <p class="text-[14px] font-[500] text-[#1F2A37]">
              {{ $t("dashboard.summary_total_overtime_workers") }}
            </p>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-[24px] font-bold text-[#1F2A37]">{{
              summary.total_overtime_hours || 0
            }}</span>
          </div>
        </Card>

        <!-- Pending Requests -->
        <Card
          class="!p-3 !border !border-[#F1F7F5] !bg-[#F8FBFA] flex flex-col justify-between relative overflow-hidden group"
        >
          <div class="flex items-center justify-start gap-2 mb-1">
            <div>
              <SvgIcon name="pending" />
            </div>
            <p class="text-[14px] font-[500] text-[#1F2A37]">
              {{ $t("dashboard.summary_total_requests_pending") }}
            </p>
          </div>
          <span class="text-[24px] font-bold text-[#1F2A37]">{{
            summary.total_requests_pending || 0
          }}</span>
        </Card>
      </div>
    </Card>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 gap-6">
      <!-- Attendance Bar Chart -->
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
      <Card v-else>
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
                        @click="handleExport('pdf', 'attendance')"
                        :class="[
                          active ? 'bg-[#0E5F4A] text-white' : 'text-[#384250]',
                          'cursor-pointer mb-1 group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                        ]"
                      >
                        PDF
                      </button>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <button
                        @click="handleExport('excel', 'attendance')"
                        :class="[
                          active ? 'bg-[#0E5F4A] text-white' : 'text-[#384250]',
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
        <div class="flex items-center justify-between">
          <p class="text-[14px] text-[#7F7F7F] font-[500]">
            {{
              isRtl
                ? "تحليل الحضور والغياب والتأخر السنوي"
                : "Yearly attendance, absence and late entry analysis"
            }}
          </p>
          <div v-if="!loading" class="flex items-center justify-start mb-1">
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#1B8354]"></span>
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
        </div>
        <div :class="isRtl ? 'rtl-chart' : 'ltr-chart'" class="py-4">
          <apexchart
            type="bar"
            height="338"
            :options="attendanceBarOptions"
            :series="attendanceBarSeries"
          />
        </div>
      </Card>

      <!-- Requests Line Chart -->
      <Card v-if="loading">
        <template #header>
          <div class="flex items-center justify-between">
            <Skeleton width="w-40" height="h-5" />
            <Skeleton width="w-24" height="h-10" />
          </div>
        </template>
        <div class="p-6">
          <Skeleton width="w-full" height="h-[250px]" />
        </div>
      </Card>
      <Card v-else>
        <template #header>
          <div class="flex items-center justify-between no-print">
            <h2 class="text-[16px] font-[600] text-[#333333]">
              {{ $t("dashboard.requests_summary") }}
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
                        @click="handleExport('pdf', 'requests')"
                        :class="[
                          active ? 'bg-[#0E5F4A] text-white' : 'text-[#384250]',
                          'cursor-pointer mb-1 group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                        ]"
                      >
                        PDF
                      </button>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <button
                        @click="handleExport('excel', 'requests')"
                        :class="[
                          active ? 'bg-[#0E5F4A] text-white' : 'text-[#384250]',
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
        <div class="flex items-center justify-between">
          <p class="text-[14px] text-[#7F7F7F] font-[500]">
            {{
              isRtl
                ? "تحليل طلبات الإجازات والأذونات والمهام الخارجية"
                : "Analysis of leave, permission and external mission requests"
            }}
          </p>
          <div v-if="!loading" class="flex items-center justify-start mb-1">
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#074D31]"></span>
                <span class="text-[13px] font-[500] text-[#4D5761]">{{
                  isRtl ? "إجازات" : "Leaves"
                }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#1B8354]"></span>
                <span class="text-[13px] font-[500] text-[#4D5761]">{{
                  isRtl ? "أذونات" : "Permissions"
                }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#B8EACB]"></span>
                <span class="text-[13px] font-[500] text-[#4D5761]">{{
                  isRtl ? "مهام خارجية" : "External Missions"
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <div :class="isRtl ? 'rtl-chart' : 'ltr-chart'" class="py-4">
          <apexchart
            type="area"
            height="265"
            :options="requestsLineOptions"
            :series="
              isRtl ? [...requestsLineSeries].reverse() : requestsLineSeries
            "
          />
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
import DateRangePicker from "@/components/ui/DateRangePicker.vue";
import Button from "@/components/ui/Button.vue";
import Icon from "@/components/ui/Icon.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import adminDashboardService from "@/services/adminDashboard.js";
import Skeleton from "@/components/ui/Skeleton.vue";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "vue-toastification";

const { t, locale } = useI18n();
const isRtl = computed(() => locale.value === "ar");

const authStore = useAuthStore();
const toast = useToast();

const loading = ref(true);
const isFiltersVisible = ref(false);
const summary = ref({});
const branches = ref([]);
const departments = ref([]);

const filters = reactive({
  branch_id: null,
  department_id: null,
  from_date: "",
  to_date: "",
  year: new Date().getFullYear(),
});

const requestsTrendData = ref([]);

// Options
const branchOptions = computed(() =>
  branches.value.map((b) => ({
    label: isRtl.value ? b.name_ar : b.name,
    value: b.id,
  })),
);

const departmentOptions = computed(() =>
  departments.value.map((d) => ({
    label: isRtl.value ? d.name_ar : d.name,
    value: d.id,
  })),
);

const formatApiDate = (dateStr) => {
  if (!dateStr || !dateStr.includes("/")) return dateStr;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return dateStr;
  let [month, day, year] = parts;
  if (year.length === 2) year = "20" + year;
  return `${year}-${month}-${day}`;
};

const formatValue = (val) =>
  val === null || val === undefined || val === "" ? "-" : val;

// Fetch Data
const fetchData = async () => {
  loading.value = true;
  try {
    const from_date = formatApiDate(filters.from_date);
    const to_date = formatApiDate(filters.to_date);

    const response = await adminDashboardService.getDashboard({
      branch_id: filters.branch_id,
      department_id: filters.department_id,
      from_date,
      to_date,
    });

    const resData = response.data.data || response.data;
    summary.value = resData.summary || {};
    requestsTrendData.value = resData.yearly_requests_trend || [];

    // Populate branches if not already done (though usually done in separate call)
    if (resData.accessible_branches && !branches.value.length) {
      branches.value = resData.accessible_branches;
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  } finally {
    loading.value = false;
  }
};

const fetchBranches = async () => {
  try {
    const { data } = await adminDashboardService.getAccessibleBranches();
    branches.value = data.data || data;
  } catch (error) {
    console.error("Error fetching branches:", error);
  }
};

const fetchDepartments = async () => {
  try {
    const response = await adminDashboardService.getDashboardDepartments({
      branch_id: filters.branch_id,
    });
    const resData = response.data;
    departments.value = Array.isArray(resData)
      ? resData
      : resData?.data || resData?.departments || [];
  } catch (error) {
    console.error("Error fetching departments:", error);
  }
};

const resetFilters = () => {
  filters.branch_id = null;
  filters.department_id = null;
  filters.from_date = "";
  filters.to_date = "";
  fetchData();
};

const applyFilters = () => {
  fetchData();
};

const handleExport = async (format, chartType) => {
  let data = [];
  let fileName = "";
  let headers = [];

  if (chartType === "attendance") {
    fileName = "attendance_summary";
    headers = [
      t("common.date"),
      isRtl.value ? "حضور" : "Present",
      isRtl.value ? "غياب" : "Absent",
      isRtl.value ? "تأخير" : "Late",
    ];
    data = requestsTrendData.value.map((d) => ({
      [headers[0]]: formatValue(isRtl.value ? d.month_name_ar : d.month_name),
      [headers[1]]: formatValue(d.attendance),
      [headers[2]]: formatValue(d.absence),
      [headers[3]]: formatValue(d.late),
    }));
  } else if (chartType === "requests") {
    fileName = "requests_summary";
    headers = [
      t("common.date"),
      isRtl.value ? "إجازات" : "Leaves",
      isRtl.value ? "أذونات" : "Permissions",
      isRtl.value ? "مهام خارجية" : "External Missions",
    ];
    data = requestsTrendData.value.map((d) => ({
      [headers[0]]: formatValue(isRtl.value ? d.month_name_ar : d.month_name),
      [headers[1]]: formatValue(d.leaves),
      [headers[2]]: formatValue(d.permissions),
      [headers[3]]: formatValue(d.external_missions),
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
        [t("common.field")]: t("dashboard.summary_total_late"),
        [t("common.value")]: formatValue(summary.value.total_late),
      },
      {
        [t("common.field")]: t("dashboard.summary_total_overtime_workers"),
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
      if (chartType === "attendance") {
        pdfTitle = isArabic
          ? "ملخص الحضور والإنصراف"
          : t("dashboard.attendance_summary");
      } else if (chartType === "requests") {
        pdfTitle = isArabic
          ? "ملخص الطلبات والإجازات"
          : t("dashboard.requests_summary");
      } else {
        pdfTitle = isArabic ? "ملخص عام للوحة التحكم" : "Dashboard Summary";
      }

      drawPdfHeader(
        doc,
        authStore,
        isArabic,
        pdfTitle,
        filters.from_date,
        filters.to_date,
      );

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

// Chart Options
const attendanceBarSeries = computed(() => [
  {
    name: isRtl.value ? "حضور" : "Present",
    data: requestsTrendData.value.map((d) => d.attendance),
  },
  {
    name: isRtl.value ? "غياب" : "Absent",
    data: requestsTrendData.value.map((d) => d.absence),
  },
  {
    name: isRtl.value ? "تأخير" : "Late",
    data: requestsTrendData.value.map((d) => d.late),
  },
]);

const attendanceBarOptions = computed(() => ({
  chart: {
    type: "bar",
    stacked: true,
    toolbar: { show: false },
    fontFamily: "inherit",
    rtl: isRtl.value,
  },
  states: {
    hover: {
      filter: {
        type: "none",
      },
    },
    active: {
      filter: {
        type: "none",
      },
    },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: "32px",
      borderRadius: 4,
    },
  },
  colors: ["#1B8354", "#54C08A", "#E5E7EB"],
  dataLabels: { enabled: false },
  xaxis: {
    categories: requestsTrendData?.value?.map((d) =>
      isRtl.value ? d.month_name_ar : d.month_name,
    ),
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      formatter: (val) => val.toFixed(0),
    },
  },
  legend: {
    show: false,
    position: "top",
    horizontalAlign: isRtl.value ? "left" : "right",
    markers: { radius: 12, shape: "circle" },
    onItemClick: {
      toggleDataSeries: false,
    },
    onItemHover: {
      highlightDataSeries: false,
    },
  },
  grid: {
    borderColor: "#f1f1f1",
  },
  tooltip: {
    theme: "light",
    y: {
      formatter: (val) => val,
    },
  },
}));

const requestsLineSeries = computed(() => [
  {
    name: isRtl.value ? "إجازات" : "Leaves",
    data: requestsTrendData.value.map((d) => d.leaves),
  },
  {
    name: isRtl.value ? "أذونات" : "Permissions",
    data: requestsTrendData.value.map((d) => d.permissions),
  },
  {
    name: isRtl.value ? "مهام خارجية" : "External Missions",
    data: requestsTrendData.value.map((d) => d.external_missions),
  },
]);

const requestsLineOptions = computed(() => ({
  chart: {
    type: "area",
    toolbar: { show: false },
    fontFamily: "inherit",
    zoom: {
      enabled: false,
    },
    rtl: isRtl.value,
  },
  dataLabels: { enabled: false },
  stroke: {
    curve: "smooth",
    width: 2,
  },
  colors: isRtl.value
    ? ["#B8EACB", "#1B8354", "#074D31"]
    : ["#074D31", "#1B8354", "#B8EACB"],
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.05,
      stops: [20, 100, 100, 100],
    },
  },
  xaxis: {
    categories: requestsTrendData?.value?.map((d) =>
      isRtl.value ? d.month_name_ar : d.month_name,
    ),
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      formatter: (val) => val.toFixed(0),
    },
  },
  legend: {
    show: false,
    position: "top",
    horizontalAlign: isRtl.value ? "left" : "right",
    markers: { radius: 12, shape: "circle" },
    onItemClick: {
      toggleDataSeries: false,
    },
    onItemHover: {
      highlightDataSeries: false,
    },
  },
  grid: {
    borderColor: "#f1f1f1",
  },
  tooltip: {
    theme: "light",
  },
}));

watch(
  () => filters.branch_id,
  () => {
    filters.department_id = null;
    fetchDepartments();
  },
);

onMounted(() => {
  fetchBranches();
  fetchDepartments();
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
:deep(.apexcharts-legend-marker) {
  cursor: auto !important;
}
:deep(.apexcharts-canvas),
:deep(.apexcharts-svg) {
  outline: none !important;
}
</style>
