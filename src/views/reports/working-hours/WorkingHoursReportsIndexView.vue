<script setup>
import { ref, onMounted, computed, nextTick, watch } from "vue";
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
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import attendanceReportsService from "@/services/attendanceReports";
import { departmentService } from "@/services/departments";
import { employeeService } from "@/services/employees";

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
const lang = computed(() => locale.value);
const toast = useAppToast();
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

// State
const allRecords = ref([]);
const loading = ref(false);
const printReports = ref([]);
const printTotalPages = ref(1);

// Pagination
const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const exportLoading = ref(false);
const selectedIds = ref([]);
const departments = ref([]);
const employees = ref([]);

// Filters strictly as per user's latest request
const filters = ref({
  employee_id: "",
  department_id: "",
  from_date: "",
  to_date: "",
  year: "",
  sort_by: "",
  sort_direction: "asc",
});

const searchTitle = ref("");
const appliedSearchTitle = ref("");

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
      ...filters.value,
    };

    if (params.from_date) params.from_date = formatToApiDate(params.from_date);
    if (params.to_date) params.to_date = formatToApiDate(params.to_date);

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }
    if (!filters.value.year) {
      delete params.year;
    }
    if (!filters.value.department_id) {
      delete params.department_id;
    }

    if (params.year && !params.from_date && !params.to_date) {
      params.from_date = `${params.year}-01-01`;
      params.to_date = `${params.year}-12-31`;
    }

    const response =
      await attendanceReportsService.getWorkingHoursReport(params);
    const data = response.data?.data || response.data || response;

    allRecords.value = data.records || [];
    total.value = data.pagination?.total || allRecords.value.length;

    // Load totals for the summary section
    await loadTotals();
  } catch (e) {
    console.error(e);
    toast.error(t("common.error"));
  } finally {
    loading.value = false;
  }
};

// HANDLE SORTING
const handleSort = (key) => {
  const sortFieldMap = {
    employee_name: "employee_name",
    date: "date",
    check_in_time: "check_in_time",
    check_out_time: "check_out_time",
    total_working_hours: "total_working_hours",
    actual_working_hours: "actual_working_hours",
    difference: "difference",
    overtime: "overtime",
    status: "attendance_status",
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

const totals = ref({
  total_working_hours: 0,
  actual_working_hours: 0,
  difference: 0,
  overtime: 0,
});
const summaryLoading = ref(false);

const loadTotals = async () => {
  summaryLoading.value = true;
  try {
    const params = {
      paginate: false,
      ...filters.value,
    };

    if (params.from_date) params.from_date = formatToApiDate(params.from_date);
    if (params.to_date) params.to_date = formatToApiDate(params.to_date);

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }
    if (!filters.value.year) {
      delete params.year;
    }
    if (!filters.value.department_id) {
      delete params.department_id;
    }

    const response =
      await attendanceReportsService.getWorkingHoursReport(params);
    const allData =
      response.data?.records || response.data?.data?.records || [];

    totals.value = allData.reduce(
      (acc, rec) => {
        acc.total_working_hours += Number(rec.total_working_hours || 0);
        acc.actual_working_hours += Number(rec.actual_working_hours || 0);
        acc.difference += Number(rec.difference || 0);
        acc.overtime += Number(rec.overtime || 0);
        return acc;
      },
      {
        total_working_hours: 0,
        actual_working_hours: 0,
        difference: 0,
        overtime: 0,
      },
    );
  } catch (e) {
    console.error("Failed to load totals:", e);
  } finally {
    summaryLoading.value = false;
  }
};

const loadInitialData = async () => {
  try {
    const [deptRes, empRes] = await Promise.all([
      departmentService.listAll(),
      employeeService.list({ paginate: false }),
    ]);

    const deptData =
      deptRes.data?.departments ||
      (Array.isArray(deptRes.data)
        ? deptRes.data
        : Array.isArray(deptRes)
          ? deptRes
          : []);
    departments.value = deptData.map((d) => ({
      label: locale.value === "ar" ? d.name_ar || d.name : d.name || d.name_ar,
      value: d.id,
    }));

    const empData = Array.isArray(empRes.data)
      ? empRes.data
      : Array.isArray(empRes.employees)
        ? empRes.employees
        : Array.isArray(empRes)
          ? empRes
          : [];
    employees.value = empData.map((e) => ({
      label: e.name,
      value: e.id,
    }));
  } catch (e) {
    console.error("Failed to load filter options:", e);
  }
};

// Format values for display (round to 2 decimals)
const formatValue = (val) => {
  if (val === null || val === undefined) return "---";
  if (typeof val === "number") {
    const str = val.toString();
    if (str.includes(".") && str.split(".")[1].length > 4)
      return val.toFixed(2);
    return val;
  }
  return val;
};

const formatTime = (timeStr) => {
  if (!timeStr || timeStr === "---") return "---";
  const parts = timeStr.trim().split(" ");
  return parts.length > 1 ? parts[1] : timeStr;
};

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "employee_name", label: t("reportsData.employee_name") },
  { key: "date", label: t("common.date"), cellClass: "text-center" },
  {
    key: "check_in_time",
    label: locale.value === "ar" ? "الحضور" : t("reportsData.check_in"),
    cellClass: "text-center",
  },
  {
    key: "check_out_time",
    label: locale.value === "ar" ? "الانصراف" : t("reportsData.check_out"),
    cellClass: "text-center",
  },
  {
    key: "total_working_hours",
    label:
      locale.value === "ar"
        ? "ساعات العمل الرسمية"
        : t("reportsData.total_working_hours"),
    cellClass: "text-center",
  },
  {
    key: "actual_working_hours",
    label:
      locale.value === "ar"
        ? "ساعات عمل الموظف"
        : t("reportsData.actual_working_hours"),
    cellClass: "text-center",
  },
  {
    key: "difference",
    label: t("reportsData.difference"),
    cellClass: "text-center",
  },
  {
    key: "overtime",
    label: locale.value === "ar" ? "أوقات اضافية" : t("reportsData.overtime"),
    cellClass: "text-center",
  },
  { key: "status", label: t("reportsData.status"), cellClass: "text-center" },
]);

const getStatusClasses = (status) => {
  const s = status?.toLowerCase() || "";
  if (s === "present" || s === "حاضر" || s === "executed")
    return "bg-[#ECFDF3] text-[#085D3A]";
  if (s === "absent" || s === "غائب") return "bg-[#FEF3F2] text-[#912018]";
  if (s === "leave" || s === "إجازة") return "bg-[#EFF8FF] text-[#1849A9]";
  if (s === "mission" || s === "مهمة رسمية")
    return "bg-[#F3FCF6] text-[#54C08A]";
  if (s === "holiday" || s === "إجازة رسمية")
    return "bg-[#FEF6EE] text-[#B93815]";
  if (s === "half_day" || s === "نصف يوم") return "bg-[#F9FAFB] text-[#374151]";
  if (s === "rest_day" || s === "يوم راحة" || s === "not executed")
    return "bg-[#E5E7EB] text-[#1F2A37]";
  return "bg-gray-50 text-gray-600";
};

const getDotClasses = (status) => {
  const s = status?.toLowerCase() || "";
  if (s === "present" || s === "حاضر" || s === "executed")
    return "bg-[#085D3A]";
  if (s === "absent" || s === "غائب") return "bg-[#912018]";
  if (s === "leave" || s === "إجازة") return "bg-[#1849A9]";
  if (s === "mission" || s === "مهمة رسمية") return "bg-[#54C08A]";
  if (s === "holiday" || s === "إجازة رسمية") return "bg-[#B93815]";
  if (s === "half_day" || s === "نصف يوم") return "bg-[#374151]";
  if (s === "rest_day" || s === "يوم راحة" || s === "not executed")
    return "bg-[#1F2A37]";
  return "bg-gray-400";
};

const selectAll = ref(false);
const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
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
    const params = {
      paginate: false,
      ...filters.value,
    };

    if (params.from_date) params.from_date = formatToApiDate(params.from_date);
    if (params.to_date) params.to_date = formatToApiDate(params.to_date);

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }
    if (!filters.value.year) {
      delete params.year;
    }
    if (!filters.value.department_id) {
      delete params.department_id;
    }

    const response =
      await attendanceReportsService.getWorkingHoursReport(params);
    const allData =
      response.data?.records || response.data?.data?.records || [];

    if (format === "excel") exportToExcel(allData);
    else if (format === "pdf") await exportToPDF(allData);
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
    [t("reportsData.employee_name")]: item.employee?.name,
    [t("common.date")]: formatDisplayDate(item.date),
    [t("reportsData.check_in")]: formatTime(item.check_in_time),
    [t("reportsData.check_out")]: formatTime(item.check_out_time),
    [locale.value === "ar"
      ? "ساعات العمل الرسمية"
      : t("reportsData.total_working_hours")]: formatValue(
      item.total_working_hours,
    ),
    [locale.value === "ar"
      ? "ساعات عمل الموظف"
      : t("reportsData.actual_working_hours")]: formatValue(
      item.actual_working_hours,
    ),
    [t("reportsData.difference")]: formatValue(item.difference),
    [locale.value === "ar" ? "أوقات اضافية" : t("reportsData.overtime")]:
      formatValue(item.overtime),
    [t("reportsData.status")]: item.attendance_status,
  }));
  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Working Hours Summary");
  XLSX.writeFile(wb, `working_hours_summary_${new Date().getTime()}.xlsx`);
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
    const title = t("sidebar.reportsHours");

    const heads = [
      "#",
      t("reportsData.employee_name"),
      t("common.date"),
      locale.value === "ar" ? "الحضور" : t("reportsData.check_in"),
      locale.value === "ar" ? "الانصراف" : t("reportsData.check_out"),
      locale.value === "ar"
        ? "ساعات الدوام"
        : t("reportsData.total_working_hours"),
      locale.value === "ar"
        ? "عمل الموظف"
        : t("reportsData.actual_working_hours"),
      t("reportsData.difference"),
      locale.value === "ar" ? "إضافي" : t("reportsData.overtime"),
      t("reportsData.status"),
    ];

    let rows = data.map((item, index) => [
      index + 1,
      item.employee?.name,
      formatDisplayDate(item.date),
      formatTime(item.check_in_time),
      formatTime(item.check_out_time),
      formatValue(item.total_working_hours),
      formatValue(item.actual_working_hours),
      formatValue(item.difference),
      formatValue(item.overtime),
      item.attendance_status,
    ]);

    if (isArabic) {
      heads.reverse();
      rows = rows.map((r) => r.reverse());
    }

    autoTable(doc, {
      startY: 55,
      head: [heads],
      body: rows,
      styles: {
        font: "IBMPlexSansArabic",
        halign: isArabic ? "right" : "left",
        fontSize: 7,
        fontStyle: "normal",
        cellPadding: 2,
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
        const margin = 15;
        doc.text(fullTitle, isArabic ? pageWidth - 15 : 15, 40, {
          align: isArabic ? "right" : "left",
        });

        //  ADD THIS
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

    // Draw Footer (Correct pagination like EmployeesIndexView)
    const totalPagesPDF = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPagesPDF; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPagesPDF, isArabic, true);
    }

    doc.save(`working_hours_summary_${new Date().getTime()}.pdf`);
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

const applyFilters = () => {
  page.value = 1;
  loadReports();
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
  appliedSearchTitle.value = "";
  applyFilters();
};

const changePage = (newPage) => {
  page.value = newPage;
  loadReports();
};

const handlePrint = async () => {
  loading.value = true;

  try {
    const params = {
      paginate: false,
      ...filters.value,
    };

    if (params.from_date) params.from_date = formatToApiDate(params.from_date);
    if (params.to_date) params.to_date = formatToApiDate(params.to_date);

    if (!filters.value.employee_id) delete params.employee_id;
    if (!filters.value.year) delete params.year;
    if (!filters.value.department_id) delete params.department_id;

    const response =
      await attendanceReportsService.getWorkingHoursReport(params);

    const data = response.data?.records || response.data?.data?.records || [];

    const doc = new jsPDF({
      orientation: "l",
      unit: "mm",
      format: "a4",
    });

    const isArabic = locale.value === "ar";

    // Load fonts
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

    // Headers
    let headers = tableHeaders.value.map((h) => h.label);

    let rows = data.map((item, index) => [
      index + 1,
      item.employee?.name,
      formatDisplayDate(item.date),
      formatTime(item.check_in_time),
      formatTime(item.check_out_time),
      formatValue(item.total_working_hours),
      formatValue(item.actual_working_hours),
      formatValue(item.difference),
      formatValue(item.overtime),
      item.attendance_status,
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
        fontStyle: "normal",
        fontSize: 8,
        halign: isArabic ? "right" : "left",
      },
      headStyles: {
        font: "IBMPlexSansArabic",
        fontStyle: "bold",
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
      },
      didParseCell: (d) => {
        d.cell.styles.font = "IBMPlexSansArabic";
      },
      didDrawPage: () => {
        const pageWidth = doc.internal.pageSize.width;

        drawPdfHeader(doc, authStore, isArabic);

        doc.setFontSize(11);
        doc.setFont("IBMPlexSansArabic", "bold");

        const title = t("sidebar.reportsHours");

        const fullTitle = isArabic
          ? `عنوان التقرير: ${title}`
          : `Report Title: ${title}`;

        doc.text(fullTitle, isArabic ? pageWidth - 15 : 15, 40, {
          align: isArabic ? "right" : "left",
        });

        //  ADD THIS
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

    // Footer pagination
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPages, isArabic, true);
    }

    // Print via iframe (stable, no flicker)
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
    toast.error(t("common.error"));
  } finally {
    loading.value = false;
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

onMounted(() => {
  loadInitialData();
  loadReports();
});
</script>

<template>
  <section class="space-y-6">
    <header
      class="flex flex-wrap gap-x-10 gap-y-5 items-center justify-between no-print"
    >
      <h1 class="text-[20px] font-[600] text-[#000000]">
        {{ t("sidebar.reportsHours") }}
      </h1>
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

      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end mb-5"
      >
        <div v-if="!authStore.isEmployee">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">{{
            t("reportsData.employee_name")
          }}</label>
          <Select
            v-model="filters.employee_id"
            :options="employees"
            :placeholder="t('employees.placeholders.nameOrId')"
            searchable
            clearable
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">{{
            t("employees.fields.departmentSection")
          }}</label>
          <Select
            v-model="filters.department_id"
            :options="departments"
            :placeholder="t('employees.placeholders.departmentOrSection')"
            searchable
            clearable
          />
        </div>
        <div>
          <DateRangePicker
            v-model:startDate="filters.from_date"
            v-model:endDate="filters.to_date"
            :label="t('common.date')"
            :selected-year="filters.year"
          />
        </div>
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
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("sidebar.reportsHours") }}
        </h2>
      </template>

      <Table
        :loading="loading"
        :items="allRecords"
        :headers="tableHeaders"
        :page="page"
        :total-pages="totalPages"
        @change-page="changePage"
        class="report-table"
      >
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
        <template #cell-index="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>
        <template #cell-employee_name="{ item }">
          {{ item.employee?.name }}
        </template>
        <template #cell-date="{ item }">
          {{ formatDisplayDate(item.date) }}
        </template>
        <template #cell-check_in_time="{ item }">
          {{ formatTime(item.check_in_time) }}
        </template>
        <template #cell-check_out_time="{ item }">
          {{ formatTime(item.check_out_time) }}
        </template>
        <template #cell-total_working_hours="{ item }">
          {{ formatValue(item.total_working_hours) }}
        </template>
        <template #cell-actual_working_hours="{ item }">
          {{ formatValue(item.actual_working_hours) }}
        </template>
        <template #cell-difference="{ item }">
          {{ formatValue(item.difference) }}
        </template>
        <template #cell-overtime="{ item }">
          {{ formatValue(item.overtime) }}
        </template>
        <template #cell-status="{ item }">
          <div
            :class="[
              'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
              getStatusClasses(item.status),
            ]"
          >
            <span
              :class="['w-2 h-2 rounded-full', getDotClasses(item.status)]"
            ></span>
            {{ item.attendance_status }}
          </div>
        </template>
      </Table>
    </Card>

    <!-- Print only -->
    <div class="print-only hidden" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th colspan="10" class="!bg-transparent !border-none !p-0">
              <PrintHeader :title="t('sidebar.reportsHours')" />
            </th>
          </tr>
          <tr class="bg-[#0E5F4A] text-white">
            <th
              v-for="h in tableHeaders"
              :key="h.key"
              class="border border-[#D2D6DB] px-1 py-1 text-[8px] font-bold text-center"
            >
              {{ h.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in printReports" :key="item.id">
            <td
              class="border border-[#D2D6DB] px-1 py-2 text-center text-[8px]"
            >
              {{ index + 1 }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-2 text-center text-[8px]"
            >
              {{ item.employee?.name }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-2 text-center text-[8px]"
            >
              {{ formatDisplayDate(item.date) }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-2 text-center text-[8px]"
            >
              {{ formatTime(item.check_in_time) }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-2 text-center text-[8px]"
            >
              {{ formatTime(item.check_out_time) }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-2 text-center text-[8px]"
            >
              {{ formatValue(item.total_working_hours) }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-2 text-center text-[8px]"
            >
              {{ formatValue(item.actual_working_hours) }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-2 text-center text-[8px]"
            >
              {{ formatValue(item.difference) }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-2 text-center text-[8px]"
            >
              {{ formatValue(item.overtime) }}
            </td>
            <td
              class="border border-[#D2D6DB] px-1 py-2 text-center text-[8px] font-medium"
            >
              {{ item.attendance_status }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="footer-spacer-row">
            <td colspan="10" class="!border-none !p-0">
              <div class="h-[60px]"></div>
            </td>
          </tr>
        </tfoot>
      </table>
      <PrintFooter :totalPages="printTotalPages" />
    </div>
  </section>
</template>
<style>
@media print {
  @page {
    size: portrait;
    margin: 0;
  }
  .no-print {
    display: none !important;
  }
  .print-only {
    display: block !important;
    padding: 0 10px !important;
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

  html,
  body,
  #app,
  main {
    overflow: visible !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }
}
</style>
