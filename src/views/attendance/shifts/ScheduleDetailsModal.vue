<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="t('shifts.modals.schedules.viewSchedule') + ' - ' + shiftName"
    width="lg"
  >
    <div v-if="schedule" class="py-2 space-y-6">
      <div class="space-y-4">
        <!-- Year -->
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-[#475467] min-w-[140px]">
            {{ t("shifts.modals.schedules.fields.year") }}
          </span>
          <span class="text-sm font-bold text-[#101828]">
            {{ schedule.year }}
          </span>
        </div>

        <!-- Working Days -->
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-[#475467] min-w-[140px]">
            {{ t("shifts.modals.schedules.fields.workingDays") }}
          </span>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="day in sortedWorkingDays"
              :key="day"
              class="px-3 py-1 text-xs font-semibold bg-[#E7EFED] text-[#0E5F4A] rounded-lg border border-[#82ACA1]"
            >
              {{ t(`common.days.${getDayName(day)}`) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Assignments Table -->
      <Table :headers="headers" :items="tableItems" class="mt-4">
        <template #cell-period="{ item }">
          <span class="text-[#344054] font-medium">
            {{ t(`workSystems.shifts.${item.period}`) }}
          </span>
        </template>
        <template #cell-employee="{ item }">
          <span class="text-[#344054] font-bold">
            {{ getAssignment(item.period)?.employee?.name || "-" }}
          </span>
        </template>
      </Table>
    </div>

    <template #footer>
      <div class="flex gap-2 mt-2">
        <Button
          variant="secondary"
          @click="$emit('update:modelValue', false)"
          class="flex-1 bg-[#F2F4F7] text-[#344054] border-none hover:bg-[#EAECF0]"
        >
          {{ t("common.cancel") }}
        </Button>
        <Button
          v-if="!isPast(schedule)"
          variant="primary"
          class="flex-1 bg-[#0E5F4A] hover:bg-[#0c5240] border-none"
          @click="$emit('edit', schedule)"
        >
          {{ t("common.edit") }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import Table from "@/components/ui/Table.vue";

const props = defineProps({
  modelValue: Boolean,
  schedule: Object,
});

defineEmits(["update:modelValue", "edit"]);

const { t, locale } = useI18n();

const headers = computed(() => [
  {
    key: "period",
    label: t("shifts.modals.schedules.fields.period"),
    headerClass: "w-1/2",
  },
  {
    key: "employee",
    label: t("shifts.modals.schedules.fields.employee"),
    headerClass: "w-1/2",
  },
]);

const tableItems = ["morning", "evening", "night"].map((period) => ({
  period,
}));

const isPast = (item) => {
  if (!item) return false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const isMonthly = item.shift?.type === "monthly";

  if (isMonthly) {
    const currentMonth = now.getMonth() + 1;
    if (item.year < currentYear) return true;
    if (item.year === currentYear && item.month < currentMonth) return true;
    return false;
  } else {
    return item.year < currentYear;
  }
};

const shiftName = computed(() => {
  if (!props.schedule?.shift) return "";
  return locale.value === "ar"
    ? props.schedule.shift.name_ar
    : props.schedule.shift.name;
});

const getDayName = (dayValue) => {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  // If dayValue is already a valid day name (string), return it
  if (typeof dayValue === "string" && days.includes(dayValue.toLowerCase())) {
    return dayValue.toLowerCase();
  }

  // If dayValue is a number (or numeric string), use it as an index
  const index = parseInt(dayValue);
  if (!isNaN(index) && index >= 0 && index < 7) {
    return days[index];
  }

  return "sunday"; // Fallback to avoid 'undefined'
};

const sortedWorkingDays = computed(() => {
  if (!props.schedule?.working_days) return [];

  const dayOrder = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const getIndex = (day) => {
    if (typeof day === "number") return day;
    const lowerDay = String(day).toLowerCase();
    const idx = dayOrder.indexOf(lowerDay);
    if (idx !== -1) return idx;
    const num = parseInt(day);
    return isNaN(num) ? 99 : num;
  };

  return [...props.schedule.working_days].sort((a, b) => getIndex(a) - getIndex(b));
});

const getAssignment = (period) => {
  return props.schedule?.assignments?.find((a) => a.period === period);
};
</script>

<style scoped></style>

