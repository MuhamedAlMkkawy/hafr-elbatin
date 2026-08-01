<template>
  <div class="no-print space-y-6">
    <!-- Filters -->
    <Card class="no-print my-6">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("notifications.searchTitle") }}
        </h2>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Date Range -->
        <DateRangePicker
          v-model:start-date="filters.date_from"
          v-model:end-date="filters.date_to"
          :placeholder="t('common.date')"
          :label="t('dailyAttendance.instantAttendance.fields.requestDate')"
        />

        <!-- Search Filter -->
        <Select
          v-if="showEmployeeFilter && !authStore.isEmployee"
          v-model="filters.employee_id"
          :options="employeeOptions"
          :placeholder="t('employees.fields.employeeName')"
          :label="t('employees.fields.employeeName')"
          size="md"
          searchable
        />

        <!-- Status Filter -->
        <Select
          v-model="filters.status"
          :options="statusOptions"
          :placeholder="t('dailyAttendance.instantAttendance.fields.status')"
          :label="t('dailyAttendance.instantAttendance.fields.status')"
          size="md"
        />
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <Button variant="ghost" @click="resetFilters" class="md:w-26">{{
          t("roles.resetFilters")
        }}</Button>
        <Button variant="primary" @click="applyFilters" class="md:w-26">{{
          t("common.search")
        }}</Button>
      </div>
    </Card>

    <!-- Table -->
    <Card class="no-print">
      <template #header>
        <div class="flex gap-2 items-center justify-between w-full">
          <h2 class="text-[16px] font-[500] text-[#0E5F4A]">
            {{ t("dailyAttendance.instantAttendance.title") }}
          </h2>
        </div>
      </template>

      <Table
        :items="items"
        :headers="headers"
        :loading="loading"
        :page="page"
        :total-pages="totalPages"
        @change-page="changePage"
      >
        <template #header-request_date="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-colors cursor-pointer"
              :class="
                filters.sort_by === 'date' ? 'text-primary' : 'text-gray-400'
              "
              @click="handleSort('date')"
            />
          </div>
        </template>

        <template #header-request_time="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-colors cursor-pointer"
              :class="
                filters.sort_by === 'request_time'
                  ? 'text-primary'
                  : 'text-gray-400'
              "
              @click="handleSort('request_time')"
            />
          </div>
        </template>

        <template #header-sender_name="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-colors cursor-pointer"
              :class="
                filters.sort_by === 'sender' ? 'text-primary' : 'text-gray-400'
              "
              @click="handleSort('sender')"
            />
          </div>
        </template>

        <template #header-employee_name="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-colors cursor-pointer"
              :class="
                filters.sort_by === 'employee'
                  ? 'text-primary'
                  : 'text-gray-400'
              "
              @click="handleSort('employee')"
            />
          </div>
        </template>

        <template #header-check_in_time="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-colors cursor-pointer"
              :class="
                filters.sort_by === 'check_in_time'
                  ? 'text-primary'
                  : 'text-gray-400'
              "
              @click="handleSort('check_in_time')"
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
                filters.sort_by === 'status' ? 'text-primary' : 'text-gray-400'
              "
              @click="handleSort('status')"
            />
          </div>
        </template>
        <template #cell-index="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>

        <template #cell-request_date="{ item }">
          {{ item.date }}
        </template>

        <template #cell-request_time="{ item }">
          {{ formatTime12(item.request_time) }}
        </template>

        <template #cell-sender_name="{ item }">
          {{ item.sender?.name }}
        </template>

        <template #cell-employee_name="{ item }">
          {{ item.employee?.name }}
        </template>

        <template #cell-check_in_time="{ item }">
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
            <span v-else>-------</span>
            <img
              v-if="item.check_in_selfie"
              :src="item.check_in_selfie"
              class="w-6 h-6 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              v-tooltip="item.employee?.name"
              @click="openSelfieModal(item.check_in_selfie)"
            />
          </div>
        </template>

        <template #cell-status="{ item }">
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[14px] font-[500]"
            :class="getStatusClass(item)"
          >
            <span
              class="w-2 h-2 rounded-full"
              :class="getStatusDotClass(item)"
            ></span>
            {{
              lang === "ar"
                ? item.status_label_ar || item.status_label
                : item.status_label
            }}
          </div>
        </template>
      </Table>
    </Card>
  </div>

  <!-- Print Area -->
  <div class="print-only" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th
            :colspan="headers.length"
            class="!bg-transparent !border-none !p-0"
          >
            <PrintHeader
              :title="t('dailyAttendance.instantAttendance.title')"
              :fromDate="filters.date_from"
              :toDate="filters.date_to"
            />
          </th>
        </tr>
        <tr class="bg-[#0E5F4A] text-white">
          <th
            v-for="h in headers"
            :key="h.key"
            class="border border-[#D2D6DB] px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider"
          >
            {{ h.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in printData"
          :key="item.id"
          class="even:bg-[#F9FAFB]"
        >
          <td
            class="border border-[#D2D6DB] px-3 py-2.5 text-[11px] text-center font-medium"
          >
            {{ (page - 1) * perPage + index + 1 }}
          </td>
          <td
            class="border border-[#D2D6DB] px-3 py-2.5 text-[11px] text-[#161616]"
          >
            {{ item.date }}
          </td>
          <td
            class="border border-[#D2D6DB] px-3 py-2.5 text-[11px] text-[#161616]"
          >
            {{ formatTime12(item.request_time) }}
          </td>
          <td
            class="border border-[#D2D6DB] px-3 py-2.5 text-[11px] text-[#161616]"
          >
            {{ item.sender?.name || "-------" }}
          </td>
          <td
            class="border border-[#D2D6DB] px-3 py-2.5 text-[11px] text-[#161616]"
          >
            {{ item.employee?.name || "-------" }}
          </td>
          <td
            class="border border-[#D2D6DB] px-3 py-2.5 text-[11px] text-[#161616]"
          >
            {{ formatTime12(item.check_in_time) || "-------" }}
          </td>
          <td
            class="border border-[#D2D6DB] px-3 py-2.5 text-[11px] font-medium"
          >
            {{
              lang === "ar"
                ? item.status_label_ar || item.status_label
                : item.status_label
            }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="footer-spacer-row">
          <td :colspan="headers.length" class="!border-none !p-0">
            <div class="h-[60px]"></div>
          </td>
        </tr>
      </tfoot>
    </table>
    <PrintFooter :totalPages="printTotalPages" />
  </div>

  <Modal
    v-model="isConfirmModalOpen"
    width="md"
    :icon="notificationActive ? 'info_modal' : 'warning'"
    :border-color="notificationActive ? '#5b9bf4' : '#e6964d'"
  >
    <div class="py-4">
      <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
        {{ t("dailyAttendance.instantAttendance.modals.confirmTitle") }}
      </h3>
      <p class="text-[14px] text-[#384250]">
        {{
          notificationActive
            ? t("dailyAttendance.instantAttendance.modals.confirmMessage")
            : t(
                "dailyAttendance.instantAttendance.modals.confirmMessageNoNotifications",
              )
        }}
      </p>
    </div>
    <template #footer>
      <div class="flex flex-col gap-2 w-full">
        <Button
          class="w-full border-none"
          :class="
            notificationActive
              ? 'bg-[#D1E9FF] !text-[#1570EF] border-none hover:bg-[#e0f0ff]'
              : 'bg-[#FFFAEB] !text-[#DC6803] border-none hover:bg-[#FFF5D6]'
          "
          size="md"
          @click="handleSendInstantAttendance"
          :loading="sending"
        >
          {{ t("dailyAttendance.instantAttendance.modals.send") }}
        </Button>
        <Button
          variant="ghost"
          class="w-full"
          size="md"
          @click="isConfirmModalOpen = false"
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
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";
import { instantAttendanceService } from "@/services/instantAttendance";
import { employeeService } from "@/services/employees";
import { notificationSettingsService } from "@/services/notificationSettings";
import { useAuthStore } from "@/stores/auth";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Modal from "@/components/ui/Modal.vue";
import SelfieViewer from "@/components/common/SelfieViewer.vue";

import PrintHeader from "@/components/ui/PrintHeader.vue";
import PrintFooter from "@/components/ui/PrintFooter.vue";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";

import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import Table from "@/components/ui/Table.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import DateRangePicker from "@/components/ui/DateRangePicker.vue";

const { t, locale } = useI18n();
const router = useRouter();
const lang = computed(() => locale.value);
const toast = useAppToast();
const authStore = useAuthStore();

const loading = ref(false);
const items = ref([]);
const page = ref(1);
const totalPages = ref(1);
const perPage = ref(10);
const printTotalPages = ref(1);
const showEmployeeFilter = ref(true);
const requesting = ref(false);

const isSelfieModalOpen = ref(false);
const selfieUrl = ref("");

const openSelfieModal = (url) => {
  selfieUrl.value = url;
  isSelfieModalOpen.value = true;
};

const filters = ref({
  date_from: "",
  date_to: "",
  employee_id: "",
  status: "",
  sort_by: "date",
  sort_direction: "desc",
});

const isConfirmModalOpen = ref(false);
const notificationActive = ref(true);
const sending = ref(false);

const employeeOptions = ref([]);

const statusOptions = computed(() => [
  {
    label: t("dailyAttendance.instantAttendance.status.executed"),
    value: "executed",
  },
  // {
  //   label: t("dailyAttendance.instantAttendance.status.pending"),
  //   value: "pending",
  // },
  {
    label: t("dailyAttendance.instantAttendance.status.not_executed"),
    value: "not_executed",
  },
]);

const currentDate = computed(() =>
  new Date().toLocaleDateString(lang.value === "ar" ? "ar-EG" : "en-US"),
);

const reportDateRange = computed(() => {
  if (filters.value.date_from && filters.value.date_to) {
    return `${filters.value.date_from} ${t("common.to")} ${filters.value.date_to}`;
  } else if (filters.value.date_from) {
    return `${t("common.from")} ${filters.value.date_from}`;
  } else if (filters.value.date_to) {
    return `${t("common.to")} ${filters.value.date_to}`;
  }
  return "";
});

const getPrintStatusColor = (status) => {
  if (status === "executed") return "text-[#085D3A]";
  if (status === "pending") return "text-[#912018]";
  if (status === "expired") return "text-[#B54708]";
  return "text-[#384250]";
};

const headers = computed(() => [
  { key: "index", label: "#" },
  {
    key: "request_date",
    label: t("dailyAttendance.instantAttendance.fields.requestDate"),
    sortable: true,
  },
  {
    key: "request_time",
    label: t("dailyAttendance.instantAttendance.fields.requestTime"),
    sortable: true,
  },
  {
    key: "sender_name",
    label: t("dailyAttendance.instantAttendance.fields.createdBy"),
    sortable: true,
  },
  {
    key: "employee_name",
    label: t("dailyAttendance.instantAttendance.fields.employeeName"),
    sortable: true,
  },
  {
    key: "check_in_time",
    label: t("dailyAttendance.instantAttendance.fields.checkInTime"),
    sortable: true,
  },
  {
    key: "status",
    label: t("dailyAttendance.instantAttendance.fields.status"),
    sortable: true,
  },
]);

const fetchData = async () => {
  if (!authStore.hasPermission("instant_attendance.view")) return;
  loading.value = true;
  try {
    const params = {
      ...filters.value,
      page: page.value,
      per_page: perPage.value,
    };

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }
    const res = await instantAttendanceService.getInstantAttendances(params);
    if (res.success) {
      items.value = res.data.instant_attendances || [];
      const pagination = res.data.pagination;
      if (pagination) {
        totalPages.value = pagination.last_page || 1;
        perPage.value = pagination.per_page || 10;
      }
      showEmployeeFilter.value = res.data.show_employee_filter;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
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

const loadEmployees = async () => {
  if (!authStore.hasPermission("employee.view")) return;
  try {
    const res = await employeeService.list({ paginated: false });
    employeeOptions.value = (res.data || []).map((e) => ({
      label: e.name,
      value: String(e.id),
    }));
  } catch (error) {
    console.error(error);
  }
};

const applyFilters = () => {
  page.value = 1;
  fetchData();
};

const resetFilters = () => {
  filters.value = {
    date_from: "",
    date_to: "",
    employee_id: "",
    status: "",
    sort_by: "date",
    sort_direction: "desc",
  };
  page.value = 1;
  fetchData();
};

const changePage = (newPage) => {
  page.value = newPage;
  fetchData();
};

const openConfirmModal = async () => {
  try {
    requesting.value = true;
    const res = await notificationSettingsService.list({
      search: "instant_attendance",
    });
    if (res.success && res.data.notification_settings?.length > 0) {
      notificationActive.value = res.data.notification_settings?.[0]?.is_active;
    }
    isConfirmModalOpen.value = true;
  } catch (error) {
    console.error(error);
    isConfirmModalOpen.value = true;
  } finally {
    requesting.value = false;
  }
};

const handleSendInstantAttendance = async () => {
  sending.value = true;
  try {
    const res = await instantAttendanceService.sendInstantAttendance();
    if (res.success) {
      toast.success(
        t("dailyAttendance.instantAttendance.messages.sentSuccess") ||
          "Request sent successfully",
      );
      isConfirmModalOpen.value = false;
      fetchData();
    } else {
      toast.error(res.message || t("common.error"));
      isConfirmModalOpen.value = false;
    }
  } catch (error) {
    console.error(error);
    toast.error(
      error?.response?.data?.message || error?.message || t("common.error"),
    );
    isConfirmModalOpen.value = false;
  } finally {
    sending.value = false;
  }
};

// Export & Print
const handleExport = async (format = "excel") => {
  try {
    loading.value = true;
    const params = {
      ...filters.value,
      paginate: false,
    };

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }
    const res = await instantAttendanceService.getInstantAttendances(params);
    const data = res.data.instant_attendances || [];

    if (!data.length) {
      toast.warning(t("common.noDataToExport") || "No data to export");
      return;
    }

    if (format === "excel") {
      const flattened = data.map((item, index) => ({
        "#": index + 1,
        [t("dailyAttendance.instantAttendance.fields.requestDate")]: item.date,
        [t("dailyAttendance.instantAttendance.fields.requestTime")]:
          formatTime12(item.request_time),
        [t("dailyAttendance.instantAttendance.fields.createdBy")]:
          item.sender?.name,
        [t("dailyAttendance.instantAttendance.fields.employeeName")]:
          item.employee?.name,
        [t("dailyAttendance.instantAttendance.fields.checkInTime")]:
          formatTime12(item.check_in_time) || "-------",
        [t("dailyAttendance.instantAttendance.fields.status")]:
          lang.value === "ar"
            ? item.status_label_ar || item.status_label
            : item.status_label,
      }));

      const ws = XLSX.utils.json_to_sheet(flattened);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Instant Attendance");
      XLSX.writeFile(wb, `instant_attendance_${new Date().getTime()}.xlsx`);
    } else if (format === "pdf") {
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

      const fontRes = await fetch(IBMPlexSansArabicRegular);
      const fontBuffer = await fontRes.arrayBuffer();
      const fontBase64 = arrayBufferToBase64(fontBuffer);
      doc.addFileToVFS("IBMPlexSansArabic-Regular.ttf", fontBase64);
      doc.addFont(
        "IBMPlexSansArabic-Regular.ttf",
        "IBMPlexSansArabic",
        "normal",
      );

      const boldFontRes = await fetch(IBMPlexSansArabicBold);
      const boldFontBuffer = await boldFontRes.arrayBuffer();
      const boldFontBase64 = arrayBufferToBase64(boldFontBuffer);
      doc.addFileToVFS("IBMPlexSansArabic-Bold.ttf", boldFontBase64);
      doc.addFont("IBMPlexSansArabic-Bold.ttf", "IBMPlexSansArabic", "bold");

      doc.setFont("IBMPlexSansArabic", "normal");

      const isArabic = lang.value === "ar";
      const title = t("dailyAttendance.instantAttendance.title");

      let pdfHeaders = headers.value.map((h) => h.label);
      let rows = data.map((item, index) => [
        index + 1,
        item.date,
        formatTime12(item.request_time),
        item.sender?.name || "-------",
        item.employee?.name || "-------",
        formatTime12(item.check_in_time) || "-------",
        lang.value === "ar"
          ? item.status_label_ar || item.status_label
          : item.status_label,
      ]);

      if (isArabic) {
        pdfHeaders = pdfHeaders.reverse();
        rows = rows.map((r) => r.reverse());
      }

      autoTable(doc, {
        startY: 52,
        head: [pdfHeaders],
        body: rows,
        styles: {
          font: "IBMPlexSansArabic",
          halign: isArabic ? "right" : "left",
          fontSize: 9,
          fontStyle: "normal",
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
          // Draw Header (includes Subtitle and Dates)
          drawPdfHeader(
            doc,
            authStore,
            isArabic,
            title,
            filters.value.date_from,
            filters.value.date_to,
          );
        },
        margin: { top: 50, bottom: 30 },
      });

      // Draw Footer
      const totalPagesHead = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPagesHead; i++) {
        doc.setPage(i);
        drawPdfFooter(doc, authStore, i, totalPagesHead, isArabic);
      }

      doc.save(`instant_attendance_${new Date().getTime()}.pdf`);
    }
  } catch (error) {
    console.error(error);
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        t("common.errors.exportFailed"),
    );
  } finally {
    loading.value = false;
  }
};

const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const printData = ref([]);
const handlePrint = async () => {
  try {
    const params = {
      ...filters.value,
      paginate: false,
    };

    if (!filters.value.employee_id) {
      delete params.employee_id;
    }

    const res = await instantAttendanceService.getInstantAttendances(params);

    if (!res || !res.data || !res.data.instant_attendances) {
      console.warn("No data to print");
      return;
    }

    const data = res.data.instant_attendances;

    if (!data.length) {
      toast.warning(t("common.noDataToPrint") || "No data to print");
      return;
    }

    printData.value = data;
    const rowsPerPage = 18;
    printTotalPages.value = Math.ceil(data.length / rowsPerPage) || 1;

    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 300));
    window.print();
  } catch (e) {
    console.error(e);
    toast.error(
      e?.response?.data?.message ||
        e?.message ||
        t("common.errors.printFailed"),
    );
  }
};

defineExpose({
  handleExport,
  handlePrint,
  openConfirmModal,
  requesting,
});

const formatTime12 = (time) => {
  if (!time || time === "-------" || time === "--:--") return time;

  // Handle HH:MM:SS or HH:MM format
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

const getStatusClass = (item) => {
  const status = item.status;
  if (status === "executed") return "bg-[#ECFDF3] text-[#085D3A]";
  if (status === "pending") return "bg-[#FEF3F2] text-[#912018]";
  if (status === "expired") return "bg-[#FFFAEB] text-[#B54708]";
  return "bg-gray-100 text-gray-700";
};

const getStatusDotClass = (item) => {
  const status = item.status;
  if (status === "executed") return "bg-[#085D3A]";
  if (status === "pending") return "bg-[#912018]";
  if (status === "expired") return "bg-[#FFFAEB]";
  return "bg-gray-700";
};

onMounted(() => {
  fetchData();
  loadEmployees();
});
</script>

<style scoped>
@media screen {
  .print-only {
    display: none !important;
  }
}

@media print {
  .no-print {
    display: none !important;
  }

  .print-only {
    display: block !important;
  }

  th {
    background-color: #0e5f4a !important;
    color: white !important;
    padding: 12px 8px !important;
    font-size: 10px !important;
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

  body {
    background: white !important;
  }

  .card {
    border: none !important;
    box-shadow: none !important;
  }

  thead {
    display: table-header-group !important;
  }

  tfoot {
    display: table-footer-group !important;
  }

  tr,
  td,
  th {
    page-break-inside: avoid !important;
  }

  table {
    page-break-inside: auto !important;
  }
}
</style>
