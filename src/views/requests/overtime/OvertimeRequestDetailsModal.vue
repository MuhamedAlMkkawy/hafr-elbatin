<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import Table from "@/components/ui/Table.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import SelfieViewer from "@/components/common/SelfieViewer.vue";

import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  request: { type: Object, default: null },
  logs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "withdraw"]);

const { t, locale } = useI18n();
const lang = computed(() => locale.value);

const isSelfieModalOpen = ref(false);
const selfieUrl = ref("");

const openSelfieModal = (url) => {
  selfieUrl.value = url;
  isSelfieModalOpen.value = true;
};

// Workflow Table Headers
const workflowHeaders = computed(() => [
  { key: "event", label: t("overtimeRequests.modals.action") },
  { key: "user_name", label: t("overtimeRequests.modals.actionBy") },
  { key: "created_at", label: t("overtimeRequests.modals.actionDate") },
]);

const handleClose = () => {
  emit("update:modelValue", false);
};

const handleWithdraw = () => {
  handleClose();
  emit("withdraw", props.request);
};

// Helper for status classes
const getStatusClass = (status) => {
  switch (status) {
    case "executed":
    case "منفذ":
      return "text-[#085D3A] bg-[#ECFDF3]";
    case "pending":
    case "غير منفذ":
    case "withdrawn":
    case "تم التراجع":
      return "text-[#4D5761] bg-[#E5E7EB]";
    default:
      return "text-[#4D5761] bg-[#E5E7EB]";
  }
};

const getStatusDotClass = (status) => {
  switch (status) {
    case "executed":
    case "منفذ":
      return "bg-[#085D3A]";
    case "pending":
    case "غير منفذ":
    case "withdrawn":
    case "تم التراجع":
      return "bg-[#4D5761]";
    default:
      return "bg-[#4D5761]";
  }
};

const formatMinutes = (minutes) => {
  if (!minutes) return "00:00";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${remainingMinutes.toString().padStart(2, "0")}`;
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="handleClose"
    :title="t('overtimeRequests.modals.viewTitle')"
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
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">{{
            t("overtimeRequests.fields.employeeName")
          }}</span>
          <span class="text-[16px] font-[600] text-[#384250]">{{
            request.employee?.name || "-"
          }}</span>
        </div>

        <!-- Created By -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">{{
            t("overtimeRequests.fields.createdBy")
          }}</span>
          <span class="text-[16px] font-[600] text-[#384250]">{{
            request.requested_by?.name || "-"
          }}</span>
        </div>

        <!-- Overtime Date -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">{{
            t("overtimeRequests.fields.overtimeDate")
          }}</span>
          <span class="text-[16px] font-[600] text-[#384250]">{{
            request.date || "-"
          }}</span>
        </div>

        <!-- Overtime Check-in -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">{{
            t("overtimeRequests.fields.overtimeCheckIn")
          }}</span>
          <div class="flex items-center gap-2">
            <span class="text-[16px] font-[600] text-[#384250]">{{
              request.check_in_time || "--:--"
            }}</span>
            <div class="flex items-center gap-1">
              <img
                v-if="request.check_in_selfie"
                :src="request.check_in_selfie"
                class="w-6 h-6 rounded-full border border-gray-200 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                alt="Selfie"
                @click="openSelfieModal(request.check_in_selfie)"
              />
              <SvgIcon
                v-if="request.check_in_location"
                name="location"
                v-tooltip="
                  lang === 'ar'
                    ? request.check_in_location?.name_ar ||
                      request.check_in_location?.name
                    : request.check_in_location?.name ||
                      request.check_in_location?.name_ar
                "
              />
            </div>
          </div>
        </div>

        <!-- Overtime Hours -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">{{
            t("overtimeRequests.fields.duration_hours")
          }}</span>
          <span class="text-[16px] font-[600] text-[#384250]">{{
            formatMinutes(request.overtime_minutes)
          }}</span>
        </div>

        <!-- Reason -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">{{
            t("overtimeRequests.fields.reason")
          }}</span>
          <span class="text-[16px] font-[600] text-[#384250]">{{
            request.notes || "-"
          }}</span>
        </div>

        <!-- Status -->
        <div class="flex items-center pb-3 gap-12">
          <span class="text-[12px] font-[500] text-[#6C737F] w-[170px]">{{
            t("overtimeRequests.fields.status")
          }}</span>
          <div
            class="flex items-center gap-2 px-2 py-0.5 rounded-full"
            :class="getStatusClass(request.status)"
          >
            <span
              class="w-2.5 h-2.5 rounded-full"
              :class="getStatusDotClass(request.status)"
            ></span>
            <span class="text-[14px] font-[500]">
              {{ t("overtimeRequests.status." + request.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Workflow Logs Section -->
      <div v-if="logs && logs.length > 0" class="mt-4">
        <h3 class="text-[12px] font-[500] text-[#6C737F] mb-4">
          {{ t("overtimeRequests.modals.workflow") }}
        </h3>
        <Table :headers="workflowHeaders" :items="logs" :loading="false">
          <template #cell-event="{ item }">
            <span>{{ item.event }}</span>
          </template>
          <template #cell-user_name="{ item }">
            <span>{{ item.user_name || "-" }}</span>
          </template>
          <template #cell-created_at="{ item }">
            <span dir="ltr">{{ item.created_at }}</span>
          </template>
        </Table>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end w-full gap-3">
        <Button
          type="button"
          variant="secondary"
          class="w-24"
          @click="handleClose"
        >
          {{ t("common.cancel") }}
        </Button>
        <Button
          v-if="request.status === 'pending' && authStore.hasPermission('overtime_request.withdraw')"
          type="button"
          variant="primary"
          @click="handleWithdraw"
        >
          {{ t("overtimeRequests.modals.withdraw") }}
        </Button>
      </div>
    </template>
    <!-- Selfie Viewer -->
    <SelfieViewer
      v-model="isSelfieModalOpen"
      :image-url="selfieUrl"
      :title="t('dailyAttendance.fields.selfie')"
    />
  </Modal>
</template>
