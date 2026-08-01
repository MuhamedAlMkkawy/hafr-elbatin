<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";
import { useAuthStore } from "@/stores/auth";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Table from "@/components/ui/Table.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import attendanceReportsService from "@/services/attendanceReports";
import DateRangePicker from "@/components/ui/DateRangePicker.vue";

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

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const formatDisplayDate = (dateStr) => {
  if (!dateStr || dateStr === "---") return "---";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);
  return `${mm}/${d}/20${y}`;
};

const formatToApiDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr.includes("T")) return dateStr.split("T")[0];
  if (dateStr.includes("/")) {
    let [m, d, y] = dateStr.split("/");
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return dateStr;
};

const isEmployee = computed(() => {
  return authStore.user?.roles?.some(
    (role) => role.toLowerCase() === "employee",
  );
});

// State
const report = ref(null);
const details = ref([]);
const loading = ref(false);
const printDetails = ref([]);
const printTotalPages = ref(1);
const sendingNotification = ref({});
const isFirstLoad = ref(true);

// Pagination
const page = ref(1);
const perPage = ref(10);
const total = ref(0);

// Filters
const filters = ref({
  search: "",
  from_date: "",
  to_date: "",
});

const reportId = route.params.id;

const localizedMonthName = computed(() => {
  if (!report.value?.from_date) return report.value?.month_name || "";
  const date = new Date(report.value.from_date);
  if (isNaN(date.getTime())) return report.value.month_name || "";
  return date.toLocaleDateString(locale.value === "ar" ? "ar-EG" : "en-US", {
    month: "long",
  });
});

const localizedReportTitle = computed(() => {
  if (!report.value) return "";
  const month = localizedMonthName.value;
  const year =
    report.value.year || new Date(report.value.from_date).getFullYear();
  return locale.value === "ar"
    ? `تقرير شهر ${month} ${year}`
    : `${month} ${year} Report`;
});

const breadcrumbItems = computed(() => [
  { label: t("sidebar.reports"), to: "/reports/absence" },
  { label: t("sidebar.reportsAbsence"), to: "/reports/absence" },
  { label: localizedReportTitle.value || t("common.details") },
]);

const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

const loadReportDetails = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...filters.value,
    };

    if (params.from_date) params.from_date = formatToApiDate(params.from_date);
    if (params.to_date) params.to_date = formatToApiDate(params.to_date);

    const response = await attendanceReportsService.getReportDetails(
      reportId,
      params,
    );
    const data = response.data?.data || response.data || response;

    report.value = data.report || null;

    if (isFirstLoad.value && report.value) {
      isFirstLoad.value = false;
    }

    details.value = data.details || [];
    total.value = data.pagination?.total || details.value.length;
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  page.value = 1;
  loadReportDetails();
};

const resetFilters = () => {
  filters.value = {
    search: "",
    from_date: "",
    to_date: "",
  };
  applyFilters();
};

const changePage = (newPage) => {
  page.value = newPage;
  loadReportDetails();
};

const sendNotification = async (detailId) => {
  sendingNotification.value[detailId] = true;
  try {
    await attendanceReportsService.sendNotification(detailId);
    toast.success(t("common.success"));
    loadReportDetails();
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  } finally {
    sendingNotification.value[detailId] = false;
  }
};

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "employee.name", label: t("reportsData.employee_name") },
  { key: "from_date", label: t("reportsData.from_date") },
  { key: "to_date", label: t("reportsData.to_date") },
  {
    key: "attendance_days",
    label: t("reportsData.attendance_days"),
    headerClass: "min-w-[130px]",
    cellClass: "min-w-[130px]",
  },
  {
    key: "no_checkout_days",
    label: t("reportsData.no_checkout_days"),
    headerClass: "min-w-[130px]",
    cellClass: "min-w-[130px]",
  },
  {
    key: "deduction_minutes",
    label: t("reportsData.deduction_minutes"),
    headerClass: "min-w-[130px]",
    cellClass: "min-w-[130px]",
  },
  {
    key: "absence_days",
    label: t("reportsData.absence_days"),
    headerClass: "min-w-[130px]",
    cellClass: "min-w-[130px]",
  },
  {
    key: "leave_days",
    label: t("reportsData.leave_days"),
    headerClass: "min-w-[130px]",
    cellClass: "min-w-[130px]",
  },
  {
    key: "official_holidays",
    label: t("reportsData.official_holidays"),
    headerClass: "min-w-[130px]",
    cellClass: "min-w-[130px]",
  },
  {
    key: "external_missions",
    label: t("reportsData.external_missions"),
    headerClass: "min-w-[130px]",
    cellClass: "min-w-[130px]",
  },
  {
    key: "delay_minutes_without_permission",
    label: t("reportsData.delay_minutes_without_permission"),
    headerClass: "min-w-[130px]",
    cellClass: "min-w-[130px]",
  },
  {
    key: "delay_minutes_with_permission",
    label: t("reportsData.delay_minutes_with_permission"),
    headerClass: "min-w-[130px]",
    cellClass: "min-w-[130px]",
  },
  {
    key: "total_delay_minutes",
    label: t("reportsData.total_delay_minutes"),
    headerClass: "min-w-[130px]",
    cellClass: "min-w-[130px]",
  },
  { key: "notification_status", label: t("reportsData.notification_status") },
]);

const handleExport = async (format = "excel") => {
  try {
    const params = { paginate: false, ...filters.value };
    if (params.from_date) params.from_date = formatToApiDate(params.from_date);
    if (params.to_date) params.to_date = formatToApiDate(params.to_date);

    const response = await attendanceReportsService.getReportDetails(
      reportId,
      params,
    );
    const data =
      response.data?.details ||
      response.data?.data?.details ||
      response.data ||
      [];

    if (format === "excel") exportToExcel(data);
    else if (format === "pdf") await exportToPDF(data);
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  }
};

const dateRangeText = computed(() => {
  const from = filters.value.from_date
    ? formatDisplayDate(filters.value.from_date)
    : null;

  const to = filters.value.to_date
    ? formatDisplayDate(filters.value.to_date)
    : null;

  if (!from && !to) return "";

  if (locale.value === "ar") {
    return `التاريخ: من ${from || "---"} إلى ${to || "---"}`;
  }

  return `Date: from ${from || "---"} to ${to || "---"}`;
});

const exportToPDF = async (data) => {
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
    const totalPagesExp = "{total_pages}";
    const title = localizedReportTitle.value;

    let heads = tableHeaders.value
      .filter((h) => h.key !== "actions")
      .map((h) => h.label);
    let rows = data.map((item, index) => [
      index + 1,
      item.employee?.name,
      formatDisplayDate(item.from_date),
      formatDisplayDate(item.to_date),
      item.attendance_days,
      item.no_checkout_days,
      item.deduction_minutes,
      item.absence_days,
      item.leave_days,
      item.official_holidays,
      item.external_missions,
      item.delay_minutes_without_permission,
      item.delay_minutes_with_permission,
      item.total_delay_minutes,
      item.notification_status_label ||
        getStatusLabel(item.notification_status),
    ]);

    if (isArabic) {
      heads = [...heads].reverse();
      rows = rows.map((r) => [...r].reverse());
    }

    autoTable(doc, {
      startY: 70,
      head: [heads],
      body: rows,
      styles: {
        font: "IBMPlexSansArabic",
        halign: isArabic ? "right" : "left",
        fontSize: 5,
        fontStyle: "normal",
        cellPadding: 0.8,
        lineHeight: 1.1,
        overflow: "linebreak",
      },
      headStyles: {
        font: "IBMPlexSansArabic",
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        lineHeight: 1.1,
      },
      columnStyles: isArabic
        ? {
            14: { cellWidth: 8 }, // #
            13: { cellWidth: 20 }, // Employee Name
          }
        : {
            0: { cellWidth: 8 }, // #
            1: { cellWidth: 20 }, // Employee Name
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
        doc.text(fullTitle, isArabic ? pageWidth - margin : margin, 47, {
          align: isArabic ? "right" : "left",
        });

        if (dateRangeText.value) {
          doc.setFontSize(9);
          doc.setFont("IBMPlexSansArabic", "normal");

          doc.text(dateRangeText.value, isArabic ? pageWidth - 15 : 15, 47, {
            align: isArabic ? "right" : "left",
          });
        }
        doc.setFont("IBMPlexSansArabic", "normal");
      },
      margin: { top: 50, bottom: 30 },
    });

    // Draw Footer (Like EmployeesIndexView.vue)
    const totalPagesHead = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPagesHead; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPagesHead, isArabic);
    }

    doc.save(
      `absence_details_${localizedReportTitle.value || reportId}_${new Date().getTime()}.pdf`,
    );
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
    const params = { paginate: false, ...filters.value };

    if (params.from_date) params.from_date = formatToApiDate(params.from_date);
    if (params.to_date) params.to_date = formatToApiDate(params.to_date);

    const response = await attendanceReportsService.getReportDetails(
      reportId,
      params,
    );

    const data = response.data?.data || response.data || response;
    const rows = data.details || [];

    const doc = new jsPDF({
      orientation: "l",
      unit: "mm",
      format: "a4",
    });

    const isArabic = locale.value === "ar";

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
    // DATE RANGE
    // =========================
    let dateRangeText = "";
    if (filters.value.from_date || filters.value.to_date) {
      const from = filters.value.from_date
        ? formatDisplayDate(filters.value.from_date)
        : "...";
      const to = filters.value.to_date
        ? formatDisplayDate(filters.value.to_date)
        : "...";

      dateRangeText = isArabic
        ? `التاريخ: من ${from} إلى ${to}`
        : `Date: From ${from} to ${to}`;
    }

    // =========================
    // HEADERS
    // =========================
    let headers = [
      "#",
      t("reportsData.employee_name"),
      t("reportsData.from_date"),
      t("reportsData.to_date"),
      t("reportsData.attendance_days"),
      t("reportsData.no_checkout_days"),
      t("reportsData.deduction_minutes"),
      t("reportsData.absence_days"),
      t("reportsData.leave_days"),
      t("reportsData.official_holidays"),
      t("reportsData.external_missions"),
      t("reportsData.delay_minutes_without_permission"),
      t("reportsData.delay_minutes_with_permission"),
      t("reportsData.total_delay_minutes"),
      t("reportsData.notification_status"),
    ];

    // =========================
    // BODY
    // =========================
    let body = rows.map((item, index) => [
      index + 1,
      item.employee?.name,
      formatDisplayDate(item.from_date),
      formatDisplayDate(item.to_date),
      item.attendance_days,
      item.no_checkout_days,
      item.deduction_minutes,
      item.absence_days,
      item.leave_days,
      item.official_holidays,
      item.external_missions,
      item.delay_minutes_without_permission,
      item.delay_minutes_with_permission,
      item.total_delay_minutes,
      item.notification_status_label ||
        getStatusLabel(item.notification_status),
    ]);

    if (isArabic) {
      headers = [...headers].reverse();
      body = body.map((r) => [...r].reverse());
    }

    autoTable(doc, {
      head: [headers],
      body,
      startY: 65,

      styles: {
        font: "IBMPlexSansArabic",
        fontSize: 8,
        halign: isArabic ? "right" : "left",
      },

      headStyles: {
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },

      didDrawPage: () => {
        const pageWidth = doc.internal.pageSize.width;
        const margin = 15;

        drawPdfHeader(doc, authStore, isArabic);

        // Base Y position under header
        const titleY = 42;
        const dateY = 48;

        // =========================
        // TITLE
        // =========================
        doc.setFontSize(11);
        doc.setFont("IBMPlexSansArabic", "bold");

        const fullTitle = isArabic
          ? `تقرير: ${t("sidebar.reportsAbsence")}`
          : `Report: ${t("sidebar.reportsAbsence")}`;

        doc.text(fullTitle, isArabic ? pageWidth - margin : margin, titleY, {
          align: isArabic ? "right" : "left",
        });

        // =========================
        // DATE RANGE (BELOW TITLE)
        // =========================
        if (dateRangeText) {
          doc.setFontSize(9);
          doc.setFont("IBMPlexSansArabic", "normal");

          doc.text(
            dateRangeText,
            isArabic ? pageWidth - margin : margin,
            dateY,
            {
              align: isArabic ? "right" : "left",
            },
          );
        }

        // reset font for table
        doc.setFont("IBMPlexSansArabic", "normal");
      },
      margin: { top: 60, bottom: 30 },
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPages, isArabic, true);
    }

    // =========================
    // SAME PAGE PRINT (IMPORTANT FIX)
    // =========================
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);

    let iframe = document.getElementById("pdf-print-frame");

    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "pdf-print-frame";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
    }

    iframe.src = url;

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

const shouldNotify = (item) => {
  return (
    item.absence_days >= 1 ||
    item.no_checkout_days >= 1 ||
    item.delay_minutes_without_permission > 0
  );
};

const goBack = () => router.back();

const viewLogs = (item) => {
  const prefix = locale.value === "en" ? "/en" : "";
  router.push({
    path: `${prefix}/reports/absence/details/logs`,
    query: {
      employee_id: item.employee_id,
      employee_name: item.employee?.name,
      from_date: item.from_date,
      to_date: item.to_date,
    },
  });
};

onMounted(() => loadReportDetails());
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
          {{ t("sidebar.reportsAbsence") }} - {{ localizedReportTitle }}
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
      <div class="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <Input
          v-if="!isEmployee"
          v-model="filters.search"
          :label="t('employees.fields.employeeName')"
          :placeholder="t('employees.fields.employeeName')"
        >
          <template #suffix><SvgIcon name="search" /></template>
        </Input>
        <DateRangePicker
          v-model:startDate="filters.from_date"
          v-model:endDate="filters.to_date"
          :label="t('common.date')"
          size="md"
          :minDate="
            report?.from_date ? formatDisplayDate(report.from_date) : ''
          "
          :maxDate="report?.to_date ? formatDisplayDate(report.to_date) : ''"
          :defaultViewDate="
            report?.from_date ? formatDisplayDate(report.from_date) : ''
          "
        />
      </div>
      <div class="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="md"
          @click="resetFilters"
          class="md:w-26"
          >{{ t("roles.resetFilters") }}</Button
        >
        <Button
          variant="primary"
          size="md"
          @click="applyFilters"
          :loading="loading"
          class="md:w-26"
        >
          <template #prefix><SvgIcon name="search" v-if="!loading" /></template>
          {{ t("common.search") }}
        </Button>
      </div>
    </Card>

    <Card class="no-print">
      <template #header>
        <div class="flex items-center gap-4">
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("sidebar.reportsAbsence") }}
          </h2>
          <span
            v-if="report"
            class="text-[14px] font-[400] text-[#0E5F4A] bg-[#E7EFED] border border-[#0E5F4A] px-2 py-1 rounded-full"
          >
            {{ localizedMonthName }} {{ report.year }}
          </span>
        </div>
      </template>
      <Table
        :loading="loading"
        :items="details"
        :headers="tableHeaders"
        :page="page"
        :total-pages="totalPages"
        @change-page="changePage"
        class="report-table"
      >
        <template #cell-index="{ index }">{{
          (page - 1) * perPage + index + 1
        }}</template>
        <template #cell-from_date="{ item }">
          {{ formatDisplayDate(item.from_date) }}
        </template>
        <template #cell-to_date="{ item }">
          {{ formatDisplayDate(item.to_date) }}
        </template>
        <template #cell-notification_status="{ item }">
          <span class="text-sm font-medium text-[#4B5563]">
            {{
              item.notification_status_label ||
              getStatusLabel(item.notification_status)
            }}
          </span>
        </template>
      </Table>
    </Card>

    <!-- Print only -->
    <div class="print-only" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              :colspan="tableHeaders.length - 1"
              class="!bg-transparent !border-none !p-0"
            >
              <div class="print-header-wrapper pb-6">
                <PrintHeader :title="localizedReportTitle" />
              </div>
            </th>
          </tr>
          <tr class="bg-[#0E5F4A] text-white">
            <th
              v-for="h in tableHeaders.filter((h) => h.key !== 'actions')"
              :key="h.key"
              class="border border-[#D2D6DB] px-0.5 py-1 text-[5px] font-bold text-center"
              :style="{
                width:
                  h.key === 'index'
                    ? '3%'
                    : h.key === 'employee.name'
                      ? '20%'
                      : h.key === 'from_date' || h.key === 'to_date'
                        ? '8%'
                        : '5.2%',
              }"
            >
              {{ h.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in printDetails" :key="index">
            <template
              v-for="h in tableHeaders.filter((h) => h.key !== 'actions')"
              :key="h.key"
            >
              <td
                class="border border-[#D2D6DB] px-0.5 py-1 text-[5px] text-center"
              >
                <template v-if="h.key === 'index'">{{ index + 1 }}</template>
                <template v-else-if="h.key === 'employee.name'">{{
                  item.employee?.name
                }}</template>
                <template
                  v-else-if="['from_date', 'to_date'].includes(h.key)"
                  >{{ formatDisplayDate(item[h.key]) }}</template
                >
                <template v-else-if="h.key === 'notification_status'">{{
                  item.notification_status_label ||
                  getStatusLabel(item.notification_status)
                }}</template>
                <template v-else>{{ item[h.key] }}</template>
              </td>
            </template>
          </tr>
        </tbody>
        <tfoot>
          <tr class="footer-spacer-row">
            <td
              :colspan="tableHeaders.filter((h) => h.key !== 'actions').length"
              class="!border-none !p-0"
            >
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
  @page {
    margin: 5mm;
    size: portrait;
  }
  .no-print {
    display: none !important;
  }
  .print-only {
    display: block !important;
    padding: 0 !important;
    width: 100% !important;
  }

  /* Force table layout to fixed to prevent overflow */
  table {
    table-layout: fixed !important;
    width: 100% !important;
    border-collapse: collapse !important;
  }

  tr,
  td,
  th {
    page-break-inside: avoid !important;
    word-break: normal !important;
    overflow-wrap: break-word !important;
  }

  th,
  td {
    font-size: 5px !important;
    padding: 2px 0.5px !important;
    border: 1px solid #d2d6db !important;
    text-align: center !important;
  }

  .header-spacer-row {
    counter-increment: page;
  }

  :deep(.min-h-screen),
  main {
    min-height: auto !important;
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* Ensure thead/tfoot repeat correctly */
  thead {
    display: table-header-group;
  }

  tfoot {
    display: table-footer-group;
  }

  tr {
    page-break-inside: avoid;
    page-break-after: auto;
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

/* Hide print-only table on screen */
@media screen {
  .print-only {
    display: none !important;
  }
}
</style>

<style>
@media print {
  /* Global resets for print - MUST be non-scoped */
  html,
  body,
  #app,
  main,
  .p-4,
  .p-6,
  .flex-1 {
    overflow: visible !important;
    display: block !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    float: none !important;
  }

  /* Ensure the page counter starts at 0 so the first page is 1 */
  html,
  body {
    counter-reset: page 0;
  }
}
</style>
