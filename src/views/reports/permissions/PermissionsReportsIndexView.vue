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
import adminDashboardService from "@/services/adminDashboard";

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

// ======================
// STATE
// ======================
const records = ref([]);
const loading = ref(false);
const exportLoading = ref(false);

const branches = ref([]);
const departments = ref([]);

const page = ref(1);
const perPage = ref(10);
const total = ref(0);

const printRecords = ref([]);
const printTotalPages = ref(1);

// ======================
// FILTERS + SORT
// ======================
const filters = ref({
  branch_id: "",
  department_id: "",

  sort_by: "",
  sort_direction: "asc",
});

// ======================
// SORT HANDLER
// ======================
const handleSort = (key) => {
  const sortMap = {
    branch_name: "branch_id",
    department_name: "department_id",
    employees_count: "employees_count",
    permission_balance: "permission_balance",
    total_consumed_balance: "total_consumed_balance",
  };

  const apiKey = sortMap[key] || key;

  if (filters.value.sort_by === apiKey) {
    filters.value.sort_direction =
      filters.value.sort_direction === "asc" ? "desc" : "asc";
  } else {
    filters.value.sort_by = apiKey;
    filters.value.sort_direction = "asc";
  }

  applyFilters();
};

// ======================
// BRANCHES / DEPARTMENTS
// ======================
const fetchBranches = async () => {
  try {
    const response = await branchService.list({ paginate: false });
    const data = Array.isArray(response?.data)
      ? response.data
      : response?.branches || [];

    branches.value = data.map((b) => ({
      label: locale.value === "ar" ? b.name_ar || b.name : b.name_en || b.name,
      value: b.id,
    }));
  } catch (e) {
    console.error(e);
  }
};

const fetchDepartments = async () => {
  try {
    const response = await adminDashboardService.getAccessibleDepartments({
      branch_id: filters.value.branch_id || null,
      paginate: false,
    });

    const resData = response?.data;
    const data = Array.isArray(resData)
      ? resData
      : resData?.departments || resData?.data || [];

    departments.value = data.map((d) => ({
      label: locale.value === "ar" ? d.name_ar || d.name : d.name_en || d.name,
      value: d.id,
    }));
  } catch (e) {
    console.error(e);
  }
};

// ======================
// LOAD DATA
// ======================
const loadSummary = async () => {
  loading.value = true;

  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      branch_id: filters.value.branch_id || null,
      department_id: filters.value.department_id || null,
      sort_by: filters.value.sort_by || null,
      sort_direction: filters.value.sort_direction || null,
    };

    const response =
      await attendanceReportsService.getPermissionBalancesSummary(params);

    const data =
      response?.data?.summary ||
      response?.data?.data?.summary ||
      response?.data ||
      [];

    records.value = data;
    total.value = response?.data?.pagination?.total || data.length;
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
  { key: "branch_name", label: t("branches.entityName") },
  {
    key: "department_name",
    label: t("employees.fields.departmentSection"),
  },
  { key: "employees_count", label: t("reportsData.employees_count") },
  { key: "permission_balance", label: t("sidebar.reportsPermissions") },
  {
    key: "total_consumed_balance",
    label: t("reportsData.total_consumed_balance_minutes"),
  },
  { key: "actions", label: t("branches.fields.actions") },
]);

// ======================
// APPLY / RESET FILTERS
// ======================
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

const changePage = (p) => {
  page.value = p;
  loadSummary();
};

// ======================
// VIEW DETAILS
// ======================
const viewDetails = (item) => {
  const prefix = locale.value === "en" ? "/en" : "";
  router.push({
    path: `${prefix}/reports/permissions/details/${item.department_id}`,
    query: {
      department_name: item.department_name,
      branch_name: item.branch_name,
    },
  });
};

// ======================
// WATCHERS
// ======================
watch(
  () => filters.value.branch_id,
  () => {
    filters.value.department_id = "";
    fetchDepartments();
  },
);

// const handlePrint = async () => {
//   try {
//     const params = { paginate: false, ...filters.value };
//     const response =
//       await attendanceReportsService.getPermissionBalancesSummary(params);

//     const data =
//       response?.data?.summary ||
//       response?.data?.data?.summary ||
//       response?.data ||
//       [];
//     printRecords.value = data;

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

const handleExport = async (format = "excel") => {
  exportLoading.value = true;
  try {
    const params = { paginate: false, ...filters.value };
    const response =
      await attendanceReportsService.getPermissionBalancesSummary(params);
    const data =
      response?.data?.summary ||
      response?.data?.data?.summary ||
      response?.data ||
      [];

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
    [t("branches.entityName")]: item.branch_name,
    [t("employees.fields.departmentSection")]: item.department_name,
    [t("reportsData.employees_count")]: item.employees_count,
    [t("sidebar.reportsPermissions")]: item.permission_balance,
    [t("reportsData.total_consumed_balance_minutes")]:
      item.total_consumed_balance,
  }));
  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Permissions Summary");
  XLSX.writeFile(wb, `permissions_summary_${new Date().getTime()}.xlsx`);
};

const exportToPDF = async (data, { save = true } = {}) => {
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
    const title = t("sidebar.reportsPermissions");

    let heads = tableHeaders.value
      .filter((h) => h.key !== "actions")
      .map((h) => h.label);
    let rows = data.map((item, index) => [
      index + 1,
      item.branch_name,
      item.department_name,
      item.employees_count,
      item.permission_balance,
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
        fontSize: 10,
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

    if (save) {
      doc.save(`permissions_summary_${new Date().getTime()}.pdf`);
      return;
    }

    return doc;
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

    const response =
      await attendanceReportsService.getPermissionBalancesSummary(params);

    const data =
      response?.data?.summary ||
      response?.data?.data?.summary ||
      response?.data ||
      [];

    // build PDF (no download)
    const doc = await exportToPDF(data, { save: false });

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = pdfUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };

    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
      iframe.remove();
    }, 10000);
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  }
};

// ======================
// INIT
// ======================
onMounted(() => {
  fetchBranches();
  fetchDepartments();
  loadSummary();
});
</script>

<template>
  <section class="space-y-6">
    <!-- HEADER -->
    <header class="flex justify-between items-center no-print">
      <h1 class="text-[20px] font-[600]">
        {{ t("sidebar.reportsPermissions") }}
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

    <!-- FILTERS -->
    <Card class="no-print">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Select
          v-model="filters.branch_id"
          :options="branches"
          :label="t('branches.entityName')"
        />
        <Select
          v-model="filters.department_id"
          :options="departments"
          :label="t('employees.fields.departmentSection')"
        />
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="ghost" @click="resetFilters">
          {{ t("roles.resetFilters") }}
        </Button>
        <Button variant="primary" :loading="loading" @click="applyFilters">
          {{ t("common.search") }}
        </Button>
      </div>
    </Card>

    <!-- TABLE -->
    <Card class="no-print">
      <Table
        :items="records"
        :headers="tableHeaders"
        :loading="loading"
        :page="page"
        :total-pages="Math.ceil(total / perPage)"
        @change-page="changePage"
      >
        <!-- SORTABLE HEADERS -->
        <template
          v-for="header in tableHeaders.filter((h) => h.key !== 'actions')"
          :key="header.key"
          #[`header-${header.key}`]
        >
          <div
            class="flex items-center justify-between cursor-pointer select-none"
            @click="handleSort(header.key)"
          >
            {{ header.label }}

            <SvgIcon
              name="sort"
              class="w-4 h-4"
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

        <template #cell-permission_balance="{ item }">
          {{ item.permission_balance }}
        </template>

        <template #cell-total_consumed_balance="{ item }">
          {{ item.total_consumed_balance }}
        </template>

        <template #cell-actions="{ item }">
          <button @click="viewDetails(item)">
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
              <PrintHeader :title="t('sidebar.reportsPermissions')" />
            </th>
          </tr>
          <tr class="bg-[#0E5F4A] text-white">
            <th
              v-for="h in tableHeaders.filter((h) => h.key !== 'actions')"
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
              {{ item.branch_name }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.department_name }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.employees_count }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.permission_balance }}
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
