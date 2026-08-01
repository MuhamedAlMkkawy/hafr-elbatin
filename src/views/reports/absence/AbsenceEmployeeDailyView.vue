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
import DateRangePicker from "@/components/ui/DateRangePicker.vue";

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
const lang = computed(() => locale.value);
const authStore = useAuthStore();
const toast = useAppToast();
const route = useRoute();
const router = useRouter();

// State
const records = ref([]);
const loading = ref(false);
const printRecords = ref([]);
const printTotalPages = ref(1);

const formatTime = (timeStr) => {
  if (!timeStr || timeStr === "---") return "---";
  const parts = timeStr.trim().split(" ");
  return parts.length > 1 ? parts[1] : timeStr;
};

// Pagination
const page = ref(1);
const perPage = ref(10);
const total = ref(0);

const employeeId = route.query.employee_id;
const employeeName = route.query.employee_name || "";
const fromDate = route.query.from_date || "";
const toDate = route.query.to_date || "";

const filters = ref({
  employee_id: employeeId,
  from_date: fromDate,
  to_date: toDate,
});

const breadcrumbItems = computed(() => [
  { label: t("sidebar.reports"), to: "/reports/absence" },
  { label: t("sidebar.reportsAbsence"), to: "/reports/absence" },
  { label: employeeName || t("reportsData.details") },
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

    const response =
      await attendanceReportsService.getWorkingHoursReport(params);
    const data = response.data?.data || response.data || response;

    records.value = data.records || [];
    total.value = data.pagination?.total || records.value.length;
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  page.value = 1;
  loadLogs();
};

const changePage = (newPage) => {
  page.value = newPage;
  loadLogs();
};

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "date", label: t("common.date") },
  { key: "check_in_time", label: t("reportsData.check_in") },
  { key: "check_out_time", label: t("reportsData.check_out") },
  { key: "total_working_hours", label: t("reportsData.total_working_hours") },
  { key: "actual_working_hours", label: t("reportsData.actual_working_hours") },
  { key: "difference", label: t("reportsData.difference") },
  { key: "overtime", label: t("reportsData.overtime") },
  { key: "status", label: t("reportsData.status") },
]);

const handleExport = async (format = "excel") => {
  try {
    const params = { paginate: false, ...filters.value };
    const response =
      await attendanceReportsService.getWorkingHoursReport(params);
    const data = response.data?.records || response.data?.data?.records || [];

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
    [t("reportsData.check_in")]: formatTime(item.check_in_time),
    [t("reportsData.check_out")]: formatTime(item.check_out_time),
    [t("reportsData.total_working_hours")]: item.total_working_hours,
    [t("reportsData.actual_working_hours")]: item.actual_working_hours,
    [t("reportsData.difference")]: item.difference,
    [t("reportsData.overtime")]: item.overtime,
    [t("reportsData.status")]: item.attendance_status,
  }));

  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Logs");
  XLSX.writeFile(
    wb,
    `absence_logs_${employeeName}_${new Date().getTime()}.xlsx`,
  );
};

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

const exportToPDF = async (data) => {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  try {
    const regularFontRes = await fetch(IBMPlexSansArabicRegular);
    const regularFontBuffer = await regularFontRes.arrayBuffer();
    const boldFontRes = await fetch(IBMPlexSansArabicBold);
    const boldFontBuffer = await boldFontRes.arrayBuffer();

    doc.addFileToVFS(
      "IBMPlexSansArabic-Regular.ttf",
      arrayBufferToBase64(regularFontBuffer),
    );
    doc.addFont("IBMPlexSansArabic-Regular.ttf", "IBMPlexSansArabic", "normal");
    doc.addFileToVFS(
      "IBMPlexSansArabic-Bold.ttf",
      arrayBufferToBase64(boldFontBuffer),
    );
    doc.addFont("IBMPlexSansArabic-Bold.ttf", "IBMPlexSansArabic", "bold");

    doc.setFont("IBMPlexSansArabic", "normal");

    const isArabic = locale.value === "ar";
    const totalPagesExp = "{total_pages}";
    const title = `${t("sidebar.reportsAbsence")} - ${employeeName}`;

    let heads = tableHeaders.value.map((h) => h.label);
    let rows = data.map((item, index) => [
      index + 1,
      item.date,
      formatTime(item.check_in_time),
      formatTime(item.check_out_time),
      item.total_working_hours,
      item.actual_working_hours,
      item.difference,
      item.overtime,
      item.attendance_status,
    ]);

    if (isArabic) {
      heads = [...heads].reverse();
      rows = rows.map((r) => [...r].reverse());
    }

    autoTable(doc, {
      startY: 70,
      head: [heads],
      body: rows,
      styles: {
        font: "IBMPlexSansArabic",
        halign: isArabic ? "right" : "left",
        fontSize: 8,
        fontStyle: "normal",
        lineHeight: 1.2,
      },
      headStyles: {
        font: "IBMPlexSansArabic",
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        lineHeight: 1.2,
      },
      didParseCell: (data) => {
        data.cell.styles.font = "IBMPlexSansArabic";
      },
      didDrawPage: (data) => {
        const pageWidth = doc.internal.pageSize.width;
        // Draw Header
        drawPdfHeader(doc, authStore, isArabic);

        // Subtitle (Title)
        doc.setFontSize(11);
        doc.setFont("IBMPlexSansArabic", "bold");
        const titleStr = t("sidebar.reportsAbsence");
        const fullTitle = `${titleStr} - ${employeeName}`;
        doc.text(fullTitle, pageWidth / 2, 45, { align: "center" });
        doc.setFont("IBMPlexSansArabic", "normal");
      },
      margin: { top: 65, bottom: 30 },
    });

    // Draw Footer (Like EmployeesIndexView.vue)
    const totalPagesHead = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPagesHead; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPagesHead, isArabic);
    }

    doc.save(`absence_logs_${employeeName}_${new Date().getTime()}.pdf`);
  } catch (err) {
    console.error(err);
    toast.error("PDF generation failed.");
  }
};

const handlePrint = async () => {
  try {
    const params = { paginate: false, ...filters.value };
    const response =
      await attendanceReportsService.getWorkingHoursReport(params);
    const data = response.data?.records || response.data?.data?.records || [];
    printRecords.value = data;

    // Calculate approx total pages for footer
    const rowsPerPage = 12;
    printTotalPages.value =
      Math.ceil(printRecords.value.length / rowsPerPage) || 1;

    await nextTick();
    window.print();
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  }
};

const goBack = () => router.back();

onMounted(() => loadLogs());
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
          {{ t("sidebar.reportsAbsence") }} - {{ employeeName }}
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
      <div class="mb-5">
        <DateRangePicker
          v-model:startDate="filters.from_date"
          v-model:endDate="filters.to_date"
          :label="t('common.date')"
          size="md"
        />
      </div>
      <div class="flex justify-end gap-2">
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
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("sidebar.reportsAbsence") }} - {{ employeeName }}
        </h2>
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
        <template #cell-index="{ index }">{{
          (page - 1) * perPage + index + 1
        }}</template>
        <template #cell-check_in_time="{ item }">{{
          formatTime(item.check_in_time)
        }}</template>
        <template #cell-check_out_time="{ item }">{{
          formatTime(item.check_out_time)
        }}</template>
        <template #cell-status="{ item }">
          <span
            :class="[
              'px-2 py-1 rounded text-xs font-medium',
              item.status === 'present'
                ? 'bg-[#ECFDF3] text-[#027A48]'
                : 'bg-[#FEF3F2] text-[#B42318]',
            ]"
          >
            {{ item.attendance_status }}
          </span>
        </template>
      </Table>
    </Card>

    <!-- Print only -->
    <div class="print-only" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              :colspan="tableHeaders.length"
              class="!bg-transparent !border-none !p-0"
            >
              <div class="print-header-wrapper pb-6">
                <PrintHeader
                  :title="t('sidebar.reportsAbsence') + ' - ' + employeeName"
                />
              </div>
            </th>
          </tr>
          <tr class="bg-[#0E5F4A] text-white">
            <th
              v-for="h in tableHeaders"
              :key="h.key"
              class="border border-[#D2D6DB] px-4 py-3 text-center text-xs font-semibold uppercase"
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
              {{ formatTime(item.check_in_time) }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ formatTime(item.check_out_time) }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.total_working_hours }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.actual_working_hours }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.difference }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.overtime }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.attendance_status }}
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
  @page {
    margin: 10mm;
  }
  .no-print {
    display: none !important;
  }
  .print-only {
    display: block !important;
    padding: 0 10mm !important;
  }

  /* Hide main content during print if we are using the print-only table */
  header,
  .card,
  #print-area,
  .breadcrumb,
  .space-y-6 > div:not(.print-only) {
    display: none !important;
  }

  tr,
  td,
  th {
    page-break-inside: avoid !important;
  }

  table {
    page-break-inside: auto !important;
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 0 !important;
  }

  .header-spacer-row {
    counter-increment: page;
  }

  :deep(.min-h-screen),
  main {
    min-height: auto !important;
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* Ensure thead/tfoot repeat correctly */
  thead {
    display: table-header-group;
  }

  tfoot {
    display: table-footer-group;
  }

  tr {
    page-break-inside: avoid;
    page-break-after: auto;
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
