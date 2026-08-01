<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Table from "@/components/ui/Table.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import attendanceReportsService from "@/services/attendanceReports";
import Select from "@/components/ui/Select.vue";

import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import PrintHeader from "@/components/ui/PrintHeader.vue";
import PrintFooter from "@/components/ui/PrintFooter.vue";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";
import { useAuthStore } from "@/stores/auth";

import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";

const { t, locale } = useI18n();
const authStore = useAuthStore();
const lang = computed(() => locale.value);
const toast = useAppToast();
const route = useRoute();
const router = useRouter();

// State
const records = ref([]);
const loading = ref(false);
const printRecords = ref([]);
const printTotalPages = ref(1);
const employeeInfo = ref(null);

const employeeId = route.params.id || route.query.employee_id;
const month = route.query.month || "";

// Pagination
const page = ref(1);
const perPage = ref(10);
const total = ref(0);

const filters = ref({
  month: month,

  sort_by: "",
  sort_direction: "asc",
});

const reportTitle = computed(() => {
  return route.query.report_title || "";
});

const breadcrumbItems = computed(() => [
  { label: t("sidebar.reports"), to: "/reports/attendance" },
  { label: t("sidebar.reportsAttendance"), to: "/reports/attendance" },
  { label: employeeInfo.value?.name || t("common.details") },
]);

const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

const loadDetails = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...filters.value,
    };

    const response = await attendanceReportsService.getAttendanceDetails(
      employeeId,
      params,
    );
    const data = response.data?.data || response.data || response;

    employeeInfo.value = data.employee || null;
    records.value = data.details || [];
    total.value = data.pagination?.total || records.value.length;
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  } finally {
    loading.value = false;
  }
};

const SORT_MAP = {
  date: "date",
  work_type: "work_type",
  check_in_time: "check_in_time",
  check_out_time: "check_out_time",
  actual_working_hours: "actual_working_hours",
  delay_minutes: "delay_minutes",
  early_leave_minutes: "early_leave_minutes",
  overtime_minutes: "overtime_minutes",
  status: "status",
};

const handleSort = (key) => {
  // ignore non-sortable columns
  if (!SORT_MAP[key]) return;

  const apiKey = SORT_MAP[key];

  if (filters.value.sort_by === apiKey) {
    filters.value.sort_direction =
      filters.value.sort_direction === "asc" ? "desc" : "asc";
  } else {
    filters.value.sort_by = apiKey;
    filters.value.sort_direction = "asc";
  }

  applyFilters();
};

const tableHeaders = computed(() => [
  { key: "index", label: "#", sortable: false },
  { key: "date", label: t("common.date"), sortable: true },
  {
    key: "work_type",
    label: locale.value === "ar" ? "الشفت" : "Shift",
    sortable: true,
  },
  {
    key: "check_in_time",
    label: t("dailyAttendance.fields.checkIn"),
    sortable: true,
  },
  {
    key: "check_out_time",
    label: t("dailyAttendance.fields.checkOut"),
    sortable: true,
  },
  {
    key: "actual_working_hours",
    label: locale.value === "ar" ? "ساعات العمل" : "Working Hours",
    sortable: true,
  },
  {
    key: "delay_minutes",
    label: t("dailyAttendance.fields.lateness"),
    sortable: true,
  },
  {
    key: "early_leave_minutes",
    label: locale.value === "ar" ? "الانصراف" : "Early Leave",
    sortable: true,
  },
  {
    key: "overtime_minutes",
    label: locale.value === "ar" ? "الإضافي" : "Overtime",
    sortable: true,
  },
  { key: "status", label: t("reportsData.status"), sortable: true },
]);

const monthOptions = computed(() => {
  const options = [{ label: t("common.month"), value: "" }];
  for (let i = 1; i <= 12; i++) {
    const monthName = new Intl.DateTimeFormat(locale.value, {
      month: "long",
    }).format(new Date(2021, i - 1, 1));
    options.push({ label: monthName, value: i.toString() });
  }
  return options;
});

const getStatusColor = (status) => {
  if (!status) return "text-[#4D5761] bg-[#E5E7EB]";
  const s = status.toLowerCase();
  // Arabic statuses
  if (s.includes("حاضر") || s.includes("present"))
    return "text-[#085D3A] bg-[#ECFDF3]";
  if (
    s.includes("إجازة") ||
    s.includes("اجازه") ||
    s.includes("leave") ||
    s.includes("vacation")
  )
    return "text-[#175CD3] bg-[#EFF8FF]";
  if (s.includes("غائب") || s.includes("absent"))
    return "text-[#D92D20] bg-[#FEF3F2]";
  if (
    s.includes("عطلة") ||
    s.includes("holiday") ||
    s.includes("weekend") ||
    s.includes("راحة") ||
    s.includes("rest")
  )
    return "text-[#4D5761] bg-[#F2F4F7]";
  if (s.includes("مهمة") || s.includes("mission"))
    return "text-[#F79009] bg-[#FFFAEB]";
  return "text-[#4D5761] bg-[#E5E7EB]";
};

const applyFilters = () => {
  page.value = 1;
  loadDetails();
};

const resetFilters = () => {
  filters.value.month = "";
  applyFilters();
};

const changePage = (newPage) => {
  page.value = newPage;
  loadDetails();
};

const handleExport = async (format = "excel") => {
  try {
    const params = { paginate: false, ...filters.value };
    const response = await attendanceReportsService.getAttendanceDetails(
      employeeId,
      params,
    );
    const data =
      response.data?.details ||
      response.data?.data?.details ||
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
    [t("common.date")]: item.date,
    [t("employees.fields.workSystemType")]: item.work_type,
    [t("dailyAttendance.fields.checkIn")]: item.check_in_time,
    [t("dailyAttendance.fields.checkOut")]: item.check_out_time,
    [t("reportsData.actual_working_hours")]: item.actual_working_hours,
    [t("dailyAttendance.fields.lateness")]: item.delay_minutes,
    [t("dailyAttendance.fields.earlyLeave")]: item.early_leave_minutes,
    [t("reportsData.overtime")]: item.overtime_minutes,
    [t("reportsData.status")]: item.status,
  }));
  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance Details");
  const fileName =
    locale.value === "ar"
      ? `الحضور_والانصراف_${employeeInfo.value?.name || ""}.xlsx`
      : `Attendance_Report_${employeeInfo.value?.name || ""}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// const exportToPDF = async (data) => {
//   const doc = new jsPDF({ orientation: "l", unit: "mm", format: "a4" });
//   try {
//     const regularFontRes = await fetch(IBMPlexSansArabicRegular);
//     const regularFontBuffer = await regularFontRes.arrayBuffer();
//     const boldFontRes = await fetch(IBMPlexSansArabicBold);
//     const boldFontBuffer = await boldFontRes.arrayBuffer();

//     doc.addFileToVFS(
//       "IBMPlexSansArabic-Regular.ttf",
//       arrayBufferToBase64(regularFontBuffer),
//     );
//     doc.addFont("IBMPlexSansArabic-Regular.ttf", "IBMPlexSansArabic", "normal");
//     doc.addFileToVFS(
//       "IBMPlexSansArabic-Bold.ttf",
//       arrayBufferToBase64(boldFontBuffer),
//     );
//     doc.addFont("IBMPlexSansArabic-Bold.ttf", "IBMPlexSansArabic", "bold");

//     doc.setFont("IBMPlexSansArabic", "normal");

//     const isArabic = locale.value === "ar";
//     const title = `${t("sidebar.reportsAttendance")} - ${employeeInfo.value?.name || ""}`;

//     let heads = tableHeaders.value.map((h) => h.label);
//     let rows = data.map((item, index) => [
//       index + 1,
//       item.date,
//       item.work_type,
//       item.check_in_time,
//       item.check_out_time,
//       item.actual_working_hours,
//       item.delay_minutes,
//       item.early_leave_minutes,
//       item.overtime_minutes,
//       item.status,
//     ]);

//     if (isArabic) {
//       heads = [...heads].reverse();
//       rows = rows.map((r) => [...r].reverse());
//     }

//     autoTable(doc, {
//       startY: 55,
//       head: [heads],
//       body: rows,
//       styles: {
//         font: "IBMPlexSansArabic",
//         halign: isArabic ? "right" : "left",
//         fontSize: 8,
//         fontStyle: "normal",
//       },
//       headStyles: {
//         font: "IBMPlexSansArabic",
//         fillColor: [14, 95, 74],
//         textColor: [255, 255, 255],
//         fontStyle: "bold",
//       },
//       didParseCell: (data) => {
//         data.cell.styles.font = "IBMPlexSansArabic";
//       },
//       didDrawPage: (data) => {
//         const pageWidth = doc.internal.pageSize.width;
//         // Draw Header
//         drawPdfHeader(doc, authStore, isArabic);

//         // Subtitle (Title)
//         doc.setFontSize(11);
//         doc.setFont("IBMPlexSansArabic", "bold");
//         const fullTitle = isArabic
//           ? `عنوان التقرير: ${title}`
//           : `Report Title: ${title}`;
//         doc.text(fullTitle, pageWidth / 2, 40, { align: "center" });
//         doc.setFont("IBMPlexSansArabic", "normal");
//       },
//       margin: { top: 50, bottom: 30 },
//     });

//     // Draw Footer (Correct pagination like EmployeesIndexView)
//     const totalPagesPDF = doc.internal.getNumberOfPages();
//     for (let i = 1; i <= totalPagesPDF; i++) {
//       doc.setPage(i);
//       drawPdfFooter(doc, authStore, i, totalPagesPDF, isArabic, true);
//     }

//     const fileName = isArabic
//       ? `الحضور_والانصراف_${employeeInfo.value?.name || ""}.pdf`
//       : `Attendance_Report_${employeeInfo.value?.name || ""}.pdf`;
//     doc.save(fileName);
//   } catch (err) {
//     console.error(err);
//     toast.error("PDF generation failed.");
//   }
// };

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
  const doc = new jsPDF({
    orientation: "l",
    unit: "mm",
    format: "a4",
  });

  try {
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
    // TITLE
    // =========================
    const titleBase = t("sidebar.reportsAttendance");
    const title = `${titleBase} - ${employeeInfo.value?.name || ""}`;

    // =========================
    // HEADERS / ROWS
    // =========================
    let heads = tableHeaders.value.map((h) => h.label);

    let rows = data.map((item, index) => [
      index + 1,
      item.date,
      item.work_type,
      item.check_in_time,
      item.check_out_time,
      item.actual_working_hours,
      item.delay_minutes,
      item.early_leave_minutes,
      item.overtime_minutes,
      item.status,
    ]);

    if (isArabic) {
      heads = [...heads].reverse();
      rows = rows.map((r) => [...r].reverse());
    }

    // =========================
    // TABLE
    // =========================
    autoTable(doc, {
      startY: 55,
      head: [heads],
      body: rows,

      styles: {
        font: "IBMPlexSansArabic",
        halign: isArabic ? "right" : "left",
        fontSize: 8,
      },

      headStyles: {
        font: "IBMPlexSansArabic",
        fontStyle: "bold",
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
      },

      didParseCell: (cell) => {
        cell.cell.styles.font = "IBMPlexSansArabic";
      },

      didDrawPage: () => {
        const pageWidth = doc.internal.pageSize.width;

        // Header
        drawPdfHeader(doc, authStore, isArabic);

        // Title
        doc.setFontSize(11);
        doc.setFont("IBMPlexSansArabic", "bold");

        const margin = 15;
        doc.text(title, isArabic ? pageWidth - margin : margin, 40, {
          align: isArabic ? "right" : "left",
        });

        if (filters.value.month) {
          doc.setFontSize(9);
          doc.setFont("IBMPlexSansArabic", "normal");

          doc.text(monthText.value, isArabic ? pageWidth - 15 : 15, 45, {
            align: isArabic ? "right" : "left",
          });
        }

        doc.setFont("IBMPlexSansArabic", "normal");
      },

      margin: { top: 50, bottom: 30 },
    });

    // =========================
    // FOOTER
    // =========================
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPages, isArabic, true);
    }

    // =========================
    // SAVE
    // =========================
    const fileName = isArabic
      ? `تقرير_الحضور_${employeeInfo.value?.name || ""}.pdf`
      : `Attendance_Report_${employeeInfo.value?.name || ""}.pdf`;

    doc.save(fileName);
  } catch (err) {
    console.error(err);
    toast.error(t("common.error"));
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

    const response = await attendanceReportsService.getAttendanceDetails(
      employeeId,
      params,
    );

    const data =
      response.data?.details ||
      response.data?.data?.details ||
      response.data ||
      [];

    const doc = new jsPDF({
      orientation: "l",
      unit: "mm",
      format: "a4",
    });

    const isArabic = locale.value === "ar";

    // Fonts
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

    let headers = tableHeaders.value.map((h) => h.label);

    let rows = data.map((item, index) => [
      index + 1,
      item.date,
      item.work_type,
      item.check_in_time,
      item.check_out_time,
      item.actual_working_hours,
      item.delay_minutes,
      item.early_leave_minutes,
      item.overtime_minutes,
      item.status,
    ]);

    if (isArabic) {
      headers = [...headers].reverse();
      rows = rows.map((r) => [...r].reverse());
    }

    autoTable(doc, {
      startY: 55,
      head: [headers],
      body: rows,

      styles: {
        font: "IBMPlexSansArabic",
        fontSize: 8,
        halign: isArabic ? "right" : "left",
      },

      headStyles: {
        font: "IBMPlexSansArabic",
        fontStyle: "bold",
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
      },

      didDrawPage: () => {
        const pageWidth = doc.internal.pageSize.width;

        drawPdfHeader(doc, authStore, isArabic);

        doc.setFontSize(11);
        doc.setFont("IBMPlexSansArabic", "bold");

        const title = `${t("sidebar.reportsAttendance")} - ${
          employeeInfo.value?.name || ""
        }`;

        const margin = 15;
        doc.text(title, isArabic ? pageWidth - margin : margin, 40, {
          align: isArabic ? "right" : "left",
        });

        if (filters.value.month) {
          doc.setFontSize(9);
          doc.setFont("IBMPlexSansArabic", "normal");

          doc.text(monthText.value, isArabic ? pageWidth - 15 : 15, 45, {
            align: isArabic ? "right" : "left",
          });
        }
      },

      margin: { top: 50, bottom: 30 },
    });

    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPages, isArabic, true);
    }

    // PRINT
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

onMounted(() => {
  loadDetails();
});
</script>

<template>
  <section class="space-y-6">
    <div class="no-print">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <header
      class="flex flex-wrap gap-x-10 gap-y-5 items-center justify-between no-print"
    >
      <div class="flex items-center gap-4">
        <h1 class="text-[20px] font-[600] text-[#000000]">
          {{ t("sidebar.reportsAttendance") }} - {{ employeeInfo?.name }}
        </h1>
      </div>
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
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-5">
        <Select
          v-model="filters.month"
          :options="monthOptions"
          :label="t('common.month')"
        />
      </div>
      <div class="flex justify-end gap-2">
        <Button variant="ghost" size="md" @click="resetFilters" class="md:w-26">
          <template #prefix><SvgIcon name="reset" /></template>
          {{ t("common.reset") }}
        </Button>
        <Button
          variant="primary"
          size="md"
          @click="applyFilters"
          :loading="loading"
          class="md:w-26"
        >
          <template #prefix><SvgIcon name="search" v-if="!loading" /></template>
          {{ t("common.search") }}
        </Button>
      </div>
    </Card>

    <Card class="no-print">
      <template #header>
        <div class="flex items-center gap-4">
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("sidebar.reportsAttendance") }} - {{ employeeInfo?.name }}
          </h2>
          <span
            v-if="reportTitle"
            class="text-[14px] font-[400] text-[#0E5F4A] bg-[#E7EFED] border border-[#0E5F4A] px-2 py-1 rounded-full"
          >
            {{ reportTitle }}
          </span>
        </div>
      </template>

      <Table
        :loading="loading"
        :items="records"
        :headers="tableHeaders"
        :page="page"
        :total-pages="totalPages"
        @change-page="changePage"
        class="report-table"
      >
        <!-- Sortable Headers -->
        <template
          v-for="header in tableHeaders"
          :key="header.key"
          #[`header-${header.key}`]
        >
          <div
            class="flex items-center gap-2 justify-between"
            :class="header.sortable ? 'cursor-pointer select-none' : ''"
            @click="header.sortable && handleSort(header.key)"
          >
            {{ header.label }}

            <SvgIcon
              v-if="header.sortable"
              name="sort"
              class="w-4 h-4 transition-colors"
              :class="{
                'text-primary': filters.sort_by === SORT_MAP[header.key],
                'text-gray-400': filters.sort_by !== SORT_MAP[header.key],
                'rotate-180':
                  filters.sort_by === SORT_MAP[header.key] &&
                  filters.sort_direction === 'desc',
              }"
            />
          </div>
        </template>
        <template #cell-index="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>
        <template #cell-work_type="{ item }">
          {{
            item.work_type === "fixed"
              ? t("employees.workSystemTypes.fixed")
              : t("employees.workSystemTypes.shift")
          }}
        </template>
        <template #cell-status="{ item }">
          <span
            class="px-2 py-0.5 rounded-full text-[13px] font-[500] flex items-center justify-center gap-1.5 w-max mx-auto capitalize"
            :class="getStatusColor(item.status)"
          >
            <span class="w-2 h-2 rounded-full bg-current"></span>
            {{ item.status }}
          </span>
        </template>
      </Table>
    </Card>

    <!-- Print only -->
    <div class="print-only hidden" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              :colspan="tableHeaders.length"
              class="!bg-transparent !border-none !p-0"
            >
              <PrintHeader
                :title="
                  t('sidebar.reportsAttendance') + ' - ' + employeeInfo?.name
                "
              />
            </th>
          </tr>
          <tr class="bg-[#0E5F4A] text-white">
            <th
              v-for="h in tableHeaders"
              :key="h.key"
              class="border border-[#D2D6DB] px-4 py-3 text-start text-xs font-semibold uppercase"
            >
              {{ h.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in printRecords" :key="index">
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ index + 1 }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.date }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.work_type }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.check_in_time }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.check_out_time }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.actual_working_hours }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.delay_minutes }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.early_leave_minutes }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.overtime_minutes }}
            </td>
            <td
              class="border border-[#D2D6DB] px-4 py-3 text-center text-sm capitalize"
            >
              {{ item.status }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="footer-spacer-row">
            <td :colspan="tableHeaders.length" class="!border-none !p-0">
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
.report-table :deep(th),
.report-table :deep(td) {
  text-align: center;
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
</style>
