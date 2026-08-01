<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Table from "@/components/ui/Table.vue";
import Select from "@/components/ui/Select.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import DateRangePicker from "@/components/ui/DateRangePicker.vue";
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
const lang = computed(() => locale.value);
const toast = useAppToast();
const router = useRouter();

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

// State
const reports = ref([]);
const loading = ref(false);
const generating = ref(false);
const exportLoading = ref(false);
const selectedIds = ref([]);
const printData = ref([]);
const printing = ref(false);
const printTotalPages = ref(1);

const groupedPrintData = computed(() => {
  return printData.value.reduce((acc, item) => {
    const title = item.report_title || t("sidebar.reportsAbsence");
    if (!acc[title]) acc[title] = [];
    acc[title].push(item);
    return acc;
  }, {});
});

// Pagination
const page = ref(1);
const perPage = ref(10);
const total = ref(0);

// Filters strictly as per user's latest request
const filters = ref({
  employee_id: "",
  department_id: "",
  from_date: "",
  to_date: "",
  year: "",

  // add this
  sort_by: "",
  sort_direction: "asc",
});

const searchTitle = ref("");

const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 20; i--) {
    years.push({ label: i.toString(), value: String(i) });
  }
  return years;
});

const loadReports = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      search: searchTitle.value,
      ...filters.value,
    };

    // Format dates to YYYY-MM-DD for the API
    if (params.from_date) params.from_date = formatToApiDate(params.from_date);
    if (params.to_date) params.to_date = formatToApiDate(params.to_date);

    const response = await attendanceReportsService.listReports(params);
    const data = response.data?.data || response.data || response;

    reports.value = data.reports || [];
    total.value = data.pagination?.total || reports.value.length;
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  page.value = 1;
  loadReports();
};

// handle sorting
const handleSort = (key) => {
  const sortFieldMap = {
    title: "title",
    year: "year",
    from_date: "from_date",
    to_date: "to_date",
  };

  const apiKey = sortFieldMap[key] || key;

  if (filters.value.sort_by === apiKey) {
    filters.value.sort_direction =
      filters.value.sort_direction === "asc" ? "desc" : "asc";
  } else {
    filters.value.sort_by = apiKey;
    filters.value.sort_direction = "asc";
  }

  applyFilters();
};

const resetFilters = () => {
  filters.value = {
    employee_id: "",
    department_id: "",
    from_date: "",
    to_date: "",
    year: "",
  };
  searchTitle.value = "";
  applyFilters();
};

const changePage = (newPage) => {
  page.value = newPage;
  loadReports();
};

const viewDetails = (reportId) => {
  const prefix = locale.value === "en" ? "/en" : "";
  router.push(`${prefix}/reports/absence/${reportId}`);
};

const generateNewReport = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  generating.value = true;
  try {
    await attendanceReportsService.generateReport(year, month);
    toast.success(t("common.success"));
    loadReports();
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  } finally {
    generating.value = false;
  }
};

const tableHeaders = computed(() => [
  { key: "selection", label: "", cellClass: "w-10 no-print" },
  {
    key: "title",
    label: t("reportsData.report_title"),
    cellClass: "text-start",
  },
  { key: "year", label: t("reportsData.year") },
  { key: "from_date", label: t("reportsData.from_date") },
  { key: "to_date", label: t("reportsData.to_date") },
  {
    key: "actions",
    label: t("branches.fields.actions"),
    cellClass: "w-10 no-print",
  },
]);

const selectAll = computed({
  get: () =>
    reports.value.length > 0 &&
    selectedIds.value.length === reports.value.length,
  set: (val) => {
    if (val) {
      selectedIds.value = reports.value.map((r) => r.id);
    } else {
      selectedIds.value = [];
    }
  },
});

const toggleSelect = (id) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
};

const handleExport = async (format = "excel") => {
  exportLoading.value = true;
  try {
    const targets =
      selectedIds.value.length > 0
        ? reports.value.filter((r) => selectedIds.value.includes(r.id))
        : reports.value;

    if (targets.length === 0) {
      toast.warning(t("common.no_data"));
      return;
    }

    let allData = [];
    for (const report of targets) {
      const params = { paginate: false };
      const response = await attendanceReportsService.getReportDetails(
        report.id,
        params,
      );
      const data = response.data?.details || response.data?.data?.details || [];
      const dataWithTitle = data.map((item) => ({
        ...item,
        report_title: report.title,
      }));
      allData = [...allData, ...dataWithTitle];
    }

    if (format === "excel") exportToExcel(allData);
    else if (format === "pdf") await exportToPDF(allData);
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  } finally {
    exportLoading.value = false;
  }
};

const getStatusLabel = (status) => {
  if (status === "sent") return t("reportsData.notification_sent");
  if (status === "not_sent") return t("reportsData.notification_not_sent");
  return status;
};

const exportToExcel = (data) => {
  const flattened = data.map((item, index) => ({
    "#": index + 1,
    [t("reportsData.employee_name")]: item.employee?.name,
    [t("reportsData.report_title")]: item.report_title,
    [t("reportsData.from_date")]: formatDisplayDate(item.from_date),
    [t("reportsData.to_date")]: formatDisplayDate(item.to_date),
    [t("reportsData.attendance_days")]: item.attendance_days,
    [t("reportsData.no_checkout_days")]: item.no_checkout_days,
    [t("reportsData.deduction_minutes")]: item.deduction_minutes,
    [t("reportsData.absence_days")]: item.absence_days,
    [t("reportsData.leave_days")]: item.leave_days,
    [t("reportsData.official_holidays")]: item.official_holidays,
    [t("reportsData.external_missions")]: item.external_missions,
    [t("reportsData.delay_minutes_without_permission")]:
      item.delay_minutes_without_permission,
    [t("reportsData.delay_minutes_with_permission")]:
      item.delay_minutes_with_permission,
    [t("reportsData.total_delay_minutes")]: item.total_delay_minutes,
    [t("reportsData.notification_status")]:
      item.notification_status_label ||
      getStatusLabel(item.notification_status),
  }));
  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Absence Summary");
  XLSX.writeFile(wb, `absence_summary_${new Date().getTime()}.xlsx`);
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

const exportToPDF = async () => {
  try {
    const doc = new jsPDF({ orientation: "l", unit: "mm", format: "a4" });
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
    // HEADERS (same as table)
    // =========================
    let headers = [
      "#",
      t("reportsData.report_title"),
      t("reportsData.year"),
      t("reportsData.from_date"),
      t("reportsData.to_date"),
    ];

    // =========================
    // ROWS (same as reports table)
    // =========================
    let rows = reports.value.map((item, index) => [
      index + 1,
      item.title,
      item.year,
      formatDisplayDate(item.from_date),
      formatDisplayDate(item.to_date),
    ]);

    if (isArabic) {
      headers = [...headers].reverse();
      rows = rows.map((r) => [...r].reverse());
    }

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 55,

      styles: {
        font: "IBMPlexSansArabic",
        fontSize: 9,
        halign: isArabic ? "right" : "left",
      },

      headStyles: {
        font: "IBMPlexSansArabic",
        fontStyle: "bold",
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
      },

      didDrawPage: () => {
        const pageWidth = doc.internal.pageSize.width;

        drawPdfHeader(doc, authStore, isArabic);

        doc.setFontSize(11);
        doc.setFont("IBMPlexSansArabic", "bold");

        const title = t("sidebar.reportsAbsence");

        const fullTitle = isArabic
          ? `عنوان التقرير: ${title}`
          : `Report Title: ${title}`;

        doc.text(fullTitle, isArabic ? pageWidth - 15 : 15, 40, {
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

    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPages, isArabic, true);
    }

    doc.save(`reports_${Date.now()}.pdf`);
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
    // HEADERS
    // =========================
    let headers = [
      "#",
      t("reportsData.report_title"),
      t("reportsData.year"),
      t("reportsData.from_date"),
      t("reportsData.to_date"),
    ];

    // =========================
    // ROWS (FROM reports.value)
    // =========================
    let rows = reports.value.map((item, index) => [
      index + 1,
      item.title,
      item.year,
      formatDisplayDate(item.from_date),
      formatDisplayDate(item.to_date),
    ]);

    if (isArabic) {
      headers = [...headers].reverse();
      rows = rows.map((r) => [...r].reverse());
    }

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 55,

      styles: {
        font: "IBMPlexSansArabic",
        fontSize: 9,
        halign: isArabic ? "right" : "left",
      },

      headStyles: {
        font: "IBMPlexSansArabic",
        fontStyle: "bold",
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
      },

      didDrawPage: () => {
        const pageWidth = doc.internal.pageSize.width;

        drawPdfHeader(doc, authStore, isArabic);

        doc.setFontSize(11);
        doc.setFont("IBMPlexSansArabic", "bold");

        const title = t("sidebar.reportsAbsence");

        const fullTitle = isArabic
          ? `عنوان التقرير: ${title}`
          : `Report Title: ${title}`;

        doc.text(fullTitle, isArabic ? pageWidth - 15 : 15, 40, {
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

    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPages, isArabic, true);
    }

    // PRINT
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
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
    toast.error(t("common.error"));
  }
};

watch(
  () => filters.value.year,
  (newYear) => {
    if (newYear) {
      filters.value.from_date = "";
      filters.value.to_date = "";
    }
  },
);

onMounted(() => loadReports());
</script>

<template>
  <section class="space-y-6">
    <header
      class="flex flex-wrap gap-x-10 gap-y-5 items-center justify-between no-print"
    >
      <h1 class="text-[20px] font-[600] text-[#000000]">
        {{ t("sidebar.reportsAbsence") }}
      </h1>
      <div class="flex items-center gap-2">
        <Button
          @click="handlePrint"
          :loading="printing"
          class="bg-[#E7EFED] border border-[#0E5F4A] !px-2 !py-2 hover:!bg-[#DDE6E4] rounded-md transition-colors"
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
                      'w-full text-start px-3 py-2 text-sm rounded-md mb-1 transition-colors cursor-pointer',
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
                      'w-full text-start px-3 py-2 text-sm rounded-md transition-colors cursor-pointer',
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

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-5">
        <Input
          v-model="searchTitle"
          :label="t('common.search')"
          :placeholder="t('reportsData.search_by_title')"
        >
          <template #suffix><SvgIcon name="search" /></template>
        </Input>
        <div class="md:col-span-1">
          <label class="block text-sm font-medium text-gray-700 mb-1">{{
            t("reportsData.year")
          }}</label>
          <Select
            v-model="filters.year"
            :options="yearOptions"
            :placeholder="t('reportsData.year')"
          />
        </div>
        <DateRangePicker
          v-model:startDate="filters.from_date"
          v-model:endDate="filters.to_date"
          :label="t('common.date')"
          :selected-year="filters.year"
        />
      </div>

      <div class="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="md"
          @click="resetFilters"
          class="!bg-[#F2F4F7] !text-[#344054] md:w-32"
        >
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
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("sidebar.reportsAbsence") }}
        </h2>
      </template>

      <Table
        :loading="loading"
        :items="reports"
        :headers="tableHeaders"
        :page="page"
        :total-pages="totalPages"
        @change-page="changePage"
        class="report-table"
      >
        <template #header-selection>
          <div class="flex justify-center">
            <input
              type="checkbox"
              v-model="selectAll"
              class="w-4 h-4 text-[#0E5F4A] border-gray-300 rounded focus:ring-[#0E5F4A] cursor-pointer"
            />
          </div>
        </template>
        <template
          v-for="header in tableHeaders.filter((h) => h.key !== 'actions')"
          :key="header.key"
          #[`header-${header.key}`]
        >
          <div
            class="flex items-center justify-between gap-2 cursor-pointer select-none"
            @click="handleSort(header.key)"
          >
            <span>{{ header.label }}</span>

            <SvgIcon
              name="sort"
              class="w-4 h-4 transition-transform"
              :class="{
                'text-[#0E5F4A]': filters.sort_by === header.key,
                'text-gray-400': filters.sort_by !== header.key,
                'rotate-180':
                  filters.sort_by === header.key &&
                  filters.sort_direction === 'desc',
              }"
            />
          </div>
        </template>
        <template #cell-from_date="{ item }">
          {{ formatDisplayDate(item.from_date) }}
        </template>
        <template #cell-to_date="{ item }">
          {{ formatDisplayDate(item.to_date) }}
        </template>
        <template #cell-selection="{ item }">
          <div class="flex justify-center">
            <input
              type="checkbox"
              :checked="selectedIds.includes(item.id)"
              @change="toggleSelect(item.id)"
              class="w-4 h-4 text-[#0E5F4A] border-gray-300 rounded focus:ring-[#0E5F4A] cursor-pointer"
            />
          </div>
        </template>
        <template #header-title="{ header }">
          <span class="font-medium text-[#101828]">{{ header.label }}</span>
        </template>
        <template #cell-actions="{ item }">
          <button
            class="cursor-pointer text-[#667085] hover:text-[#0E5F4A] transition-colors"
            @click="viewDetails(item.id)"
            v-tooltip="
              t('common.actionTooltips.view.title', { target: item.title })
            "
          >
            <SvgIcon name="eye" />
          </button>
        </template>
      </Table>
    </Card>

    <!-- Print only -->
    <div
      v-if="printData.length > 0"
      class="print-only"
      :dir="lang === 'ar' ? 'rtl' : 'ltr'"
    >
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th colspan="15" class="!bg-transparent !border-none !p-0">
              <div class="print-header-wrapper pb-6">
                <PrintHeader :title="t('sidebar.reportsAbsence')" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <template
            v-for="(groupItems, groupTitle) in groupedPrintData"
            :key="groupTitle"
          >
            <tr>
              <th
                colspan="15"
                class="!bg-[#E7EFED] !text-[#0E5F4A] border border-[#D2D6DB] px-4 py-2 text-sm font-bold text-center"
              >
                {{ groupTitle }}
              </th>
            </tr>
            <tr class="bg-[#0E5F4A] text-white">
              <th
                v-for="h in [
                  '#',
                  t('reportsData.employee_name'),
                  t('reportsData.from_date'),
                  t('reportsData.to_date'),
                  t('reportsData.attendance_days'),
                  t('reportsData.no_checkout_days'),
                  t('reportsData.deduction_minutes'),
                  t('reportsData.absence_days'),
                  t('reportsData.leave_days'),
                  t('reportsData.official_holidays'),
                  t('reportsData.external_missions'),
                  t('reportsData.delay_minutes_without_permission'),
                  t('reportsData.delay_minutes_with_permission'),
                  t('reportsData.total_delay_minutes'),
                  t('reportsData.notification_status'),
                ]"
                :key="h"
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] font-bold text-center uppercase"
              >
                {{ h }}
              </th>
            </tr>
            <tr v-for="(item, index) in groupItems" :key="item.id">
              <td
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] text-center"
              >
                {{ index + 1 }}
              </td>
              <td
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] text-center"
              >
                {{ item.employee?.name }}
              </td>
              <td
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] text-center"
              >
                {{ formatDisplayDate(item.from_date) }}
              </td>
              <td
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] text-center"
              >
                {{ formatDisplayDate(item.to_date) }}
              </td>
              <td
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] text-center"
              >
                {{ item.attendance_days }}
              </td>
              <td
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] text-center"
              >
                {{ item.no_checkout_days }}
              </td>
              <td
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] text-center"
              >
                {{ item.deduction_minutes }}
              </td>
              <td
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] text-center"
              >
                {{ item.absence_days }}
              </td>
              <td
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] text-center"
              >
                {{ item.leave_days }}
              </td>
              <td
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] text-center"
              >
                {{ item.official_holidays }}
              </td>
              <td
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] text-center"
              >
                {{ item.external_missions }}
              </td>
              <td
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] text-center"
              >
                {{ item.delay_minutes_without_permission }}
              </td>
              <td
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] text-center"
              >
                {{ item.delay_minutes_with_permission }}
              </td>
              <td
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] text-center"
              >
                {{ item.total_delay_minutes }}
              </td>
              <td
                class="border border-[#D2D6DB] px-1 py-1 text-[8px] text-center font-medium"
              >
                {{ item.localized_status }}
              </td>
            </tr>
          </template>
        </tbody>
        <tfoot>
          <tr class="footer-spacer-row">
            <td colspan="15" class="!border-none !p-0">
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
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.report-table :deep(thead th) {
  background-color: #f9fafb;
  font-weight: 600;
  color: #111827;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  font-size: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
}

.report-table :deep(tbody tr) {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.report-table :deep(tbody tr:hover) {
  background-color: #f9fafb;
  transform: translateY(-1px);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03);
  z-index: 10;
  position: relative;
}

@media print {
  @page {
    margin: 10mm;
  }
  .no-print {
    display: none !important;
  }
  .print-only {
    display: block !important;
    padding: 0 10mm !important;
  }

  /* Hide main content during print */
  header,
  .card,
  #print-area,
  .breadcrumb,
  .space-y-6 > div:not(.print-only) {
    display: none !important;
  }

  tr,
  td,
  th {
    page-break-inside: avoid !important;
  }

  table {
    page-break-inside: auto !important;
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 0 !important;
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
    padding: 8px 4px !important;
    font-size: 8px !important;
    border: 1px solid #d2d6db !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    text-align: center !important;
  }

  td {
    padding: 6px 4px !important;
    font-size: 8px !important;
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
