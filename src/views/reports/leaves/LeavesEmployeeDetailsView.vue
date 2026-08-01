<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
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

// State
const details = ref([]);
const loading = ref(false);
const printTotalPages = ref(1);

const employeeId = route.params.id;
const employeeName = ref(route.query.employee_name || "");
const departmentName = ref(route.query.department_name || "");
const branchName = ref(route.query.branch_name || "");

const breadcrumbItems = computed(() => {
  const prefix = locale.value === "en" ? "/en" : "";
  const items = [
    { label: t("sidebar.reports"), to: "/reports/leaves" },
    { label: t("sidebar.reportsLeaves"), to: "/reports/leaves" },
  ];
  if (departmentName.value) {
    items.push({
      label: departmentName.value,
      to: route.query.department_id
        ? `${prefix}/reports/leaves/department/${route.query.department_id}?department_name=${departmentName.value}&branch_name=${branchName.value}`
        : null,
    });
  }
  items.push({ label: employeeName.value || t("reportsData.details") });
  return items;
});

const loadEmployeeDetails = async () => {
  loading.value = true;
  try {
    const response =
      await attendanceReportsService.getEmployeeLeaveBalances(employeeId);
    const data = response.data?.data || response.data || response;

    details.value = data.details || [];
    if (data.employee_name) employeeName.value = data.employee_name;
    if (data.department_name) departmentName.value = data.department_name;
    if (data.branch_name) branchName.value = data.branch_name;

    printTotalPages.value = 1;
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  } finally {
    loading.value = false;
  }
};

// const handlePrint = async () => {
//   try {
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
    key: "leave_type",
    label: t("leaveRequests.fields.leaveType") || "نوع الإجازة",
    cellClass: "text-start",
  }, // نوع الإجازة
  { key: "total_days", label: t("reportsData.total_days") || "الرصيد السنوي" }, // الرصيد السنوي / إجمالي الأيام
  { key: "consumed_days", label: t("reportsData.consumed_days") || "المستهلك" }, // المستهلك
  {
    key: "remaining_days",
    label: t("reportsData.remaining_balance") || "المتبقي",
  }, // المتبقي
]);

const handleExport = async (format = "excel") => {
  try {
    const response =
      await attendanceReportsService.getEmployeeLeaveBalances(employeeId);
    const data =
      response.data?.details ||
      response.data?.data?.details ||
      response.details ||
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
    [t("leaveRequests.fields.leaveType") || "نوع الإجازة"]: item.leave_type,
    [t("reportsData.total_days") || "الرصيد السنوي"]: item.total_days,
    [t("reportsData.consumed_days") || "المستهلك"]: item.consumed_days,
    [t("reportsData.remaining_balance") || "المتبقي"]: item.remaining_days,
  }));
  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employee Leave Balance");
  XLSX.writeFile(
    wb,
    `employee_leave_${employeeName.value}_${new Date().getTime()}.xlsx`,
  );
};

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

const exportToPDF = async (data, { save = true } = {}) => {
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
    const title = `${t("sidebar.reportsLeaves")} - ${employeeName.value}`;

    let heads = tableHeaders.value.map((h) => h.label);
    let rows = data.map((item, index) => [
      index + 1,
      item.leave_type,
      item.total_days,
      item.consumed_days,
      item.remaining_days,
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
      doc.save(
        `employee_leave_${employeeName.value}_${new Date().getTime()}.pdf`,
      );
      return;
    }

    return doc;
  } catch (err) {
    console.error(err);
    toast.error("PDF generation failed.");
  }
};

const handlePrint = async () => {
  try {
    const response =
      await attendanceReportsService.getEmployeeLeaveBalances(employeeId);

    const data =
      response.data?.details ||
      response.data?.data?.details ||
      response.details ||
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

onMounted(() => loadEmployeeDetails());
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
          {{ t("sidebar.reportsLeaves") }} - {{ employeeName }}
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
        <div class="flex items-center justify-between">
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("sidebar.reportsLeaves") }} - {{ employeeName }}
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
        :items="details"
        :headers="tableHeaders"
        :page="1"
        :total-pages="1"
        class="report-table"
      >
        <template #cell-index="{ index }">
          {{ index + 1 }}
        </template>
        <template #header-title="{ header }">
          <span class="font-medium text-[#101828]">{{ header.label }}</span>
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
                :title="t('sidebar.reportsLeaves') + ' - ' + employeeName"
              />
            </th>
          </tr>
          <tr>
            <th
              :colspan="tableHeaders.length"
              class="!bg-transparent !border-none !p-0"
            >
              <div class="mb-4 text-center text-sm font-medium">
                <span class="mx-2">{{ branchName }}</span> |
                <span class="mx-2">{{ departmentName }}</span>
              </div>
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
          <tr v-for="(item, index) in details" :key="index">
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ index + 1 }}
            </td>
            <td
              class="border border-[#D2D6DB] px-4 py-3 text-center text-sm text-start"
            >
              {{ item.leave_type }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.total_days }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.consumed_days }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-center text-sm">
              {{ item.remaining_days }}
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
