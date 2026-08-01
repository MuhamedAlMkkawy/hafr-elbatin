<template>
  <section class="space-y-5" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
    <!-- BREADCRUMB -->
    <Breadcrumb :items="breadcrumbItems" />

    <div class="flex items-center justify-between no-print">
      <h2 class="lg:text-[14px] text-[16px] font-[800] text-[#333333]">
        {{ $t("contact.title") }}
      </h2>

      <!-- Export / Add Message Button -->
      <div class="flex items-center gap-2">
        <!-- Add Message Button (Only if has both permissions or create only, but here we are in Index so it means they have both or view only) -->
        <Button
          v-if="authStore.hasPermission('employee_message.create')"
          variant="primary"
          size="md"
          @click="router.push(isEn ? '/en/add-message' : '/add-message')"
        >
          <SvgIcon name="plus" />
          <span class="ms-1 me-2">{{ $t("contact.add_message") }}</span>
        </Button>

        <Menu as="div" class="relative inline-block text-left">
          <MenuButton as="template">
            <Button variant="primary" size="md">
              <SvgIcon name="export" />
              <span class="ms-1 me-2">{{ $t("employees.export") }}</span>
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
              class="absolute ltr:right-0 rtl:left-0 mt-2 w-30 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50 text-start"
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
                      'cursor-pointer mb-1 group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
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
    </div>

    <!-- ==============================> Statistics Cards -->
    <Card class="relative no-print" v-if="showStatistics">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("contact.messages") }}
        </h2>
      </template>

      <div class="relative">
        <swiper
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
          :dir="lang == 'ar' ? 'rtl' : 'ltr'"
          :key="lang"
        >
          <!-- Cards -->
          <swiper-slide
            v-for="(stat, index) in [
              'total',
              'new',
              'under_processing',
              'solved',
            ]"
            :key="index"
            class="!w-[25%]"
          >
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div
                v-if="!loading"
                class="flex flex-col items-start justify-center w-full h-full"
              >
                <div class="flex items-center gap-2 mb-1">
                  <SvgIcon :name="stat + '_messages'" />
                  <span class="text-[#1F2A37] text-[14px] font-[500]">
                    {{
                      stat === "total"
                        ? t("contact.statistics.total")
                        : stat === "new"
                          ? t("contact.statistics.new")
                          : stat === "under_processing"
                            ? t("contact.statistics.in_progress")
                            : t("contact.statistics.done")
                    }}
                  </span>
                </div>
                <span class="text-[#1F2A37] font-[600] text-[24px]">
                  {{
                    stat === "total"
                      ? statistics?.total
                      : stat === "new"
                        ? statistics?.new
                        : stat === "under_processing"
                          ? statistics?.under_processing
                          : statistics?.solved
                  }}
                  <!-- {{ statistics?.[stat] ?? "--" }} -->
                </span>
              </div>

              <div
                v-else
                class="w-full flex flex-col items-start justify-center gap-2"
              >
                <Skeleton width="w-35" height="h-5" />
                <Skeleton width="w-20" height="h-5" />
              </div>
            </Card>
          </swiper-slide>
        </swiper>
      </div>
    </Card>

    <!-- ==============================> Search / Filter -->
    <Card class="no-print" v-if="!loading">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("contact.search.title") }}
        </h2>
      </template>

      <div class="grid xl:grid-cols-3 md:grid-cols-2 gap-4 items-end">
        <!-- Search in messages -->
        <Input
          v-model="filters.search"
          :placeholder="t('contact.search.placeholder')"
          :label="t('contact.search.label')"
          size="md"
        >
          <template #suffix>
            <Icon name="magnifyingGlass" size="lg" class="text-[#0E5F4A]" />
          </template>
        </Input>

        <!-- Status -->
        <Select
          v-model="filters.status"
          :options="statusOptions"
          :label="t('contact.search.status')"
          :placeholder="t('contact.search.status')"
          size="md"
        />

        <!-- Priority -->
        <Select
          v-model="filters.priority"
          :options="priorityOptions"
          :label="t('contact.search.priority')"
          :placeholder="t('contact.search.priority')"
          size="md"
        />
      </div>

      <div class="flex gap-2 mt-5 justify-end">
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

    <!-- ==============================> Messages List -->
    <Card>
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("contact.list.title") }}
        </h2>
      </template>

      <!-- Table skeleton while loading -->
      <div v-if="loading" class="overflow-x-auto">
        <table class="w-full table-auto border-collapse">
          <thead>
            <tr>
              <th
                v-for="header in tableHeaders"
                :key="header.key"
                class="px-3 py-2 text-left text-gray-400 text-sm font-medium"
              >
                <Skeleton height="h-8" />
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Always 5 skeleton rows -->
            <tr v-for="row in 5" :key="row">
              <td
                v-for="header in tableHeaders"
                :key="header.key"
                class="px-3 py-2"
              >
                <Skeleton height="h-5" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Table
        v-else
        :loading="loading"
        :items="messages"
        :headers="tableHeaders"
        :page="page"
        :total-pages="totalPages"
        :loading-text="t('common.loading')"
        :empty-text="t('contact.empty')"
        @change-page="changePage"
      >
        <!-- Sortable Headers -->
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

        <!-- Index -->
        <template #cell-index="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>

        <!-- Message Number -->
        <template #cell-message_number="{ item }">
          {{ item.message_number || "--" }}
        </template>

        <!-- Sender -->
        <template #cell-sender="{ item }">
          {{ item.name || "--" }}
        </template>

        <!-- Email -->
        <template #cell-email="{ item }">
          {{ item.email || "--" }}
        </template>

        <!-- Subject -->
        <template #cell-subject="{ item }">
          {{ item.subject || "--" }}
        </template>

        <!-- Date -->
        <template #cell-date="{ item }">
          {{ formatDate(item.created_at) || "--" }}
        </template>

        <!-- Status Badge -->
        <template #cell-status="{ item }">
          <span
            class="inline-flex items-center gap-1.5 text-[14px] font-[500] px-3 py-0.5 rounded-full flex-shrink-0"
            :class="statusClass(item.status)"
          >
            <span
              class="w-2 h-2 rounded-full"
              :class="statusDotClass(item.status)"
            />
            {{ item.status_label }}
          </span>
        </template>

        <!-- Priority Badge -->
        <template #cell-priority="{ item }">
          <span
            class="inline-flex items-center gap-1.5 text-[14px] font-[500] px-3 py-0.5 rounded-full flex-shrink-0"
            :class="priorityClass(item.priority)"
          >
            <span
              class="w-2 h-2 rounded-full"
              :class="priorityDotClass(item.priority)"
            />
            {{ item.priority_label }}
          </span>
        </template>

        <!-- Actions -->
        <template #cell-actions="{ item }">
          <div class="flex items-center gap-2">
            <button
              class="hover:opacity-75 transition-opacity cursor-pointer text-[#6C737F]"
              @click="goToView(item)"
              v-tooltip="{
                title: t('common.actionTooltips.view.title', {
                  target: t('contact.entityName'),
                }),
                content: t('common.actionTooltips.view.content', {
                  target: t('contact.entityName'),
                  name: item.message_number,
                }),
              }"
            >
              <SvgIcon name="eye" />
            </button>
          </div>
        </template>
      </Table>
    </Card>
  </section>
</template>
<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";

import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import Card from "@/components/ui/Card.vue";
import Table from "@/components/ui/Table.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import Icon from "@/components/ui/Icon.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Skeleton from "@/components/ui/Skeleton.vue";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";
import "swiper/css";

import { contactService } from "@/services/contact";
import { useAppToast } from "@/composables/useAppToast";
import { useAuthStore } from "@/stores/auth";

// ####################### Auth
const authStore = useAuthStore();
const showStatistics = computed(() => {
  return (
    authStore.isAdmin ||
    authStore.isHr ||
    authStore.isManager ||
    authStore.hasPermission("employee_message.statistics")
  );
});
const user = ref(null);

// ####################### i18n / routing
const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const lang = computed(() => locale.value);
const isRtl = computed(() => locale.value === "ar");
const toast = useAppToast();

// ####################### Data
const messages = ref([]);
const statistics = ref({ total: 0, new: 0, in_progress: 0, done: 0 });
const loading = ref(true);
const page = ref(1);
const perPage = ref(10);
const total = ref(0);

// ####################### Breadcrumb
const breadcrumbItems = computed(() => {
  const prefix = locale.value === "en" ? "/en" : "";
  return [
    { label: t("sidebar.support"), to: `${prefix}/` },
    { label: t("sidebar.supportContact") },
  ];
});

// ####################### Filters
const filters = ref({
  search: "",
  status: "",
  priority: "",
  sort_by: "created_at",
  sort_direction: "desc",
});

const statusOptions = computed(() => [
  { label: t("contact.status.new"), value: "new" },
  { label: t("contact.status.in_progress"), value: "under_processing" },
  { label: t("contact.status.done"), value: "solved" },
]);

const priorityOptions = computed(() => [
  { label: t("contact.priority.low"), value: "low" },
  { label: t("contact.priority.medium"), value: "medium" },
  { label: t("contact.priority.high"), value: "high" },
]);

// ####################### Pagination
const totalPages = computed(() =>
  total.value && perPage.value
    ? Math.max(1, Math.ceil(total.value / perPage.value))
    : 1,
);

// ####################### Table Headers
const tableHeaders = computed(() => [
  { key: "index", label: "#", sortable: false },
  {
    key: "message_number",
    label: t("contact.list.message_number"),
    sortable: true,
  },
  { key: "name", label: t("contact.list.sender"), sortable: true },
  { key: "email", label: t("contact.list.email"), sortable: true },
  { key: "subject", label: t("contact.list.subject"), sortable: true },
  { key: "date", label: t("contact.list.date"), sortable: true },
  { key: "status", label: t("contact.list.status"), sortable: true },
  { key: "priority", label: t("contact.list.priority"), sortable: true },
  { key: "actions", label: t("contact.list.actions"), sortable: false },
]);

// ####################### Status / Priority helpers
function statusClass(status) {
  switch (status) {
    case "new": // New
      return "bg-blue-100 text-blue-600";
    case "under_processing": // In Progress
      return "bg-orange-100 text-orange-600";
    case "solved": // solved
      return "bg-gray-100 text-gray-600";
    default:
      return "";
  }
}

function statusDotClass(status) {
  switch (status) {
    case "new":
      return "bg-blue-600";
    case "under_processing":
      return "bg-orange-600";
    case "solved":
      return "bg-gray-600";
    default:
      return "";
  }
}

const priorityClass = (priority) => ({
  "bg-[#FEE2E2] text-[#B91C1C]": priority === "high",
  "bg-[#FEF3C7] text-[#92400E]": priority === "medium",
  "bg-[#E5E7EB] text-[#374151]": priority === "low",
});

const priorityDotClass = (priority) => ({
  "bg-[#B91C1C]": priority === "high",
  "bg-[#92400E]": priority === "medium",
  "bg-[#374151]": priority === "low",
});

// ####################### Date formatter
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

// ####################### Load data
const loadMessages = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      sort_by: filters.value.sort_by,
      sort_direction: filters.value.sort_direction,
    };
    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.priority) params.priority = filters.value.priority;

    const response = await contactService.list(params);
    messages.value = response.data?.employee_messages || [];
    statistics.value = response.data?.statistics || statistics.value;
    total.value = response.data?.pagination?.total ?? messages.value.length;
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  page.value = 1;
  loadMessages();
};

const resetFilters = () => {
  filters.value = {
    search: "",
    status: "",
    priority: "",
    sort_by: "created_at",
    sort_direction: "desc",
  };
  applyFilters();
};

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  loadMessages();
};

// ####################### Sorting
const handleSort = (key) => {
  const sortFieldMap = {
    message_number: "message_number",
    sender: "sender_name",
    email: "email",
    subject: "subject",
    date: "created_at",
    status: "status",
    priority: "priority",
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

// ####################### Navigation
const isEn = computed(() => route.path.startsWith("/en"));
const basePath = computed(() =>
  isEn.value ? "/en/support/contact" : "/support/contact",
);

const goToView = (item, lang = "ar") => {
  const routeName = lang === "en" ? "single-message_en" : "single-message";
  router.push({ name: routeName, params: { id: item.id } });
};

// ####################### Export
const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
};

const handleExport = async (format) => {
  const fileName = "contact_messages";

  try {
    // =========================
    // FETCH ALL DATA
    // =========================
    const params = {
      page: 1,
      per_page: 100000,
      sort_by: filters.value.sort_by,
      sort_direction: filters.value.sort_direction,
      export: true,
      status: filters?.value?.status,
      priority: filters?.value?.priority,
    };

    const response = await contactService.list(params);
    const exportData = response?.data?.employee_messages || [];

    if (!exportData.length) {
      toast.warning("No data to export");
      return;
    }

    // =========================
    // HEADERS (ARABIC SAFE)
    // =========================
    const headers = [
      "#",
      t("contact.list.message_number"),
      t("contact.list.sender"),
      t("contact.list.email"),
      t("contact.list.subject"),
      t("contact.list.date"),
      t("contact.list.status"),
      t("contact.list.priority"),
    ];

    // =========================
    // BUILD AOA (IMPORTANT FIX)
    // =========================
    const wsData = [
      headers,
      ...exportData.map((item, idx) => [
        idx + 1,
        item.message_number || "--",
        item.name || "--",
        item.email || "--",
        item.subject || "--",
        formatDate(item.created_at) || "--",
        item.status_label || "--",
        item.priority_label || "--",
      ]),
    ];

    // =========================
    // EXCEL EXPORT
    // =========================
    if (format === "excel") {
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Messages");

      // =========================
      // RTL SUPPORT (IMPORTANT)
      // =========================
      ws["!rtl"] = true;

      // =========================
      // COLUMN WIDTHS
      // =========================
      ws["!cols"] = headers.map(() => ({
        wch: 22,
      }));

      // =========================
      // HEADER STYLING (OPTIONAL BUT NICE)
      // =========================
      const headerStyle = {
        font: { bold: true, name: "Arial" },
        alignment: {
          horizontal: "center",
          vertical: "center",
          readingOrder: 2, // RTL
        },
        fill: { fgColor: { rgb: "0E5F4A" } },
      };

      const range = XLSX.utils.decode_range(ws["!ref"]);

      for (let C = 0; C <= range.e.c; C++) {
        const cell = XLSX.utils.encode_cell({ r: 0, c: C });
        if (ws[cell]) ws[cell].s = headerStyle;
      }

      XLSX.writeFile(wb, `${fileName}_${Date.now()}.xlsx`);
    }

    // =========================
    // PDF EXPORT (UNCHANGED BUT SAFE)
    // =========================
    else if (format === "pdf") {
      const doc = new jsPDF({
        orientation: "l",
        unit: "mm",
        format: "a4",
      });

      try {
        const fontRes = await fetch(IBMPlexSansArabicRegular);
        const fontBuffer = await fontRes.arrayBuffer();
        const fontBase64 = arrayBufferToBase64(fontBuffer);

        doc.addFileToVFS("IBMPlexSansArabic-Regular.ttf", fontBase64);
        doc.addFont(
          "IBMPlexSansArabic-Regular.ttf",
          "IBMPlexSansArabic",
          "normal",
        );

        const fontResBold = await fetch(IBMPlexSansArabicBold);
        const fontBufferBold = await fontResBold.arrayBuffer();
        doc.addFileToVFS(
          "IBMPlexSansArabic-Bold.ttf",
          arrayBufferToBase64(fontBufferBold),
        );
        doc.addFont("IBMPlexSansArabic-Bold.ttf", "IBMPlexSansArabic", "bold");

        doc.setFont("IBMPlexSansArabic", "normal");
      } catch (_) {
        console.error("Font loading failed");
      }

      const isArabic = isRtl.value;
      const totalPagesExp = "{total_pages}";

      let pdfHeaders = [...headers];
      let rows = exportData.map((item, idx) => [
        idx + 1,
        item.message_number || "--",
        item.name || "--",
        item.email || "--",
        item.subject || "--",
        formatDate(item.created_at) || "--",
        item.status_label || "--",
        item.priority_label || "--",
      ]);

      if (isArabic) {
        pdfHeaders = pdfHeaders.reverse();
        rows = rows.map((r) => [...r].reverse());
      }

      autoTable(doc, {
        head: [pdfHeaders],
        body: rows,
        startY: 45,
        styles: {
          font: "IBMPlexSansArabic",
          fontStyle: "normal",
          halign: isArabic ? "right" : "left",
          fontSize: 9,
          overflow: "linebreak",
          cellPadding: 2,
        },
        headStyles: {
          font: "IBMPlexSansArabic",
          fontStyle: "normal",
          halign: isArabic ? "right" : "left",
          fillColor: [14, 95, 74],
          textColor: [255, 255, 255],
        },
        columnStyles: isArabic
          ? {
              0: { cellWidth: 25 }, // Priority
              1: { cellWidth: 25 }, // Status
              2: { cellWidth: 30 }, // Date
              3: { cellWidth: "auto" }, // Subject
              4: { cellWidth: 45 }, // Email
              5: { cellWidth: 35 }, // Sender
              6: { cellWidth: 30 }, // Message Number
              7: { cellWidth: 10 }, // #
            }
          : {
              0: { cellWidth: 10 }, // #
              1: { cellWidth: 30 }, // Message Number
              2: { cellWidth: 35 }, // Sender
              3: { cellWidth: 45 }, // Email
              4: { cellWidth: "auto" }, // Subject
              5: { cellWidth: 30 }, // Date
              6: { cellWidth: 25 }, // Status
              7: { cellWidth: 25 }, // Priority
            },
        didParseCell: function (data) {
          data.cell.styles.font = "IBMPlexSansArabic";
          data.cell.styles.fontStyle = "normal";
        },
        didDrawPage: function (data) {
          doc.setFont("IBMPlexSansArabic", "normal");
          const pageWidth = doc.internal.pageSize.width;

          // Draw Header
          drawPdfHeader(doc, authStore, isArabic);

          // Subtitle (Title)
          doc.setFontSize(11);
          doc.setFont("IBMPlexSansArabic", "bold");
          const titleStr = t("contact.title");
          const fullTitle = isArabic
            ? `عنوان التقرير: ${titleStr}`
            : `Report Title: ${titleStr}`;
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

      doc.save(`${fileName}_${Date.now()}.pdf`);
    }
  } catch (err) {
    console.error(err);
    toast.error("Export failed");
  }
};

onMounted(async () => {
  user.value = JSON.parse(
    localStorage.getItem("attendance.auth") || "null",
  )?.user;
  await loadMessages();
});
</script>

<style scoped></style>
