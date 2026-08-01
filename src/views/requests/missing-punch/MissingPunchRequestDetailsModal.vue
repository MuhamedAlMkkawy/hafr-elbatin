<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import Table from "@/components/ui/Table.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const props = defineProps({
  modelValue: Boolean,
  request: Object,
  logs: { type: Array, default: () => [] },
  loading: Boolean,
  scope: String,
});

const emit = defineEmits([
  "update:modelValue",
  "withdraw",
  "approve",
  "reject",
]);

const { t, locale } = useI18n();
const lang = computed(() => locale.value);

const workflowHeaders = computed(() => [
  { key: "action", label: t("missingPunchRequests.modals.action") },
  { key: "performed_by", label: t("missingPunchRequests.modals.actionBy") },
  { key: "created_at", label: t("missingPunchRequests.modals.actionDate") },
]);

const handleClose = () => {
  emit("update:modelValue", false);
};

const getStatusClass = (status) => {
  switch (status) {
    case "approved":
    case "تمت الموافقة":
      return "text-[#085D3A] bg-[#ECFDF3]";
    case "pending":
    case "قيد المراجعة":
      return "text-[#93370D] bg-[#FFFAEB]";
    case "rejected":
    case "مرفوض":
      return "text-[#B42318] bg-[#FEF3F2]";
    case "withdrawn":
    case "تم التراجع":
      return "text-[#4D5761] bg-[#E5E7EB]";
    default:
      return "text-[#4D5761] bg-[#E5E7EB]";
  }
};

const getStatusDotClass = (status) => {
  switch (status) {
    case "approved":
    case "تمت الموافقة":
      return "bg-[#085D3A]";
    case "pending":
    case "قيد المراجعة":
      return "bg-[#93370D]";
    case "rejected":
    case "مرفوض":
      return "bg-[#B42318]";
    case "withdrawn":
    case "تم التراجع":
      return "bg-[#4D5761]";
    default:
      return "bg-[#4D5761]";
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
  const day = String(isDateOnly ? date.getUTCDate() : date.getDate()).padStart(2, "0");
  const month = String(isDateOnly ? date.getUTCMonth() + 1 : date.getMonth() + 1).padStart(2, "0");
  const year = String(isDateOnly ? date.getUTCFullYear() : date.getFullYear()).slice(-2);
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
  <Modal
    :model-value="modelValue"
    @update:model-value="handleClose"
    :title="t('missingPunchRequests.modals.viewTitle')"
    width="xl"
  >
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <div v-else-if="request" class="space-y-4 py-4">
      <!-- Details Section -->
      <div class="grid grid-cols-1 gap-y-1">
        <!-- Employee Name -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("missingPunchRequests.fields.employeeName") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ request.employee?.name || "-" }}
          </span>
        </div>

        <!-- Date -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("missingPunchRequests.fields.date") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ formatDate(request.date) }}
          </span>
        </div>

        <!-- Original Check-in -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("missingPunchRequests.fields.originalCheckIn") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{
              formatTime12(request.original_attendance?.check_in_time) || "--:--"
            }}
          </span>
        </div>

        <!-- Modified Check-in -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("missingPunchRequests.fields.checkIn") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ formatTime12(request.check_in_time) || "--:--" }}
          </span>
        </div>

        <!-- Original Check-out -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("missingPunchRequests.fields.originalCheckOut") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{
              formatTime12(request.original_attendance?.check_out_time) || "--:--"
            }}
          </span>
        </div>

        <!-- Modified Check-out -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("missingPunchRequests.fields.checkOut") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ formatTime12(request.check_out_time) || "--:--" }}
          </span>
        </div>

        <!-- Reason -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("missingPunchRequests.fields.reason") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ request.reason || "-" }}
          </span>
        </div>

        <!-- Status -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("missingPunchRequests.fields.status") }}
          </span>
          <div
            class="flex items-center gap-2 px-2 py-0.5 rounded-full w-max"
            :class="getStatusClass(request.status)"
          >
            <span
              class="w-2.5 h-2.5 rounded-full"
              :class="getStatusDotClass(request.status)"
            ></span>
            <span class="text-[14px] font-[500]">
              {{ t("missingPunchRequests.status." + request.status) }}
            </span>
          </div>
        </div>

        <!-- Rejection Reason -->
        <div
          v-if="request.rejection_reason"
          class="flex items-center pb-3 gap-12"
        >
          <span class="text-[12px] font-[500] text-red-500 w-[170px]">
            {{ t("missingPunchRequests.modals.rejectTitle") }}
          </span>
          <span class="text-[16px] font-[600] text-red-600">
            {{ request.rejection_reason }}
          </span>
        </div>
      </div>

      <!-- Workflow Section -->
      <div v-if="logs && logs.length > 0" class="mt-4">
        <h3 class="text-[12px] font-[500] text-[#6C737F] mb-4">
          {{ t("missingPunchRequests.modals.workflow") }}
        </h3>
        <Table :headers="workflowHeaders" :items="logs" :loading="false">
          <template #cell-action="{ item }">
            <span>{{ item.action_label || item.action }}</span>
          </template>
          <template #cell-performed_by="{ item }">
            <span>{{ item.performed_by?.name || "-" }}</span>
          </template>
          <template #cell-created_at="{ item }">
            <span dir="ltr">{{ item.created_at }}</span>
          </template>
        </Table>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-3 w-full">
        <!-- Cancel/Close Button -->
        <Button
          variant="secondary"
          size="md"
          class="min-w-[75px] !text-[15px]"
          @click="handleClose"
        >
          {{ t("common.cancel") }}
        </Button>
        <template v-if="request && !loading">
          <!-- Case 1: Management actions are available (Approve/Reject) -->
          <template
            v-if="
              request.status === 'pending' &&
              scope !== 'own' &&
              (authStore.hasPermission('missing_punch_request.approve') ||
                authStore.hasPermission('missing_punch_request.reject'))
            "
          >
            <!-- Withdraw (Secondary in this case) -->
            <Button
              v-if="
                (request.is_withdrawable || request.status === 'pending') &&
                request.status !== 'approved' &&
                authStore.hasPermission('missing_punch_request.withdraw')
              "
              size="md"
              :class="isPreviousMonth(request.date) ? 'opacity-30 !cursor-not-allowed' : 'hover:!bg-[#DDE6E4]'"
              @click="!isPreviousMonth(request.date) && emit('withdraw', request)"
              class="bg-[#E7EFED] !border !border-[#0E5F4A] !text-[#0E5F4A] hover:!bg-[#DDE6E4]"
            >
              {{ t("missingPunchRequests.modals.withdraw") }}
            </Button>

            <!-- Reject -->
            <Button
              size="md"
              :class="isPreviousMonth(request.date) ? 'opacity-30 !cursor-not-allowed ' : 'hover:bg-[#FEE4E2] hover:border-[#D92D20] hover:!text-[#D92D20]'"
              @click="!isPreviousMonth(request.date) && emit('reject', request)"
              v-if="authStore.hasPermission('missing_punch_request.reject')"
              class="!text-[#D92D20] !border !!border-[#D92D20] bg-[#FEE4E2AB]"
            >
              {{ t("missingPunchRequests.modals.reject") }}
            </Button>

            <!-- Approve -->
            <Button
              variant="primary"
              size="md"
              class="min-w-[98px] !text-[15px]"
              :class="isPreviousMonth(request.date) ? 'opacity-30 !cursor-not-allowed' : ''"
              @click="!isPreviousMonth(request.date) && emit('approve', request)"
              v-if="authStore.hasPermission('missing_punch_request.approve')"
            >
              {{ t("missingPunchRequests.modals.approve") }}
            </Button>
          </template>

          <template
            v-else-if="
              (request.is_withdrawable || request.status === 'pending') &&
              request.status !== 'approved' &&
              authStore.hasPermission('missing_punch_request.withdraw')
            "
          >
            <Button
              variant="primary"
              size="md"
              class="min-w-[98px] !text-[15px]"
              :class="isPreviousMonth(request.date) ? 'opacity-30 !cursor-not-allowed' : ''"
              @click="!isPreviousMonth(request.date) && emit('withdraw', request)"
            >
              {{ t("missingPunchRequests.modals.withdraw") }}
            </Button>
          </template>
        </template>
      </div>
    </template>
  </Modal>
</template>
