<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Table from "@/components/ui/Table.vue";
import Select from "@/components/ui/Select.vue";
import Icon from "@/components/ui/Icon.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import DateRangePicker from "@/components/ui/DateRangePicker.vue";

import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";

import { permissionRequestsService } from "@/services/permissionRequests";
import PermissionRequestFormModal from "./PermissionRequestFormModal.vue";
import PermissionRequestDetailsModal from "./PermissionRequestDetailsModal.vue";

import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";

import PrintHeader from "@/components/ui/PrintHeader.vue";
import PrintFooter from "@/components/ui/PrintFooter.vue";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const { t, locale } = useI18n();
const route = useRoute();
const lang = computed(() => locale.value);
const toast = useAppToast();

const requests = ref([]);
const balanceSummary = ref(null);
const positiveBalance = ref(null);
const loading = ref(false);
const loadingBalance = ref(false);
const saving = ref(false);
const loadingDetails = ref(false);
const employees = ref([]);

const dropdownStyle = ref({
  top: "0px",
  left: "0px",
});

const setDropdownPosition = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  dropdownStyle.value = {
    top: rect.bottom + window.scrollY + "px",
    left: rect.left + window.scrollX + "px",
  };
};

const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const scope = ref("own");
const printRequests = ref([]);
const printTotalPages = ref(1);
const printTitle = computed(() => t("permissionRequests.listTitle"));

const filters = ref({
  search: "",
  employee_id: "",
  status: "",
  from_date: "",
  to_date: "",
  sort_by: "created_at",
  sort_direction: "desc",
});

const showFormModal = ref(false);
const showDetailsModal = ref(false);
const selectedRequest = ref(null);
const actionRequest = ref(null);
const rejectionReason = ref("");

const totalPages = computed(() => Math.ceil(total.value / perPage.value));

const loadInitialData = async () => {
  try {
    const empRes = await permissionRequestsService.getEmployees();
    employees.value = empRes.data?.employees || [];
  } catch (error) {
    console.error(error);
  }
};

const loadBalance = async () => {
  loadingBalance.value = true;
  try {
    const empId =
      scope.value !== "own" ? filters.value.employee_id || null : null;
    const [balanceRes, positiveRes] = await Promise.all([
      permissionRequestsService.getBalance(empId),
      permissionRequestsService.getPositiveBalance(),
    ]);
    balanceSummary.value = balanceRes.data?.balance || null;
    positiveBalance.value = positiveRes.data?.positive_balance || null;
  } catch (error) {
    console.error(error);
  } finally {
    loadingBalance.value = false;
  }
};

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
      date_from: formatApiDate(filters.value.from_date),
      date_to: formatApiDate(filters.value.to_date),
    };

    if (scope.value === "own" || !filters.value.employee_id) {
      delete params.employee_id;
    }

    const response = await permissionRequestsService.list(params);
    requests.value = response.data?.permission_requests || [];
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
  loadBalance();
};

const resetFilters = () => {
  filters.value = {
    search: "",
    employee_id: "",
    status: "",
    from_date: "",
    to_date: "",
    sort_by: "created_at",
    sort_direction: "desc",
  };
  applyFilters();
};

const changePage = (newPage) => {
  page.value = newPage;
  loadRequests();
};

const handleSort = (key) => {
  if (filters.value.sort_by === key) {
    filters.value.sort_direction =
      filters.value.sort_direction === "asc" ? "desc" : "asc";
  } else {
    filters.value.sort_by = key;
    filters.value.sort_direction = "desc";
  }
  applyFilters();
};

const openCreate = () => {
  selectedRequest.value = null;
  showFormModal.value = true;
};

const openEdit = (request) => {
  selectedRequest.value = request;
  showFormModal.value = true;
};

const openView = async (request) => {
  selectedRequest.value = request;
  showDetailsModal.value = true;
  loadingDetails.value = true;
  try {
    const response = await permissionRequestsService.get(request.id);
    selectedRequest.value = response.data?.permission_request || request;
  } catch (error) {
    console.error(error);
    toast.error(error);
  } finally {
    loadingDetails.value = false;
  }
};

const handleWithdraw = (request) => {
  actionRequest.value = request;
  confirmWithdraw();
};

const confirmWithdraw = async () => {
  if (!actionRequest.value) return;
  try {
    await permissionRequestsService.withdraw(actionRequest.value.id);
    toast.success(t("permissionRequests.messages.withdrawn"));
    loadRequests();
    loadBalance();
  } catch (e) {
    console.error(e);
    toast.error(e);
  }
};

const handleApprove = (request) => {
  actionRequest.value = request;
  confirmApprove();
};

const confirmApprove = async () => {
  if (!actionRequest.value) return;
  try {
    await permissionRequestsService.approve(actionRequest.value.id);
    toast.success(t("permissionRequests.messages.approved"));
    loadRequests();
    loadBalance();
  } catch (e) {
    console.error(e);
    toast.error(e);
  }
};

const handleReject = (request) => {
  actionRequest.value = request;
  rejectionReason.value = "";
  // In a real app, this might show a modal to enter reason
  confirmReject();
};

const confirmReject = async () => {
  if (!actionRequest.value) return;
  try {
    await permissionRequestsService.reject(
      actionRequest.value.id,
      rejectionReason.value,
    );
    toast.success(t("permissionRequests.messages.rejected"));
    loadRequests();
    loadBalance();
  } catch (e) {
    console.error(e);
    toast.error(e);
  }
};

const handleSave = async (payload) => {
  saving.value = true;
  try {
    if (selectedRequest.value?.id) {
      await permissionRequestsService.update(selectedRequest.value.id, payload);
      toast.success(t("permissionRequests.messages.updated"));
    } else {
      await permissionRequestsService.create(payload);
      toast.success(t("permissionRequests.messages.created"));
    }
    showFormModal.value = false;
    loadRequests();
    loadBalance();
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    saving.value = false;
  }
};

const employeesOptions = computed(() => {
  return (employees.value || []).map((emp) => ({
    label: emp.name,
    value: emp.id,
  }));
});

onMounted(() => {
  loadInitialData();
  loadRequests();
  loadBalance();
});

const isCurrentMonthCheck = (item) => {
  const dateStr = item?.date || item?.from_date;
  if (!dateStr) return false;
  const now = new Date();
  const itemDate = new Date(dateStr);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return itemDate >= currentMonthStart || item.is_finalized === false;
};

const canWithdraw = (request) => {
  if (!request) return false;

  // Status check
  let statusOk = false;
  if (scope.value === "own") {
    statusOk = request.status === "pending";
  } else {
    statusOk =
      (request.status === "pending" || request.status === "approved") &&
      !request.is_finalized;
  }

  if (!statusOk) return false;

  // Month check
  return isCurrentMonthCheck(request);
};

const tableHeaders = computed(() => [
  { key: "index", label: "#", headerClass: "w-[50px]", cellClass: "w-[50px]" },
  {
    key: "employee",
    label: t("permissionRequests.fields.employeeName"),
    sortable: true,
    headerClass: "min-w-[150px]",
    cellClass: "min-w-[150px]",
  },
  {
    key: "date",
    label: t("permissionRequests.fields.date"),
    sortable: true,
    headerClass: "min-w-[100px]",
    cellClass: "min-w-[100px]",
  },
  {
    key: "from_time",
    label: t("permissionRequests.fields.fromTime"),
    sortable: true,
    headerClass: "min-w-[100px]",
    cellClass: "min-w-[100px]",
  },
  {
    key: "to_time",
    label: t("permissionRequests.fields.toTime"),
    sortable: true,
    headerClass: "min-w-[100px]",
    cellClass: "min-w-[100px]",
  },
  {
    key: "duration",
    label: t("permissionRequests.fields.duration"),
    sortable: true,
    headerClass: "min-w-[100px]",
    cellClass: "min-w-[100px]",
  },
  {
    key: "status",
    label: t("permissionRequests.fields.status"),
    sortable: true,
    headerClass: "min-w-[130px]",
    cellClass: "min-w-[130px]",
  },
  {
    key: "actions",
    label: t("permissionRequests.fields.actions"),
    headerClass: "w-[120px]",
    cellClass: "w-[120px]",
  },
]);

const getStatusColor = (status) => {
  switch (status) {
    case "approved":
      return "text-[#085D3A] bg-[#ECFDF3]";
    case "pending":
      return "text-[#B54708] bg-[#FFFAEB]";
    case "rejected":
      return "text-[#B42318] bg-[#FEF3F2]";
    case "withdrawn":
    case "cancelled":
      return "text-[#4D5761] bg-[#E5E7EB]";
    default:
      return "text-[#4D5761] bg-[#E5E7EB]";
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

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

const formatDuration = (minutes) => {
  if (minutes === undefined || minutes === null) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const exportToExcel = (data) => {
  const flattened = data.map((item, index) => ({
    "#": index + 1,
    [t("permissionRequests.fields.employeeName")]: item.employee?.name,
    [t("permissionRequests.fields.date")]: formatDate(item.date),
    [t("permissionRequests.fields.fromTime")]: item.from_time,
    [t("permissionRequests.fields.toTime")]: item.to_time,
    [t("permissionRequests.fields.duration")]: formatDuration(
      item.duration_minutes,
    ),
    [t("permissionRequests.fields.status")]:
      t("permissionRequests.status." + item.status) || item.status,
  }));

  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Permission Requests");
  XLSX.writeFile(wb, `permission_requests_export_${new Date().getTime()}.xlsx`);
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
    const title = t("permissionRequests.listTitle");

    let headers = [
      "#",
      t("permissionRequests.fields.employeeName"),
      t("permissionRequests.fields.date"),
      t("permissionRequests.fields.fromTime"),
      t("permissionRequests.fields.toTime"),
      t("permissionRequests.fields.duration"),
      t("permissionRequests.fields.status"),
    ];

    let rows = data.map((item, index) => [
      index + 1,
      item.employee?.name,
      formatDate(item.date),
      item.from_time,
      item.to_time,
      formatDuration(item.duration_minutes),
      t("permissionRequests.status." + item.status) || item.status,
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

    // Draw Footer (Correct pagination)
    const totalPagesPDF = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPagesPDF; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPagesPDF, isArabic);
    }

    doc.save(`permission_requests_export_${new Date().getTime()}.pdf`);
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

const handleExportExcel = async () => {
  try {
    const params = {
      ...filters.value,
      date_from: formatApiDate(filters.value.from_date),
      date_to: formatApiDate(filters.value.to_date),
      paginate: false,
    };
    if (scope.value === "own" || !filters.value.employee_id) {
      delete params.employee_id;
    }
    const response = await permissionRequestsService.list(params);
    exportToExcel(response.data?.permission_requests || []);
  } catch (e) {
    console.error(e);
    toast.error(t("common.errors.exportFailed"));
  }
};

const handleExportPDF = async () => {
  try {
    const params = {
      ...filters.value,
      date_from: formatApiDate(filters.value.from_date),
      date_to: formatApiDate(filters.value.to_date),
      paginate: false,
    };
    if (scope.value === "own" || !filters.value.employee_id) {
      delete params.employee_id;
    }
    const response = await permissionRequestsService.list(params);
    exportToPDF(response.data?.permission_requests || []);
  } catch (e) {
    console.error(e);
    toast.error(t("common.errors.exportFailed"));
  }
};

const handlePrint = async () => {
  try {
    const params = {
      paginate: false,
      ...filters.value,
      date_from: formatApiDate(filters.value.from_date),
      date_to: formatApiDate(filters.value.to_date),
    };

    if (scope.value === "own" || !filters.value.employee_id) {
      delete params.employee_id;
    }

    const response = await permissionRequestsService.list(params);

    const printRequests = response.data?.permission_requests || [];

    // =========================
    // PDF CREATION (inside same function)
    // =========================
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });

    const isArabic = lang.value === "ar";

    // Fonts
    const fontRes = await fetch(IBMPlexSansArabicRegular);
    const fontBuffer = await fontRes.arrayBuffer();
    const fontBase64 = arrayBufferToBase64(fontBuffer);

    const fontBoldRes = await fetch(IBMPlexSansArabicBold);
    const fontBoldBuffer = await fontBoldRes.arrayBuffer();
    const fontBoldBase64 = arrayBufferToBase64(fontBoldBuffer);

    doc.addFileToVFS("IBMPlexSansArabic-Regular.ttf", fontBase64);
    doc.addFont("IBMPlexSansArabic-Regular.ttf", "IBMPlexSansArabic", "normal");

    doc.addFileToVFS("IBMPlexSansArabic-Bold.ttf", fontBoldBase64);
    doc.addFont("IBMPlexSansArabic-Bold.ttf", "IBMPlexSansArabic", "bold");

    doc.setFont("IBMPlexSansArabic", "normal");

    // =========================
    // TITLE
    // =========================
    const title = t("permissionRequests.listTitle");

    // =========================
    // HEADERS / ROWS
    // =========================
    let headers = [
      "#",
      t("permissionRequests.fields.employeeName"),
      t("permissionRequests.fields.date"),
      t("permissionRequests.fields.fromTime"),
      t("permissionRequests.fields.toTime"),
      t("permissionRequests.fields.duration"),
      t("permissionRequests.fields.status"),
    ];

    let rows = printRequests.map((item, index) => [
      index + 1,
      item.employee?.name,
      formatDate(item.date),
      item.from_time,
      item.to_time,
      formatDuration(item.duration_minutes),
      t("permissionRequests.status." + item.status) || item.status,
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
        cellPadding: 2,
        overflow: "linebreak",
      },

      headStyles: {
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
        font: "IBMPlexSansArabic",
        fontStyle: "bold",
        halign: "center",
      },

      didDrawPage: function () {
        drawPdfHeader(doc, authStore, isArabic);

        const pageWidth = doc.internal.pageSize.width;

        doc.setFontSize(11);
        doc.setFont("IBMPlexSansArabic", "bold");

        const fullTitle = isArabic
          ? `عنوان التقرير: ${title}`
          : `Report Title: ${title}`;

        doc.text(fullTitle, isArabic ? pageWidth - 15 : 15, 40, {
          align: isArabic ? "right" : "left",
        });

        // =========================
        // DATE RANGE (NEW)
        // =========================
        const hasDateRange = filters.value.from_date || filters.value.to_date;

        if (hasDateRange) {
          const dateLabel = isArabic ? "التاريخ:" : "Date:";
          const fromLabel = isArabic ? "من" : "From";
          const toLabel = isArabic ? "إلى" : "To";

          const fromDate = filters.value.from_date || "--";
          const toDate = filters.value.to_date || "--";

          const dateText = isArabic
            ? `${dateLabel} ${fromLabel} ${fromDate} ${toLabel} ${toDate}`
            : `${dateLabel} ${fromLabel} ${fromDate} ${toLabel} ${toDate}`;

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
      drawPdfFooter(doc, authStore, i, totalPages, isArabic);
    }

    // =========================
    // PRINT (iframe method - same as employees)
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
//       date_from: formatApiDate(filters.value.from_date),
//       date_to: formatApiDate(filters.value.to_date),
//     };
//     if (scope.value === "own" || !filters.value.employee_id) {
//       delete params.employee_id;
//     }
//     const response = await permissionRequestsService.list(params);
//     printRequests.value = response.data?.permission_requests || [];

//     await nextTick();

//     // Calculate total pages based on rendered content
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

const statusOptions = computed(() => [
  { label: t("permissionRequests.status.pending"), value: "pending" },
  { label: t("permissionRequests.status.approved"), value: "approved" },
  { label: t("permissionRequests.status.rejected"), value: "rejected" },
  { label: t("permissionRequests.status.withdrawn"), value: "withdrawn" },
]);
</script>

<template>
  <section class="space-y-6">
    <!-- Header -->
    <header class="flex flex-wrap gap-2 items-center justify-between no-print">
      <div class="flex items-center">
        <router-link
          :to="{ name: lang === 'ar' ? 'requests-leave' : 'requests-en-leave' }"
          class="py-3 px-6 relative transition-all cursor-pointer block"
          :class="
            route && route.name.includes('leave')
              ? 'text-[#0E5F4A]'
              : 'text-[#384250]'
          "
        >
          <span class="font-medium">{{ t("leaveRequests.tabs.leaves") }}</span>
          <div
            class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] rounded-full"
          >
            <div
              v-if="route && route.name.includes('leave')"
              class="h-full w-[44px] bg-[#0E5F4A] rounded-full mx-auto"
            ></div>
          </div>
        </router-link>

        <router-link
          :to="{
            name:
              lang === 'ar' ? 'requests-permission' : 'requests-en-permission',
          }"
          class="py-3 px-6 relative transition-all cursor-pointer block"
          :class="
            route && route.name.includes('permission')
              ? 'text-[#0E5F4A]'
              : 'text-[#384250]'
          "
        >
          <span class="font-medium">{{
            t("leaveRequests.tabs.permissions")
          }}</span>
          <div
            class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] rounded-full"
          >
            <div
              v-if="route && route.name.includes('permission')"
              class="h-full w-[44px] bg-[#0E5F4A] rounded-full mx-auto"
            ></div>
          </div>
        </router-link>
      </div>

      <div class="flex items-center gap-2">
        <Button
          @click="handlePrint"
          class="bg-[#E7EFED] !px-2 !py-2 hover:!bg-[#DDE6E3] transition-colors duration-300"
          size="md"
          v-tooltip="t('leaveRequests.print')"
        >
          <SvgIcon name="printer" />
        </Button>

        <Menu
          as="div"
          class="relative inline-block text-left"
          v-if="authStore.hasPermission('permission_request.export')"
        >
          <MenuButton as="template">
            <Button
              class="bg-[#E7EFED] border border-[#0E5F4A] !px-2 !py-2 hover:!bg-[#DDE6E4] transition-colors duration-300 !text-[#0E5F4A]"
              size="md"
            >
              <SvgIcon name="export" />
              <span class="ms-1 me-2">{{ t("leaveRequests.export") }}</span>
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
                    @click="handleExportPDF"
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
                    @click="handleExportExcel"
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
              'permission_request.create',
              'permission_request.store',
            ])
          "
        >
          {{ t("permissionRequests.addRequest") }}
        </Button>
      </div>
    </header>

    <!-- Filters -->
    <Card class="no-print">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("permissionRequests.searchTitle") }}
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DateRangePicker
          v-model:startDate="filters.from_date"
          v-model:endDate="filters.to_date"
          :placeholder="t('overtimeRequests.placeholders.selectDateRange')"
          :label="t('common.date')"
          size="md"
        />
        <Select
          v-if="!authStore.isEmployee"
          v-model="filters.employee_id"
          :options="employeesOptions"
          :label="t('permissionRequests.fields.employeeName')"
          :placeholder="t('permissionRequests.placeholders.searchEmployee')"
          size="md"
          filterable
        />

        <Select
          v-model="filters.status"
          :options="statusOptions"
          :label="t('permissionRequests.fields.status')"
          :placeholder="t('permissionRequests.placeholders.status')"
          size="md"
        />
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <Button variant="ghost" size="md" @click="resetFilters" class="md:w-26">
          {{ t("common.reset") }}
        </Button>
        <Button
          variant="primary"
          size="md"
          @click="applyFilters"
          class="md:w-26"
        >
          {{ t("common.search") }}
        </Button>
      </div>
    </Card>

    <!-- Balance Cards -->
    <Card v-if="balanceSummary" class="space-y-4 no-print">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("permissionRequests.balanceTitle") }}
        </h2>
      </template>

      <div class="overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Monthly Permissions Card -->
          <div>
            <Card class="!p-5 !bg-[#F8FBFA] !border !border-[#F1F7F5] h-full">
              <div class="flex flex-col h-full justify-between">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center"
                    >
                      <SvgIcon name="permissions" />
                    </div>
                    <span class="text-[14px] font-[500] text-[#1F2A37]">
                      {{ t("permissionRequests.monthlyBalance") }}
                    </span>
                  </div>
                </div>
                <div class="space-y-3">
                  <div class="text-[12px] font-[500] text-[#6C737F]">
                    {{ t("permissionRequests.balance.usage") }}
                  </div>
                  <div
                    class="w-full h-1.5 rounded-full overflow-hidden bg-[#CFDFDB]"
                  >
                    <div
                      class="h-full rounded-full transition-all duration-500 bg-[#0E5F4A]"
                      :style="{
                        width: `${Math.min((balanceSummary.used_monthly_minutes / balanceSummary.max_monthly_minutes) * 100, 100)}%`,
                      }"
                    ></div>
                  </div>
                  <div class="space-y-3">
                    <div class="flex items-center">
                      <div
                        class="w-[10px] h-[10px] rounded-full bg-[#0E5F4A] me-2"
                      ></div>
                      <span class="text-[12px] text-[#6C737F] w-[100px]">
                        {{ t("permissionRequests.balance.remaining") }}
                      </span>
                      <span class="text-[13px] font-[600] text-[#0E5F4A]">
                        {{
                          Math.floor(
                            balanceSummary.remaining_monthly_minutes / 60,
                          )
                        }}
                        {{ t("permissionRequests.balance.hours") }}
                        {{ balanceSummary.remaining_monthly_minutes % 60 }}
                        {{ t("permissionRequests.balance.minutes") }}
                      </span>
                    </div>
                    <div class="flex items-center">
                      <div
                        class="w-[10px] h-[10px] rounded-full bg-[#CFDFDB] me-2"
                      ></div>
                      <span class="text-[12px] text-[#6C737F] w-[100px]">
                        {{ t("permissionRequests.balance.used") }}
                      </span>
                      <span class="text-[13px] font-[600] text-[#384250]">
                        {{
                          Math.floor(balanceSummary.used_monthly_minutes / 60)
                        }}
                        {{ t("permissionRequests.balance.hours") }}
                        {{ balanceSummary.used_monthly_minutes % 60 }}
                        {{ t("permissionRequests.balance.minutes") }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          <!-- Positive Balance Card -->
          <div>
            <Card class="!p-5 !bg-[#F8FBFA] !border !border-[#F1F7F5] h-full">
              <div class="flex flex-col h-full justify-between">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center"
                    >
                      <SvgIcon name="positive_balance" />
                    </div>
                    <span class="text-[14px] font-[500] text-[#1F2A37]">
                      {{ t("permissionRequests.positiveBalance") }}
                    </span>
                  </div>
                </div>
                <div class="space-y-3">
                  <div class="text-[12px] font-[500] text-[#6C737F]">
                    {{ t("permissionRequests.balance.usage") }}
                  </div>
                  <div
                    class="w-full h-1.5 rounded-full overflow-hidden bg-[#CFDFDB]"
                  >
                    <div
                      class="h-full rounded-full transition-all duration-500 bg-[#0E5F4A]"
                      :style="{
                        width: `${positiveBalance ? (positiveBalance.consumed / positiveBalance.total) * 100 : 0}%`,
                      }"
                    ></div>
                  </div>
                  <div class="space-y-3">
                    <div class="flex items-center">
                      <div
                        class="w-[10px] h-[10px] rounded-full bg-[#0E5F4A] me-2"
                      ></div>
                      <span class="text-[12px] text-[#6C737F] w-[100px]">
                        {{ t("permissionRequests.balance.remaining") }}
                      </span>
                      <span class="text-[13px] font-[600] text-[#0E5F4A]">
                        {{ positiveBalance?.remaining || 0 }}
                        {{ t("permissionRequests.balance.minutes") }}
                      </span>
                    </div>
                    <div class="flex items-center">
                      <div
                        class="w-[10px] h-[10px] rounded-full bg-[#CFDFDB] me-2"
                      ></div>
                      <span class="text-[12px] text-[#6C737F] w-[100px]">
                        {{ t("permissionRequests.balance.used") }}
                      </span>
                      <span class="text-[13px] font-[600] text-[#384250]">
                        {{ positiveBalance?.consumed || 0 }}
                        {{ t("permissionRequests.balance.minutes") }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Card>

    <!-- Table -->
    <Card class="no-print">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333] no-print">
          {{ t("permissionRequests.listTitle") }}
        </h2>
      </template>
      <Table
        :loading="loading"
        :items="requests"
        :headers="tableHeaders"
        :page="page"
        :total-pages="totalPages"
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
          {{ item.employee?.name }}
        </template>
        <template #cell-date="{ item }">
          {{ formatDate(item.date) }}
        </template>
        <template #cell-duration="{ item }">
          {{ formatDuration(item.duration_minutes) }}
        </template>
        <template #cell-status="{ item }">
          <span
            class="px-2 py-0.5 rounded-full text-[14px] font-[500] flex items-center gap-1.5 w-max"
            :class="getStatusColor(item.status)"
          >
            <span class="w-2.5 h-2.5 rounded-full bg-current"></span>
            {{ t("permissionRequests.status." + item.status) || item.status }}
          </span>
        </template>
        <template #cell-actions="{ item }">
          <div class="flex items-center gap-2">
            <button
              class="hover:opacity-75 transition-opacity cursor-pointer text-[#6C737F]"
              @click="openView(item)"
              v-tooltip="
                t('common.actionTooltips.view.title', {
                  target: t('permissionRequests.entityName'),
                })
              "
            >
              <SvgIcon name="eye" />
            </button>

            <button
              v-if="authStore.hasPermission('permission_request.update')"
              class="transition-opacity text-[#6C737F]"
              :class="
                !item.is_editable || !isCurrentMonthCheck(item)
                  ? 'opacity-30 !cursor-not-allowed'
                  : 'hover:opacity-75 cursor-pointer'
              "
              @click="
                item.is_editable && isCurrentMonthCheck(item) && openEdit(item)
              "
              v-tooltip="
                item.is_editable && isCurrentMonthCheck(item)
                  ? t('common.actionTooltips.edit.title', {
                      target: t('permissionRequests.entityName'),
                    })
                  : null
              "
            >
              <SvgIcon name="edit" />
            </button>

            <!-- Dots Menu for Approve, Reject, Withdraw -->
            <template
              v-if="
                scope !== 'own' &&
                authStore.hasPermission([
                  'permission_request.approve',
                  'permission_request.reject',
                  'permission_request.withdraw',
                ])
              "
            >
              <Menu
                v-if="item.status === 'pending' && isCurrentMonthCheck(item)"
                v-slot="{ open }"
                as="div"
                class="relative inline-block text-left no-print"
              >
                <MenuButton
                  @click="setDropdownPosition"
                  class="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                >
                  <SvgIcon name="dots" />
                </MenuButton>

                <Teleport to="body">
                  <transition
                    enter-active-class="transition duration-100 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-75 ease-in"
                    leave-from-class="transform scale-100 opacity-100"
                    leave-to-class="transform scale-95 opacity-0"
                  >
                    <MenuItems
                      v-show="open"
                      static
                      :style="dropdownStyle"
                      class="absolute w-[110px] rounded-[4px] bg-white shadow-lg z-[9999] p-1"
                    >
                      <template
                        v-if="
                          item.status === 'pending' &&
                          scope !== 'own' &&
                          isCurrentMonthCheck(item)
                        "
                      >
                        <MenuItem
                          v-slot="{ active }"
                          v-if="
                            authStore.hasPermission(
                              'permission_request.approve',
                            )
                          "
                        >
                          <button
                            @click="handleApprove(item)"
                            class="group flex w-full items-center rounded-sm p-2 text-[14px] text-[#161616] hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            {{ t("permissionRequests.modals.approve") }}
                          </button>
                        </MenuItem>
                        <MenuItem
                          v-slot="{ active }"
                          v-if="
                            authStore.hasPermission('permission_request.reject')
                          "
                        >
                          <button
                            @click="handleReject(item)"
                            class="group flex w-full items-center rounded-sm p-2 text-[14px] text-[#161616] hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            {{ t("permissionRequests.modals.reject") }}
                          </button>
                        </MenuItem>
                      </template>
                      <MenuItem
                        v-if="
                          canWithdraw(item) &&
                          authStore.hasPermission('permission_request.withdraw')
                        "
                        v-slot="{ active }"
                      >
                        <button
                          @click="handleWithdraw(item)"
                          class="group flex w-full items-center rounded-sm p-2 text-[14px] text-[#161616] hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          {{ t("permissionRequests.modals.withdraw") }}
                        </button>
                      </MenuItem>
                    </MenuItems>
                  </transition>
                </Teleport>
              </Menu>
              <div
                v-else
                class="flex items-center text-gray-400 opacity-30 cursor-not-allowed"
              >
                <SvgIcon name="dots" />
              </div>
            </template>
            <button
              v-else-if="authStore.hasPermission('permission_request.withdraw')"
              class="transition-opacity text-[#6C737F]"
              :class="
                !canWithdraw(item)
                  ? 'opacity-30 !cursor-not-allowed'
                  : 'hover:opacity-75 cursor-pointer'
              "
              @click="canWithdraw(item) && handleWithdraw(item)"
              v-tooltip="
                canWithdraw(item)
                  ? t('common.actionTooltips.withdraw.title', {
                      target: t('permissionRequests.entityName'),
                    })
                  : null
              "
            >
              <SvgIcon name="withdraw" />
            </button>
          </div>
        </template>
      </Table>
    </Card>

    <!-- Modals -->
    <PermissionRequestFormModal
      v-if="showFormModal"
      :show="showFormModal"
      :request="selectedRequest"
      :employees="employees"
      :scope="scope"
      :saving="saving"
      @close="showFormModal = false"
      @save="handleSave"
    />

    <PermissionRequestDetailsModal
      v-if="showDetailsModal"
      :show="showDetailsModal"
      :request="selectedRequest"
      :scope="scope"
      :loading="loadingDetails"
      @close="showDetailsModal = false"
      @withdraw="handleWithdraw"
      @approve="handleApprove"
      @reject="handleReject"
    />

    <div class="print-only hidden" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              :colspan="tableHeaders.length - 1"
              class="!bg-transparent !border-none !p-0"
            >
              <PrintHeader :title="t('permissionRequests.listTitle')" />
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
              {{ formatDate(item.date) }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ item.from_time }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ item.to_time }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ formatDuration(item.duration_minutes) }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ t("permissionRequests.status." + item.status) || item.status }}
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
