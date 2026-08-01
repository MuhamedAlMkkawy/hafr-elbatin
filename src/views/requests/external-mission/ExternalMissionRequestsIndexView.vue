<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Table from "@/components/ui/Table.vue";
import Modal from "@/components/ui/Modal.vue";
import Select from "@/components/ui/Select.vue";
import Icon from "@/components/ui/Icon.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import DateRangePicker from "@/components/ui/DateRangePicker.vue";

import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { useAuthStore } from "@/stores/auth";
import { externalMissionsService } from "@/services/externalMissions";
import ExternalMissionRequestFormModal from "./ExternalMissionRequestFormModal.vue";
import ExternalMissionRequestDetailsModal from "./ExternalMissionRequestDetailsModal.vue";

import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";

import PrintHeader from "@/components/ui/PrintHeader.vue";
import PrintFooter from "@/components/ui/PrintFooter.vue";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";

const authStore = useAuthStore();
const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();

const requests = ref([]);
const loading = ref(false);
const saving = ref(false);
const loadingDetails = ref(false);

const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const scope = ref("own");
const printRequests = ref([]);
const printTotalPages = ref(1);
const printTitle = computed(() => t("externalMissions.listTitle"));

const filters = ref({
  search: "",
  employee_id: "",
  status: "",
  from_date: "",
  to_date: "",
  sort_by: "created_at",
  sort_direction: "desc",
});

const statusOptions = computed(() => [
  { label: t("externalMissions.status.assigned"), value: "assigned" },
  { label: t("externalMissions.status.withdrawn"), value: "withdrawn" },
]);

const employees = ref([]);

const showFormModal = ref(false);
const showDetailsModal = ref(false);
const showWithdrawConfirm = ref(false);

const selectedRequest = ref(null);
const actionRequest = ref(null);
const requestLogs = ref([]);

const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

const formatApiDate = (dateStr) => {
  if (!dateStr || !dateStr.includes("/")) return dateStr;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return dateStr;
  let [month, day, year] = parts;
  if (year.length === 2) year = "20" + year;
  return `${year}-${month}-${day}`;
};

const loadRequests = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...filters.value,
      from_date: formatApiDate(filters.value.from_date),
      to_date: formatApiDate(filters.value.to_date),
    };

    if (scope.value === "own" || !filters.value.employee_id) {
      delete params.employee_id;
    }
    const response = await externalMissionsService.list(params);
    requests.value = response.data?.missions || [];
    total.value = response.data?.pagination?.total || requests.value.length;
    scope.value = response.data?.scope || "own";
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  page.value = 1;
  loadRequests();
};

const handleSort = (key) => {
  if (filters.value.sort_by === key) {
    filters.value.sort_direction =
      filters.value.sort_direction === "asc" ? "desc" : "asc";
  } else {
    filters.value.sort_by = key;
    filters.value.sort_direction = "asc";
  }
  applyFilters();
};

const resetFilters = () => {
  filters.value.search = "";
  filters.value.employee_id = "";
  filters.value.status = "";
  filters.value.from_date = "";
  filters.value.to_date = "";
  filters.value.sort_by = "created_at";
  filters.value.sort_direction = "desc";
  applyFilters();
};

const loadInitialData = async () => {
  try {
    const response = await externalMissionsService.getEmployees();
    employees.value = response.data?.employees || [];
  } catch (error) {
    console.error(error);
  }
};

const openCreate = () => {
  selectedRequest.value = null;
  showFormModal.value = true;
};

const openEdit = (request) => {
  if (!isActionAllowed(request)) {
    toast.error(t("externalMissions.messages.cannotEditPastMonth"));
    return;
  }
  showDetailsModal.value = false;
  selectedRequest.value = request;
  showFormModal.value = true;
};

const openView = async (request) => {
  selectedRequest.value = request;
  showDetailsModal.value = true;
  loadingDetails.value = true;
  try {
    const response = await externalMissionsService.get(request.id);
    selectedRequest.value = response.data?.mission || request;
    requestLogs.value = response.data?.logs || [];
  } catch (error) {
    console.error(error);
    toast.error(error);
  } finally {
    loadingDetails.value = false;
  }
};

const isActionAllowed = (request) => {
  if (!request?.from_date) return true;
  const missionDate = new Date(request.from_date);

  // If the date is a simple YYYY-MM-DD, setHours in local time might shift it.
  // We want to compare the calendar date.
  if (/^\d{4}-\d{2}-\d{2}$/.test(request.from_date)) {
    missionDate.setMinutes(
      missionDate.getMinutes() + missionDate.getTimezoneOffset(),
    );
  }

  const now = new Date();

  const missionMonth = missionDate.getMonth();
  const missionYear = missionDate.getFullYear();

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return (
    missionYear > currentYear ||
    (missionYear === currentYear && missionMonth >= currentMonth)
  );
};

const handleWithdraw = (request) => {
  actionRequest.value = request;
  showDetailsModal.value = false;
  showWithdrawConfirm.value = true;
};

const confirmWithdraw = async () => {
  if (!actionRequest.value) return;
  try {
    await externalMissionsService.withdraw(actionRequest.value.id);
    toast.success(t("externalMissions.messages.withdrawn"));
    showWithdrawConfirm.value = false;
    loadRequests();
  } catch (e) {
    console.error(e);
    toast.error(e);
  }
};

const handleApprove = async (request) => {
  try {
    await externalMissionsService.approve(request.id);
    toast.success(t("externalMissions.messages.approved"));
    showDetailsModal.value = false;
    loadRequests();
  } catch (e) {
    console.error(e);
    toast.error(e);
  }
};

const handleSave = async (payload) => {
  saving.value = true;
  try {
    if (selectedRequest.value?.id) {
      await externalMissionsService.update(selectedRequest.value.id, payload);
      toast.success(t("externalMissions.messages.updated"));
    } else {
      await externalMissionsService.create(payload);
      toast.success(t("externalMissions.messages.created"));
    }
    showFormModal.value = false;
    loadRequests();
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    saving.value = false;
  }
};

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  loadRequests();
};

const handleExport = async (format = "excel") => {
  try {
    const params = {
      paginate: false,
      ...filters.value,
      from_date: formatApiDate(filters.value.from_date),
      to_date: formatApiDate(filters.value.to_date),
    };

    if (scope.value === "own" || !filters.value.employee_id) {
      delete params.employee_id;
    }

    const response = await externalMissionsService.list(params);
    const data = response.data?.missions || [];

    if (format === "excel") {
      exportToExcel(data);
    } else if (format === "pdf") {
      await exportToPDF(data);
    }
  } catch (e) {
    console.error(e);
    toast.error(t("common.errors.exportFailed") || "Export failed");
  }
};

const exportToExcel = (data) => {
  const flattened = data.map((item, index) => ({
    "#": index + 1,
    [t("externalMissions.fields.employeeName")]: item.employee?.name,
    [t("externalMissions.fields.title")]: item.title,
    [t("externalMissions.fields.fromDate")]: formatDate(item.from_date),
    [t("externalMissions.fields.toDate")]: formatDate(item.to_date),
    [t("externalMissions.fields.totalDays")]: item.total_days,
    [t("externalMissions.fields.createdBy")]: item.created_by?.name || "-",
    [t("externalMissions.fields.status")]: ["assigned", "withdrawn"].includes(
      item.status,
    )
      ? t("externalMissions.status." + item.status)
      : "-",
  }));

  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "External Missions");
  XLSX.writeFile(wb, `external_missions_export_${new Date().getTime()}.xlsx`);
};

const exportToPDF = async (data) => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

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

    const isArabic = lang.value === "ar";
    const title = t("externalMissions.title");

    let headers = [
      "#",
      t("externalMissions.fields.employeeName"),
      t("externalMissions.fields.title"),
      t("externalMissions.fields.fromDate"),
      t("externalMissions.fields.toDate"),
      t("externalMissions.fields.totalDays"),
      t("externalMissions.fields.createdBy"),
      t("externalMissions.fields.status"),
    ];

    let rows = data.map((item, index) => [
      index + 1,
      item.employee?.name,
      item.title,
      formatDate(item.from_date),
      formatDate(item.to_date),
      item.total_days,
      item.created_by?.name || "-",
      ["assigned", "withdrawn"].includes(item.status)
        ? t("externalMissions.status." + item.status)
        : "-",
    ]);

    if (isArabic) {
      headers = headers.reverse();
      rows = rows.map((r) => r.reverse());
    }

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 55,
      styles: {
        font: "IBMPlexSansArabic",
        fontStyle: "normal",
        halign: isArabic ? "right" : "left",
        fontSize: 9,
      },
      headStyles: {
        font: "IBMPlexSansArabic",
        fontStyle: "bold",
        halign: isArabic ? "right" : "left",
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
      },
      didParseCell: function (data) {
        data.cell.styles.font = "IBMPlexSansArabic";
      },
      didDrawPage: function (data) {
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

    doc.save(`external_missions_export_${new Date().getTime()}.pdf`);
  } catch (err) {
    console.error("PDF Export Error:", err);
    toast.error("PDF generation failed.");
  }
};

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

const handlePrint = async () => {
  try {
    const params = {
      paginate: false,
      ...filters.value,
      from_date: formatApiDate(filters.value.from_date),
      to_date: formatApiDate(filters.value.to_date),
    };

    if (scope.value === "own" || !filters.value.employee_id) {
      delete params.employee_id;
    }

    const response = await externalMissionsService.list(params);
    const printData = response.data?.missions || [];

    // =========================
    // PDF INIT
    // =========================
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });

    const isArabic = lang.value === "ar";
    const title = t("externalMissions.title");

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
    let headers = [
      "#",
      t("externalMissions.fields.employeeName"),
      t("externalMissions.fields.title"),
      t("externalMissions.fields.fromDate"),
      t("externalMissions.fields.toDate"),
      t("externalMissions.fields.totalDays"),
      t("externalMissions.fields.createdBy"),
      t("externalMissions.fields.status"),
    ];

    let rows = printData.map((item, index) => [
      index + 1,
      item.employee?.name,
      item.title,
      formatDate(item.from_date),
      formatDate(item.to_date),
      item.total_days,
      item.created_by?.name || "-",
      ["assigned", "withdrawn"].includes(item.status)
        ? t("externalMissions.status." + item.status)
        : "-",
    ]);

    if (isArabic) {
      headers = headers.reverse();
      rows = rows.map((r) => r.reverse());
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
        fontSize: 9,
      },

      headStyles: {
        font: "IBMPlexSansArabic",
        fontStyle: "bold",
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
        halign: isArabic ? "right" : "left",
      },

      didParseCell: function (data) {
        data.cell.styles.font = "IBMPlexSansArabic";
      },

      didDrawPage: function () {
        drawPdfHeader(doc, authStore, isArabic);

        const pageWidth = doc.internal.pageSize.width;

        // =========================
        // TITLE
        // =========================
        doc.setFontSize(11);
        doc.setFont("IBMPlexSansArabic", "bold");

        const fullTitle = isArabic
          ? `عنوان التقرير: ${title}`
          : `Report Title: ${title}`;

        doc.text(fullTitle, isArabic ? pageWidth - 15 : 15, 40, {
          align: isArabic ? "right" : "left",
        });

        // =========================
        // DATE RANGE
        // =========================
        const hasDateRange = filters.value.from_date || filters.value.to_date;

        if (hasDateRange) {
          const dateLabel = isArabic ? "التاريخ:" : "Date:";
          const fromLabel = isArabic ? "من" : "From";
          const toLabel = isArabic ? "إلى" : "To";

          const fromDate = filters.value.from_date || "--";
          const toDate = filters.value.to_date || "--";

          const dateText = `${dateLabel} ${fromLabel} ${fromDate} ${toLabel} ${toDate}`;

          doc.setFontSize(9);
          doc.setFont("IBMPlexSansArabic", "normal");

          doc.text(dateText, isArabic ? pageWidth - 15 : 15, 47, {
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
    // PRINT (iframe style like your other exports)
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
    toast.error(e?.message || t("common.error"));
  }
};

// const handlePrint = async () => {
//   try {
//     const params = {
//       paginate: false,
//       ...filters.value,
//       from_date: formatApiDate(filters.value.from_date),
//       to_date: formatApiDate(filters.value.to_date),
//     };

//     if (scope.value === "own" || !filters.value.employee_id) {
//       delete params.employee_id;
//     }

//     const response = await externalMissionsService.list(params);
//     const data = response.data?.missions || [];
//     printRequests.value = data;

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

onMounted(() => {
  loadInitialData();
  loadRequests();
});

const employeesOptions = computed(() => {
  return (employees.value || []).map((emp) => ({
    label: emp.name,
    value: emp.id,
  }));
});

const tableHeaders = computed(() => [
  { key: "index", label: "#", headerClass: "w-[50px]", cellClass: "w-[50px]" },
  {
    key: "employee",
    label: t("externalMissions.fields.employeeName"),
    sortable: true,
    headerClass: "min-w-[100px]",
    cellClass: "min-w-[100px]",
  },
  {
    key: "title",
    label: t("externalMissions.fields.title"),
    sortable: true,
    headerClass: "min-w-[100px]",
    cellClass: "min-w-[100px]",
  },
  {
    key: "from_date",
    label: t("externalMissions.fields.fromDate"),
    sortable: true,
    headerClass: "min-w-[80px]",
    cellClass: "min-w-[80px]",
  },
  {
    key: "to_date",
    label: t("externalMissions.fields.toDate"),
    sortable: true,
    headerClass: "min-w-[80px]",
    cellClass: "min-w-[80px]",
  },
  {
    key: "total_days",
    label: t("externalMissions.fields.totalDays"),
    sortable: true,
    headerClass: "min-w-[10px]",
    cellClass: "min-w-[10px]",
  },
  {
    key: "created_by",
    label: t("externalMissions.fields.createdBy"),
    sortable: true,
    headerClass: "min-w-[100px]",
    cellClass: "min-w-[100px]",
  },
  {
    key: "status",
    label: t("externalMissions.fields.status"),
    sortable: true,
    headerClass: "min-w-[130px]",
    cellClass: "min-w-[130px]",
  },
  {
    key: "actions",
    label: t("externalMissions.fields.actions"),
    headerClass: "w-[120px]",
    cellClass: "w-[120px]",
  },
]);

const getStatusColor = (status) => {
  switch (status) {
    case "approved":
    case "pending":
    case "assigned":
      return "text-[#085D3A] bg-[#ECFDF3]";
    case "withdrawn":
    case "cancelled":
    case "canceled":
      return "text-[#4D5761] bg-[#E5E7EB]";
    default:
      return "text-[#4D5761] bg-[#E5E7EB]";
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  // Use getUTC methods to avoid timezone shift if the date was string-parsed as UTC
  // which is common for "YYYY-MM-DD" formatted strings.
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const day = String(isDateOnly ? date.getUTCDate() : date.getDate()).padStart(
    2,
    "0",
  );
  const month = String(
    isDateOnly ? date.getUTCMonth() + 1 : date.getMonth() + 1,
  ).padStart(2, "0");
  const year = String(
    isDateOnly ? date.getUTCFullYear() : date.getFullYear(),
  ).slice(-2);
  return `${month}/${day}/${year}`;
};
</script>

<template>
  <section class="space-y-6">
    <header class="flex items-center justify-between no-print">
      <h1 class="text-[20px] font-[600] text-[#000000]">
        {{ t("externalMissions.title") }}
      </h1>
      <div class="flex items-center gap-2">
        <Button
          @click="handlePrint"
          class="bg-[#E7EFED] !px-2 !py-2 hover:!bg-[#DDE6E4] transition-colors duration-300"
          size="md"
          v-tooltip="t('externalMissions.print')"
        >
          <SvgIcon name="printer" />
        </Button>

        <Menu
          as="div"
          class="relative inline-block text-left"
          v-if="authStore.hasPermission('external_mission.export')"
        >
          <MenuButton as="template">
            <Button
              class="bg-[#E7EFED] border border-[#0E5F4A] !px-2 !py-2 hover:!bg-[#DDE6E4] transition-colors duration-300 !text-[#0E5F4A]"
              size="md"
            >
              <SvgIcon name="export" />
              <span class="ms-1 me-2">{{ t("externalMissions.export") }}</span>
              <SvgIcon name="down" />
            </Button>
          </MenuButton>

          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <MenuItems
              class="absolute right-0 mt-2 w-30 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50 text-start"
            >
              <div class="px-1 py-1">
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleExport('pdf')"
                    :class="[
                      active ? 'bg-[#0E5F4A] text-white' : 'text-[#384250]',
                      'cursor-pointer mb-1 group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                    ]"
                  >
                    PDF
                  </button>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <button
                    @click="handleExport('excel')"
                    :class="[
                      active ? 'bg-[#0E5F4A] text-white' : 'text-[#384250]',
                      'cursor-pointer group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                    ]"
                  >
                    Excel
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </transition>
        </Menu>

        <Button
          variant="primary"
          icon="plus"
          size="md"
          @click="openCreate"
          v-if="
            authStore.hasPermission([
              'external_mission.create',
              'external_mission.store',
            ])
          "
        >
          {{ t("externalMissions.addRequest") }}
        </Button>
      </div>
    </header>

    <!-- Filters Card -->
    <Card class="no-print">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("externalMissions.searchTitle") }}
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <DateRangePicker
          v-model:startDate="filters.from_date"
          v-model:endDate="filters.to_date"
          :label="t('externalMissions.placeholders.date')"
          :placeholder="t('externalMissions.placeholders.selectDateRange')"
          size="md"
        />

        <Select
          v-if="!authStore.isEmployee"
          v-model="filters.employee_id"
          :options="employeesOptions"
          :label="t('externalMissions.fields.employeeName')"
          :placeholder="t('externalMissions.placeholders.searchEmployee')"
          size="md"
          filterable
        />

        <Select
          v-model="filters.status"
          :options="statusOptions"
          :label="t('externalMissions.fields.status')"
          :placeholder="t('externalMissions.placeholders.status')"
          size="md"
        />
      </div>

      <div class="flex gap-2 mt-5 justify-end">
        <Button class="md:w-26" variant="ghost" size="md" @click="resetFilters">
          {{ t("roles.resetFilters") }}
        </Button>
        <Button
          class="md:w-26"
          variant="primary"
          size="md"
          @click="applyFilters"
        >
          {{ t("common.search") }}
        </Button>
      </div>
    </Card>

    <!-- List Card -->
    <div id="print-area">
      <Card class="print:!border-none print:!shadow-none no-print">
        <template #header>
          <h2 class="text-[16px] font-[600] text-[#333333] no-print">
            {{ t("externalMissions.listTitle") }}
          </h2>
        </template>

        <Table
          :loading="loading"
          :items="requests"
          :headers="tableHeaders"
          :page="page"
          :total-pages="totalPages"
          :loading-text="t('common.loading')"
          :empty-text="t('externalMissions.empty')"
          @change-page="changePage"
        >
          <template
            v-for="header in tableHeaders.filter((h) => h.sortable)"
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
                classes="w-4 h-4 transition-colors"
                :class="
                  filters.sort_by === header.key
                    ? 'text-primary'
                    : 'text-gray-400'
                "
              />
            </div>
          </template>
          <template #cell-index="{ index }">
            {{ (page - 1) * perPage + index + 1 }}
          </template>

          <template #cell-employee="{ item }">
            <span>{{ item.employee?.name }}</span>
          </template>

          <template #cell-title="{ item }">
            <span>{{ item.title }}</span>
          </template>

          <template #cell-from_date="{ item }">
            {{ formatDate(item.from_date) }}
          </template>

          <template #cell-to_date="{ item }">
            {{ formatDate(item.to_date) }}
          </template>

          <template #cell-total_days="{ item }">
            {{ item.total_days }}
          </template>

          <template #cell-created_by="{ item }">
            <span>{{ item.created_by?.name || "-" }}</span>
          </template>

          <template #cell-status="{ item }">
            <template
              v-if="
                ['pending', 'assigned', 'cancelled', 'withdrawn'].includes(
                  item.status,
                )
              "
            >
              <span
                class="px-2 py-0.5 rounded-full text-[14px] font-[500] flex items-center gap-1.5 w-max"
                :class="getStatusColor(item.status)"
              >
                <span class="w-2.5 h-2.5 rounded-full bg-current"></span>
                {{ t("externalMissions.status." + item.status) }}
              </span>
            </template>
            <span v-else>-</span>
          </template>

          <template #cell-actions="{ item }">
            <div class="flex items-center gap-2">
              <!-- View Button -->
              <button
                class="hover:opacity-75 transition-opacity cursor-pointer text-[#6C737F]"
                @click="openView(item)"
                v-tooltip="{
                  title: t('common.actionTooltips.view.title', {
                    target: t('externalMissions.entityName'),
                  }),
                  content: t('common.actionTooltips.view.content', {
                    target: t('externalMissions.entityName'),
                    name: item.employee?.name,
                  }),
                }"
              >
                <SvgIcon name="eye" />
              </button>

              <!-- Edit Button -->
              <button
                v-if="authStore.hasPermission('external_mission.update')"
                class="transition-opacity text-[#6C737F]"
                :class="
                  (item.status !== 'pending' && item.status !== 'assigned') ||
                  !isActionAllowed(item)
                    ? 'opacity-30 !cursor-not-allowed'
                    : 'hover:opacity-75 cursor-pointer'
                "
                @click="
                  (item.status === 'pending' || item.status === 'assigned') &&
                  isActionAllowed(item) &&
                  openEdit(item)
                "
                v-tooltip="
                  (item.status === 'pending' || item.status === 'assigned') &&
                  isActionAllowed(item)
                    ? {
                        title: t('common.actionTooltips.edit.title', {
                          target: t('externalMissions.entityName'),
                        }),
                        content: t('common.actionTooltips.edit.content', {
                          target: t('externalMissions.entityName'),
                          name: item.employee?.name,
                        }),
                      }
                    : null
                "
              >
                <SvgIcon name="edit" />
              </button>

              <!-- Withdraw Button -->
              <button
                v-if="authStore.hasPermission('external_mission.withdraw')"
                class="transition-opacity text-[#F04438]"
                :class="
                  (item.status !== 'pending' && item.status !== 'assigned') ||
                  !isActionAllowed(item)
                    ? 'opacity-30 !cursor-not-allowed'
                    : 'hover:opacity-75 cursor-pointer'
                "
                @click="
                  (item.status === 'pending' || item.status === 'assigned') &&
                  isActionAllowed(item) &&
                  handleWithdraw(item)
                "
                v-tooltip="
                  (item.status === 'pending' || item.status === 'assigned') &&
                  isActionAllowed(item)
                    ? {
                        title: t('common.actionTooltips.withdraw.title', {
                          target: t('externalMissions.entityName'),
                        }),
                        content: t('common.actionTooltips.withdraw.content', {
                          target: t('externalMissions.entityName'),
                          name: item.employee?.name,
                        }),
                      }
                    : null
                "
              >
                <SvgIcon name="withdraw" />
              </button>
            </div>
          </template>
        </Table>
      </Card>
    </div>

    <!-- Print-only Table (Full Data) -->
    <div class="print-only hidden" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              :colspan="tableHeaders.length - 1"
              class="!bg-transparent !border-none !p-0"
            >
              <PrintHeader :title="t('externalMissions.title')" />
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
          <tr
            v-for="(item, index) in printRequests"
            :key="item.id"
            class="border-b border-[#D2D6DB]"
          >
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ index + 1 }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ item.employee?.name }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ item.title }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ formatDate(item.from_date) }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ formatDate(item.to_date) }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ item.total_days }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ item.created_by?.name || "-" }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm font-medium">
              {{
                ["assigned", "withdrawn"].includes(item.status)
                  ? t("externalMissions.status." + item.status)
                  : "-"
              }}
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

    <!-- Modals -->
    <ExternalMissionRequestFormModal
      v-model="showFormModal"
      :request="selectedRequest"
      :loading="saving"
      :scope="scope"
      @save="handleSave"
    />

    <ExternalMissionRequestDetailsModal
      v-model="showDetailsModal"
      :request="selectedRequest"
      :logs="requestLogs"
      :loading="loadingDetails"
      :scope="scope"
      :can-action="isActionAllowed(selectedRequest)"
      @withdraw="handleWithdraw"
      @approve="handleApprove"
      @reject="handleReject"
      @edit="openEdit"
    />

    <!-- Withdraw Confirm Modal -->
    <Modal
      v-model="showWithdrawConfirm"
      width="md"
      icon="error"
      border-color="#e76d62"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("externalMissions.modals.withdrawTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("externalMissions.modals.withdrawMessage") }}
        </p>
      </div>
      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button
            class="w-full bg-[#FEF3F2] !text-[#B42318] border-none hover:bg-[#FDE4E2]"
            size="md"
            @click="confirmWithdraw"
          >
            {{ t("common.confirm") || "تأكيد" }}
          </Button>
          <Button
            variant="secondary"
            class="w-full !border-none"
            size="md"
            @click="showWithdrawConfirm = false"
          >
            {{ t("common.cancel") }}
          </Button>
        </div>
      </template>
    </Modal>
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

  :deep(.min-h-screen),
  main {
    min-height: auto !important;
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
  }
}
</style>
