<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";
import { useAuthStore } from "@/stores/auth";

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

import { missingPunchRequestsService } from "@/services/missingPunchRequests";
import { employeeService } from "@/services/employees";
import MissingPunchRequestFormModal from "./MissingPunchRequestFormModal.vue";
import MissingPunchRequestDetailsModal from "./MissingPunchRequestDetailsModal.vue";

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
const printRequests = ref([]);
const printTotalPages = ref(1);
const scope = ref("own");

const filters = ref({
  search: "",
  employee_id: "",
  status: "",
  date_from: "",
  date_to: "",
  sort_by: "created_at",
  sort_direction: "desc",
});

const statusOptions = computed(() => [
  { label: t("missingPunchRequests.status.pending"), value: "pending" },
  { label: t("missingPunchRequests.status.approved"), value: "approved" },
  { label: t("missingPunchRequests.status.rejected"), value: "rejected" },
  { label: t("missingPunchRequests.status.withdrawn"), value: "withdrawn" },
]);

const employees = ref([]);
const user = ref();
const showFormModal = ref(false);
const showDetailsModal = ref(false);
const showWithdrawConfirm = ref(false);
const showApproveConfirm = ref(false);
const showRejectConfirm = ref(false);

const selectedRequest = ref(null);
const actionRequest = ref(null);
// const rejectionReason = ref("");

const requestLogs = ref([]);

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

const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

const formatApiDate = (dateStr) => {
  if (!dateStr || !dateStr.includes("/")) return dateStr;
  const [month, day, year] = dateStr.split("/");
  return `${year}-${month}-${day}`;
};

const loadRequests = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...filters.value,
      date_from: formatApiDate(filters.value.date_from),
      date_to: formatApiDate(filters.value.date_to),
    };

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }

    const response = await missingPunchRequestsService.list(params);
    requests.value = response.data?.missing_punch_requests || [];
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
  filters.value.date_from = "";
  filters.value.date_to = "";
  filters.value.sort_by = "created_at";
  filters.value.sort_direction = "desc";
  applyFilters();
};

const loadInitialData = async () => {
  try {
    const response = await employeeService.list({ paginate: false });
    employees.value = response.data || [];
  } catch (error) {
    console.error(error);
  }
};

const openCreate = (user) => {
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
    const response = await missingPunchRequestsService.get(request.id);
    selectedRequest.value = response.data?.missing_punch_request || request;
    requestLogs.value = response.data?.logs || [];
  } catch (error) {
    console.error(error);
    toast.error(error);
  } finally {
    loadingDetails.value = false;
  }
};

const openWithdraw = (request) => {
  actionRequest.value = request;
  // showWithdrawConfirm.value = true;
  confirmWithdraw();
};

const openApprove = (request) => {
  actionRequest.value = request;
  // showApproveConfirm.value = true;
  confirmApprove();
};

const openReject = (request) => {
  actionRequest.value = request;
  // rejectionReason.value = "";
  // showRejectConfirm.value = true;
  confirmReject();
};

const handleSave = async (payload) => {
  saving.value = true;
  try {
    if (selectedRequest.value?.id) {
      await missingPunchRequestsService.update(
        selectedRequest.value.id,
        payload,
      );
      toast.success(t("missingPunchRequests.messages.updated"));
    } else {
      await missingPunchRequestsService.create(payload);
      toast.success(t("missingPunchRequests.messages.created"));
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

const confirmWithdraw = async () => {
  if (!actionRequest.value) return;

  try {
    await missingPunchRequestsService.withdraw(actionRequest.value.id);
    toast.success(t("missingPunchRequests.messages.withdrawn"));
    showWithdrawConfirm.value = false;
    showDetailsModal.value = false;
    loadRequests();
  } catch (e) {
    console.error(e);
    toast.error(e);
  }
};

const confirmApprove = async () => {
  if (!actionRequest.value) return;

  try {
    await missingPunchRequestsService.approve(actionRequest.value.id);
    toast.success(t("missingPunchRequests.messages.approved"));
    showApproveConfirm.value = false;
    showDetailsModal.value = false;
    loadRequests();
  } catch (e) {
    console.error(e);
    toast.error(e);
  }
};

const confirmReject = async () => {
  if (!actionRequest.value) return;

  try {
    // await missingPunchRequestsService.reject(actionRequest.value.id, rejectionReason.value);
    await missingPunchRequestsService.reject(actionRequest.value.id, "");
    toast.success(t("missingPunchRequests.messages.rejected"));
    showRejectConfirm.value = false;
    showDetailsModal.value = false;
    loadRequests();
  } catch (e) {
    console.error(e);
    toast.error(e);
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
      date_from: formatApiDate(filters.value.date_from),
      date_to: formatApiDate(filters.value.date_to),
    };

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }

    const response = await missingPunchRequestsService.list(params);
    const data = response.data?.missing_punch_requests || [];

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
    [t("missingPunchRequests.fields.employeeName")]: item.employee?.name,
    [t("missingPunchRequests.fields.createdBy")]: item.requested_by?.name,
    [t("missingPunchRequests.fields.date")]: formatDate(item.date),
    [t("missingPunchRequests.fields.originalCheckIn")]:
      item.original_attendance?.check_in_time || "--:--",
    [t("missingPunchRequests.fields.checkIn")]: item.check_in_time || "--:--",
    [t("missingPunchRequests.fields.originalCheckOut")]:
      item.original_attendance?.check_out_time || "--:--",
    [t("missingPunchRequests.fields.checkOut")]: item.check_out_time || "--:--",

    [t("missingPunchRequests.fields.status")]: t(
      "missingPunchRequests.status." + item.status,
    ),
  }));

  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Missing Punch Requests");
  XLSX.writeFile(
    wb,
    `missing_punch_requests_export_${new Date().getTime()}.xlsx`,
  );
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
    const title = t("missingPunchRequests.title");

    let headers = [
      "#",
      t("missingPunchRequests.fields.employeeName"),
      t("missingPunchRequests.fields.createdBy"),
      t("missingPunchRequests.fields.date"),
      t("missingPunchRequests.fields.originalCheckIn"),
      t("missingPunchRequests.fields.checkIn"),
      t("missingPunchRequests.fields.originalCheckOut"),
      t("missingPunchRequests.fields.checkOut"),
      t("missingPunchRequests.fields.status"),
    ];

    let rows = data.map((item, index) => [
      index + 1,
      item.employee?.name,
      item.requested_by?.name,
      formatDate(item.date),
      item.original_attendance?.check_in_time || "--:--",
      item.original_attendance?.check_out_time || "--:--",
      item.check_in_time || "--:--",
      item.check_out_time || "--:--",
      t("missingPunchRequests.status." + item.status),
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
      drawPdfFooter(doc, authStore, i, totalPagesPDF, isArabic);
    }

    doc.save(`missing_punch_requests_export_${new Date().getTime()}.pdf`);
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
      date_from: formatApiDate(filters.value.date_from),
      date_to: formatApiDate(filters.value.date_to),
    };

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }

    const response = await missingPunchRequestsService.list(params);
    const printData = response.data?.missing_punch_requests || [];

    // =========================
    // CREATE PDF
    // =========================
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });

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

    const isArabic = lang.value === "ar";
    const title = t("missingPunchRequests.title");

    let headers = [
      "#",
      t("missingPunchRequests.fields.employeeName"),
      t("missingPunchRequests.fields.createdBy"),
      t("missingPunchRequests.fields.date"),
      t("missingPunchRequests.fields.originalCheckIn"),
      t("missingPunchRequests.fields.checkIn"),
      t("missingPunchRequests.fields.originalCheckOut"),
      t("missingPunchRequests.fields.checkOut"),
      t("missingPunchRequests.fields.status"),
    ];

    let rows = printData.map((item, index) => [
      index + 1,
      item.employee?.name,
      item.requested_by?.name,
      formatDate(item.date),
      item.original_attendance?.check_in_time || "--:--",
      item.check_in_time || "--:--",
      item.original_attendance?.check_out_time || "--:--",
      item.check_out_time || "--:--",
      t("missingPunchRequests.status." + item.status),
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
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
        halign: isArabic ? "right" : "left",
      },

      didDrawPage: () => {
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
        // DATE RANGE (NEW PART)
        // =========================
        // =========================
        // DATE RANGE (UPDATED)
        // =========================
        const hasDateRange = filters.value.date_from || filters.value.date_to;

        if (hasDateRange) {
          const dateLabel = isArabic ? "التاريخ:" : "Date:";

          const fromLabel = isArabic ? "من" : "From";
          const toLabel = isArabic ? "إلى" : "To";

          const fromDate = filters.value.date_from || "--";
          const toDate = filters.value.date_to || "--";

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
    // FOOTER PAGES
    // =========================
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPages, isArabic);
    }

    // =========================
    // PRINT (same as your overtime style)
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
//       date_from: formatApiDate(filters.value.date_from),
//       date_to: formatApiDate(filters.value.date_to),
//     };

//     if (!filters.value.employee_id) {
//       delete params.employee_id;
//     }

//     const response = await missingPunchRequestsService.list(params);
//     printRequests.value = response.data?.missing_punch_requests || [];

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
    label: t("missingPunchRequests.fields.employeeName"),
    sortable: true,
    headerClass: "min-w-[150px]",
    cellClass: "min-w-[150px]",
  },
  {
    key: "date",
    label: t("missingPunchRequests.fields.date"),
    sortable: true,
    headerClass: "min-w-[100px]",
    cellClass: "min-w-[100px]",
  },
  {
    key: "original_check_in",
    label: t("missingPunchRequests.fields.originalCheckIn"),
    sortable: true,
    headerClass: "min-w-[150px]",
    cellClass: "min-w-[150px]",
  },
  {
    key: "check_in",
    label: t("missingPunchRequests.fields.checkIn"),
    sortable: true,
    headerClass: "min-w-[150px]",
    cellClass: "min-w-[150px]",
  },
  {
    key: "original_check_out",
    label: t("missingPunchRequests.fields.originalCheckOut"),
    sortable: true,
    headerClass: "min-w-[150px]",
    cellClass: "min-w-[150px]",
  },
  {
    key: "check_out",
    label: t("missingPunchRequests.fields.checkOut"),
    sortable: true,
    headerClass: "min-w-[150px]",
    cellClass: "min-w-[150px]",
  },
  {
    key: "status",
    label: t("missingPunchRequests.fields.status"),
    sortable: true,
    headerClass: "min-w-[130px]",
    cellClass: "min-w-[130px]",
  },
  {
    key: "actions",
    label: t("missingPunchRequests.fields.actions"),
    headerClass: "w-[80px]",
    cellClass: "w-[80px]",
  },
]);

const getStatusColor = (status) => {
  switch (status) {
    case "approved":
    case "تمت الموافقة":
      return "text-[#085D3A] bg-[#ECFDF3]";
    case "pending":
    case "قيد المراجعة":
      return "text-[#93370D] bg-[#FFFAEB]";
    case "rejected":
    case "مرفوض":
      return "text-[#912018] bg-[#FEF3F2]";
    case "withdrawn":
    case "تم التراجع":
      return "text-[#4D5761] bg-[#E5E7EB]";
    default:
      return "text-[#4D5761] bg-[#E5E7EB]";
  }
};

const formatTime12 = (time) => {
  if (!time || time === "--:--") return time;
  const parts = time.split(":");
  if (parts.length < 2) return time;

  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm =
    hour >= 12
      ? lang.value === "ar"
        ? "م"
        : "PM"
      : lang.value === "ar"
        ? "ص"
        : "AM";
  hour = hour % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${minute} ${ampm}`;
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

const isPreviousMonth = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const requestYear = isDateOnly ? date.getUTCFullYear() : date.getFullYear();
  const requestMonth = isDateOnly ? date.getUTCMonth() : date.getMonth();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return (
    requestYear < currentYear ||
    (requestYear === currentYear && requestMonth < currentMonth)
  );
};
</script>

<template>
  <section class="space-y-6">
    <header class="flex items-center justify-between no-print">
      <h1 class="text-[20px] font-[600] text-[#000000]">
        {{ t("missingPunchRequests.title") }}
      </h1>
      <div class="flex items-center gap-2">
        <Button
          @click="handlePrint"
          class="bg-[#E7EFED] !px-2 !py-2 hover:!bg-[#DDE6E4] transition-colors duration-300"
          size="md"
        >
          <SvgIcon name="printer" />
        </Button>

        <Menu
          as="div"
          class="relative inline-block text-left"
          v-if="authStore.hasPermission('missing_punch_request.export')"
        >
          <MenuButton as="template">
            <Button
              class="bg-[#E7EFED] border border-[#0E5F4A] !px-2 !py-2 hover:!bg-[#DDE6E4] transition-colors duration-300 !text-[#0E5F4A]"
              size="md"
            >
              <SvgIcon name="export" />
              <span class="ms-1 me-2">{{
                t("missingPunchRequests.export")
              }}</span>
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
              'missing_punch_request.create',
              'missing_punch_request.store',
            ])
          "
        >
          {{ t("missingPunchRequests.addRequest") }}
        </Button>
      </div>
    </header>

    <!-- Filters Card -->
    <Card class="no-print">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("missingPunchRequests.searchTitle") }}
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <DateRangePicker
          v-model:startDate="filters.date_from"
          v-model:endDate="filters.date_to"
          :label="t('missingPunchRequests.placeholders.date')"
          :placeholder="t('missingPunchRequests.placeholders.selectDateRange')"
          size="md"
        />

        <Select
          v-if="!authStore.isEmployee"
          v-model="filters.employee_id"
          :options="employeesOptions"
          :label="t('missingPunchRequests.fields.employeeName')"
          :placeholder="t('missingPunchRequests.placeholders.searchEmployee')"
          size="md"
          searchable
        />

        <Select
          v-model="filters.status"
          :options="statusOptions"
          :label="t('missingPunchRequests.fields.status')"
          :placeholder="t('missingPunchRequests.placeholders.status')"
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
            {{ t("missingPunchRequests.listTitle") }}
          </h2>
        </template>

        <Table
          :loading="loading"
          :items="requests"
          :headers="tableHeaders"
          :page="page"
          :total-pages="totalPages"
          :loading-text="t('common.loading')"
          :empty-text="t('missingPunchRequests.empty')"
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

          <template #cell-date="{ item }">
            {{ formatDate(item.date) }}
          </template>

          <template #cell-original_check_in="{ item }">
            {{
              formatTime12(item.original_attendance?.check_in_time) || "--:--"
            }}
          </template>

          <template #cell-original_check_out="{ item }">
            {{
              formatTime12(item.original_attendance?.check_out_time) || "--:--"
            }}
          </template>

          <template #cell-check_in="{ item }">
            {{ formatTime12(item.check_in_time) || "--:--" }}
          </template>

          <template #cell-check_out="{ item }">
            {{ formatTime12(item.check_out_time) || "--:--" }}
          </template>

          <template #cell-status="{ item }">
            <span
              class="px-2 py-0.5 rounded-full text-[14px] font-[500] flex items-center gap-1.5 w-max"
              :class="getStatusColor(item.status)"
            >
              <span class="w-2.5 h-2.5 rounded-full bg-current"></span>
              {{ t("missingPunchRequests.status." + item.status) }}
            </span>
          </template>

          <template #cell-actions="{ item }">
            <div class="flex items-center gap-2">
              <!-- View Button -->
              <button
                class="hover:opacity-75 transition-opacity cursor-pointer text-[#6C737F]"
                @click="openView(item)"
                v-tooltip="{
                  title: t('common.actionTooltips.view.title', {
                    target: t('missingPunchRequests.entityName'),
                  }),
                  content: t('common.actionTooltips.view.content', {
                    target: t('missingPunchRequests.entityName'),
                    name: item.employee?.name,
                  }),
                }"
              >
                <SvgIcon name="eye" />
              </button>

              <button
                v-if="authStore.hasPermission('missing_punch_request.update')"
                class="transition-opacity text-[#6C737F]"
                :class="
                  !item.is_editable || isPreviousMonth(item.date)
                    ? 'opacity-30 !cursor-not-allowed'
                    : 'hover:opacity-75 cursor-pointer'
                "
                @click="
                  !(!item.is_editable || isPreviousMonth(item.date)) &&
                  openEdit(item)
                "
                v-tooltip="{
                  title: t('common.actionTooltips.edit.title', {
                    target: t('missingPunchRequests.entityName'),
                  }),
                  content: t('common.actionTooltips.edit.content', {
                    target: t('missingPunchRequests.entityName'),
                    name: item.employee?.name,
                  }),
                }"
              >
                <SvgIcon name="edit" />
              </button>

              <!-- Dropdown for other actions -->
              <template
                v-if="
                  (scope !== 'own' &&
                    (authStore.hasPermission('missing_punch_request.approve') ||
                      authStore.hasPermission(
                        'missing_punch_request.reject',
                      ))) ||
                  ((item.is_withdrawable || item.status === 'pending') &&
                    authStore.hasPermission('missing_punch_request.withdraw'))
                "
              >
                <template
                  v-if="
                    item.status === 'pending' && !isPreviousMonth(item.date)
                  "
                >
                  <!-- Single action: Withdraw -->
                  <button
                    v-if="
                      scope === 'own' ||
                      (!authStore.hasPermission(
                        'missing_punch_request.approve',
                      ) &&
                        !authStore.hasPermission(
                          'missing_punch_request.reject',
                        ))
                    "
                    class="hover:opacity-75 transition-opacity cursor-pointer text-[#6C737F]"
                    @click="openWithdraw(item)"
                    v-tooltip="t('missingPunchRequests.modals.withdraw')"
                  >
                    <SvgIcon name="withdraw" />
                  </button>

                  <!-- Multiple actions: Menu -->
                  <Menu
                    v-else
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
                          <MenuItem
                            v-if="
                              item.status === 'pending' &&
                              scope !== 'own' &&
                              authStore.hasPermission(
                                'missing_punch_request.approve',
                              )
                            "
                            v-slot="{ active }"
                          >
                            <button
                              @click="openApprove(item)"
                              class="group flex w-full items-center rounded-sm p-2 text-[14px] text-[#161616] hover:bg-gray-100 cursor-pointer"
                            >
                              {{ t("missingPunchRequests.modals.approve") }}
                            </button>
                          </MenuItem>
                          <MenuItem
                            v-if="
                              item.status === 'pending' &&
                              scope !== 'own' &&
                              authStore.hasPermission(
                                'missing_punch_request.reject',
                              )
                            "
                            v-slot="{ active }"
                          >
                            <button
                              @click="openReject(item)"
                              class="group flex w-full items-center rounded-sm p-2 text-[14px] text-[#161616] hover:bg-gray-100 cursor-pointer"
                            >
                              {{ t("missingPunchRequests.modals.reject") }}
                            </button>
                          </MenuItem>
                          <MenuItem
                            v-if="
                              (item.is_withdrawable ||
                                item.status === 'pending') &&
                              authStore.hasPermission(
                                'missing_punch_request.withdraw',
                              )
                            "
                            v-slot="{ active }"
                          >
                            <button
                              @click="openWithdraw(item)"
                              class="group flex w-full items-center rounded-sm p-2 text-[14px] text-[#161616] hover:bg-gray-100 cursor-pointer"
                            >
                              {{ t("missingPunchRequests.modals.withdraw") }}
                            </button>
                          </MenuItem>
                        </MenuItems>
                      </transition>
                    </Teleport>
                  </Menu>
                </template>

                <div
                  v-else
                  class="flex items-center text-gray-400 opacity-30 cursor-not-allowed"
                  v-tooltip="
                    item.status === 'approved'
                      ? t('missingPunchRequests.status.approved')
                      : isPreviousMonth(item.date)
                        ? t('missingPunchRequests.messages.cannotEditPastMonth')
                        : ''
                  "
                >
                  <SvgIcon
                    :name="
                      scope === 'own' ||
                      (!authStore.hasPermission(
                        'missing_punch_request.approve',
                      ) &&
                        !authStore.hasPermission(
                          'missing_punch_request.reject',
                        ))
                        ? 'withdraw'
                        : 'dots'
                    "
                  />
                </div>
              </template>
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
              <PrintHeader :title="t('missingPunchRequests.title')" />
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
              {{
                formatTime12(item.original_attendance?.check_in_time) || "--:--"
              }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ formatTime12(item.check_in_time) || "--:--" }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{
                formatTime12(item.original_attendance?.check_out_time) ||
                "--:--"
              }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ formatTime12(item.check_out_time) || "--:--" }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{
                t("missingPunchRequests.status." + item.status) || item.status
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

    <MissingPunchRequestFormModal
      v-model="showFormModal"
      :request="selectedRequest"
      :loading="saving"
      :scope="scope"
      @save="handleSave"
    />

    <MissingPunchRequestDetailsModal
      v-model="showDetailsModal"
      :request="selectedRequest"
      :logs="requestLogs"
      :loading="loadingDetails"
      :scope="scope"
      @withdraw="openWithdraw"
      @approve="openApprove"
      @reject="openReject"
    />
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
  #print-area {
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
