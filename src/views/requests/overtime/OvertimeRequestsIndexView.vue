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
import SelfieViewer from "@/components/common/SelfieViewer.vue";

import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { overtimeRequestsService } from "@/services/overtimeRequests";
import { useAuthStore } from "@/stores/auth";
import OvertimeRequestFormModal from "./OvertimeRequestFormModal.vue";
import OvertimeRequestDetailsModal from "./OvertimeRequestDetailsModal.vue";

import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";

import PrintHeader from "@/components/ui/PrintHeader.vue";
import PrintFooter from "@/components/ui/PrintFooter.vue";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();
const authStore = useAuthStore();

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
const employees = ref([]);

const isSelfieModalOpen = ref(false);
const selfieUrl = ref("");

const openSelfieModal = (url) => {
  selfieUrl.value = url;
  isSelfieModalOpen.value = true;
};

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
  { label: t("overtimeRequests.status.pending"), value: "pending" },
  { label: t("overtimeRequests.status.executed"), value: "executed" },
  { label: t("overtimeRequests.status.withdrawn"), value: "withdrawn" },
]);

const showFormModal = ref(false);
const showDetailsModal = ref(false);
const showWithdrawConfirm = ref(false);
const showCancelConfirm = ref(false);

const selectedRequest = ref(null);
const actionRequest = ref(null);

const requestLogs = ref([]);

const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

const loadInitialData = async () => {
  try {
    const res = await overtimeRequestsService.getEmployees();
    employees.value = res.data?.employees || [];
  } catch (error) {
    console.error(error);
  }
};

const loadRequests = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...filters.value,
    };

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }

    const response = await overtimeRequestsService.list(params);
    requests.value = response.data?.overtime_requests || [];
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
    const response = await overtimeRequestsService.get(request.id);
    selectedRequest.value = response.data?.overtime_request || request;
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
  showWithdrawConfirm.value = true;
};

const openCancel = (request) => {
  actionRequest.value = request;
  showCancelConfirm.value = true;
};

const handleSave = async (payload) => {
  saving.value = true;
  try {
    if (selectedRequest.value?.id) {
      await overtimeRequestsService.update(selectedRequest.value.id, payload);
      toast.success(t("overtimeRequests.messages.updated"));
    } else {
      await overtimeRequestsService.create(payload);
      toast.success(t("overtimeRequests.messages.created"));
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
    await overtimeRequestsService.withdraw(actionRequest.value.id);
    toast.success(t("overtimeRequests.messages.withdrawn"));
    showWithdrawConfirm.value = false;
    loadRequests();
  } catch (e) {
    console.error(e);
    toast.error(e);
  }
};

const confirmCancel = async () => {
  if (!actionRequest.value) return;

  try {
    await overtimeRequestsService.cancel(actionRequest.value.id);
    toast.success(t("overtimeRequests.messages.canceled"));
    showCancelConfirm.value = false;
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
    };

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }

    const response = await overtimeRequestsService.list(params);
    const data = response.data?.overtime_requests || [];

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
    [t("overtimeRequests.fields.employeeName")]: item.employee?.name,
    [t("overtimeRequests.fields.createdBy")]: item.requested_by?.name,
    [t("overtimeRequests.fields.overtimeDate")]: item.date,
    [t("overtimeRequests.fields.overtimeCheckIn")]:
      item.check_in_time || "--:--",
    [t("overtimeRequests.fields.duration")]: item.duration || "--:--",
    [t("overtimeRequests.fields.status")]: t(
      "overtimeRequests.status." + item.status,
    ),
  }));

  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Overtime Requests");
  XLSX.writeFile(wb, `overtime_requests_export_${new Date().getTime()}.xlsx`);
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
    const title = t("overtimeRequests.title");

    let headers = [
      "#",
      t("overtimeRequests.fields.employeeName"),
      t("overtimeRequests.fields.createdBy"),
      t("overtimeRequests.fields.overtimeDate"),
      t("overtimeRequests.fields.overtimeCheckIn"),
      t("overtimeRequests.fields.duration"),
      t("overtimeRequests.fields.status"),
    ];

    let rows = data.map((item, index) => [
      index + 1,
      item.employee?.name,
      item.requested_by?.name,
      item.date,
      item.check_in_time || "--:--",
      formatMinutes(item?.overtime_minutes) || "--:--",
      t("overtimeRequests.status." + item.status),
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

    doc.save(`overtime_requests_export_${new Date().getTime()}.pdf`);
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
    };

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }

    const response = await overtimeRequestsService.list(params);
    const printData = response.data?.overtime_requests || [];

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
    const title = t("overtimeRequests.title");

    let headers = [
      "#",
      t("overtimeRequests.fields.employeeName"),
      t("overtimeRequests.fields.createdBy"),
      t("overtimeRequests.fields.overtimeDate"),
      t("overtimeRequests.fields.overtimeCheckIn"),
      t("overtimeRequests.fields.duration"),
      t("overtimeRequests.fields.status"),
    ];

    let rows = printData.map((item, index) => [
      index + 1,
      item.employee?.name,
      item.requested_by?.name,
      item.date,
      item.check_in_time || "--:--",
      formatMinutes(item?.overtime_minutes) || "--:--",
      t("overtimeRequests.status." + item.status),
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
        // DATE RANGE (NEW)
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
    // PRINT (same style as your employee version)
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
//     };

//     if (!filters.value.employee_id) {
//       delete params.employee_id;
//     }

//     const response = await overtimeRequestsService.list(params);
//     printRequests.value = response.data?.overtime_requests || [];

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
  { key: "index", label: "#" },
  {
    key: "employee",
    label: t("overtimeRequests.fields.employeeName"),
    sortable: true,
  },
  {
    key: "requested_by",
    label: t("overtimeRequests.fields.createdBy"),
    sortable: true,
  },
  {
    key: "date",
    label: t("overtimeRequests.fields.overtimeDate"),
    sortable: true,
  },
  {
    key: "check_in",
    label: t("overtimeRequests.fields.overtimeCheckIn"),
    sortable: true,
  },
  {
    key: "duration",
    label: t("overtimeRequests.fields.duration"),
    sortable: true,
  },
  { key: "status", label: t("overtimeRequests.fields.status"), sortable: true },
  {
    key: "actions",
    label: t("overtimeRequests.fields.actions"),
    cellClass: "w-24",
  },
]);

const getStatusColor = (status) => {
  switch (status) {
    case "executed":
    case "منفذ":
      return "text-[#085D3A] bg-[#ECFDF3]";
    case "pending":
    case "غير منفذ":
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

const formatMinutes = (minutes) => {
  if (!minutes) return "00:00";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${remainingMinutes.toString().padStart(2, "0")}`;
};
</script>

<template>
  <section class="space-y-6">
    <header class="flex items-center justify-between no-print">
      <h1 class="text-[20px] font-[600] text-[#000000]">
        {{ t("overtimeRequests.title") }}
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
          v-if="authStore.hasPermission('overtime_request.export')"
        >
          <MenuButton as="template">
            <Button
              class="bg-[#E7EFED] border border-[#0E5F4A] !px-2 !py-2 hover:!bg-[#DDE6E4] transition-colors duration-300 !text-[#0E5F4A]"
              size="md"
            >
              <SvgIcon name="export" />
              <span class="ms-1 me-2">{{ t("overtimeRequests.export") }}</span>
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
              'overtime_request.create',
              'overtime_request.store',
            ])
          "
        >
          {{ t("overtimeRequests.addRequest") }}
        </Button>
      </div>
    </header>

    <!-- Filters Card -->
    <Card class="no-print">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("overtimeRequests.searchTitle") }}
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <DateRangePicker
          v-model:startDate="filters.date_from"
          v-model:endDate="filters.date_to"
          :label="t('overtimeRequests.placeholders.date')"
          :placeholder="t('overtimeRequests.placeholders.selectDateRange')"
          size="md"
        />

        <Select
          v-if="!authStore.isEmployee"
          v-model="filters.employee_id"
          :options="employeesOptions"
          :label="t('overtimeRequests.fields.employeeName')"
          :placeholder="t('overtimeRequests.placeholders.searchEmployee')"
          size="md"
          filterable
        />

        <Select
          v-model="filters.status"
          :options="statusOptions"
          :label="t('overtimeRequests.fields.status')"
          :placeholder="t('overtimeRequests.placeholders.status')"
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
      <Card class="print:!border-none print:!shadow-none">
        <template #header>
          <h2 class="text-[16px] font-[600] text-[#333333] no-print">
            {{ t("overtimeRequests.listTitle") }}
          </h2>
        </template>

        <Table
          :loading="loading"
          :items="requests"
          :headers="tableHeaders"
          :page="page"
          :total-pages="totalPages"
          :loading-text="t('common.loading')"
          :empty-text="t('overtimeRequests.empty')"
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

          <template #cell-requested_by="{ item }">
            <span>{{ item.requested_by?.name }}</span>
          </template>

          <template #cell-date="{ item }">
            {{ item.date }}
          </template>

          <template #cell-check_in="{ item }">
            <div class="flex items-center gap-2">
              <span v-if="item.check_in_time" class="flex items-center gap-1">
                {{ formatTime12(item.check_in_time) }}
                <div
                  v-if="item.check_in_location"
                  v-tooltip="
                    lang === 'ar'
                      ? item.check_in_location?.name_ar ||
                        item.check_in_location?.name
                      : item.check_in_location?.name ||
                        item.check_in_location?.name_ar
                  "
                >
                  <SvgIcon name="location" />
                </div>
              </span>
              <span v-else>--:--</span>
              <img
                v-if="item.check_in_selfie"
                :src="item.check_in_selfie"
                class="w-6 h-6 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                v-tooltip="item.employee?.name"
                @click="openSelfieModal(item.check_in_selfie)"
              />
            </div>
          </template>

          <template #cell-duration="{ item }">
            {{ formatMinutes(item?.overtime_minutes) || "--:--" }}
          </template>

          <template #cell-status="{ item }">
            <span
              class="px-2 py-0.5 rounded-full text-[14px] font-[500] flex items-center gap-1.5 w-max"
              :class="getStatusColor(item.status)"
            >
              <span class="w-2.5 h-2.5 rounded-full bg-current"></span>
              {{ t("overtimeRequests.status." + item.status) }}
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
                    target: t('overtimeRequests.entityName'),
                  }),
                  content: t('common.actionTooltips.view.content', {
                    target: t('overtimeRequests.entityName'),
                    name: item.employee?.name,
                  }),
                }"
              >
                <SvgIcon name="eye" />
              </button>

              <!-- Edit Button -->
              <button
                v-if="authStore.hasPermission('overtime_request.update')"
                class="transition-opacity text-[#6C737F]"
                :class="
                  item.status !== 'pending' || isPreviousMonth(item.date)
                    ? 'opacity-30 !cursor-not-allowed'
                    : 'hover:opacity-75 cursor-pointer'
                "
                @click="
                  item.status === 'pending' &&
                  !isPreviousMonth(item.date) &&
                  openEdit(item)
                "
                v-tooltip="
                  item.status === 'pending' && !isPreviousMonth(item.date)
                    ? {
                        title: t('common.actionTooltips.edit.title', {
                          target: t('overtimeRequests.entityName'),
                        }),
                        content: t('common.actionTooltips.edit.content', {
                          target: t('overtimeRequests.entityName'),
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
                v-if="authStore.hasPermission('overtime_request.withdraw')"
                class="transition-opacity text-red-500"
                :class="
                  item.status !== 'pending' || isPreviousMonth(item.date)
                    ? 'opacity-30 !cursor-not-allowed'
                    : 'hover:opacity-75 cursor-pointer'
                "
                @click="
                  item.status === 'pending' &&
                  !isPreviousMonth(item.date) &&
                  openWithdraw(item)
                "
                v-tooltip="
                  item.status === 'pending' && !isPreviousMonth(item.date)
                    ? {
                        title: t('overtimeRequests.modals.withdrawTitle'),
                        content: t('overtimeRequests.modals.withdrawMessage'),
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

    <div class="print-only hidden" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              :colspan="tableHeaders.length - 1"
              class="!bg-transparent !border-none !p-0"
            >
              <PrintHeader :title="t('overtimeRequests.title')" />
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
              {{ item.requested_by?.name }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ item.date }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              <div class="flex items-center gap-1">
                {{ formatTime12(item.check_in_time) || "--:--" }}
                <span
                  v-if="item.check_in_location"
                  class="text-[10px] text-gray-500"
                >
                  ({{
                    lang === "ar"
                      ? item.check_in_location?.name_ar ||
                        item.check_in_location?.name
                      : item.check_in_location?.name ||
                        item.check_in_location?.name_ar
                  }})
                </span>
              </div>
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ formatMinutes(item?.overtime_minutes) || "--:--" }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ t("overtimeRequests.status." + item.status) }}
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

    <OvertimeRequestFormModal
      v-model="showFormModal"
      :request="selectedRequest"
      :loading="saving"
      :scope="scope"
      @save="handleSave"
    />

    <OvertimeRequestDetailsModal
      v-model="showDetailsModal"
      :request="selectedRequest"
      :logs="requestLogs"
      :loading="loadingDetails"
      @withdraw="openWithdraw"
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
          {{ t("overtimeRequests.modals.withdrawTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("overtimeRequests.modals.withdrawMessage") }}
        </p>
      </div>
      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button
            class="w-full bg-[#FEF3F2] !text-[#B42318] border-none hover:bg-[#FDE4E2]"
            size="md"
            @click="confirmWithdraw"
          >
            تأكيد
          </Button>
          <Button
            variant="ghost"
            class="w-full"
            size="md"
            @click="showWithdrawConfirm = false"
          >
            {{ t("common.cancel") }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Cancel Confirm Modal -->
    <Modal
      v-model="showCancelConfirm"
      width="md"
      icon="error"
      border-color="#e76d62"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("overtimeRequests.modals.cancelTitle") }}
        </h3>
      </div>
      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button
            class="w-full bg-[#FEF3F2] !text-[#B42318] border-none hover:bg-[#FDE4E2]"
            size="md"
            @click="confirmCancel"
          >
            تأكيد
          </Button>
          <Button
            variant="ghost"
            class="w-full"
            size="md"
            @click="showCancelConfirm = false"
          >
            {{ t("common.cancel") }}
          </Button>
        </div>
      </template>
    </Modal>
    <!-- Selfie Viewer -->
    <SelfieViewer
      v-model="isSelfieModalOpen"
      :image-url="selfieUrl"
      :title="t('dailyAttendance.fields.selfie')"
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
