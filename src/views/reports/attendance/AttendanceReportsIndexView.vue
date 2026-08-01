<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Table from "@/components/ui/Table.vue";
import Select from "@/components/ui/Select.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import DateRangePicker from "@/components/ui/DateRangePicker.vue";
import attendanceReportsService from "@/services/attendanceReports";
import branchService from "@/services/branches";
import departmentService from "@/services/departments";
import adminDashboardService from "@/services/adminDashboard";
import employeeService from "@/services/employees";

import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";

import PrintHeader from "@/components/ui/PrintHeader.vue";
import PrintFooter from "@/components/ui/PrintFooter.vue";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";
import { useAuthStore } from "@/stores/auth";

const { t, locale } = useI18n();
const toast = useAppToast();
const router = useRouter();
const authStore = useAuthStore();

// State
const records = ref([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);
const perPage = ref(10);
const printRecords = ref([]);
const printTotalPages = ref(1);

// Filters
const filters = ref({
  department_id: "",
  branch_id: "",
  employee_id: "",
  year: "",
  month: "",
  from_date: "",
  to_date: "",
  work_system_type: "",

  // sorting (UI)
  sort_by: "",
  sort_direction: "asc",
});

const handleSort = (key) => {
  const sortFieldMap = {
    employee_name: "employee_id",
    branch: "branch_id",
    department: "department_id",
    work_system_type: "work_system_type",
    work_days: "work_days",
    attendance_days: "attendance_days",
    absence_days: "absence_days",
    leave_days: "leave_days",
    delay_minutes: "delay_minutes",
    early_leave_minutes: "early_leave_minutes",
    overtime_minutes: "overtime_minutes",
    total_working_hours: "total_working_hours",
  };

  const apiKey = sortFieldMap[key] || key;

  // compare using API key (NOT UI key)
  if (filters.value.sort_by === apiKey) {
    filters.value.sort_direction =
      filters.value.sort_direction === "asc" ? "desc" : "asc";
  } else {
    filters.value.sort_by = apiKey;
    filters.value.sort_direction = "asc";
  }

  applyFilters();
};

const branches = ref([]);
const departments = ref([]);
const employees = ref([]);

const monthOptions = computed(() => {
  const options = [];
  for (let i = 1; i <= 12; i++) {
    const monthName = new Intl.DateTimeFormat(locale.value, {
      month: "long",
    }).format(new Date(2021, i - 1, 1));
    options.push({ label: monthName, value: i.toString() });
  }
  return options;
});

const workTypes = computed(() => [
  { label: t("employees.workSystemTypes.fixed"), value: "fixed" },
  { label: t("employees.workSystemTypes.shift"), value: "shift" },
]);

const fetchBranches = async () => {
  try {
    const response = await branchService.list({ paginate: false });
    const data = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : response?.branches || [];
    branches.value = data.map((b) => ({
      label: locale.value === "ar" ? b.name_ar || b.name : b.name_en || b.name,
      value: b.id,
    }));
  } catch (e) {
    console.error("Error fetching branches:", e);
  }
};

const fetchDepartments = async () => {
  try {
    const params = {
      branch_id: filters.value.branch_id || null,
      paginate: false,
    };
    let response = await adminDashboardService.getAccessibleDepartments(params);
    const resData = response?.data;
    let data = Array.isArray(resData)
      ? resData
      : resData?.data || resData?.departments || [];

    departments.value = (Array.isArray(data) ? data : []).map((d) => ({
      label: locale.value === "ar" ? d.name_ar || d.name : d.name_en || d.name,
      value: d.id,
    }));
  } catch (e) {
    console.error("Error fetching departments:", e);
  }
};

const fetchEmployees = async () => {
  try {
    const response = await employeeService.list({ paginate: false });
    const data = response.data?.data || response.data || [];
    employees.value = data.map((emp) => ({
      label: emp.name,
      value: emp.id,
    }));
  } catch (e) {
    console.error("Error fetching employees:", e);
  }
};

const loadSummary = async () => {
  loading.value = true;

  try {
    const rawParams = {
      page: page.value,
      per_page: perPage.value,
      ...filters.value,
    };

    //  keep only filled values
    const params = Object.fromEntries(
      Object.entries(rawParams).filter(
        ([_, value]) => value !== "" && value !== null && value !== undefined,
      ),
    );

    const res = await attendanceReportsService.getAttendanceSummary(params);

    const data = res.data?.data || res.data || res;

    records.value = data.summary || [];
    total.value = data.pagination?.total || records.value.length;
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  } finally {
    loading.value = false;
  }
};

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  {
    key: "employee_name",
    label: t("reportsData.employee_name"),
    cellClass: "text-start",
  },
  { key: "branch", label: t("branches.entityName") },
  { key: "department", label: t("employees.fields.departmentSection") },
  { key: "work_system_type", label: t("employees.fields.workSystemType") },
  { key: "work_days", label: t("employeeDashboard.summary.working_days") },
  { key: "attendance_days", label: t("reportsData.attendance_days") },
  { key: "absence_days", label: t("reportsData.absence_days") },
  { key: "leave_days", label: locale.value === "ar" ? "الإجازات" : "Leaves" },
  { key: "delay_minutes", label: t("dailyAttendance.fields.lateness") },
  {
    key: "early_leave_minutes",
    label: locale.value === "ar" ? "الانصراف" : "Early Leave",
  },
  {
    key: "overtime_minutes",
    label: locale.value === "ar" ? "العمل" : "Overtime",
  },
  {
    key: "total_working_hours",
    label: locale.value === "ar" ? "ساعات العمل" : "Working Hours",
  },
  {
    key: "actions",
    label: t("branches.fields.actions"),
    cellClass: "w-10 no-print",
  },
]);

const handleExport = async (format = "excel") => {
  try {
    const params = { paginate: false, ...filters.value };
    if (!filters.value.employee_id) {
      delete params.employee_id;
    }

    const response =
      await attendanceReportsService.getAttendanceSummary(params);
    const data =
      response.data?.summary ||
      response.data?.data?.summary ||
      response.data ||
      [];

    if (format === "excel") exportToExcel(data);
    else if (format === "pdf") await exportToPDF(data);
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  }
};

const exportToExcel = (data) => {
  const flattened = data.map((item, index) => ({
    "#": index + 1,
    [t("reportsData.employee_name")]: item.employee_name,
    [t("branches.entityName")]: item.branch,
    [t("employees.fields.departmentSection")]: item.department,
    [t("employees.fields.workSystemType")]:
      item.work_system_type === "fixed"
        ? t("employees.workSystemTypes.fixed")
        : t("employees.workSystemTypes.shift"),
    [t("employeeDashboard.summary.working_days")]: item.work_days,
    [t("reportsData.attendance_days")]: item.attendance_days,
    [t("reportsData.absence_days")]: item.absence_days,
    [t("reportsData.leave_days")]: item.leave_days,
    [t("dailyAttendance.fields.lateness")]: item.delay_minutes,
    [t("dailyAttendance.fields.earlyLeave")]: item.early_leave_minutes,
    [t("reportsData.overtime")]: item.overtime_minutes,
    [t("reportsData.total_working_hours")]:
      item.total_working_hours?.toFixed(2),
  }));
  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance Summary");
  XLSX.writeFile(wb, `attendance_summary_${new Date().getTime()}.xlsx`);
};

const monthText = computed(() => {
  if (!filters.value.month) return "";

  const monthLabel =
    monthOptions.value.find((m) => m.value == filters.value.month)?.label ||
    filters.value.month;

  return locale.value === "ar"
    ? `الشهر: ${monthLabel}`
    : `Month: ${monthLabel}`;
});

const exportToPDF = async (data) => {
  const doc = new jsPDF({ orientation: "l", unit: "mm", format: "a4" });
  try {
    const fontRes = await fetch(IBMPlexSansArabicRegular);
    const fontBuffer = await fontRes.arrayBuffer();
    doc.addFileToVFS(
      "IBMPlexSansArabic-Regular.ttf",
      arrayBufferToBase64(fontBuffer),
    );
    doc.addFont("IBMPlexSansArabic-Regular.ttf", "IBMPlexSansArabic", "normal");

    const fontBoldRes = await fetch(IBMPlexSansArabicBold);
    const fontBoldBuffer = await fontBoldRes.arrayBuffer();
    doc.addFileToVFS(
      "IBMPlexSansArabic-Bold.ttf",
      arrayBufferToBase64(fontBoldBuffer),
    );
    doc.addFont("IBMPlexSansArabic-Bold.ttf", "IBMPlexSansArabic", "bold");

    doc.setFont("IBMPlexSansArabic", "normal");

    const isArabic = locale.value === "ar";
    const totalPagesExp = "{total_pages}";
    let heads = tableHeaders.value
      .filter((h) => h.key !== "actions")
      .map((h) => h.label);
    let rows = data.map((item, index) => [
      index + 1,
      item.employee_name,
      item.branch,
      item.department,
      item.work_system_type === "fixed"
        ? t("employees.workSystemTypes.fixed")
        : t("employees.workSystemTypes.shift"),
      item.work_days,
      item.attendance_days,
      item.absence_days,
      item.leave_days,
      item.delay_minutes,
      item.early_leave_minutes,
      item.overtime_minutes,
      item.total_working_hours?.toFixed(2),
    ]);

    if (isArabic) {
      heads = [...heads].reverse();
      rows = rows.map((r) => [...r].reverse());
    }

    autoTable(doc, {
      head: [heads],
      body: rows,
      startY: 55,
      styles: {
        font: "IBMPlexSansArabic",
        halign: isArabic ? "right" : "left",
        fontSize: 7,
        fontStyle: "normal",
      },
      headStyles: {
        font: "IBMPlexSansArabic",
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
        fontStyle: "normal",
      },
      didParseCell: (data) => {
        data.cell.styles.font = "IBMPlexSansArabic";
        data.cell.styles.fontStyle = "normal";
      },
      didDrawPage: (data) => {
        doc.setFont("IBMPlexSansArabic", "normal");
        const pageWidth = doc.internal.pageSize.width;

        // Draw Header
        drawPdfHeader(doc, authStore, isArabic);

        // Subtitle (Title)
        doc.setFontSize(11);
        doc.setFont("IBMPlexSansArabic", "bold");
        const titleStr = t("sidebar.reportsAttendance");
        const fullTitle = isArabic
          ? `عنوان التقرير: ${titleStr}`
          : `Report Title: ${titleStr}`;
        const margin = 15;
        doc.text(fullTitle, isArabic ? pageWidth - margin : margin, 40, {
          align: isArabic ? "right" : "left",
        });

        if (filters.value.month) {
          doc.setFontSize(9);
          doc.setFont("IBMPlexSansArabic", "normal");

          doc.text(monthText.value, isArabic ? pageWidth - 15 : 15,45 , {
            align: isArabic ? "right" : "left",
          });
        }
        doc.setFont("IBMPlexSansArabic", "normal");
      },
      margin: { top: 50, bottom: 30 },
    });

    // Draw Footer (Correct pagination like EmployeesIndexView)
    const totalPagesPDF = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPagesPDF; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPagesPDF, isArabic, true);
    }

    doc.save(`attendance_summary_${new Date().getTime()}.pdf`);
  } catch (err) {
    console.error(err);
    toast.error("PDF generation failed.");
  }
};

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

const handlePrint = async () => {
  try {
    const params = {
      paginate: false,
      ...filters.value,
    };

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }

    const response =
      await attendanceReportsService.getAttendanceSummary(params);

    const data =
      response.data?.summary ||
      response.data?.data?.summary ||
      response.data ||
      [];

    // =========================
    // INIT PDF
    // =========================
    const doc = new jsPDF({
      orientation: "l",
      unit: "mm",
      format: "a4",
    });

    const isArabic = locale.value === "ar";

    // =========================
    // FONTS
    // =========================
    const regularFont = await fetch(IBMPlexSansArabicRegular).then((r) =>
      r.arrayBuffer(),
    );

    const boldFont = await fetch(IBMPlexSansArabicBold).then((r) =>
      r.arrayBuffer(),
    );

    doc.addFileToVFS(
      "IBMPlexSansArabic-Regular.ttf",
      arrayBufferToBase64(regularFont),
    );
    doc.addFont("IBMPlexSansArabic-Regular.ttf", "IBMPlexSansArabic", "normal");

    doc.addFileToVFS(
      "IBMPlexSansArabic-Bold.ttf",
      arrayBufferToBase64(boldFont),
    );
    doc.addFont("IBMPlexSansArabic-Bold.ttf", "IBMPlexSansArabic", "bold");

    doc.setFont("IBMPlexSansArabic", "normal");

    // =========================
    // HEADERS
    // =========================
    let headers = tableHeaders.value
      .filter((h) => h.key !== "actions")
      .map((h) => h.label);

    let rows = data.map((item, index) => [
      index + 1,
      item.employee_name,
      item.branch,
      item.department,
      item.work_system_type === "fixed"
        ? t("employees.workSystemTypes.fixed")
        : t("employees.workSystemTypes.shift"),
      item.work_days,
      item.attendance_days,
      item.absence_days,
      item.leave_days,
      item.delay_minutes,
      item.early_leave_minutes,
      item.overtime_minutes,
      item.total_working_hours?.toFixed(2),
    ]);

    if (isArabic) {
      headers = [...headers].reverse();
      rows = rows.map((r) => [...r].reverse());
    }

    // =========================
    // TABLE
    // =========================
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 55,

      styles: {
        font: "IBMPlexSansArabic",
        fontStyle: "normal",
        halign: isArabic ? "right" : "left",
        fontSize: 8,
      },

      headStyles: {
        font: "IBMPlexSansArabic",
        fontStyle: "bold",
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
        halign: isArabic ? "right" : "left",
      },

      didParseCell: (data) => {
        data.cell.styles.font = "IBMPlexSansArabic";
      },

      didDrawPage: () => {
        const pageWidth = doc.internal.pageSize.width;

        drawPdfHeader(doc, authStore, isArabic);

        // =========================
        // TITLE
        // =========================
        doc.setFontSize(11);
        doc.setFont("IBMPlexSansArabic", "bold");

        const title = t("sidebar.reportsAttendance");

        const fullTitle = isArabic
          ? `عنوان التقرير: ${title}`
          : `Report Title: ${title}`;

        doc.text(fullTitle, isArabic ? pageWidth - 15 : 15, 40, {
          align: isArabic ? "right" : "left",
        });

        if (filters.value.month) {
          doc.setFontSize(9);
          doc.setFont("IBMPlexSansArabic", "normal");

          doc.text(monthText.value, isArabic ? pageWidth - 15 : 15,45 , {
            align: isArabic ? "right" : "left",
          });
        }

        doc.setFont("IBMPlexSansArabic", "normal");

        // =========================
        // DATE FILTER
        // =========================
        const hasDateRange = filters.value.from_date || filters.value.to_date;

        if (hasDateRange) {
          const from = filters.value.from_date || "--";
          const to = filters.value.to_date || "--";

          const dateText = isArabic
            ? `التاريخ: من ${from} إلى ${to}`
            : `Date: From ${from} To ${to}`;

          doc.setFontSize(9);
          doc.text(dateText, isArabic ? pageWidth - 15 : 15, 47, {
            align: isArabic ? "right" : "left",
          });
        }
      },

      margin: { top: 50, bottom: 30 },
    });

    // =========================
    // FOOTER PAGES
    // =========================
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPages, isArabic, true);
    }

    // =========================
    // PRINT VIA IFRAME
    // =========================
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = url;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }, 300);
    };
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  }
};

// const handlePrint = async () => {
//   try {
//     const params = { paginate: false, ...filters.value };
//     if (!filters.value.employee_id) {
//       delete params.employee_id;
//     }

//     const response =
//       await attendanceReportsService.getAttendanceSummary(params);
//     printRecords.value =
//       response.data?.summary || response.data?.data?.summary || [];

//     await nextTick();

//     // Calculate total pages
//     const tableBody = document.querySelector(".print-only tbody");
//     if (tableBody) {
//       const rows = tableBody.querySelectorAll("tr");
//       const firstRowHeight = rows[0]?.offsetHeight || 35;
//       const availableHeight = 903;
//       const rowsPerPage = Math.floor(availableHeight / firstRowHeight);
//       const totalRows = rows.length;
//       printTotalPages.value = Math.max(1, Math.ceil(totalRows / rowsPerPage));
//     }

//     await nextTick();
//     await new Promise((resolve) => setTimeout(resolve, 300));
//     window.print();
//   } catch (e) {
//     console.error(e);
//     toast.error(t("common.error"));
//   }
// };

const applyFilters = () => {
  page.value = 1;
  loadSummary();
};

const resetFilters = () => {
  filters.value = {
    branch_id: "",
    department_id: "",
    employee_id: "",
    month: "",
    work_system_type: "",
  };
  applyFilters();
};

const viewDetails = (item) => {
  const prefix = locale.value === "en" ? "/en" : "";
  router.push({
    path: `${prefix}/reports/attendance/employee/${item.employee_id}`,
    query: {
      month: filters.value.month,
      employee_name: item.employee_name,
    },
  });
};

const changePage = (newPage) => {
  page.value = newPage;
  loadSummary();
};

watch(
  () => filters.value.branch_id,
  () => {
    filters.value.department_id = "";
    fetchDepartments();
  },
);

onMounted(() => {
  loadSummary();
  fetchBranches();
  fetchDepartments();
  fetchEmployees();
});
</script>

<template>
  <section class="space-y-6">
    <header
      class="flex flex-wrap gap-x-10 gap-y-5 items-center justify-between no-print"
    >
      <h1 class="text-[20px] font-[600] text-[#000000]">
        {{ t("sidebar.reportsAttendance") }}
      </h1>
      <div class="flex items-center gap-2">
        <Button
          @click="handlePrint"
          class="bg-[#E7EFED] border border-[#0E5F4A] !px-2 !py-2 hover:!bg-[#DDE6E4]"
        >
          <SvgIcon name="printer" />
        </Button>
        <Menu as="div" class="relative inline-block text-left">
          <MenuButton as="template">
            <Button variant="primary" size="md">
              <SvgIcon name="export" />
              <span class="ms-1 me-2">{{ t("employees.export") }}</span>
              <SvgIcon name="down" />
            </Button>
          </MenuButton>
          <transition
            enter-active-class="transition duration-100"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
          >
            <MenuItems
              class="absolute right-0 mt-2 w-30 bg-white shadow-lg rounded-md ring-1 ring-black/5 z-50 text-start"
            >
              <div class="px-1 py-1">
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleExport('pdf')"
                    :class="[
                      active ? 'bg-[#0E5F4A] text-white' : 'text-[#384250]',
                      'w-full text-start px-3 py-2 text-sm rounded-md mb-1 transition-colors',
                    ]"
                    class="cursor-pointer"
                  >
                    PDF
                  </button>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleExport('excel')"
                    :class="[
                      active ? 'bg-[#0E5F4A] text-white' : 'text-[#384250]',
                      'w-full text-start px-3 py-2 text-sm rounded-md transition-colors',
                    ]"
                    class="cursor-pointer"
                  >
                    Excel
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </transition>
        </Menu>
      </div>
    </header>

    <Card class="no-print">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("auditLogs.filters.title") }}
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-5">
        <Select
          v-model="filters.branch_id"
          :options="branches"
          :label="t('branches.entityName')"
          :placeholder="t('branches.placeholders.name')"
        />
        <Select
          v-model="filters.department_id"
          :options="departments"
          :label="t('employees.fields.departmentSection')"
          :placeholder="t('employees.placeholders.departmentOrSection')"
        />
        <Select
          v-if="!authStore.isEmployee"
          v-model="filters.employee_id"
          :options="employees"
          :label="t('reportsData.employee_name')"
          :placeholder="t('employees.placeholders.nameOrId')"
        />
        <Select
          v-model="filters.month"
          :options="monthOptions"
          :label="t('common.month')"
        />
        <Select
          v-model="filters.work_system_type"
          :options="workTypes"
          :label="t('employees.fields.workSystemType')"
          :placeholder="t('employees.placeholders.status')"
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
          :loading="loading"
          class="md:w-26"
        >
          {{ t("common.search") }}
        </Button>
      </div>
    </Card>

    <Card class="no-print">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("sidebar.reportsAttendance") }}
        </h2>
      </template>

      <Table
        :loading="loading"
        :items="records"
        :headers="tableHeaders"
        :page="page"
        :total-pages="Math.ceil(total / perPage)"
        @change-page="changePage"
        class="report-table"
      >
        <!-- Sortable Headers -->

        <template
          v-for="header in tableHeaders.filter((h) => h.key !== 'actions')"
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
              class="w-4 h-4 transition-colors"
              :class="{
                'text-primary': filters.sort_by === header.key,
                'text-gray-400': filters.sort_by !== header.key,
                'rotate-180':
                  filters.sort_by === header.key &&
                  filters.sort_direction === 'desc',
              }"
            />
          </div>
        </template>

        <template #cell-index="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>
        <template #cell-work_system_type="{ item }">
          {{
            item.work_system_type === "fixed"
              ? t("employees.workSystemTypes.fixed")
              : t("employees.workSystemTypes.shift")
          }}
        </template>
        <template #cell-total_working_hours="{ item }">
          {{ item?.total_working_hours }}
        </template>
        <template #cell-actions="{ item }">
          <button
            class="cursor-pointer text-[#667085] hover:text-[#0E5F4A] transition-colors"
            @click="viewDetails(item)"
            v-tooltip="
              t('common.actionTooltips.view.title', {
                target: item?.employee_name,
              })
            "
          >
            <SvgIcon name="eye" />
          </button>
        </template>
      </Table>
    </Card>

    <div class="print-only" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              :colspan="tableHeaders.length - 1"
              class="!bg-transparent !border-none !p-0"
            >
              <PrintHeader :title="t('sidebar.reportsAttendance')" />
            </th>
          </tr>
          <tr class="bg-[#0E5F4A] text-white">
            <th
              v-for="header in tableHeaders.filter((h) => h.key !== 'actions')"
              :key="header.key"
              class="border border-[#D2D6DB] px-4 py-3 text-start text-xs font-semibold uppercase"
            >
              {{ header.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in printRecords" :key="index">
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ index + 1 }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ item.employee_name }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ item.branch }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ item.department }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{
                item.work_system_type === "fixed"
                  ? t("employees.workSystemTypes.fixed")
                  : t("employees.workSystemTypes.shift")
              }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm text-center">
              {{ item.work_days }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm text-center">
              {{ item.attendance_days }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm text-center">
              {{ item.absence_days }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm text-center">
              {{ item.leave_days }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm text-center">
              {{ item.delay_minutes }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm text-center">
              {{ item.early_leave_minutes }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm text-center">
              {{ item.overtime_minutes }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm text-center">
              {{ item.total_working_hours?.toFixed(2) }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="footer-spacer-row">
            <td :colspan="tableHeaders.length - 1" class="!border-none !p-0">
              <div class="h-[60px]"></div>
            </td>
          </tr>
        </tfoot>
      </table>
      <PrintFooter :totalPages="printTotalPages" />
    </div>
  </section>
</template>

<style scoped>
.report-table :deep(table) {
  min-width: 1400px;
}
.report-table :deep(th),
.report-table :deep(td) {
  text-align: center;
  padding-left: 1rem;
  padding-right: 1rem;
}
@media print {
  .no-print {
    display: none !important;
  }
  .print-only {
    display: block !important;
  }

  header,
  .card,
  #print-area,
  .breadcrumb {
    display: none !important;
  }

  tbody,
  tr,
  td,
  th {
    page-break-inside: avoid !important;
  }

  table {
    page-break-inside: auto !important;
  }

  :deep(.min-h-screen),
  main {
    min-height: auto !important;
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  table {
    border-collapse: collapse !important;
    margin: 0 !important;
  }

  thead {
    display: table-header-group;
  }

  tfoot {
    display: table-footer-group;
  }

  th {
    background-color: #0e5f4a !important;
    color: white !important;
    padding: 12px 8px !important;
    font-size: 11px !important;
    border: 1px solid #d2d6db !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    text-align: center !important;
  }

  td {
    padding: 10px 8px !important;
    font-size: 10px !important;
    border: 1px solid #d2d6db !important;
    text-align: center !important;
  }
}

/* Hide print-only table on screen */
@media screen {
  .print-only {
    display: none !important;
  }
}
</style>

<style>
@media print {
  /* Global resets for print - MUST be non-scoped */
  html,
  body,
  #app,
  main,
  .p-4,
  .p-6,
  .flex-1 {
    overflow: visible !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    float: none !important;
  }

  /* Ensure the page counter starts at 0 so the first page is 1 */
  html,
  body {
    counter-reset: page 0;
  }
}
</style>
