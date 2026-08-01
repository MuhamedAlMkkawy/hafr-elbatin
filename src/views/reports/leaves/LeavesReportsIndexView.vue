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
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import attendanceReportsService from "@/services/attendanceReports";
import branchService from "@/services/branches";
import departmentService from "@/services/departments";

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
const authStore = useAuthStore();
const toast = useAppToast();
const router = useRouter();

// State
const records = ref([]);
const loading = ref(false);
const exportLoading = ref(false);
const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const printRecords = ref([]);
const printTotalPages = ref(1);

const filters = ref({
  branch_id: "",
  department_id: "",
  sort_by: "",
  sort_direction: "asc",
});

const branches = ref([]);
const departments = ref([]);

const breadcrumbItems = computed(() => [
  { label: t("sidebar.reports"), to: "/reports/leaves" },
  { label: t("sidebar.reportsLeaves"), to: "/reports/leaves" },
]);

// Headers based on Task
const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "branch_name", label: t("branches.title") }, // الفرع
  {
    key: "department_name",
    label: t("employees.fields.departmentSection"),
    cellClass: "text-start",
  }, // القسم
  { key: "employees_count", label: t("reportsData.employees_count") }, // عدد الموظفين
  {
    key: "distributed_consumed_leaves",
    label: t("reportsData.leaves") || "الإجازات",
    cellClass: "text-start",
  }, // الإجازات
  {
    key: "total_consumed_balance",
    label: t("reportsData.total_days") || "إجمالي الأيام",
  }, // إجمالي الأيام
  {
    key: "actions",
    label: t("branches.fields.actions"),
    cellClass: "w-10 no-print",
  },
]);

const fetchBranches = async () => {
  try {
    const response = await branchService.list({ paginate: false });
    const data = response?.data || response?.branches || response || [];
    branches.value = (Array.isArray(data) ? data : []).map((b) => ({
      label: locale.value === "ar" ? b.name_ar || b.name : b.name_en || b.name,
      value: b.id,
    }));
  } catch (e) {
    console.error("Error fetching branches:", e);
  }
};

const fetchDepartments = async () => {
  try {
    let resData = await departmentService.listAll();
    let data = resData?.data?.departments;

    departments.value = (Array.isArray(data) ? data : []).map((d) => ({
      label: locale.value === "ar" ? d.name_ar || d.name : d.name_en || d.name,
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

    const response =
      await attendanceReportsService.getLeaveBalancesSummary(params);
    const resData = response.data?.data || response.data || response;

    records.value = resData.summary || [];
    total.value = resData.pagination?.total || records.value.length;
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  } finally {
    loading.value = false;
  }
};

// HANDLE THE SORTING
const sortFieldMap = {
  branch_name: "branch_id",
  department_name: "department_id",
  employees_count: "employees_count",
  distributed_consumed_leaves: "distributed_consumed_leaves",
  total_consumed_balance: "total_consumed_balance",
};

const handleSort = (key) => {
  const apiKey = sortFieldMap[key] || key;

  if (filters.value.sort_by === apiKey) {
    filters.value.sort_direction =
      filters.value.sort_direction === "asc" ? "desc" : "asc";
  } else {
    filters.value.sort_by = apiKey;
    filters.value.sort_direction = "asc";
  }

  applyFilters();
};

const handlePrint = async () => {
  try {
    const params = {
      paginate: false,
      ...filters.value,
    };

    const response =
      await attendanceReportsService.getLeaveBalancesSummary(params);

    const data =
      response.data?.summary ||
      response.data?.data?.summary ||
      response.data ||
      [];

    // =========================
    // CREATE PDF
    // =========================
    const doc = new jsPDF({
      orientation: "l",
      unit: "mm",
      format: "a4",
    });

    const isArabic = locale.value === "ar";

    // =========================
    // LOAD FONTS
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
      item.branch_name,
      item.department_name,
      item.employees_count,
      item.distributed_consumed_leaves
        ?.map((l) => `${l.leave_type}: ${l.consumed_days}`)
        .join(", ") || "---",
      item.total_consumed_balance,
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
        fontSize: 8,
        halign: isArabic ? "right" : "left",
      },

      headStyles: {
        font: "IBMPlexSansArabic",
        fontStyle: "bold",
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
      },

      didParseCell: (d) => {
        d.cell.styles.font = "IBMPlexSansArabic";
      },

      didDrawPage: () => {
        const pageWidth = doc.internal.pageSize.width;

        drawPdfHeader(doc, authStore, isArabic);

        doc.setFontSize(11);
        doc.setFont("IBMPlexSansArabic", "bold");

        const title = `${t("sidebar.reportsLeaves")} - ${
          t("reportsData.summary") || "Summary"
        }`;

        doc.text(title, isArabic ? pageWidth - 15 : 15, 40, {
          align: isArabic ? "right" : "left",
        });

        doc.setFont("IBMPlexSansArabic", "normal");
      },

      margin: { top: 50, bottom: 30 },
    });

    // =========================
    // FOOTER PAGINATION
    // =========================
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPages, isArabic, true);
    }

    // =========================
    // PRINT (STABLE)
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

const handleExport = async (format = "excel") => {
  exportLoading.value = true;
  try {
    const params = { paginate: false, ...filters.value };
    const response =
      await attendanceReportsService.getLeaveBalancesSummary(params);
    const data = response.data?.summary || response.data?.data?.summary || [];

    if (format === "excel") exportToExcel(data);
    else if (format === "pdf") await exportToPDF(data);
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  } finally {
    exportLoading.value = false;
  }
};

const exportToExcel = (data) => {
  const flattened = data.map((item, index) => ({
    "#": index + 1,
    [t("branches.title")]: item.branch_name,
    [t("employees.fields.departmentSection")]: item.department_name,
    [t("reportsData.employees_count")]: item.employees_count,
    [t("reportsData.leaves") || "الإجازات"]: item.distributed_consumed_leaves
      ?.map((l) => `${l.leave_type}: ${l.consumed_days}`)
      .join(", "),
    [t("reportsData.total_days") || "إجمالي الأيام"]:
      item.total_consumed_balance,
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
    const title = `${t("sidebar.reportsLeaves")} - ${t("reportsData.summary")}`;

    let heads = tableHeaders.value
      .filter((h) => h.key !== "actions")
      .map((h) => h.label);

    let rows = data.map((item, index) => [
      index + 1,
      item.branch_name,
      item.department_name,
      item.employees_count,
      item.distributed_consumed_leaves
        ?.map((l) => `${l.leave_type}: ${l.consumed_days}`)
        .join(", "),
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
        fontSize: 8,
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
        const margin = 15;
        doc.text(fullTitle, isArabic ? pageWidth - margin : margin, 40, {
          align: isArabic ? "right" : "left",
        });
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
    sort_by: "",
    sort_direction: "asc",
  };
  applyFilters();
};

const viewDeptDetails = (item) => {
  const prefix = locale.value === "en" ? "/en" : "";
  router.push({
    path: `${prefix}/reports/leaves/department/${item.department_id}`,
    query: {
      department_name: item.department_name,
      branch_name: item.branch_name,
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
  fetchBranches();
  fetchDepartments();
  loadSummary();
});
</script>

<template>
  <section class="space-y-6">
    <!-- <div class="no-print">
      <Breadcrumb :items="breadcrumbItems" />
    </div> -->

    <header
      class="flex flex-wrap gap-x-10 gap-y-5 items-center justify-between no-print"
    >
      <h1 class="text-[20px] font-[600] text-[#000000]">
        {{ t("sidebar.reportsLeaves") }} -
        {{ t("reportsData.summary") || "أرصدة الاجازات" }}
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
            <Button variant="primary" size="md" :loading="exportLoading">
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
          {{ t("sidebar.reportsLeaves") }}
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
        <template
          v-for="header in tableHeaders.filter((h) => h.key !== 'actions')"
          :key="header.key"
          #[`header-${header.key}`]
        >
          <div
            class="flex items-center justify-center gap-2 cursor-pointer select-none"
            @click="handleSort(header.key)"
          >
            <span>{{ header.label }}</span>

            <SvgIcon
              name="sort"
              class="w-4 h-4 transition-transform"
              :class="{
                'text-[#0E5F4A]': filters.sort_by === header.key,
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

        <template #cell-distributed_consumed_leaves="{ item }">
          <div class="flex flex-wrap gap-1">
            <span
              v-for="(leave, i) in item.distributed_consumed_leaves"
              :key="i"
              class="text-[12px] bg-gray-100 px-2 py-0.5 rounded text-gray-700"
            >
              {{ leave.leave_type }}: <b>{{ leave.consumed_days }}</b>
            </span>
            <span
              v-if="
                !item.distributed_consumed_leaves ||
                item.distributed_consumed_leaves.length === 0
              "
              class="text-gray-400"
              >---</span
            >
          </div>
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
              <PrintHeader :title="t('sidebar.reportsLeaves')" />
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
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.branch_name }}
            </td>
            <td
              class="border border-[#D2D6DB] px-4 py-3 text-center text-sm text-start"
            >
              {{ item.department_name }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.employees_count }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              <div class="flex flex-wrap gap-1 justify-center">
                <span
                  v-for="(leave, i) in item.distributed_consumed_leaves"
                  :key="i"
                  class="whitespace-nowrap"
                >
                  {{ leave.leave_type }}: {{ leave.consumed_days }}
                </span>
              </div>
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
