<template>
  <div class="space-y-6" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
    <!-- BREADCRUMB -->
    <Breadcrumb :items="breadcrumbItems" />

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <h2 class="lg:text-[20px] text-[16px] font-[800] text-[#333333]">
        {{ t("contactView.title") }}
      </h2>

      <!-- Export Button -->
      <Menu as="div" class="relative inline-block text-start">
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

    <!-- ==================== SKELETON ==================== -->
    <template v-if="loading">
      <!-- Card header bar skeleton -->
      <Card class="!p-0 overflow-hidden border-none">
        <div class="bg-[#F3F9F6] py-2 px-4 border-b border-gray-100">
          <div class="skeleton h-[20px] w-[160px] rounded-md" />
        </div>
        <div class="p-5 space-y-6">
          <!-- Top row: meta badges + ref number -->
          <div class="flex items-center justify-between">
            <div class="skeleton h-[36px] w-[200px] rounded-md" />
            <div class="flex items-center gap-4">
              <div class="skeleton h-[22px] w-[110px] rounded-full" />
              <div class="skeleton h-[22px] w-[64px] rounded-full" />
            </div>
          </div>
          <!-- Divider -->
          <div class="border-t border-gray-100" />
          <!-- Sender row -->
          <div class="flex items-center gap-4">
            <div
              class="skeleton w-[64px] h-[64px] rounded-full flex-shrink-0"
            />
            <div class="flex gap-10 flex-1">
              <div class="space-y-2">
                <div class="skeleton h-[12px] w-[80px] rounded-md" />
                <div class="skeleton h-[16px] w-[160px] rounded-md" />
              </div>
              <div class="space-y-2">
                <div class="skeleton h-[12px] w-[80px] rounded-md" />
                <div class="skeleton h-[16px] w-[100px] rounded-md" />
              </div>
              <div class="space-y-2">
                <div class="skeleton h-[12px] w-[80px] rounded-md" />
                <div class="skeleton h-[16px] w-[140px] rounded-md" />
              </div>
            </div>
          </div>
          <!-- Divider -->
          <div class="border-t border-gray-100" />
          <!-- Body skeleton -->
          <div class="space-y-2">
            <div class="skeleton h-[12px] w-[60px] rounded-md" />
            <div class="skeleton h-[14px] w-full rounded-md" />
            <div class="skeleton h-[14px] w-[90%] rounded-md" />
            <div class="skeleton h-[14px] w-[80%] rounded-md" />
            <div class="skeleton h-[14px] w-[85%] rounded-md" />
          </div>
        </div>
      </Card>

      <!-- Attachments skeleton -->
      <Card class="!p-0 overflow-hidden border-none">
        <div
          class="bg-[#F3F9F6] py-2 px-4 border-b border-gray-100 flex items-center justify-between"
        >
          <div class="skeleton h-[20px] w-[100px] rounded-md" />
          <div class="skeleton h-[20px] w-[24px] rounded-md" />
        </div>
        <div class="p-5 flex gap-3">
          <div
            v-for="i in 2"
            :key="i"
            class="skeleton h-[44px] flex-1 rounded-lg"
          />
        </div>
      </Card>

      <!-- Footer skeleton -->
      <div class="flex justify-start pt-2">
        <div class="skeleton h-[40px] w-[140px] rounded-md" />
      </div>
    </template>

    <!-- ==================== ACTUAL CONTENT ==================== -->
    <template v-else-if="message">
      <!-- Message Details Card -->
      <Card class="!p-0 overflow-hidden border-none">
        <!-- Card Header -->
        <div
          class="bg-[#F3F9F6] py-2 px-4 border-b border-gray-100 flex items-center gap-2"
        >
          <SvgIcon name="info" />
          <h3 class="font-[500] text-[#1F2A37] text-[16px] text-start">
            {{ t("contactView.message_details") }}
          </h3>
        </div>

        <div class="p-5">
          <!-- Subject + meta row -->
          <div class="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div class="flex gap-5">
              <!-- Subject -->
              <h3 class="text-[18px] font-[700] text-[#1F2A37] text-start">
                {{ message.subject || "--" }}
              </h3>
              <!-- Time ago -->
              <span class="flex items-center gap-1 text-[13px] text-[#6C737F]">
                <SvgIcon name="time_ago" class="scale-[0.85]" />
                {{ message?.display_time }}
              </span>
            </div>

            <!-- Badges + timestamp -->
            <div class="flex items-center gap-3 flex-wrap">
              <!-- Status badge -->
              <span
                class="inline-flex items-center gap-1.5 text-[13px] font-[500] px-3 py-0.5 rounded-full"
                :class="statusClass(message.status)"
              >
                <span
                  class="w-2 h-2 rounded-full"
                  :class="statusDotClass(message.status)"
                />
                {{ message.status_label }}
              </span>

              <!-- Priority badge -->
              <span
                class="inline-flex items-center gap-1.5 text-[13px] font-[500] px-3 py-0.5 rounded-full"
                :class="priorityClass(message.priority)"
              >
                <span
                  class="w-2 h-2 rounded-full"
                  :class="priorityDotClass(message.priority)"
                />
                {{ message.priority_label }}
              </span>
            </div>
          </div>

          <!-- Reference number -->
          <p class="text-[13px] text-[#6C737F] mb-5">
            {{ t("contactView.ref_number") }}:
            <span>{{ message.message_number || "--" }}</span>
          </p>

          <!-- Divider -->
          <div class="border-t border-gray-100 mb-5" />

          <!-- Sender info row -->
          <div class="flex items-center gap-5 flex-wrap mb-5">
            <!-- Avatar -->
            <div
              class="w-[80px] h-[80px] rounded-full overflow-hidden flex-shrink-0 bg-gray-100"
            >
              <img
                v-if="message?.employee?.image"
                :src="message?.employee?.image"
                alt="Avatar"
                class="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                @click="openViewer(message?.employee?.image, message.name)"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center bg-[#E7EFED] text-[#0E5F4A] text-[20px] font-[700]"
              >
                {{ message.name?.charAt(0) || "?" }}
              </div>
            </div>

            <!-- Sender name -->
            <div class="flex flex-col min-w-[160px] text-start">
              <span class="text-[12px] text-[#6C737F] mb-1">
                {{ t("contactView.sender_name") }}
              </span>
              <span class="text-[15px] font-[700] text-[#1F2A37]">
                {{ message.name || "--" }}
              </span>
            </div>

            <!-- Department -->
            <div class="flex flex-col min-w-[160px] text-start">
              <span class="text-[12px] text-[#6C737F] mb-1">
                {{ t("contactView.department") }}
              </span>
              <span
                class="text-[15px] font-[600] text-[#384250]"
                v-if="message?.employee?.department"
              >
                {{ message.employee?.department?.[`name_${locale}`] || "--" }}
              </span>
              <span class="text-[15px] font-[600] text-[#384250]" v-else>
                --
              </span>
            </div>

            <!-- Contact / Email -->
            <div class="flex flex-col min-w-[160px] text-start">
              <span class="text-[12px] text-[#6C737F] mb-1">
                {{ t("contactView.contact") }}
              </span>
              <span class="text-[15px] font-[500] text-[#384250]">
                {{ message.email || "--" }}
              </span>
            </div>
          </div>

          <!-- Divider -->
          <!-- <div class="border-t border-gray-100 mb-5" /> -->

          <!-- Message body -->
          <div class="mt-8 flex flex-col">
            <p class="text-[13px] text-[#6C737F] mb-2">
              {{ t("contactView.content") }}
            </p>
            <div
              class="text-[15px] text-[#1F2A37] leading-[1.9] font-[600] text-start"
              v-html="message.body || message.message || '--'"
            />
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-gray-100 mb-5" />

        <!-- Attachments Section -->
        <div
          v-if="message.attachments?.length"
          class="px-4 flex items-center gap-[5px] justify-start"
        >
          <div class="flex items-center gap-2">
            <h3 class="font-[500] text-[#1F2A37] text-[16px]">
              {{ t("contactView.attachments") }}
            </h3>
          </div>
          (<span class="text-[14px] text-[#106c55]">{{
            message.attachments.length
          }}</span
          >)
        </div>

        <div class="p-5">
          <div class="flex flex-wrap gap-3">
            <template
              v-for="(attachment, index) in message.attachments"
              :key="index"
            >
              <!-- Image Attachment -->
              <div
                v-if="isImage(attachment.url || attachment)"
                @click="
                  openViewer(attachment.url || attachment, attachment.name)
                "
                class="flex items-center justify-between gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 flex-1 min-w-[260px] hover:!text-[#0E5F4A] cursor-pointer transition-all hover:border-[#0E5F4A]/50 group"
              >
                <div class="flex items-center gap-2 overflow-hidden">
                  <div
                    class="w-[28px] h-[28px] rounded-md flex items-center justify-center flex-shrink-0 bg-gray-50 group-hover:bg-[#E7EFED]"
                  >
                    <SvgIcon name="eye" />
                  </div>
                  <div
                    class="text-[13px] text-[#384250] truncate transition-colors group-hover:text-[#0E5F4A]"
                  >
                    {{ attachment.name || t("contactView.attachment_name") }}
                  </div>
                </div>
                <div
                  class="text-[11px] text-[#9CA3AF] px-2 py-0.5 bg-gray-50 rounded group-hover:bg-[#E7EFED] group-hover:text-[#0E5F4A]"
                >
                  {{ t("common.view") || "View" }}
                </div>
              </div>

              <!-- Other Attachments (Download/Open) -->
              <a
                v-else
                :href="attachment.url || attachment"
                target="_blank"
                class="flex items-center justify-between gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 flex-1 min-w-[260px] hover:!text-[#0E5F4A] transition-all hover:border-[#0E5F4A]/50 group"
              >
                <div class="flex items-center gap-2 overflow-hidden">
                  <div
                    class="w-[28px] h-[28px] rounded-md flex items-center justify-center flex-shrink-0 bg-gray-50 group-hover:bg-[#E7EFED]"
                  >
                    <SvgIcon name="check" />
                  </div>
                  <div
                    class="text-[13px] text-[#384250] truncate transition-colors group-hover:text-[#0E5F4A]"
                  >
                    {{ attachment.name || t("contactView.attachment_name") }}
                  </div>
                </div>
              </a>
            </template>
          </div>
        </div>
      </Card>

      <div
        v-if="
          authStore.hasPermission('employee_message.updateStatus') &&
          message?.status !== 'solved'
        "
        class="flex justify-end w-full gap-3 pt-2"
      >
        <Button variant="primary" size="md" @click="showDeleteModal = true">
          {{ t("contactView.close_solution") }}
        </Button>
      </div>
    </template>
    <Modal
      :modelValue="showDeleteModal"
      type="primary"
      width="sm"
      icon="info"
      @close="showDeleteModal = false"
      borderColor="#0e5f4a"
    >
      <h4 class="text-[16px] font-[500] mt-[10px] mb-[15px]">
        {{ t("contact.confirmPopup.title") }}
      </h4>
      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button
            variant="primary"
            class="w-full justify-center"
            @click="handleCloseMessage"
          >
            {{ t("contact.confirmPopup.confirm") }}
          </Button>
          <Button
            variant="ghost"
            class="w-full justify-center hover:!bg-[#4a5565] hover:!text-[#fff]"
            @click="showDeleteModal = false"
          >
            {{ t("contact.confirmPopup.cancel") }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Selfie Viewer -->
    <SelfieViewer
      v-model="showViewer"
      :image-url="viewerUrl"
      :title="viewerTitle"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";

import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";

import { contactService } from "@/services/contact";
import { useAppToast } from "@/composables/useAppToast";
import { useAuthStore } from "@/stores/auth";
import Modal from "@/components/ui/Modal.vue";
import SelfieViewer from "@/components/common/SelfieViewer.vue";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const isRtl = computed(() => locale.value === "ar");
const router = useRouter();
const route = useRoute();
const toast = useAppToast();
const authStore = useAuthStore();

// ############################### State
const loading = ref(true);
const message = ref(null);

// Viewer state
const showViewer = ref(false);
const viewerUrl = ref("");
const viewerTitle = ref("");

const openViewer = (url, title = "") => {
  if (!url) return;
  viewerUrl.value = url;
  viewerTitle.value = title;
  showViewer.value = true;
};

const isImage = (url) => {
  if (!url) return false;
  const path = typeof url === "string" ? url : url.url;
  if (!path) return false;
  return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(path.split("?")[0]);
};

// ############################### Breadcrumb
const breadcrumbItems = computed(() => {
  const prefix = locale.value === "en" ? "/en" : "";
  return [
    { label: t("sidebar.support") },
    { label: t("sidebar.supportContact"), to: `${prefix}/support/contact` },
    { label: t("contactView.title") },
  ];
});

// ############################### Load
const loadMessage = async () => {
  loading.value = true;
  try {
    const res = await contactService.getById(route.params.id);

    const rawMessage = res.data?.employee_message ?? res.data ?? null;

    if (!rawMessage) {
      toast.error(t("common.error"));
      return;
    }

    // Normalize attachments
    rawMessage.attachments = (rawMessage.attachments || []).map(
      (att, index) => {
        // case 1: string (URL only)
        if (typeof att === "string") {
          const fileName = att.split("/").pop()?.split("?")[0]; // extract name from URL

          return {
            id: index,
            name: fileName || `Attachment ${index + 1}`,
            url: att,
          };
        }

        // case 2: object
        const fileNameFromUrl = att.url?.split("/").pop()?.split("?")[0];

        return {
          id: att.id ?? index,
          name:
            att.name || // preferred
            att.file_name || // common backend key
            att.filename || // another common key
            fileNameFromUrl || // fallback from URL
            `Attachment ${index + 1}`,
          url: att.url || att.path || "",
        };
      },
    );
    message.value = rawMessage;
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

// ############################### Helpers
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
};

const timeAgo = (date) => {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (isRtl.value) {
    if (days > 0) return `منذ ${days} ${days === 1 ? "يوم" : "أيام"}`;
    if (hrs > 0) return `منذ ${hrs} ${hrs === 1 ? "ساعة" : "ساعات"}`;
    return `منذ ${mins} دقيقة`;
  }
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hrs > 0) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
};

// ############################### Status / Priority
const statusClass = (s) => ({
  "bg-[#DBEAFE] text-[#1D4ED8]": s === "new",
  "bg-[#FEF9C3] text-[#92400E]": s === "under_processing",
  "bg-[#ECFDF3] text-[#065F46]": s === "solved",
});
const statusDotClass = (s) => ({
  "bg-[#1D4ED8]": s === "new",
  "bg-[#92400E]": s === "under_processing",
  "bg-[#065F46]": s === "solved",
});
const priorityClass = (p) => ({
  "text-[#B91C1C]": p === "high",
  "text-[#92400E]": p === "medium",
  "text-[#374151]": p === "low",
});
const priorityDotClass = (p) => ({
  "bg-[#B91C1C]": p === "high",
  "bg-[#92400E]": p === "medium",
  "bg-[#374151]": p === "low",
});

// ############################### Actions
const goBack = () => router.go(-1);

const handleCloseMessage = async () => {
  try {
    await contactService.update(route.params.id, {
      status: "solved",
    });
    toast.success(t("contactView.closed_success"));
    router.go(-1);
  } catch (e) {
    toast.error(e);
  }
};

const showDeleteModal = ref(false);

// ############################### Export
const arrayBufferToBase64 = (buf) => {
  let b = "";
  new Uint8Array(buf).forEach((byte) => (b += String.fromCharCode(byte)));
  return window.btoa(b);
};

const handleExport = async (format) => {
  if (!message.value) return;

  const fileName = `message_${message.value.message_number || route.params.id}`;
  // ===================== DATA STRUCTURE (LIKE UI)
  const data = {
    ref: message.value.message_number || "--",
    subject: message.value.subject || "--",
    sender: message.value.name || "--",
    department:
      message.value.employee?.department?.[`name_${locale.value}`] || "--",
    email: message.value.email || "--",
    status: message.value.status_label || "--",
    priority: message.value.priority_label || "--",
    date: formatDate(message.value.created_at) || "--",
    content: message.value.body || message.value.message || "--",
    attachments:
      message.value.attachments?.map((a) => a.name).join(", ") || "--",
  };

  // ===================== EXCEL =====================
  if (format === "excel") {
    const excelData = [
      { Field: t("contactView.ref_number"), Value: data.ref },
      { Field: t("contact.list.subject"), Value: data.subject },
      { Field: t("contactView.sender_name"), Value: data.sender },
      { Field: t("contactView.department"), Value: data.department },
      { Field: t("contactView.contact"), Value: data.email },
      { Field: t("contact.list.status"), Value: data.status },
      { Field: t("contact.list.priority"), Value: data.priority },
      { Field: t("contact.list.date"), Value: data.date },
      { Field: t("contactView.content"), Value: data.content },
      { Field: t("contactView.attachments"), Value: data.attachments },
    ];

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Message");

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  // ===================== PDF =====================
  else if (format === "pdf") {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    try {
      const fontRes = await fetch(IBMPlexSansArabicRegular);
      const fontBase64 = arrayBufferToBase64(await fontRes.arrayBuffer());
      doc.addFileToVFS("IBMPlexSansArabic-Regular.ttf", fontBase64);
      doc.addFont("IBMPlexSansArabic-Regular.ttf", "IBMPlexSansArabic", "normal");

      const fontResBold = await fetch(IBMPlexSansArabicBold);
      const fontBase64Bold = arrayBufferToBase64(await fontResBold.arrayBuffer());
      doc.addFileToVFS("IBMPlexSansArabic-Bold.ttf", fontBase64Bold);
      doc.addFont("IBMPlexSansArabic-Bold.ttf", "IBMPlexSansArabic", "bold");

      doc.setFont("IBMPlexSansArabic", "normal");
    } catch (_) {
      console.error("Font loading failed");
    }

    const isArabic = isRtl.value;
    const pageWidth = doc.internal.pageSize.width;

    // Draw Header
    drawPdfHeader(doc, authStore, isArabic);

    // Subtitle (Title)
    doc.setFontSize(11);
    doc.setFont("IBMPlexSansArabic", "bold");
    const titleStr = t("contactView.title");
    const fullTitle = isArabic
      ? `${titleStr} :عنوان التقرير`
      : `Report Title: ${titleStr}`;
    doc.text(fullTitle, pageWidth / 2, 40, { align: "center" });
    doc.setFont("IBMPlexSansArabic", "normal");

    let y = 55;
    const align = isArabic ? "right" : "left";
    const labelX = isArabic ? pageWidth - 10 : 10;
    const valueX = isArabic ? pageWidth - 60 : 60;

    const addLine = (label, value) => {
      doc.setFontSize(11);
      doc.setFont("IBMPlexSansArabic", "bold");
      const labelText = isArabic ? `:${label}` : `${label}:`;
      doc.text(labelText, labelX, y, { align });
      doc.setFont("IBMPlexSansArabic", "normal");
      doc.setFontSize(10);
      doc.text(String(value), valueX, y, { align });
      y += 8;
    };

    // ================= DETAILS =================
    addLine(t("contactView.ref_number"), data.ref);
    addLine(t("contact.list.subject"), data.subject);
    addLine(t("contactView.sender_name"), data.sender);
    addLine(t("contactView.department"), data.department);
    addLine(t("contactView.contact"), data.email);
    addLine(t("contact.list.status"), data.status);
    addLine(t("contact.list.priority"), data.priority);
    addLine(t("contact.list.date"), data.date);

    y += 5;

    // ================= CONTENT =================
    doc.setFontSize(12);
    doc.setFont("IBMPlexSansArabic", "bold");
    doc.text(t("contactView.content"), labelX, y, { align });
    y += 6;

    doc.setFontSize(10);
    doc.setFont("IBMPlexSansArabic", "normal");
    const splitContent = doc.splitTextToSize(data.content, 180);
    doc.text(splitContent, labelX, y, { align });
    y += splitContent.length * 6 + 10;

    // ================= ATTACHMENTS =================
    doc.setFontSize(12);
    doc.setFont("IBMPlexSansArabic", "bold");
    doc.text(t("contactView.attachments"), labelX, y, { align });
    y += 6;

    doc.setFontSize(10);
    doc.setFont("IBMPlexSansArabic", "normal");

    if (message.value.attachments?.length) {
      message.value.attachments.forEach((att) => {
        const attText = isArabic ? `${att.name} -` : `- ${att.name}`;
        doc.text(attText, isArabic ? labelX - 2 : labelX + 2, y, {
          align,
        });
        y += 6;
      });
    } else {
      doc.text("--", labelX, y, { align });
    }

    // Draw Footer (Correct pagination like EmployeesIndexView)
    const totalPagesPDF = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPagesPDF; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, authStore, i, totalPagesPDF, isArabic, true);
    }

    doc.save(`${fileName}.pdf`);
  }
};

// ############################### Init
onMounted(async () => await loadMessage());

watch(
  () => route.params.id,
  (newValue) => {
    if (newValue) {
      loadMessage();
    }
  },
);
</script>

<style scoped>
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
