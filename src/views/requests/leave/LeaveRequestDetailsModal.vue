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
  show: Boolean,
  request: Object,
  loading: Boolean,
});

const emit = defineEmits(["close", "withdraw", "approve", "reject"]);

const { t, locale } = useI18n();
const lang = computed(() => locale.value);

const workflowLogs = computed(() => props.request?.logs || []);

const workflowHeaders = computed(() => [
  { key: "action", label: t("leaveRequests.modals.action") },
  { key: "performed_by", label: t("leaveRequests.modals.actionBy") },
  { key: "created_at", label: t("leaveRequests.modals.actionDate") },
]);

const getStatusClass = (status) => {
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

const getStatusDotClass = (status) => {
  switch (status) {
    case "approved":
      return "bg-[#085D3A]";
    case "pending":
      return "bg-[#B54708]";
    case "rejected":
      return "bg-[#B42318]";
    case "withdrawn":
    case "cancelled":
      return "bg-[#4D5761]";
    default:
      return "bg-[#4D5761]";
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

  const day = String(
    isDateOnly ? date.getUTCDate() : date.getDate()
  ).padStart(2, "0");

  const month = String(
    isDateOnly ? date.getUTCMonth() + 1 : date.getMonth() + 1
  ).padStart(2, "0");

  const year = String(
    isDateOnly ? date.getUTCFullYear() : date.getFullYear()
  ).slice(-2);

  return `${month}/${day}/${year}`;
};

const handleClose = () => emit("close");
const handleWithdraw = () => emit("withdraw", props.request);
const handleApprove = () => emit("approve", props.request);
const handleReject = () => emit("reject", props.request);

const isCurrentMonth = computed(() => {
  const dateStr = props.request?.from_date || props.request?.date;
  if (!dateStr) return false;
  const now = new Date();
  const itemDate = new Date(dateStr);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return itemDate >= currentMonthStart || props.request.is_finalized === false;
});
</script>

<template>
  <Modal
    :model-value="show"
    @close="handleClose"
    :title="t('leaveRequests.modals.viewTitle')"
    width="xl"
  >
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <!-- Content -->
    <div v-else-if="request" class="space-y-4 py-4">
      <div class="grid grid-cols-1 gap-y-1">

        <!-- Employee -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("employees.fields.employeeName") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ request.employee?.name || "-" }}
          </span>
        </div>

        <!-- Leave Type -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("leaveRequests.fields.leaveType") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ lang === "ar"
              ? request.leave_type?.name_ar
              : request.leave_type?.name }}
          </span>
        </div>

        <!-- From Date -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("leaveRequests.fields.fromDate") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ formatDate(request.from_date) }}
          </span>
        </div>

        <!-- To Date -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("leaveRequests.fields.toDate") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ formatDate(request.to_date) }}
          </span>
        </div>

        <!-- Duration -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("leaveRequests.balance.duration") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ request.duration_days }} {{ t("leaveRequests.balance.days") }}
          </span>
        </div>
        
        <!-- Reason -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("leaveRequests.fields.reason") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ request.reason || "-" }}
          </span>
        </div>

        <!-- Rejection Reason -->
        <div
          v-if="request.status === 'rejected' && request.rejection_reason"
          class="flex items-center pb-3 gap-12"
        >
          <span class="text-[12px] font-[500] text-red-500 w-[170px]">
            {{ t("leaveRequests.fields.rejectionReason") }}
          </span>

          <span class="text-[16px] font-[600] text-red-600">
            {{ request.rejection_reason }}
          </span>
        </div>

        <!-- Status -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("leaveRequests.fields.status") }}
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
              {{ t("leaveRequests.status." + request.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Workflow -->
      <div v-if="workflowLogs.length > 0" class="mt-4">
        <h3 class="text-[12px] font-[500] text-[#6C737F] mb-4">
          {{ t("leaveRequests.modals.workflow") }}
        </h3>

        <Table :headers="workflowHeaders" :items="workflowLogs">
          <template #cell-action="{ item }">
            {{ t("auditLogs.events." + item.action) || item.action }}
          </template>

          <template #cell-performed_by="{ item }">
            {{ item.user?.name || "-" }}
          </template>

          <template #cell-created_at="{ item }">
            {{ formatDate(item.created_at) }}
          </template>
        </Table>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex flex-wrap justify-end gap-2 w-full">
        <Button variant="secondary" @click="handleClose">
          {{ t("common.cancel") }}
        </Button>

        <template v-if="request && (request.status === 'pending' || request.status === 'approved') ">
          <Button
            v-if="request.is_withdrawable && isCurrentMonth && authStore.hasPermission('leave_request.withdraw')"
            :variant="request.status === 'approved' ? 'primary' : 'secondary'"
            :class="request.status === 'approved' ? '' : '!bg-[#E7EFED] !text-[#0E5F4A] border border-primary'"
            @click="handleWithdraw"
          >
            {{ t("leaveRequests.modals.withdraw") }}
          </Button>

          <template v-if="request.status === 'pending' && isCurrentMonth">
            <Button @click="handleReject" class="bg-[#FEF3F2] !text-[#D92D20] hover:bg-[#FDE4E2]" v-if="authStore.hasPermission('leave_request.reject')">
              {{ t("leaveRequests.modals.reject") }}
            </Button>
            <Button variant="primary" @click="handleApprove" v-if="authStore.hasPermission('leave_request.approve')">
              {{ t("leaveRequests.modals.approve") }}
            </Button>
          </template>
        </template>
      </div>
    </template>
  </Modal>
</template>