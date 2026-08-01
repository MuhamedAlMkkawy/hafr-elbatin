<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Table from "@/components/ui/Table.vue";
import Select from "@/components/ui/Select.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import attendanceReportsService from "@/services/attendanceReports";
import branchService from "@/services/branches";
import departmentService from "@/services/departments";
import adminDashboardService from "@/services/adminDashboard";
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
const toast = useAppToast();
const route = useRoute();
const router = useRouter();
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

const fromDate = route.query.from_date || "";
const toDate = route.query.to_date || "";
const reportTitle = computed(() => route.query.report_title || "");

// State
const records = ref([]);
const loading = ref(false);
const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const printRecords = ref([]);
const printTotalPages = ref(1);

// Filters
const filters = ref({
  branch_id: "",
  department_id: "",
  from_date: fromDate,
  to_date: toDate,
});

const branches = ref([]);
const departments = ref([]);

const breadcrumbItems = computed(() => [
  { label: t("sidebar.reports"), to: "/reports/leaves" },
  { label: t("sidebar.reportsLeaves"), to: "/reports/leaves" },
  { label: reportTitle.value || t("common.details") },
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
      label: lang.value === "ar" ? b.name_ar || b.name : b.name_en || b.name,
      value: b.id,
    }));
  } catch (e) {
    console.error("Error fetching branches:", e);
  }
};

const fetchDepartments = async () => {
  try {
    const params = { paginate: false };
    let response = await adminDashboardService.getAccessibleDepartments(params);
    let data = Array.isArray(response)
      ? response
      : response?.data || response?.departments || [];
    if (data && !Array.isArray(data) && Array.isArray(data.data))
      data = data.data;

    departments.value = (Array.isArray(data) ? data : []).map((d) => ({
      label: lang.value === "ar" ? d.name_ar || d.name : d.name_en || d.name,
      value: d.id,
    }));
  } catch (e) {
    console.error("Error fetching departments:", e);
  }
};

const loadSummary = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...filters.value,
    };
    if (params.from_date) params.from_date = formatToApiDate(params.from_date);
    if (params.to_date) params.to_date = formatToApiDate(params.to_date);

    const response =
      await attendanceReportsService.getLeaveBalancesSummary(params);
    const data =
      response.data?.summary ||
      response.data?.data?.summary ||
      response.data ||
      response;

    records.value = Array.isArray(data) ? data : data.summary || [];
    total.value =
      response.data?.pagination?.total ||
      data.pagination?.total ||
      records.value.length;
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  } finally {
    loading.value = false;
  }
};

const handlePrint = async () => {
  try {
    const params = { paginate: false, ...filters.value };
    if (params.from_date) params.from_date = formatToApiDate(params.from_date);
    if (params.to_date) params.to_date = formatToApiDate(params.to_date);

    const response =
      await attendanceReportsService.getLeaveBalancesSummary(params);
    printRecords.value =
      response.data?.summary || response.data?.data?.summary || [];

    await nextTick();

    // Calculate total pages
    const tableBody = document.querySelector(".print-only tbody");
    if (tableBody) {
      const rows = tableBody.querySelectorAll("tr");
      const firstRowHeight = rows[0]?.offsetHeight || 35;
      const availableHeight = 903;
      const rowsPerPage = Math.floor(availableHeight / firstRowHeight);
      const totalRows = rows.length;
      printTotalPages.value = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    }

    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 300));
    window.print();
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  }
};

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  {
    key: "department_name",
    label: t("employees.fields.departmentSection"),
    cellClass: "text-start",
  },
  { key: "branch_name", label: t("branches.title") },
  { key: "employees_count", label: t("reportsData.employees_count") },
  {
    key: "total_consumed_balance",
    label: t("reportsData.total_consumed_balance"),
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
    if (params.from_date) params.from_date = formatToApiDate(params.from_date);
    if (params.to_date) params.to_date = formatToApiDate(params.to_date);

    const response =
      await attendanceReportsService.getLeaveBalancesSummary(params);
    const data = response.data?.summary || response.data?.data?.summary || [];

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
    [t("employees.fields.departmentSection")]: item.department_name,
    [t("branches.title")]: item.branch_name,
    [t("reportsData.employees_count")]: item.employees_count,
    [t("reportsData.total_consumed_balance")]: item.total_consumed_balance,
  }));
  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leave Summary");
  XLSX.writeFile(wb, `leave_summary_${new Date().getTime()}.xlsx`);
};

const exportToPDF = async (data) => {
  const doc = new jsPDF({ orientation: "l", unit: "mm", format: "a4" });
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
    const title = `${t("sidebar.reportsLeaves")} - ${reportTitle.value}`;

    let heads = tableHeaders.value
      .filter((h) => h.key !== "actions")
      .map((h) => h.label);
    let rows = data.map((item, index) => [
      index + 1,
      item.department_name,
      item.branch_name,
      item.employees_count,
      item.total_consumed_balance,
    ]);

    if (isArabic) {
      heads = [...heads].reverse();
      rows = rows.map((r) => [...r].reverse());
    }

    autoTable(doc, {
      startY: 55,
      head: [heads],
      body: rows,
      styles: {
        font: "IBMPlexSansArabic",
        halign: isArabic ? "right" : "left",
        fontSize: 9,
        fontStyle: "normal",
      },
      headStyles: {
        font: "IBMPlexSansArabic",
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
        fontStyle: "bold",
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
        const fullTitle = isArabic
          ? `عنوان التقرير: ${title}`
          : `Report Title: ${title}`;
        doc.text(fullTitle, pageWidth / 2, 40, { align: "center" });
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

    doc.save(`leave_summary_${new Date().getTime()}.pdf`);
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

const applyFilters = () => {
  page.value = 1;
  loadSummary();
};

const resetFilters = () => {
  filters.value = {
    branch_id: "",
    department_id: "",
    from_date: fromDate,
    to_date: toDate,
  };
  applyFilters();
};

const viewDeptDetails = (item) => {
  const prefix = locale.value === "en" ? "/en" : "";
  router.push({
    path: `${prefix}/reports/leaves/department/${item.department_id}`,
    query: {
      from_date: filters.value.from_date,
      to_date: filters.value.to_date,
      report_title: reportTitle.value,
      department_name: item.department_name,
    },
  });
};

const changePage = (newPage) => {
  page.value = newPage;
  loadSummary();
};

onMounted(() => {
  loadSummary();
  fetchBranches();
  fetchDepartments();
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
      <h1 class="text-[20px] font-[600] text-[#000000]">
        {{ t("sidebar.reportsLeaves") }} - {{ reportTitle }}
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
          :label="t('branches.title')"
          :placeholder="t('branches.placeholders.name')"
        />
        <Select
          v-model="filters.department_id"
          :options="departments"
          :label="t('employees.fields.departmentSection')"
          :placeholder="t('employees.placeholders.departmentOrSection')"
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
        <div class="flex items-center gap-4">
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("sidebar.reportsLeaves") }}
          </h2>
          <span
            v-if="reportTitle"
            class="text-[14px] font-[400] text-[#0E5F4A] bg-[#E7EFED] border border-[#0E5F4A] px-2 py-1 rounded-full"
            >{{ reportTitle }}</span
          >
        </div>
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
        <template #cell-index="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>
        <template #cell-actions="{ item }">
          <button
            class="cursor-pointer text-[#667085] hover:text-[#0E5F4A] transition-colors"
            @click="viewDeptDetails(item)"
            v-tooltip="
              t('common.actionTooltips.view.title', {
                target: item?.department_name,
              })
            "
          >
            <SvgIcon name="eye" />
          </button>
        </template>
      </Table>
    </Card>

    <div class="print-only hidden" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              :colspan="tableHeaders.length - 1"
              class="!bg-transparent !border-none !p-0"
            >
              <PrintHeader
                :title="t('sidebar.reportsLeaves') + ' - ' + reportTitle"
              />
            </th>
          </tr>
          <tr class="bg-[#0E5F4A] text-white">
            <th
              v-for="h in tableHeaders.filter((h) => h.key !== 'actions')"
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
            <td
              class="border border-[#D2D6DB] px-4 py-3 text-center text-sm text-start"
            >
              {{ item.department_name }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.branch_name }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.employees_count }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.total_consumed_balance }}
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
