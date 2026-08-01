<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import Table from "@/components/ui/Table.vue";
import Icon from "@/components/ui/Icon.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";

import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const props = defineProps({
  modelValue: Boolean,
  request: Object,
  logs: { type: Array, default: () => [] },
  loading: Boolean,
  scope: String,
  canAction: Boolean,
});

const emit = defineEmits([
  "update:modelValue",
  "withdraw",
  "approve",
  "reject",
  "cancel",
  "edit",
]);

const { t, locale } = useI18n();
const lang = computed(() => locale.value);

const workflowHeaders = computed(() => [
  { key: "action", label: t("externalMissions.modals.action") },
  { key: "performed_by", label: t("externalMissions.modals.actionBy") },
  { key: "created_at", label: t("externalMissions.modals.actionDate") },
]);

const handleClose = () => {
  emit("update:modelValue", false);
};

const getStatusClass = (status) => {
  switch (status) {
    case "approved":
    case "pending":
    case "assigned":
      return "text-[#085D3A] bg-[#ECFDF3]";
    case "withdrawn":
    case "cancelled":
    case "canceled":
      return "text-[#4D5761] bg-[#E5E7EB]";
    default:
      return "text-[#4D5761] bg-[#E5E7EB]";
  }
};

const getStatusDotClass = (status) => {
  switch (status) {
    case "approved":
    case "pending":
    case "assigned":
      return "bg-[#085D3A]";
    case "withdrawn":
    case "cancelled":
    case "canceled":
      return "bg-[#4D5761]";
    default:
      return "bg-[#4D5761]";
  }
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
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="handleClose"
    :title="t('externalMissions.modals.viewTitle')"
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
            {{ t("externalMissions.fields.employeeName") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ request.employee?.name || "-" }}
          </span>
        </div>

        <!-- From Date -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("externalMissions.fields.fromDate") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ formatDate(request.from_date) }}
          </span>
        </div>

        <!-- To Date -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("externalMissions.fields.toDate") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ formatDate(request.to_date) }}
          </span>
        </div>

        <!-- Total Days -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("externalMissions.fields.totalDays") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ request.total_days || 0 }}
          </span>
        </div>

        <!-- Mission Title -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("externalMissions.fields.title") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ request.title || "-" }}
          </span>
        </div>

        <!-- Address -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("externalMissions.fields.address") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ request.address || "-" }}
          </span>
        </div>

        <!-- Status -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("externalMissions.fields.status") }}
          </span>
          <div
            v-if="['pending', 'assigned', 'cancelled', 'withdrawn'].includes(request.status)"
            class="flex items-center gap-2 px-2 py-0.5 rounded-full w-max"
            :class="getStatusClass(request.status)"
          >
            <span
              class="w-2.5 h-2.5 rounded-full"
              :class="getStatusDotClass(request.status)"
            ></span>
            <span class="text-[14px] font-[500]">
              {{
                t(
                  "externalMissions.status." + request.status,
                )
              }}
            </span>
          </div>
          <span v-else class="text-[16px] font-[600] text-[#384250]">-</span>
        </div>

        <!-- Description -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">
            {{ t("externalMissions.fields.description") }}
          </span>
          <span class="text-[16px] font-[600] text-[#384250]">
            {{ request.description || "-" }}
          </span>
        </div>

        <!-- Rejection Reason -->
        <!-- <div
          v-if="request.rejection_reason"
          class="flex items-center pb-3 gap-12 "
        >
          <span class="text-[12px] font-[500] text-red-500 w-[170px]">
            {{ t("externalMissions.modals.rejectTitle") }}
          </span>
          <span class="text-[16px] font-[600] text-red-600">
            {{ request.rejection_reason }}
          </span>
        </div> -->
      </div>

      <!-- Workflow Section -->
      <div v-if="logs && logs.length > 0" class="mt-4">
        <h3 class="text-[12px] font-[500] text-[#6C737F] mb-4">
          {{ t("externalMissions.modals.workflow") }}
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
        <!-- Close Button -->
        <Button
          variant="secondary"
          size="md"
          class="min-w-[75px] !text-[15px]"
          @click="handleClose"
        >
          {{ t("common.cancel") }}
        </Button>

        <template v-if="request && !loading">
          <!-- Withdraw Action -->
          <Button
            v-if="(request.status === 'pending' || request.status === 'assigned') && canAction && authStore.hasPermission('external_mission.withdraw')"
            variant="secondary"
            size="md"
            class="min-w-[94px] !bg-[#E7EFED] !text-[#0E5F4A] hover:!bg-[#DDE6E4] !text-[15px] border border-primary"
            @click="emit('withdraw', request)"
          >
            {{ t("externalMissions.modals.withdraw") }}
          </Button>

          <!-- Edit Action -->
          <Button
            v-if="(request.status === 'pending' || request.status === 'assigned') && canAction && authStore.hasPermission('external_mission.update')"
            variant="primary"
            size="md"
            class="min-w-[75px] !text-[15px]"
            @click="emit('edit', request)"
          >
            {{ t("common.edit") }}
          </Button>
        </template>
      </div>
    </template>
  </Modal>
</template>
