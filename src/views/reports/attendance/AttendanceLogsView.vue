<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Table from "@/components/ui/Table.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Select from "@/components/ui/Select.vue";
import DateRangePicker from "@/components/ui/DateRangePicker.vue";

import attendanceReportsService from "@/services/attendanceReports";
import departmentService from "@/services/departments";
import adminDashboardService from "@/services/adminDashboard";
import employeeService from "@/services/employees";
import { useAuthStore } from "@/stores/auth";

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

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();
const authStore = useAuthStore();

const formatDisplayDate = (dateStr) => {
  if (!dateStr || dateStr === "---") return "---";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);
  return `${mm}/${d}/20${y}`;
};

const formatToApiDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr.includes("T")) return dateStr.split("T")[0];
  if (dateStr.includes("/")) {
    let [m, d, y] = dateStr.split("/");
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return dateStr;
};

// ======================
// STATE
// ======================
const records = ref([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);
const perPage = ref(10);

const printRecords = ref([]);
const printTotalPages = ref(1);

// ======================
// FILTERS + SORT
// ======================
const filters = ref({
  department_id: "",
  employee_id: "",
  from_date: null,
  to_date: null,

  sort_by: "",
  sort_direction: "asc",
});

// ======================
// SORT HANDLER
// ======================
const handleSort = (key) => {
  const map = {
    date: "date",
    employee_name: "employee_name",
    device_in: "device_in",
    device_out: "device_out",
    app_in: "app_in",
    app_out: "app_out",
    diff_in: "diff_in",
    diff_out: "diff_out",
  };

  const apiKey = map[key] || key;

  if (filters.value.sort_by === apiKey) {
    filters.value.sort_direction =
      filters.value.sort_direction === "asc" ? "desc" : "asc";
  } else {
    filters.value.sort_by = apiKey;
    filters.value.sort_direction = "asc";
  }

  applyFilters();
};

const departments = ref([]);
const employees = ref([]);

const fetchDepartments = async () => {
  try {
    const params = { paginate: false };
    let response = await adminDashboardService.getAccessibleDepartments(params);
    let data = Array.isArray(response)
      ? response
      : response?.data || response?.departments || [];
    if (data && !Array.isArray(data) && Array.isArray(data.data))
      data = data.data;

    if (!Array.isArray(data) || data.length === 0) {
      const allRes = await departmentService.listAll();
      data = Array.isArray(allRes)
        ? allRes
        : allRes?.data || allRes?.departments || [];
      if (data && !Array.isArray(data) && Array.isArray(data.data))
        data = data.data;
    }

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

// ======================
// PROCESS LOGS
// ======================
const processLogs = (logs) => {
  const grouped = {};
  logs.forEach((log) => {
    const key = `${log.employee_id}_${log.date}`;
    if (!grouped[key]) {
      grouped[key] = {
        date: log.date,
        employee_name: log.employee_name,
        device_in: "-",
        device_out: "-",
        app_in: "-",
        app_out: "-",
        diff_in: "-",
        diff_out: "-",
      };
    }
    const timeStr = log.time ? log.time.split(" ")[1] : "-";
    if (log.source === "device") {
      if (log.type === "Check-in") {
        grouped[key].device_in = timeStr;
        if (log.difference) grouped[key].diff_in = log.difference;
      } else if (log.type === "Check-out") {
        grouped[key].device_out = timeStr;
        if (log.difference) grouped[key].diff_out = log.difference;
      }
    } else if (log.source === "mobile") {
      if (log.type === "Check-in") {
        grouped[key].app_in = timeStr;
        if (log.difference && grouped[key].diff_in === "-")
          grouped[key].diff_in = log.difference;
      } else if (log.type === "Check-out") {
        grouped[key].app_out = timeStr;
        if (log.difference && grouped[key].diff_out === "-")
          grouped[key].diff_out = log.difference;
      }
    }
  });
  return Object.values(grouped);
};

const processedRecords = computed(() => processLogs(records.value));

// ======================
// LOAD LOGS
// ======================
const loadLogs = async () => {
  loading.value = true;

  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...filters.value,
    };

    if (params.from_date) params.from_date = formatToApiDate(params.from_date);
    if (params.to_date) params.to_date = formatToApiDate(params.to_date);
    if (!filters.value.employee_id) {
      delete params.employee_id;
    }

    const response = await attendanceReportsService.getAttendanceLogs(params);
    const data = response.data?.data || response.data || response;

    records.value = data.logs || [];
    total.value = data.pagination?.total || records.value.length;
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  } finally {
    loading.value = false;
  }
};

// ======================
// TABLE HEADERS
// ======================
const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "date", label: t("common.date") },
  {
    key: "employee_name",
    label: t("reportsData.employee_name"),
    cellClass: "text-start",
  },
  { key: "device_in", label: t("reportsData.device_check_in") },
  { key: "device_out", label: t("reportsData.device_check_out") },
  { key: "app_in", label: t("reportsData.app_check_in") },
  { key: "app_out", label: t("reportsData.app_check_out") },
  { key: "diff_in", label: t("reportsData.diff_check_in") },
  { key: "diff_out", label: t("reportsData.diff_check_out") },
]);

const handleExport = async (format = "excel") => {
  try {
    const params = { paginate: false, ...filters.value };
    if (params.from_date) params.from_date = formatToApiDate(params.from_date);
    if (params.to_date) params.to_date = formatToApiDate(params.to_date);

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }

    const response = await attendanceReportsService.getAttendanceLogs(params);
    const data =
      response.data?.logs || response.data?.data?.logs || response.data || [];

    const finalData = processLogs(data);

    if (format === "excel") exportToExcel(finalData);
    else if (format === "pdf") await exportToPDF(finalData);
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  }
};

const exportToExcel = (data) => {
  const flattened = data.map((item, index) => ({
    "#": index + 1,
    [t("common.date")]: item.date,
    [t("reportsData.employee_name")]: item.employee_name,
    [t("reportsData.device_check_in")]: item.device_in,
    [t("reportsData.device_check_out")]: item.device_out,
    [t("reportsData.app_check_in")]: item.app_in,
    [t("reportsData.app_check_out")]: item.app_out,
    [t("reportsData.diff_check_in")]: item.diff_in,
    [t("reportsData.diff_check_out")]: item.diff_out,
  }));
  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance Logs");
  XLSX.writeFile(wb, `attendance_logs_${new Date().getTime()}.xlsx`);
};

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

const getDateRangeLabel = () => {
  const from = filters.value.from_date
    ? formatDisplayDate(filters.value.from_date)
    : "--";

  const to = filters.value.to_date
    ? formatDisplayDate(filters.value.to_date)
    : "--";

  return locale.value === "ar"
    ? `التاريخ : من ${from}  إلى ${to}`
    : `Date: From ${from}  To ${to}`;
};

const exportToPDF = async (data, { save = true } = {}) => {
  const doc = new jsPDF({ orientation: "l", unit: "mm", format: "a4" });
  try {
    const fontRes = await fetch(IBMPlexSansArabicRegular);
    const fontBuffer = await fontRes.arrayBuffer();
    doc.addFileToVFS(
      "IBMPlexSansArabic-Regular.ttf",
      arrayBufferToBase64(fontBuffer),
    );
    doc.addFont("IBMPlexSansArabic-Regular.ttf", "IBMPlexSansArabic", "normal");

    const fontResBold = await fetch(IBMPlexSansArabicBold);
    const fontBufferBold = await fontResBold.arrayBuffer();
    doc.addFileToVFS(
      "IBMPlexSansArabic-Bold.ttf",
      arrayBufferToBase64(fontBufferBold),
    );
    doc.addFont("IBMPlexSansArabic-Bold.ttf", "IBMPlexSansArabic", "bold");

    doc.setFont("IBMPlexSansArabic", "normal");

    const isArabic = locale.value === "ar";
    const totalPagesExp = "{total_pages}";
    let heads = tableHeaders.value.map((h) => h.label);
    let rows = data.map((item, index) => [
      index + 1,
      item.date,
      item.employee_name,
      item.device_in,
      item.device_out,
      item.app_in,
      item.app_out,
      item.diff_in,
      item.diff_out,
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
        fontSize: 8,
        fontStyle: "normal",
      },
      headStyles: {
        font: "IBMPlexSansArabic",
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
        fontStyle: "normal",
      },
      bodyStyles: { font: "IBMPlexSansArabic", fontStyle: "normal" },
      didParseCell: (data) => {
        data.cell.styles.font = "IBMPlexSansArabic";
        data.cell.styles.fontStyle = "normal";
      },
      didDrawPage: (data) => {
        doc.setFont("IBMPlexSansArabic", "normal");
        const pageWidth = doc.internal.pageSize.width;

        drawPdfHeader(doc, authStore, isArabic);

        // Subtitle (Title)
        doc.setFontSize(11);
        doc.setFont("IBMPlexSansArabic", "bold");
        const titleStr = t("reportsData.attendance_logs");
        const fullTitle = isArabic
          ? `عنوان التقرير: ${titleStr}`
          : `Report Title: ${titleStr}`;
        const margin = 15;
        doc.text(fullTitle, isArabic ? pageWidth - margin : margin, 40, {
          align: isArabic ? "right" : "left",
        });

        // Date Range (NEW)
        doc.setFontSize(10);
        doc.setFont("IBMPlexSansArabic", "normal");

        const dateRangeText = getDateRangeLabel();

        doc.text(dateRangeText, isArabic ? pageWidth - margin : margin, 46, {
          align: isArabic ? "right" : "left",
        });

        doc.setFont("IBMPlexSansArabic", "normal");
      },
      margin: { top: 50, bottom: 30 },
    });

    // Draw Footer
    const totalPagesHead = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPagesHead; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPagesHead, isArabic);
    }

    if (typeof doc.putTotalPages === "function") {
      doc.putTotalPages(totalPagesExp);
    }
    if (save) {
      doc.save(`attendance_logs_${new Date().getTime()}.pdf`);
      return;
    }

    return doc;
  } catch (err) {
    console.error(err);
    toast.error("PDF generation failed.");
  }
};

const printFrame = ref(null);

const getPrintFrame = () => {
  if (printFrame.value) return printFrame.value;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";

  document.body.appendChild(iframe);
  printFrame.value = iframe;

  return iframe;
};

const handlePrint = async () => {
  try {
    const params = {
      paginate: false,
      ...filters.value,
    };

    if (params.from_date) params.from_date = formatToApiDate(params.from_date);
    if (params.to_date) params.to_date = formatToApiDate(params.to_date);
    if (!filters.value.employee_id) delete params.employee_id;

    const response = await attendanceReportsService.getAttendanceLogs(params);

    const data =
      response?.data?.logs ||
      response?.data?.data?.logs ||
      response?.data ||
      [];

    const finalData = processLogs(data);

    const doc = await exportToPDF(finalData, { save: false });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);

    const iframe = getPrintFrame();

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // cleanup blob after printing
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    iframe.src = url;
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  }
};

// ======================
// FILTERS
// ======================
const applyFilters = () => {
  page.value = 1;
  loadLogs();
};

const resetFilters = () => {
  filters.value = {
    department_id: "",
    employee_id: "",
    from_date: null,
    to_date: null,
    sort_by: "",
    sort_direction: "asc",
  };
  applyFilters();
};

const changePage = (newPage) => {
  page.value = newPage;
  loadLogs();
};

watch(locale, () => {
  fetchDepartments();
  fetchEmployees();
});

onMounted(() => {
  loadLogs();
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
        {{ t("reportsData.attendance_logs") }}
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
        <DateRangePicker
          v-model:startDate="filters.from_date"
          v-model:endDate="filters.to_date"
          :label="t('common.date')"
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
          {{ t("reportsData.attendance_logs") }}
        </h2>
      </template>

      <Table
        :loading="loading"
        :items="processedRecords"
        :headers="tableHeaders"
        :page="page"
        :total-pages="Math.ceil(total / perPage)"
        @change-page="changePage"
        class="report-table"
      >
        <!-- SORTABLE HEADERS -->
        <template
          v-for="h in tableHeaders.filter((x) => x.key !== 'actions')"
          :key="h.key"
          #[`header-${h.key}`]
        >
          <div
            class="flex justify-between items-center cursor-pointer"
            @click="handleSort(h.key)"
          >
            {{ h.label }}

            <SvgIcon
              name="sort"
              class="w-4 h-4"
              :class="{
                'text-primary': filters.sort_by === h.key,
                'text-gray-400': filters.sort_by !== h.key,
                'rotate-180':
                  filters.sort_by === h.key &&
                  filters.sort_direction === 'desc',
              }"
            />
          </div>
        </template>

        <template #cell-date="{ item }">
          {{ formatDisplayDate(item.date) }}
        </template>
        <template #cell-index="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>
        <template #cell-diff_in="{ item }">
          <span
            :class="
              item.diff_in !== '-'
                ? item.diff_in.startsWith('-')
                  ? 'text-red-500'
                  : 'text-green-500'
                : ''
            "
          >
            {{ item.diff_in }}
          </span>
        </template>
        <template #cell-diff_out="{ item }">
          <span
            :class="
              item.diff_out !== '-'
                ? item.diff_out.startsWith('-')
                  ? 'text-red-500'
                  : 'text-green-500'
                : ''
            "
          >
            {{ item.diff_out }}
          </span>
        </template>
      </Table>
    </Card>
    <!-- <div class="print-only" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th colspan="9" class="!bg-transparent !border-none !p-0">
              <PrintHeader :title="t('reportsData.attendance_logs')" />
            </th>
          </tr>
          <tr class="bg-[#0E5F4A] text-white">
            <th
              v-for="h in tableHeaders"
              :key="h.key"
              class="border border-[#D2D6DB] px-1 py-1 text-[8px] font-bold text-center uppercase"
            >
              {{ h.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in printRecords" :key="index">
            <td
              class="border border-[#D2D6DB] px-1 py-1 text-center text-[8px]"
            >
              {{ index + 1 }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-1 text-center text-[8px]"
            >
              {{ formatDisplayDate(item.date) }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-1 text-center text-[7px]"
            >
              {{ item.employee_name }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-1 text-center text-[8px]"
            >
              {{ item.device_in }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-1 text-center text-[8px]"
            >
              {{ item.device_out }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-1 text-center text-[8px]"
            >
              {{ item.app_in }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-1 text-center text-[8px]"
            >
              {{ item.app_out }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-1 text-center text-[8px]"
            >
              {{ item.diff_in }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-1 text-center text-[8px]"
            >
              {{ item.diff_out }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="footer-spacer-row">
            <td colspan="9" class="!border-none !p-0">
              <div class="h-[60px]"></div>
            </td>
          </tr>
        </tfoot>
      </table>
      <PrintFooter :totalPages="printTotalPages" />
    </div> -->
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

  tbody,
  tr,
  td,
  th {
    page-break-inside: avoid !important;
  }

  table {
    page-break-inside: auto !important;
  }

  .header-spacer-row {
    counter-increment: page;
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
    display: block !important;
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
