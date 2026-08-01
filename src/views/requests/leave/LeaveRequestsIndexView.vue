<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
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
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";
import "swiper/css";

import { leaveRequestsService } from "@/services/leaveRequests";
import { permissionRequestsService } from "@/services/permissionRequests";
import LeaveRequestFormModal from "./LeaveRequestFormModal.vue";
import PermissionRequestFormModal from "../permission/PermissionRequestFormModal.vue";
import LeaveRequestDetailsModal from "./LeaveRequestDetailsModal.vue";
import PermissionRequestDetailsModal from "../permission/PermissionRequestDetailsModal.vue";

import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";

import PrintHeader from "@/components/ui/PrintHeader.vue";
import PrintFooter from "@/components/ui/PrintFooter.vue";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";

const authStore = useAuthStore();
const { t, locale } = useI18n();
const route = useRoute();
const lang = computed(() => locale.value);
const toast = useAppToast();

const requests = ref([]);
const balances = ref([]);
const balanceSummary = ref(null);
const positiveBalance = ref(null);
const leaveTypes = ref([]);

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

const activeTab = ref("leave");

const tabs = computed(() => [
  { id: "leave", label: t("leaveRequests.tabs.leaves") },
  { id: "permission", label: t("leaveRequests.tabs.permissions") },
]);

watch(activeTab, (val) => {
  filters.value.type = val;
  applyFilters();
});

const statusOptions = computed(() => [
  { label: t("leaveRequests.status.pending"), value: "pending" },
  { label: t("leaveRequests.status.approved"), value: "approved" },
  { label: t("leaveRequests.status.rejected"), value: "rejected" },
  { label: t("leaveRequests.status.withdrawn"), value: "withdrawn" },
]);

const filters = ref({
  search: "",
  employee_id: "",
  status: "",
  leave_type_id: "",
  from_date: "",
  to_date: "",
  sort_by: "created_at",
  sort_direction: "desc",
  type: "leave",
});

const showFormModal = ref(false);
const showDetailsModal = ref(false);

const selectedRequest = ref(null);
const actionRequest = ref(null);
const rejectionReason = ref("");

const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

const loadInitialData = async () => {
  try {
    const typesRes = await leaveRequestsService.getLeaveTypes();
    leaveTypes.value = typesRes.data?.leave_types || [];
    const empRes = await leaveRequestsService.getEmployees();
    employees.value = empRes.data?.employees || [];
  } catch (error) {
    console.error(error);
  }
};

const loadBalance = async () => {
  loadingBalance.value = true;
  try {
    const empId = filters.value.employee_id || null;
    if (activeTab.value === "leave") {
      const response = await leaveRequestsService.getBalanceSummary(empId);
      balanceSummary.value = response.data?.summary || null;
      balances.value = response.data?.summary?.details || [];
    } else {
      const [balanceRes, positiveRes] = await Promise.all([
        permissionRequestsService.getBalance(empId),
        permissionRequestsService.getPositiveBalance(),
      ]);
      balanceSummary.value = balanceRes.data?.balance || null;
      positiveBalance.value = positiveRes.data?.positive_balance || null;
    }
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
      from_date: formatApiDate(filters.value.from_date),
      to_date: formatApiDate(filters.value.to_date),
    };

    if (scope.value === "own" || !filters.value.employee_id) {
      delete params.employee_id;
    }

    const response = await (activeTab.value === "leave"
      ? leaveRequestsService.list(params)
      : permissionRequestsService.list(params));

    if (activeTab.value === "leave") {
      requests.value = response.data?.leave_requests || [];
    } else {
      requests.value = response.data?.permission_requests || [];
    }

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
    leave_type_id: "",
    from_date: "",
    to_date: "",
    sort_by: "created_at",
    sort_direction: "desc",
    type: activeTab.value,
  };
  applyFilters();
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
    const response = await (activeTab.value === "leave"
      ? leaveRequestsService.get(request.id)
      : permissionRequestsService.get(request.id));
    selectedRequest.value =
      (activeTab.value === "leave"
        ? response.data?.leave_request
        : response.data?.permission_request) || request;
  } catch (error) {
    console.error(error);
    toast.error(error);
  } finally {
    loadingDetails.value = false;
  }
};

const handleWithdraw = (request) => {
  actionRequest.value = request;
  showDetailsModal.value = false;
  confirmWithdraw();
};

const confirmWithdraw = async () => {
  if (!actionRequest.value) return;
  try {
    if (activeTab.value === "leave") {
      await leaveRequestsService.withdraw(actionRequest.value.id);
      toast.success(t("leaveRequests.messages.withdrawn"));
    } else {
      await permissionRequestsService.withdraw(actionRequest.value.id);
      toast.success(t("permissionRequests.messages.withdrawn"));
    }
    loadRequests();
    loadBalance();
  } catch (e) {
    console.error(e);
    toast.error(e);
  }
};

const handleApprove = (request) => {
  actionRequest.value = request;
  showDetailsModal.value = false;
  confirmApprove();
};

const confirmApprove = async () => {
  if (!actionRequest.value) return;
  try {
    if (activeTab.value === "leave") {
      await leaveRequestsService.approve(actionRequest.value.id);
      toast.success(t("leaveRequests.messages.approved"));
    } else {
      await permissionRequestsService.approve(actionRequest.value.id);
      toast.success(t("permissionRequests.messages.approved"));
    }
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
  showDetailsModal.value = false;
  confirmReject();
};

const confirmReject = async () => {
  if (!actionRequest.value) return;
  try {
    if (activeTab.value === "leave") {
      await leaveRequestsService.reject(
        actionRequest.value.id,
        rejectionReason.value,
      );
      toast.success(t("leaveRequests.messages.rejected"));
    } else {
      await permissionRequestsService.reject(
        actionRequest.value.id,
        rejectionReason.value,
      );
      toast.success(t("permissionRequests.messages.rejected"));
    }
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
      if (activeTab.value === "leave") {
        await leaveRequestsService.update(selectedRequest.value.id, payload);
        toast.success(t("leaveRequests.messages.updated"));
      } else {
        await permissionRequestsService.update(
          selectedRequest.value.id,
          payload,
        );
        toast.success(t("permissionRequests.messages.updated"));
      }
    } else {
      if (activeTab.value === "leave") {
        await leaveRequestsService.create(payload);
        toast.success(t("leaveRequests.messages.created"));
      } else {
        await permissionRequestsService.create(payload);
        toast.success(t("permissionRequests.messages.created"));
      }
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

    const response = await leaveRequestsService.list(params);
    const data = response.data?.leave_requests || [];

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
    [t("leaveRequests.fields.employeeName")]: item.employee?.name,
    [t("leaveRequests.fields.leaveType")]:
      lang.value === "ar" ? item.leave_type?.name_ar : item.leave_type?.name,
    [t("leaveRequests.fields.fromDate")]: formatDate(item.from_date),
    [t("leaveRequests.fields.toDate")]: formatDate(item.to_date),
    [t("leaveRequests.fields.duration")]: item.duration_days,
    [t("leaveRequests.fields.status")]: t(
      "leaveRequests.status." + item.status,
    ),
  }));

  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leave Requests");
  XLSX.writeFile(wb, `leave_requests_export_${new Date().getTime()}.xlsx`);
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
    const title =
      activeTab.value === "leave"
        ? t("leaveRequests.tabs.leaves")
        : t("leaveRequests.tabs.permissions");

    let headers = [
      "#",
      t("leaveRequests.fields.employeeName"),
      t("leaveRequests.fields.leaveType"),
      t("leaveRequests.fields.fromDate"),
      t("leaveRequests.fields.toDate"),
      t("leaveRequests.fields.duration"),
      t("leaveRequests.fields.status"),
    ];

    let rows = data.map((item, index) => [
      index + 1,
      item.employee?.name,
      isArabic ? item.leave_type?.name_ar : item.leave_type?.name,
      formatDate(item.from_date),
      formatDate(item.to_date),
      item.duration_days,
      t("leaveRequests.status." + item.status),
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

    doc.save(`leave_requests_export_${new Date().getTime()}.pdf`);
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

// const handlePrint = async () => {
//   try {
//     const params = {
//       paginate: false,
//       per_page: 1000,
//       ...filters.value,
//       from_date: formatApiDate(filters.value.from_date),
//       to_date: formatApiDate(filters.value.to_date),
//     };

//     if (scope.value === "own" || !filters.value.employee_id) {
//       delete params.employee_id;
//     }

//     const response = await (activeTab.value === "leave"
//       ? leaveRequestsService.list(params)
//       : permissionRequestsService.list(params));

//     if (activeTab.value === "leave") {
//       printRequests.value = response.data?.leave_requests || [];
//     } else {
//       printRequests.value = response.data?.permission_requests || [];
//     }

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

const handlePrint = async () => {
  try {
    const params = {
      paginate: false,
      per_page: 1000,
      ...filters.value,
      from_date: formatApiDate(filters.value.from_date),
      to_date: formatApiDate(filters.value.to_date),
    };

    if (scope.value === "own" || !filters.value.employee_id) {
      delete params.employee_id;
    }

    const response = await (activeTab.value === "leave"
      ? leaveRequestsService.list(params)
      : permissionRequestsService.list(params));

    const printData =
      activeTab.value === "leave"
        ? response.data?.leave_requests || []
        : response.data?.permission_requests || [];

    // =========================
    // PDF INIT
    // =========================
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });

    const isArabic = lang.value === "ar";

    // Fonts
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
    // HEADER TITLE
    // =========================
    const title =
      activeTab.value === "leave"
        ? t("leaveRequests.tabs.leaves")
        : t("leaveRequests.tabs.permissions");

    // =========================
    // TABLE CONFIG
    // =========================
    let headers =
      activeTab.value === "leave"
        ? [
            "#",
            t("leaveRequests.fields.employeeName"),
            t("leaveRequests.fields.leaveType"),
            t("leaveRequests.fields.fromDate"),
            t("leaveRequests.fields.toDate"),
            t("leaveRequests.fields.duration"),
            t("leaveRequests.fields.status"),
          ]
        : [
            "#",
            t("permissionRequests.fields.employeeName"),
            t("permissionRequests.fields.date"),
            t("permissionRequests.fields.fromTime"),
            t("permissionRequests.fields.toTime"),
            t("permissionRequests.fields.duration"),
            t("permissionRequests.fields.status"),
          ];

    let rows = printData.map((item, index) => {
      if (activeTab.value === "leave") {
        return [
          index + 1,
          item.employee?.name,
          isArabic ? item.leave_type?.name_ar : item.leave_type?.name,
          formatDate(item.from_date),
          formatDate(item.to_date),
          item.duration_days,
          t("leaveRequests.status." + item.status),
        ];
      } else {
        return [
          index + 1,
          item.employee?.name,
          formatDate(item.date),
          item.from_time,
          item.to_time,
          item.duration_formatted,
          isArabic ? item.status_label : item.status,
        ];
      }
    });

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
    // FOOTER PAGES
    // =========================
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPages, isArabic);
    }

    // =========================
    // PRINT (same pattern as your example)
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

onMounted(() => {
  loadInitialData();
  loadRequests();
  loadBalance();
});

const tableHeaders = computed(() => {
  const baseHeaders = [
    {
      key: "index",
      label: "#",
      headerClass: "w-[50px]",
      cellClass: "w-[50px]",
    },
    {
      key: "employee",
      label:
        activeTab.value === "leave"
          ? t("leaveRequests.fields.employeeName")
          : t("permissionRequests.fields.employeeName"),
      sortable: true,
      headerClass: "min-w-[150px]",
      cellClass: "min-w-[150px]",
    },
  ];

  if (activeTab.value === "leave") {
    baseHeaders.push(
      {
        key: "leave_type",
        label: t("leaveRequests.fields.leaveType"),
        sortable: true,
        headerClass: "min-w-[120px]",
        cellClass: "min-w-[120px]",
      },
      {
        key: "from_date",
        label: t("leaveRequests.fields.fromDate"),
        sortable: true,
        headerClass: "min-w-[100px]",
        cellClass: "min-w-[100px]",
      },
      {
        key: "to_date",
        label: t("leaveRequests.fields.toDate"),
        sortable: true,
        headerClass: "min-w-[100px]",
        cellClass: "min-w-[100px]",
      },
      {
        key: "duration_days",
        label: t("leaveRequests.fields.duration"),
        sortable: true,
        headerClass: "min-w-[80px]",
        cellClass: "min-w-[80px]",
      },
    );
  } else {
    baseHeaders.push(
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
        key: "duration_formatted",
        label: t("permissionRequests.fields.duration"),
        sortable: true,
        headerClass: "min-w-[100px]",
        cellClass: "min-w-[100px]",
      },
    );
  }

  baseHeaders.push(
    {
      key: "status",
      label:
        activeTab.value === "leave"
          ? t("leaveRequests.fields.status")
          : t("permissionRequests.fields.status"),
      sortable: true,
      headerClass: "min-w-[130px]",
      cellClass: "min-w-[130px]",
    },
    {
      key: "actions",
      label:
        activeTab.value === "leave"
          ? t("leaveRequests.fields.actions")
          : t("permissionRequests.fields.actions"),
      headerClass: "w-[120px]",
      cellClass: "w-[120px]",
    },
  );

  return baseHeaders;
});

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

const isCurrentMonthCheck = (item) => {
  const dateStr = item?.from_date || item?.date;
  if (!dateStr) return false;
  const now = new Date();
  const itemDate = new Date(dateStr);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return itemDate >= currentMonthStart || item.is_finalized === false;
};
const employeesOptions = computed(() => {
  return (employees.value || []).map((emp) => ({
    label: emp.name,
    value: emp.id,
  }));
});
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-wrap gap-2 items-center justify-between no-print">
      <div class="flex items-center">
        <router-link
          :to="{ name: lang === 'ar' ? 'requests-leave' : 'requests-en-leave' }"
          class="py-3 px-6 relative transition-all cursor-pointer block"
          :class="
            route.name.includes('leave') ? 'text-[#0E5F4A]' : 'text-[#384250]'
          "
        >
          <span class="font-medium">{{ t("leaveRequests.tabs.leaves") }}</span>
          <div
            class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] rounded-full"
          >
            <div
              v-if="route.name.includes('leave')"
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
            route.name.includes('permission')
              ? 'text-[#0E5F4A]'
              : 'text-[#384250]'
          "
        >
          <span class="font-medium">
            {{ t("leaveRequests.tabs.permissions") }}
          </span>

          <!-- gray line always -->
          <div
            class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#d2d6db] rounded-full"
          >
            <!-- green only if active -->
            <div
              v-if="route.name.includes('permission')"
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
          v-if="
            authStore.hasPermission(
              activeTab === 'leave'
                ? 'leave_request.export'
                : 'permission_request.export',
            )
          "
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
            authStore.hasPermission(
              activeTab === 'leave'
                ? ['leave_request.create', 'leave_request.store']
                : ['permission_request.create', 'permission_request.store'],
            )
          "
        >
          {{
            activeTab === "leave"
              ? t("leaveRequests.addRequest")
              : t("permissionRequests.addRequest")
          }}
        </Button>
      </div>
    </header>

    <!-- Filters Card -->
    <Card class="no-print">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{
            activeTab === "leave"
              ? t("leaveRequests.searchTitle")
              : t("permissionRequests.searchTitle")
          }}
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <DateRangePicker
          v-model:startDate="filters.from_date"
          v-model:endDate="filters.to_date"
          :label="t('leaveRequests.placeholders.date')"
          :placeholder="t('leaveRequests.placeholders.selectDateRange')"
          size="md"
        />

        <Select
          v-if="!authStore.isEmployee"
          v-model="filters.employee_id"
          :options="employeesOptions"
          :label="
            activeTab === 'leave'
              ? t('leaveRequests.fields.employeeName')
              : t('permissionRequests.fields.employeeName')
          "
          :placeholder="
            activeTab === 'leave'
              ? t('leaveRequests.placeholders.searchEmployee')
              : t('permissionRequests.placeholders.searchEmployee')
          "
          size="md"
          filterable
        />

        <Select
          v-model="filters.leave_type_id"
          :options="
            leaveTypes.map((t) => ({
              label: lang === 'ar' ? t.name_ar : t.name,
              value: t.id,
            }))
          "
          :label="t('leaveRequests.fields.leaveType')"
          :placeholder="t('leaveRequests.placeholders.selectLeaveType')"
          size="md"
        />

        <Select
          v-model="filters.status"
          :options="statusOptions"
          :label="
            activeTab === 'leave'
              ? t('leaveRequests.fields.status')
              : t('permissionRequests.fields.status')
          "
          :placeholder="
            activeTab === 'leave'
              ? t('leaveRequests.placeholders.status')
              : t('permissionRequests.placeholders.status')
          "
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

    <Card
      v-if="balances.length > 0 || balanceSummary"
      class="space-y-4 no-print"
    >
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{
            activeTab === "leave"
              ? t("leaveRequests.balanceTitle")
              : t("permissionRequests.balanceTitle")
          }}
        </h2>
      </template>

      <div class="relative">
        <Swiper
          :modules="[Autoplay]"
          :slides-per-view="'auto'"
          :space-between="12"
          :loop="true"
          :autoplay="{
            delay: 2000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }"
          class="statistics-swiper w-full"
          :dir="lang === 'ar' ? 'rtl' : 'ltr'"
          :key="lang"
        >
          <template v-if="activeTab === 'leave'">
            <SwiperSlide
              v-for="(balance, index) in balances"
              :key="balance.leave_type_id"
              class="!w-[340px]"
            >
              <Card class="!p-5 !bg-[#F8FBFA] !border !border-[#F1F7F5] h-full">
                <div class="flex flex-col h-full justify-between">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                      <div
                        class="marker:w-10 h-10 rounded-lg flex items-center justify-center"
                      >
                        <SvgIcon name="regular" />
                      </div>
                      <span class="text-[14px] font-[500] text-[#1F2A37]">
                        {{
                          lang === "ar"
                            ? balance.leave_type_name_ar
                            : balance.leave_type_name
                        }}
                      </span>
                    </div>
                  </div>

                  <div class="space-y-3">
                    <div class="text-[12px] font-[500] text-[#6C737F]">
                      {{ t("leaveRequests.balance.usage") }}
                    </div>
                    <div
                      class="w-full h-1.5 rounded-full overflow-hidden bg-[#CFDFDB]"
                    >
                      <div
                        class="h-full rounded-full transition-all duration-500 bg-[#0E5F4A]"
                        :style="{
                          width: `${(balance.approved_used_days / balance.total_days) * 100}%`,
                        }"
                      ></div>
                    </div>

                    <div class="space-y-3">
                      <div class="flex items-center">
                        <div
                          class="w-[10px] h-[10px] rounded-full bg-[#0E5F4A] me-2"
                        ></div>
                        <span class="text-[12px] text-[#6C737F] w-[100px]">{{
                          t("leaveRequests.balance.remaining")
                        }}</span>
                        <span class="text-[13px] font-[600] text-[#0E5F4A]">
                          {{ balance.remaining_days }}
                          {{ t("leaveRequests.balance.days") }}
                        </span>
                      </div>
                      <div class="flex items-center">
                        <div
                          class="w-[10px] h-[10px] rounded-full bg-[#CFDFDB] me-2"
                        ></div>
                        <span class="text-[12px] text-[#6C737F] w-[100px]">{{
                          t("leaveRequests.balance.used")
                        }}</span>
                        <span class="text-[13px] font-[600] text-[#384250]">
                          {{ balance.approved_used_days }}
                          {{ t("leaveRequests.balance.days") }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </SwiperSlide>
          </template>
          <template v-else-if="balanceSummary">
            <!-- Monthly Permissions Card -->
            <SwiperSlide class="!w-[340px]">
              <Card class="!p-5 !bg-[#F8FBFA] !border !border-[#F1F7F5] h-full">
                <div class="flex flex-col h-full justify-between">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-10 h-10 rounded-lg flex items-center justify-center"
                      >
                        <Icon
                          name="historyPermissions"
                          size="lg"
                          class="text-primary"
                        />
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
                        <span class="text-[12px] text-[#6C737F] w-[100px]">{{
                          t("permissionRequests.balance.remaining")
                        }}</span>
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
                        <span class="text-[12px] text-[#6C737F] w-[100px]">{{
                          t("permissionRequests.balance.used")
                        }}</span>
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
            </SwiperSlide>
            <!-- Positive Balance Card -->
            <SwiperSlide class="!w-[340px]">
              <Card class="!p-5 !bg-[#F8FBFA] !border !border-[#F1F7F5] h-full">
                <div class="flex flex-col h-full justify-between">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-10 h-10 rounded-lg flex items-center justify-center"
                      >
                        <Icon name="plus" size="lg" class="text-primary" />
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
                        <span class="text-[12px] text-[#6C737F] w-[100px]">{{
                          t("permissionRequests.balance.remaining")
                        }}</span>
                        <span class="text-[13px] font-[600] text-[#0E5F4A]">
                          {{ positiveBalance?.remaining || 0 }}
                          {{ t("permissionRequests.balance.minutes") }}
                        </span>
                      </div>
                      <div class="flex items-center">
                        <div
                          class="w-[10px] h-[10px] rounded-full bg-[#CFDFDB] me-2"
                        ></div>
                        <span class="text-[12px] text-[#6C737F] w-[100px]">{{
                          t("permissionRequests.balance.used")
                        }}</span>
                        <span class="text-[13px] font-[600] text-[#384250]">
                          {{ positiveBalance?.consumed || 0 }}
                          {{ t("permissionRequests.balance.minutes") }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </SwiperSlide>
          </template>
        </Swiper>
      </div>
    </Card>

    <!-- List Card -->
    <div id="print-area">
      <Card class="print:!border-none print:!shadow-none no-print">
        <template #header>
          <h2 class="text-[16px] font-[600] text-[#333333] no-print">
            {{
              activeTab === "leave"
                ? t("leaveRequests.listTitle")
                : t("permissionRequests.listTitle")
            }}
          </h2>
        </template>

        <Table
          :loading="loading"
          :items="requests"
          :headers="tableHeaders"
          :page="page"
          :total-pages="totalPages"
          :loading-text="t('common.loading')"
          :empty-text="t('leaveRequests.empty')"
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

          <template #cell-leave_type="{ item }">
            <span>{{
              lang === "ar" ? item.leave_type?.name_ar : item.leave_type?.name
            }}</span>
          </template>

          <template #cell-from_date="{ item }">
            {{ formatDate(item.from_date) }}
          </template>

          <template #cell-to_date="{ item }">
            {{ formatDate(item.to_date) }}
          </template>

          <template #cell-duration_days="{ item }">
            {{ item.duration_days }} {{ t("leaveRequests.balance.days") }}
          </template>

          <template #cell-date="{ item }">
            {{ activeTab === "permission" ? formatDate(item.date) : "" }}
          </template>

          <template #cell-from_time="{ item }">
            {{ item.from_time }}
          </template>

          <template #cell-to_time="{ item }">
            {{ item.to_time }}
          </template>

          <template #cell-duration_formatted="{ item }">
            {{ item.duration_formatted }}
          </template>

          <template #cell-status="{ item }">
            <span
              class="px-2 py-0.5 rounded-full text-[14px] font-[500] flex items-center gap-1.5 w-max"
              :class="getStatusColor(item.status)"
            >
              <span class="w-2.5 h-2.5 rounded-full bg-current"></span>
              {{
                activeTab === "leave"
                  ? t("leaveRequests.status." + item.status)
                  : lang === "ar"
                    ? item.status_label
                    : item.status
              }}
            </span>
          </template>

          <template #cell-actions="{ item }">
            <div class="flex items-center gap-2">
              <button
                class="hover:opacity-75 transition-opacity cursor-pointer text-[#6C737F]"
                @click="openView(item)"
                v-tooltip="
                  t('common.actionTooltips.view.title', {
                    target:
                      activeTab === 'leave'
                        ? t('leaveRequests.entityName')
                        : t('permissionRequests.entityName'),
                  })
                "
              >
                <SvgIcon name="eye" />
              </button>

              <button
                v-if="
                  authStore.hasPermission(
                    activeTab === 'leave'
                      ? 'leave_request.update'
                      : 'permission_request.update',
                  )
                "
                class="transition-opacity text-[#6C737F]"
                :class="
                  !(
                    item.is_editable ||
                    item.status === 'approved' ||
                    item.status === 'pending'
                  ) || !isCurrentMonthCheck(item)
                    ? 'opacity-30 !cursor-not-allowed'
                    : 'hover:opacity-75 cursor-pointer'
                "
                @click="
                  (item.is_editable ||
                    item.status === 'approved' ||
                    item.status === 'pending') &&
                  isCurrentMonthCheck(item) &&
                  openEdit(item)
                "
                v-tooltip="
                  (item.is_editable ||
                    item.status === 'approved' ||
                    item.status === 'pending') &&
                  isCurrentMonthCheck(item)
                    ? t('common.actionTooltips.edit.title', {
                        target: t('leaveRequests.entityName'),
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
                  authStore.hasPermission(
                    activeTab === 'leave'
                      ? [
                          'leave_request.approve',
                          'leave_request.reject',
                          'leave_request.withdraw',
                        ]
                      : [
                          'permission_request.approve',
                          'permission_request.reject',
                          'permission_request.withdraw',
                        ],
                  )
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
                          v-if="item.status === 'pending' && scope !== 'own'"
                        >
                          <MenuItem
                            v-slot="{ active }"
                            v-if="
                              authStore.hasPermission(
                                activeTab === 'leave'
                                  ? 'leave_request.approve'
                                  : 'permission_request.approve',
                              )
                            "
                          >
                            <button
                              @click="handleApprove(item)"
                              class="group flex w-full items-center rounded-sm p-2 text-[14px] text-[#161616] hover:bg-gray-100 cursor-pointer transition-colors"
                            >
                              {{ t("leaveRequests.modals.approve") }}
                            </button>
                          </MenuItem>
                          <MenuItem
                            v-slot="{ active }"
                            v-if="
                              authStore.hasPermission(
                                activeTab === 'leave'
                                  ? 'leave_request.reject'
                                  : 'permission_request.reject',
                              )
                            "
                          >
                            <button
                              @click="handleReject(item)"
                              class="group flex w-full items-center rounded-sm p-2 text-[14px] text-[#161616] hover:bg-gray-100 cursor-pointer transition-colors"
                            >
                              {{ t("leaveRequests.modals.reject") }}
                            </button>
                          </MenuItem>
                        </template>

                        <MenuItem
                          v-if="
                            authStore.hasPermission(
                              activeTab === 'leave'
                                ? 'leave_request.withdraw'
                                : 'permission_request.withdraw',
                            ) &&
                            item.is_withdrawable &&
                            (item.status === 'approved' ||
                              item.status === 'pending') &&
                            isCurrentMonthCheck(item)
                          "
                          v-slot="{ active }"
                        >
                          <button
                            @click="handleWithdraw(item)"
                            class="group flex w-full items-center rounded-sm p-2 text-[14px] text-[#161616] hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            {{ t("leaveRequests.modals.withdraw") }}
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
                v-else-if="
                  authStore.hasPermission(
                    activeTab === 'leave'
                      ? 'leave_request.withdraw'
                      : 'permission_request.withdraw',
                  )
                "
                class="transition-opacity text-[#6C737F]"
                :class="
                  !(
                    item.is_withdrawable &&
                    (item.status === 'approved' || item.status === 'pending')
                  ) || !isCurrentMonthCheck(item)
                    ? 'opacity-30 !cursor-not-allowed'
                    : 'hover:opacity-75 cursor-pointer'
                "
                @click="
                  item.is_withdrawable &&
                  (item.status === 'approved' || item.status === 'pending') &&
                  isCurrentMonthCheck(item) &&
                  handleWithdraw(item)
                "
                v-tooltip="
                  item.is_withdrawable &&
                  (item.status === 'approved' || item.status === 'pending') &&
                  isCurrentMonthCheck(item)
                    ? t('common.actionTooltips.withdraw.title', {
                        target:
                          activeTab === 'leave'
                            ? t('leaveRequests.entityName')
                            : t('permissionRequests.entityName'),
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
    </div>

    <!-- Print-only Table -->
    <div class="print-only hidden" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              :colspan="tableHeaders.length - 1"
              class="!bg-transparent !border-none !p-0"
            >
              <PrintHeader
                :title="
                  activeTab === 'leave'
                    ? t('leaveRequests.tabs.leaves')
                    : t('leaveRequests.tabs.permissions')
                "
              />
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

            <template v-if="activeTab === 'leave'">
              <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
                {{
                  lang === "ar"
                    ? item.leave_type?.name_ar
                    : item.leave_type?.name
                }}
              </td>
              <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
                {{ formatDate(item.from_date) }}
              </td>
              <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
                {{ formatDate(item.to_date) }}
              </td>
              <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
                {{ item.duration_days }}
              </td>
            </template>

            <template v-else>
              <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
                {{ item.duration_formatted }}
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
            </template>

            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{
                activeTab === "leave"
                  ? t("leaveRequests.status." + item.status)
                  : lang === "ar"
                    ? item.status_label
                    : item.status
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
      <PrintFooter :total-pages="printTotalPages" />
    </div>

    <!-- Modals -->
    <LeaveRequestFormModal
      v-if="showFormModal && activeTab === 'leave'"
      :show="showFormModal"
      :request="selectedRequest"
      :leave-types="leaveTypes"
      :employees="employees"
      :scope="scope"
      :saving="saving"
      @close="showFormModal = false"
      @save="handleSave"
    />

    <PermissionRequestFormModal
      v-if="showFormModal && activeTab === 'permission'"
      :show="showFormModal"
      :request="selectedRequest"
      :employees="employees"
      :scope="scope"
      :saving="saving"
      @close="showFormModal = false"
      @save="handleSave"
    />

    <LeaveRequestDetailsModal
      v-if="showDetailsModal && activeTab === 'leave'"
      :show="showDetailsModal"
      :request="selectedRequest"
      :loading="loadingDetails"
      @close="showDetailsModal = false"
      @withdraw="handleWithdraw"
      @approve="handleApprove"
      @reject="handleReject"
    />

    <PermissionRequestDetailsModal
      v-if="showDetailsModal && activeTab === 'permission'"
      :show="showDetailsModal"
      :request="selectedRequest"
      :loading="loadingDetails"
      @close="showDetailsModal = false"
      @withdraw="handleWithdraw"
      @approve="handleApprove"
      @reject="handleReject"
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
