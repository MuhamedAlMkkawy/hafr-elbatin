<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Icon from "@/components/ui/Icon.vue";
import Table from "@/components/ui/Table.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Select from "@/components/ui/Select.vue";

import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { employeeService } from "@/services/employees";
import { attendanceLocationService } from "@/services/attendanceLocations";
import { departmentService } from "@/services/departments";
import { roleService } from "@/services/roles";

import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";

import PrintHeader from "@/components/ui/PrintHeader.vue";
import PrintFooter from "@/components/ui/PrintFooter.vue";
import { useAuthStore } from "@/stores/auth";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const router = useRouter();
const route = useRoute();
const toast = useAppToast();
const authStore = useAuthStore();

const employees = ref([]);
const loading = ref(true);
const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const printEmployees = ref([]);
const isPrinting = ref(false);
const printTotalPages = ref(1);

const filters = ref({
  search: "",
  organizational_unit_id: "",
  department_id: "",
  role: "",
  status: "",
  sort_by: "created_at",
  sort_direction: "desc",
});

const organizationalUnitOptions = ref([]);
const departmentOptions = ref([]);
const roleOptions = ref([]);

const loadRoles = async () => {
  try {
    const res = await roleService.list({ paginate: false });
    const list = res.data || [];
    roleOptions.value = list.map((r) => ({
      label: lang.value === "ar" ? r.name_ar || r.name : r.name || r.name_ar,
      value: String(r.name),
    }));
  } catch (e) {
    console.error(e);
  }
};

const statusOptions = computed(() => [
  { label: t("branches.status.active"), value: "active" },
  { label: t("branches.status.inactive"), value: "inactive" },
]);

const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

const isEn = computed(() => route.path.startsWith("/en"));
const basePath = computed(() => (isEn.value ? "/en/employees" : "/employees"));

const loadOrganizationalUnits = async () => {
  try {
    const res = await attendanceLocationService.listOrganizationalUnits();
    const list = res?.data?.organizational_units || [];
    organizationalUnitOptions.value = list.map((b) => ({
      label:
        lang.value === "ar" ? b.name_ar || b.name_en : b.name_en || b.name_ar,
      value: String(b.id),
    }));
  } catch (e) {
    console.error(e);
  }
};

const loadDepartments = async () => {
  try {
    // const res = await departmentService.listAll()
    // const list = Array.isArray(res) ? res : (res.data || [])
    const list = [
      { id: 1, name: "Human Resources", name_ar: "الموارد البشرية" },
      { id: 2, name: "Information Technology", name_ar: "تكنولوجيا المعلومات" },
      { id: 3, name: "Finance", name_ar: "المالية" },
    ];
    departmentOptions.value = list?.map((d) => ({
      label: lang.value === "ar" ? d.name_ar || d.name : d.name || d.name_ar,
      value: String(d.id),
    }));
  } catch (e) {
    console.error(e);
  }
};

// Removed old commented out loadRoles

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

const loadEmployees = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      sort_by: filters.value.sort_by,
      sort_direction: filters.value.sort_direction,
    };
    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.organizational_unit_id)
      params.organizational_unit_id = filters.value.organizational_unit_id;
    if (filters.value.department_id)
      params.department_id = filters.value.department_id;
    if (filters.value.role) params.role = filters.value.role;
    if (filters.value.status) params.status = filters.value.status;

    const response = await employeeService.list(params);
    employees.value = response.data || [];
    total.value = response.meta?.total ?? employees.value.length;
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  page.value = 1;
  loadEmployees();
};

const resetFilters = () => {
  filters.value.search = "";
  filters.value.organizational_unit_id = "";
  filters.value.department_id = "";
  filters.value.role = "";
  filters.value.status = "";
  filters.value.sort_by = "created_at";
  filters.value.sort_direction = "desc";
  applyFilters();
};

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  loadEmployees();
};

const handleExport = async (format = "excel") => {
  try {
    const params = {
      paginate: false,
      ...filters.value,
    };

    const response = await employeeService.list(params);
    const data = Array.isArray(response.data)
      ? response.data
      : response.data?.employees || [];

    if (format === "excel") {
      exportToExcel(data);
    } else if (format === "pdf") {
      await exportToPDF(data);
    }
  } catch (e) {
    console.error(e);
    toast.error(
      e?.response?.data?.message ||
        e?.message ||
        t("common.errors.exportFailed"),
    );
  }
};

const exportToExcel = (data) => {
  const flattened = data.map((emp, index) => ({
    "#": index + 1,
    [t("employees.fields.employeeId")]: emp.employee_number,
    [t("employees.fields.employeeName")]: emp.name,
    [t("employees.fields.entityName")]: organizationalUnitName(emp),
    [t("employees.fields.departmentSection")]:
      lang.value === "ar"
        ? emp.department?.name_ar || emp.department?.name
        : emp.department?.name || emp.department?.name_ar,
    [t("employees.fields.role")]: roleLabel(emp),
    [t("employees.fields.status")]: !emp.is_active
      ? t("branches.status.inactive")
      : t("branches.status.active"),
  }));

  const ws = XLSX.utils.json_to_sheet(flattened);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employees");
  XLSX.writeFile(wb, `employees_export_${new Date().getTime()}.xlsx`);
};

// const exportToPDF = async (data) => {
//   const doc = new jsPDF({
//     orientation: "p",
//     unit: "mm",
//     format: "a4",
//   });

//   try {
//     const fontRes = await fetch(IBMPlexSansArabicRegular);
//     const fontBuffer = await fontRes.arrayBuffer();
//     const fontBase64 = arrayBufferToBase64(fontBuffer);

//     const fontBoldRes = await fetch(IBMPlexSansArabicBold);
//     const fontBoldBuffer = await fontBoldRes.arrayBuffer();
//     const fontBoldBase64 = arrayBufferToBase64(fontBoldBuffer);

//     doc.addFileToVFS("IBMPlexSansArabic-Regular.ttf", fontBase64);
//     doc.addFont("IBMPlexSansArabic-Regular.ttf", "IBMPlexSansArabic", "normal");

//     doc.addFileToVFS("IBMPlexSansArabic-Bold.ttf", fontBoldBase64);
//     doc.addFont("IBMPlexSansArabic-Bold.ttf", "IBMPlexSansArabic", "bold");

//     doc.setFont("IBMPlexSansArabic", "normal");

//     const isArabic = lang.value === "ar";

//     let headers = [
//       "#",
//       t("employees.fields.employeeId"),
//       t("employees.fields.employeeName"),
//       t("employees.fields.entityName"),
//       t("employees.fields.departmentSection"),
//       t("employees.fields.role"),
//       t("employees.fields.status"),
//     ];

//     let rows = data.map((emp, index) => [
//       index + 1,
//       emp.employee_number,
//       emp.name,
//       organizationalUnitName(emp),
//       departmentName(emp),
//       roleLabel(emp),
//       !emp.is_active
//         ? t("branches.status.inactive")
//         : t("branches.status.active"),
//     ]);

//     if (isArabic) {
//       headers = headers.reverse();
//       rows = rows.map((r) => r.reverse());
//     }

//     autoTable(doc, {
//       head: [headers],
//       body: rows,
//       startY: 55, // Increased space below title

//       styles: {
//         font: "IBMPlexSansArabic",
//         fontStyle: "normal",
//         halign: isArabic ? "right" : "left",
//         fontSize: 9,
//       },

//       headStyles: {
//         font: "IBMPlexSansArabic",
//         fontStyle: "normal",
//         halign: isArabic ? "right" : "left",
//         fillColor: [14, 95, 74],
//         textColor: [255, 255, 255],
//       },

//       didParseCell: function (data) {
//         data.cell.styles.font = "IBMPlexSansArabic";
//         data.cell.styles.fontStyle = "normal";
//       },

//       didDrawPage: function (data) {
//         doc.setFont("IBMPlexSansArabic", "normal");
//         const margin = 15;
//         const pageWidth = doc.internal.pageSize.width;
//         const isArabic = lang.value === "ar";

//         // Draw Header
//         drawPdfHeader(doc, authStore, isArabic);

//         // Subtitle (Title)
//         doc.setFontSize(11);
//         doc.setFont("IBMPlexSansArabic", "bold");

//         const titleStr = t("employees.title");
//         const fullTitle = isArabic
//           ? `عنوان التقرير: ${titleStr}`
//           : `Report Title: ${titleStr}`;

//         doc.text(fullTitle, isArabic ? pageWidth - margin : margin, 40, {
//           align: isArabic ? "right" : "left",
//         });
//         doc.setFont("IBMPlexSansArabic", "normal");
//       },
//       margin: { top: 50, bottom: 30 },
//     });

//     // Draw Footer
//     const totalPagesHead = doc.internal.getNumberOfPages();
//     for (let i = 1; i <= totalPagesHead; i++) {
//       doc.setPage(i);
//       drawPdfFooter(doc, authStore, i, totalPagesHead, isArabic);
//     }

//     doc.save(`employees_export_${new Date().getTime()}.pdf`);
//   } catch (err) {
//     console.error("PDF Export Error:", err);
//     toast.error(
//       err?.response?.data?.message || err?.message || "PDF generation failed.",
//     );
//   }
// };

const exportToPDF = async (data, { returnDoc = false } = {}) => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  try {
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

    let headers = [
      "#",
      t("employees.fields.employeeId"),
      t("employees.fields.employeeName"),
      t("employees.fields.entityName"),
      t("employees.fields.departmentSection"),
      t("employees.fields.role"),
      t("employees.fields.status"),
    ];

    let rows = data.map((emp, index) => [
      index + 1,
      emp.employee_number,
      emp.name,
      organizationalUnitName(emp),
      departmentName(emp),
      roleLabel(emp),
      !emp.is_active
        ? t("branches.status.inactive")
        : t("branches.status.active"),
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
        halign: isArabic ? "right" : "left",
        fontSize: 9,
      },
      headStyles: {
        fillColor: [14, 95, 74],
        textColor: [255, 255, 255],
      },
      didDrawPage: function () {
        drawPdfHeader(doc, authStore, isArabic);

        doc.setFontSize(11);
        doc.setFont("IBMPlexSansArabic", "bold");

        const titleStr = t("employees.title");
        const fullTitle = isArabic
          ? `عنوان التقرير: ${titleStr}`
          : `Report Title: ${titleStr}`;

        doc.text(fullTitle, isArabic ? 195 : 15, 40, {
          align: isArabic ? "right" : "left",
        });

        doc.setFont("IBMPlexSansArabic", "normal");
      },
      margin: { top: 50, bottom: 30 },
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPages, isArabic);
    }

    // KEY CHANGE
    if (returnDoc) {
      return doc;
    }

    doc.save(`employees_export_${new Date().getTime()}.pdf`);
  } catch (err) {
    console.error(err);
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
//       ...filters.value,
//     };

//     const response = await employeeService.list(params);

//     printEmployees.value = Array.isArray(response.data)
//       ? response.data
//       : response.data?.employees || [];

//     const data = printEmployees.value;

//     // Build PDF
//     const doc = await buildEmployeesPDF(data);

//     // Convert to blob URL
//     const blob = doc.output("blob");
//     const url = URL.createObjectURL(blob);

//     // Create hidden iframe
//     const iframe = document.createElement("iframe");
//     iframe.style.position = "fixed";
//     iframe.style.width = "0";
//     iframe.style.height = "0";
//     iframe.style.border = "0";
//     iframe.src = url;

//     document.body.appendChild(iframe);

//     iframe.onload = () => {
//       setTimeout(() => {
//         iframe.contentWindow.focus();
//         iframe.contentWindow.print();
//       }, 300);
//     };
//   } catch (e) {
//     console.error(e);
//     toast.error(e?.message || "Print failed");
//   }
// };

const handlePrint = async () => {
  try {
    const params = {
      paginate: false,
      ...filters.value,
    };

    const response = await employeeService.list(params);

    const printEmployees = Array.isArray(response.data)
      ? response.data
      : response.data?.employees || [];

    // =========================
    // Create PDF (inside same function)
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

    let headers = [
      "#",
      t("employees.fields.employeeId"),
      t("employees.fields.employeeName"),
      t("employees.fields.entityName"),
      t("employees.fields.departmentSection"),
      t("employees.fields.role"),
      t("employees.fields.status"),
    ];

    let rows = printEmployees.map((emp, index) => [
      index + 1,
      emp.employee_number,
      emp.name,
      organizationalUnitName(emp),
      departmentName(emp),
      roleLabel(emp),
      !emp.is_active
        ? t("branches.status.inactive")
        : t("branches.status.active"),
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

      //  HERE: column widths
      // columnStyles: {
      //   0: { cellWidth: 25 }, // Employee ID
      //   1: { cellWidth: 30 }, // Name
      //   2: { cellWidth: 25 }, // Check In
      //   3: { cellWidth: 25 }, // Check Out
      //   4: { cellWidth: 25 }, // Lateness
      //   5: { cellWidth: 25 }, // Early Leave
      //   6: { cellWidth: 25 }, // Actual Hours
      // },

      didDrawPage: function () {
        drawPdfHeader(doc, authStore, isArabic);

        doc.setFontSize(11);
        doc.setFont("IBMPlexSansArabic", "bold");

        const titleStr = t("employees.title");
        const fullTitle = isArabic
          ? `عنوان التقرير: ${titleStr}`
          : `Report Title: ${titleStr}`;

        doc.text(fullTitle, isArabic ? 195 : 15, 40, {
          align: isArabic ? "right" : "left",
        });

        doc.setFont("IBMPlexSansArabic", "normal");
      },

      margin: { top: 50, bottom: 30 },
    });

    // =========================
    // Footer pages
    // =========================
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPages, isArabic);
    }

    // =========================
    // PRINT FLOW (no popup tab)
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
    toast.error(e?.message || "Print failed");
  }
};

const goToView = (item) => {
  router.push(`${basePath.value}/view/${item.id}`);
};

const goToEdit = (item) => {
  router.push(`${basePath.value}/${item.id}/edit`);
};

const goToSchedule = (item) => {
  const path = isEn.value ? "/en/scheduale" : "/scheduale";
  router.push({ path: path, query: { employee_id: item.id } });
};

const roleLabel = (item) => {
  if (!item.roles) return "--------";
  const roles = Array.isArray(item.roles) ? item.roles : [item.roles];
  if (roles.length === 0) return "--------";

  return roles
    .map((r) => {
      const option = roleOptions.value.find((opt) => opt.value === String(r));
      return option ? option.label : r;
    })
    .join(", ");
};

const departmentName = (item) => {
  const d = item.department;
  if (!d) return "--------";
  return lang.value === "ar" ? d.name_ar || d.name : d.name || d.name_ar;
};

const organizationalUnitName = (item) => {
  const b = item?.organizational_unit;
  if (!b) return "--------";
  if (lang.value === "ar") {
    return b.name_ar || b.name_en || "--------";
  }
  return b.name_en || b.name_ar || "--------";
};

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "id", label: t("employees.fields.employeeId") },
  { key: "name", label: t("employees.fields.employeeName") },
  { key: "entityName", label: t("employees.fields.entityName") },
  { key: "departmentSection", label: t("employees.fields.departmentSection") },
  { key: "role", label: t("employees.fields.role") },
  { key: "status", label: t("employees.fields.status") },
  { key: "actions", label: t("employees.fields.actions") },
]);

onMounted(async () => {
  await loadOrganizationalUnits();
  await loadDepartments();
  await loadRoles();
  loadEmployees();
});
</script>

<template>
  <section class="space-y-6">
    <header class="flex items-center justify-between no-print">
      <h1 class="text-[20px] font-[600] text-[#000000]">
        {{ t("employees.title") }}
      </h1>
      <div class="flex items-center gap-2 no-print">
        <Button
          @click="handlePrint"
          class="bg-[#E7EFED] border border-[#0E5F4A] !px-2 !py-2 hover:!bg-[#DDE6E4] transition-colors duration-300"
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
      </div>
    </header>

    <Card class="no-print">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("employees.searchTitle") }}
        </h2>
      </template>
      <div class="grid md:grid-cols-3 gap-4 items-end">
        <Input
          v-model="filters.search"
          :placeholder="t('employees.placeholders.nameOrId')"
          :label="t('employees.placeholders.nameOrId')"
          size="md"
        >
          <template #suffix>
            <Icon name="magnifyingGlass" size="lg" class="text-[#0E5F4A]" />
          </template>
        </Input>
        <Select
          v-model="filters.organizational_unit_id"
          :options="organizationalUnitOptions"
          :placeholder="t('employees.placeholders.branch')"
          :label="t('employees.placeholders.branch')"
          size="md"
        />
        <Select
          v-model="filters.department_id"
          :options="departmentOptions"
          :placeholder="t('employees.placeholders.departmentOrSection')"
          :label="t('employees.placeholders.departmentOrSection')"
          size="md"
        />
        <Select
          v-model="filters.role"
          :options="roleOptions"
          :placeholder="t('employees.placeholders.role')"
          :label="t('employees.placeholders.role')"
          size="md"
        />
        <Select
          v-model="filters.status"
          :options="statusOptions"
          :placeholder="t('employees.placeholders.status')"
          :label="t('employees.placeholders.status')"
          size="md"
        />
      </div>
      <div class="flex gap-2 mt-5 justify-end">
        <Button variant="ghost" size="md" @click="resetFilters" class="md:w-26">
          {{ t("employees.resetFilters") }}
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
    <div id="print-area">
      <Card class="print:!border-none print:!shadow-none">
        <template #header>
          <h2 class="text-[16px] font-[600] text-[#333333] no-print">
            {{ t("employees.listTitle") }}
          </h2>
        </template>
        <Table
          :loading="loading"
          :items="employees"
          :headers="tableHeaders"
          :page="page"
          :total-pages="totalPages"
          :empty-text="t('employees.noData')"
          @change-page="changePage"
        >
          <template #header-id="{ header }">
            <div class="flex items-center gap-2 select-none justify-between">
              {{ header.label }}
              <SvgIcon
                name="sort"
                classes="w-5 h-5 transition-colors cursor-pointer"
                :class="
                  filters.sort_by === 'employee_number'
                    ? 'text-primary'
                    : 'text-gray-400'
                "
                @click="handleSort('employee_number')"
              />
            </div>
          </template>

          <template #header-name="{ header }">
            <div class="flex items-center gap-2 select-none justify-between">
              {{ header.label }}
              <SvgIcon
                name="sort"
                classes="w-5 h-5 transition-colors cursor-pointer"
                :class="
                  filters.sort_by === 'name' ? 'text-primary' : 'text-gray-400'
                "
                @click="handleSort('name')"
              />
            </div>
          </template>

          <template #header-entityName="{ header }">
            <div class="flex items-center gap-2 select-none justify-between">
              {{ header.label }}
              <SvgIcon
                name="sort"
                classes="w-5 h-5 transition-colors cursor-pointer"
                :class="
                  filters.sort_by === 'organizational_unit_id'
                    ? 'text-primary'
                    : 'text-gray-400'
                "
                @click="handleSort('organizational_unit_id')"
              />
            </div>
          </template>

          <template #header-departmentSection="{ header }">
            <div class="flex items-center gap-2 select-none justify-between">
              {{ header.label }}
              <SvgIcon
                name="sort"
                classes="w-5 h-5 transition-colors cursor-pointer"
                :class="
                  filters.sort_by === 'department_id'
                    ? 'text-primary'
                    : 'text-gray-400'
                "
                @click="handleSort('department_id')"
              />
            </div>
          </template>

          <template #header-role="{ header }">
            <div class="flex items-center gap-2 select-none justify-between">
              {{ header.label }}
              <SvgIcon
                name="sort"
                classes="w-5 h-5 transition-colors cursor-pointer"
                :class="
                  filters.sort_by === 'role' ? 'text-primary' : 'text-gray-400'
                "
                @click="handleSort('role')"
              />
            </div>
          </template>

          <template #header-status="{ header }">
            <div class="flex items-center gap-2 select-none justify-between">
              {{ header.label }}
              <SvgIcon
                name="sort"
                classes="w-5 h-5 transition-colors cursor-pointer"
                :class="
                  filters.sort_by === 'is_active'
                    ? 'text-primary'
                    : 'text-gray-400'
                "
                @click="handleSort('is_active')"
              />
            </div>
          </template>

          <template #cell-index="{ index }">
            {{ (page - 1) * perPage + index + 1 }}
          </template>
          <template #cell-id="{ item }">
            {{ item.employee_number }}
          </template>
          <template #cell-name="{ item }">
            {{ item.name }}
          </template>
          <template #cell-entityName="{ item }">
            {{ organizationalUnitName(item) }}
          </template>
          <template #cell-departmentSection="{ item }">
            {{ departmentName(item) }}
          </template>
          <template #cell-role="{ item }">
            {{ roleLabel(item) }}
          </template>
          <template #cell-status="{ item }">
            <span
              class="inline-flex items-center gap-1.5 text-[14px] font-[500] px-3 py-0.5 rounded-full"
              :class="
                !item.is_active
                  ? 'bg-[#E5E7EB] text-[#1F2A37]'
                  : 'bg-[#ECFDF3] text-[#085D3A]'
              "
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="!item.is_active ? 'bg-[#4D5761]' : 'bg-[#085D3A]'"
              />
              {{
                !item.is_active
                  ? t("branches.status.inactive")
                  : t("branches.status.active")
              }}
            </span>
          </template>
          <template #cell-actions="{ item }">
            <div class="flex items-center gap-2 no-print">
              <button
                type="button"
                class="hover:opacity-75 transition-opacity cursor-pointer"
                v-tooltip="{
                  title: t('common.actionTooltips.view.title', {
                    target: t('employees.entityName'),
                  }),
                  content: t('common.actionTooltips.view.content', {
                    target: t('employees.entityName'),
                    name: item.name,
                  }),
                }"
                @click="goToView(item)"
              >
                <SvgIcon name="eye" classes="w-8 h-8" />
              </button>
              <button
                type="button"
                class="hover:opacity-75 transition-opacity cursor-pointer"
                v-tooltip="{
                  title: t('common.actionTooltips.edit.title', {
                    target: t('employees.entityName'),
                  }),
                  content: t('common.actionTooltips.edit.content', {
                    target: t('employees.entityName'),
                    name: item.name,
                  }),
                }"
                @click="goToEdit(item)"
              >
                <SvgIcon name="edit" classes="w-8 h-8" />
              </button>
              <button
                type="button"
                class="hover:opacity-75 transition-opacity cursor-pointer"
                v-tooltip="{
                  title: t('employees.tooltips.schedule'),
                  content: t('employees.tooltips.scheduleContent', {
                    name: item.name,
                  }),
                }"
                @click="goToSchedule(item)"
              >
                <SvgIcon name="table" />
              </button>
            </div>
          </template>
        </Table>
      </Card>
    </div>

    <!-- Print-only Table (Full Data) -->
    <div class="print-only" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              :colspan="tableHeaders.length - 1"
              class="!bg-transparent !border-none !p-0"
            >
              <PrintHeader :title="t('employees.title')" />
            </th>
          </tr>
          <tr class="bg-[#0E5F4A] text-white">
            <th
              v-for="header in tableHeaders.filter((h) => h.key !== 'actions')"
              :key="header.key"
              class="border border-[#D2D6DB] px-4 py-3 text-start text-xs font-semibold text-[#384250] uppercase"
            >
              {{ header.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(emp, index) in printEmployees"
            :key="emp.id"
            class="border-b border-[#D2D6DB]"
          >
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ index + 1 }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ emp.employee_number }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ emp.name }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ organizationalUnitName(emp) }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ departmentName(emp) }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{ roleLabel(emp) }}
            </td>
            <td class="border border-[#D2D6DB] px-4 py-3 text-sm">
              {{
                !emp.is_active
                  ? t("branches.status.inactive")
                  : t("branches.status.active")
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

  /* Hide main content during print if we are using the print-only table */
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

  .header-spacer-row {
    counter-increment: page;
  }

  /* Sticky Header/Footer for every page */

  :deep(.min-h-screen),
  main {
    min-height: auto !important;
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 0 !important;
    page-break-inside: auto;
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
    padding: 12px 8px !important; /* Increased padding */
    font-size: 11px !important;
    border: 1px solid #d2d6db !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    text-align: center !important;
  }

  td {
    padding: 10px 8px !important; /* Increased padding */
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
