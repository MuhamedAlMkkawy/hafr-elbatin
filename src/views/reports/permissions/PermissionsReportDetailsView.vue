<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Table from "@/components/ui/Table.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import attendanceReportsService from "@/services/attendanceReports";
import MonthPicker from "@/components/ui/MonthPicker.vue";

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
const route = useRoute();

// State
const records = ref([]);
const loading = ref(false);
const exportLoading = ref(false);
const total = ref(0);
const page = ref(1);
const perPage = ref(10);
const printRecords = ref([]);

const departmentId = route.params.id;
const departmentName = ref(route.query.department_name || "");
const branchName = ref(route.query.branch_name || "");
const currentMonth = ref(
  route.query.month || new Date().toISOString().slice(0, 7),
);

const filters = ref({
  search: "",
});

const breadcrumbItems = computed(() => [
  { label: t("sidebar.reports"), to: "/reports" },
  { label: t("sidebar.reportsPermissions"), to: "/reports/permissions" },
  { label: departmentName.value || t("common.details") },
]);

const loadEmployees = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      month: currentMonth.value,
      ...filters.value,
    };

    const response =
      await attendanceReportsService.getPermissionBalancesDepartmentEmployees(
        departmentId,
        params,
      );
    const data = response?.data?.data || response?.data || response;

    records.value = data?.employees || [];
    total.value =
      data?.pagination?.total || data?.total || records.value.length;

    if (data?.department) {
      departmentName.value = data.department.name;
    }
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  } finally {
    loading.value = false;
  }
};

// const handlePrint = async () => {
//   try {
//     const params = {
//       paginate: false,
//       month: currentMonth.value,
//       ...filters.value,
//     };

//     const response =
//       await attendanceReportsService.getPermissionBalancesDepartmentEmployees(
//         departmentId,
//         params,
//       );
//     const data = response?.data?.data || response?.data || response;

//     printRecords.value = data?.employees || [];

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

const printTotalPages = ref(1);

const formatTime = (minutes) => {
  if (minutes === undefined || minutes === null) return "00:00";
  const hours = Math.floor(Math.abs(minutes) / 60);
  const mins = Math.abs(minutes) % 60;
  return `${minutes < 0 ? "-" : ""}${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  {
    key: "employee_name",
    label: t("reportsData.employee_name") || t("employees.fields.employeeName"),
    cellClass: "text-start",
  },
  { key: "monthly_balance", label: t("reportsData.monthly_balance") },
  {
    key: "total_consumed_balance",
    label: t("reportsData.consumed_count") || t("common.total"),
  },
  { key: "remaining_balance", label: t("reportsData.remaining_balance") },
]);

const handleExport = async (format = "excel") => {
  exportLoading.value = true;
  try {
    const params = {
      paginate: false,
      month: currentMonth.value,
      ...filters.value,
    };
    const response =
      await attendanceReportsService.getPermissionBalancesDepartmentEmployees(
        departmentId,
        params,
      );
    const data =
      response?.data?.employees || response?.data?.data?.employees || [];

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
    [t("reportsData.employee_name") || t("employees.fields.employeeName")]:
      item.employee_name,
    [t("reportsData.monthly_balance")]: formatTime(item.monthly_balance),
    [t("reportsData.consumed_count") || t("common.total")]: formatTime(
      item.total_consumed_balance,
    ),
    [t("reportsData.remaining_balance")]: formatTime(item.remaining_balance),
  }));
  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employee Permissions");
  XLSX.writeFile(
    wb,
    `permission_details_${departmentName.value}_${currentMonth.value}.xlsx`,
  );
};

const exportToPDF = async (data, { save = true } = {}) => {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  try {
    // ======================
    // LOAD FONTS (PARALLEL)
    // ======================
    const [regularRes, boldRes] = await Promise.all([
      fetch(IBMPlexSansArabicRegular),
      fetch(IBMPlexSansArabicBold),
    ]);

    const [regularBuffer, boldBuffer] = await Promise.all([
      regularRes.arrayBuffer(),
      boldRes.arrayBuffer(),
    ]);

    const toBase64 = (buffer) => {
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    };

    doc.addFileToVFS("IBMPlexSansArabic-Regular.ttf", toBase64(regularBuffer));
    doc.addFont("IBMPlexSansArabic-Regular.ttf", "IBMPlexSansArabic", "normal");

    doc.addFileToVFS("IBMPlexSansArabic-Bold.ttf", toBase64(boldBuffer));
    doc.addFont("IBMPlexSansArabic-Bold.ttf", "IBMPlexSansArabic", "bold");

    doc.setFont("IBMPlexSansArabic", "normal");

    // ======================
    // BASIC INFO
    // ======================
    const isArabic = locale.value === "ar";
    const title = `${t("sidebar.reportsPermissions")} - ${departmentName.value}`;

    const marginX = 14;

    // ======================
    // HEADERS
    // ======================
    const headers = tableHeaders.value.map((h) => h.label);

    // ======================
    // ROWS (SAFE MAP)
    // ======================
    const rows = data.map((item, index) => [
      index + 1,
      item.employee_name ?? "---",
      formatTime(item.monthly_balance),
      formatTime(item.total_consumed_balance),
      formatTime(item.remaining_balance),
    ]);

    // ======================
    // RTL SAFE TRANSFORM (NON-DESTRUCTIVE)
    // ======================
    const headsFinal = isArabic ? [...headers].reverse() : headers;
    const rowsFinal = isArabic ? rows.map((r) => [...r].reverse()) : rows;

    // ======================
    // TABLE
    // ======================
    autoTable(doc, {
      startY: 55,
      head: [headsFinal],
      body: rowsFinal,

      styles: {
        font: "IBMPlexSansArabic",
        fontSize: 9,
        halign: "center",
        valign: "middle",
      },

      headStyles: {
        fillColor: [14, 95, 74],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },

      alternateRowStyles: {
        fillColor: [245, 248, 247],
      },

      tableLineColor: [210, 214, 219],
      tableLineWidth: 0.2,

      margin: { top: 50, bottom: 30, left: marginX, right: marginX },

      didParseCell: (data) => {
        data.cell.styles.font = "IBMPlexSansArabic";
      },

      didDrawPage: () => {
        const pageWidth = doc.internal.pageSize.width;

        drawPdfHeader(doc, authStore, isArabic);

        doc.setFont("IBMPlexSansArabic", "bold");
        doc.setFontSize(11);

        doc.text(title, isArabic ? pageWidth - 15 : 15, 40, {
          align: isArabic ? "right" : "left",
        });

        doc.setFont("IBMPlexSansArabic", "normal");
      },
    });

    // ======================
    // FOOTER PAGINATION
    // ======================
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPages, isArabic, true);
    }

    // ======================
    // SAVE
    // ======================
    if (save) {
      doc.save(
        `permission_details_${departmentName.value}_${currentMonth.value}.pdf`,
      );
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
      month: currentMonth.value,
      ...filters.value,
    };

    const response =
      await attendanceReportsService.getPermissionBalancesDepartmentEmployees(
        departmentId,
        params,
      );

    const data = response?.data?.data || response?.data || response;
    const employees = data?.employees || [];

    // generate PDF (no download)
    const doc = await exportToPDF(employees, { save: false });

    if (!doc) {
      toast.error(t("common.error"));
      return;
    }

    // create blob URL
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // remove old iframe if exists
    const oldFrame = document.getElementById("print-pdf-frame");
    if (oldFrame) oldFrame.remove();

    // create hidden iframe in SAME PAGE
    const iframe = document.createElement("iframe");
    iframe.id = "print-pdf-frame";
    iframe.src = pdfUrl;

    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";

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

const applyFilters = () => {
  page.value = 1;
  loadEmployees();
};

const resetFilters = () => {
  filters.value.search = "";
  applyFilters();
};

const changePage = (newPage) => {
  page.value = newPage;
  loadEmployees();
};

onMounted(() => loadEmployees());
</script>

<template>
  <section class="space-y-6">
    <header
      class="flex flex-wrap gap-x-10 gap-y-5 items-center justify-between no-print"
    >
      <div class="flex flex-col gap-2">
        <Breadcrumb :items="breadcrumbItems" />
        <h1 class="text-[20px] font-[600] text-[#000000]">
          {{ t("sidebar.reportsPermissions") }} - {{ departmentName }}
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
        <Input
          v-model="filters.search"
          :label="t('reportsData.employee_name') || 'الموظف'"
          :placeholder="t('common.search')"
        >
          <template #suffix><SvgIcon name="search" /></template>
        </Input>
        <MonthPicker
          v-model="currentMonth"
          :label="t('common.month') || 'الشهر'"
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
        <div class="flex flex-wrap items-center gap-4">
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("sidebar.reportsPermissions") }}
          </h2>
          <span
            class="text-[14px] font-[400] text-[#0E5F4A] bg-[#E7EFED] border border-[#0E5F4A] px-2 py-1 rounded-full"
            >{{ departmentName }}</span
          >
          <span
            class="text-[14px] font-[400] text-[#0E5F4A] bg-[#E7EFED] border border-[#0E5F4A] px-2 py-1 rounded-full"
            v-if="branchName"
            >{{ branchName }}</span
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
        <template #cell-monthly_balance="{ item }">
          {{ formatTime(item.monthly_balance) }}
        </template>
        <template #cell-total_consumed_balance="{ item }">
          {{ formatTime(item.total_consumed_balance) }}
        </template>
        <template #cell-remaining_balance="{ item }">
          {{ formatTime(item.remaining_balance) }}
        </template>
      </Table>
    </Card>

    <div class="print-only hidden" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              :colspan="tableHeaders.length"
              class="!bg-transparent !border-none !p-0"
            >
              <PrintHeader
                :title="
                  t('sidebar.reportsPermissions') + ' - ' + departmentName
                "
              />
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
            <td class="border border-[#D2D6DB] px-4 py-3 text-start text-sm">
              {{ item.employee_name }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ formatTime(item.monthly_balance) }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ formatTime(item.total_consumed_balance) }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ formatTime(item.remaining_balance) || "---" }}
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
