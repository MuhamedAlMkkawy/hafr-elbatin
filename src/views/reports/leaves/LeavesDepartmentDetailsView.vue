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
const route = useRoute();
const router = useRouter();

const departmentId = route.params.id;
const departmentName = ref(route.query.department_name || "");
const branchName = ref(route.query.branch_name || "");

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
  search: "",
});

const breadcrumbItems = computed(() => [
  { label: t("sidebar.reports"), to: "/reports/leaves" },
  { label: t("sidebar.reportsLeaves"), to: "/reports/leaves" },
  { label: departmentName.value || t("common.details") },
]);

const loadDetails = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...filters.value,
    };

    const response =
      await attendanceReportsService.getLeaveBalancesDepartmentEmployees(
        departmentId,
        params,
      );
    const data = response.data?.data || response.data || response;

    records.value = data.employees || [];
    total.value = data.pagination?.total || records.value.length;

    if (data.department?.name) departmentName.value = data.department.name;
    // Note: branch name might come from first employee if it's not in department object
    if (records.value.length > 0 && !branchName.value) {
      branchName.value = records.value[0].branch_name;
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
//       ...filters.value,
//     };
//     const response =
//       await attendanceReportsService.getLeaveBalancesDepartmentEmployees(
//         departmentId,
//         params,
//       );
//     const data = response.data?.data || response.data || response;
//     printRecords.value = data.employees || [];

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

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  {
    key: "employee_name",
    label: t("reportsData.employee_name") || "اسم الموظف",
    cellClass: "text-start",
  },
  {
    key: "distributed_consumed_leaves",
    label: t("reportsData.leaves") || "الإجازات",
    cellClass: "text-start",
  },
  {
    key: "total_consumed_balance",
    label: t("reportsData.total_days") || "إجمالي الأيام",
  },
  {
    key: "actions",
    label: t("branches.fields.actions"),
    cellClass: "w-10 no-print",
  },
]);

const handleExport = async (format = "excel") => {
  exportLoading.value = true;
  try {
    const params = {
      paginate: false,
      ...filters.value,
    };
    const response =
      await attendanceReportsService.getLeaveBalancesDepartmentEmployees(
        departmentId,
        params,
      );
    const data =
      response.data?.employees || response.data?.data?.employees || [];

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
    [t("reportsData.employee_name") || "اسم الموظف"]: item.employee_name,
    [t("reportsData.leaves") || "الإجازات"]: item.distributed_consumed_leaves
      ?.map((l) => `${l.leave_type}: ${l.consumed_days}`)
      .join(", "),
    [t("reportsData.total_days") || "إجمالي الأيام"]:
      item.total_consumed_balance,
  }));
  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Department Leaves");
  XLSX.writeFile(
    wb,
    `leaves_${departmentName.value}_${new Date().getTime()}.xlsx`,
  );
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
    const title = `${t("sidebar.reportsLeaves")} - ${departmentName.value}`;

    let heads = tableHeaders.value
      .filter((h) => h.key !== "actions")
      .map((h) => h.label);
    let rows = data.map((item, index) => [
      index + 1,
      item.employee_name,
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
        doc.text(fullTitle, isArabic ? pageWidth - 15 : 15, 40, {
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
      doc.save(`leaves_${departmentName.value}_${new Date().getTime()}.pdf`);
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
      await attendanceReportsService.getLeaveBalancesDepartmentEmployees(
        departmentId,
        params,
      );

    const data =
      response.data?.employees || response.data?.data?.employees || [];

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

    // cleanup
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
      iframe.remove();
    }, 10000);
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  }
};

const viewEmployeeDetails = (item) => {
  const prefix = locale.value === "en" ? "/en" : "";
  router.push({
    path: `${prefix}/reports/leaves/employee/${item.employee_id}`,
    query: {
      employee_name: item.employee_name,
      branch_name: item.branch_name,
      department_name: departmentName.value,
      department_id: departmentId,
    },
  });
};

const applyFilters = () => {
  page.value = 1;
  loadDetails();
};

const resetFilters = () => {
  filters.value.search = "";
  applyFilters();
};

const changePage = (newPage) => {
  page.value = newPage;
  loadDetails();
};

onMounted(() => loadDetails());
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
          {{ t("sidebar.reportsLeaves") }} - {{ departmentName }}
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
          class="md:col-span-2"
        >
          <template #suffix><SvgIcon name="search" /></template>
        </Input>
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
        <div class="flex items-center justify-between">
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("sidebar.reportsLeaves") }} - {{ departmentName }}
          </h2>
          <div class="flex items-center gap-2">
            <span
              v-if="branchName"
              class="text-[14px] font-[400] text-[#0E5F4A] bg-[#E7EFED] border border-[#0E5F4A] px-2 py-1 rounded-full"
              >{{ branchName }}</span
            >
            <span
              v-if="departmentName"
              class="text-[14px] font-[400] text-[#0E5F4A] bg-[#E7EFED] border border-[#0E5F4A] px-2 py-1 rounded-full"
              >{{ departmentName }}</span
            >
          </div>
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
            @click="viewEmployeeDetails(item)"
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

    <div class="print-only hidden" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              :colspan="tableHeaders.length - 1"
              class="!bg-transparent !border-none !p-0"
            >
              <PrintHeader
                :title="t('sidebar.reportsLeaves') + ' - ' + departmentName"
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
              {{ item.employee_name }}
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
