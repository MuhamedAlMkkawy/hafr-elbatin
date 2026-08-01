<template>
  <div class="space-y-6">
    <!-- Top Actions -->
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <div class="flex gap-3 items-center">
        <h1 class="text-[20px] font-[600] text-[#000000]">
          {{ pageTitle }}
        </h1>
        <div
          class="text-[16px] font-[500] text-[#0E5F4A] bg-[#E7EFED] border border-[#82ACA1] rounded-full px-4 py-1.5"
        >
          {{ t("common.monthly") }}
        </div>
      </div>
      <div class="flex items-center gap-3" v-if="schedule">
        <span
          :class="[
            'px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5',
            schedule?.status === 'published'
              ? 'bg-[#ECFDF3] text-[#085D3A]'
              : 'bg-[#E5E7EB] text-[#1F2A37]',
          ]"
        >
          <div
            class="rounded-full w-[10px] h-[10px]"
            :class="
              schedule?.status === 'published' ? 'bg-[#085D3A]' : 'bg-[#4D5761]'
            "
          ></div>

          {{ t(`shifts.modals.schedules.status.${schedule?.status}`) }}
        </span>
      </div>
    </div>

    <!-- Details Section -->
    <Card>
      <div class="space-y-6">
        <!-- Header: period label + status -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex gap-20 items-center">
            <span class="text-[#6C737F] font-[500] text-[12px]">
              {{ t("common.month") }}
            </span>
            <h2 class="text-[18px] font-[600] text-[#384250]">
              {{ schedule?.period_label }}
            </h2>
          </div>
        </div>

        <!-- Days Table -->
        <Table
          :loading="loading"
          :items="monthDays"
          :headers="headers"
          max-height="500px"
        >
          <template #cell-index="{ index }">
            <span>
              {{ index + 1 }}
            </span>
          </template>

          <template #cell-dayName="{ item }">
            <span>
              {{ item.dayName }}
            </span>
          </template>

          <template #cell-formattedDate="{ item }">
            <span>
              {{ item.formattedDate }}
            </span>
          </template>

          <template #cell-morning="{ item }">
            <div>
              <span v-if="getAssignment(item.day, 'morning')">
                {{ getAssignment(item.day, "morning")?.employee?.name }}
              </span>
              <span v-else>-</span>
            </div>
          </template>

          <template #cell-evening="{ item }">
            <div>
              <span v-if="getAssignment(item.day, 'evening')">
                {{ getAssignment(item.day, "evening")?.employee?.name }}
              </span>
              <span v-else>-</span>
            </div>
          </template>

          <template #cell-night="{ item }">
            <div>
              <span v-if="getAssignment(item.day, 'night')">
                {{ getAssignment(item.day, "night")?.employee?.name }}
              </span>
              <span v-else>-</span>
            </div>
          </template>
        </Table>
      </div>
    </Card>
    <div class="flex gap-2 justify-end">
      <Button
        variant="secondary"
        size="md"
        @click="goBack"
        class="border-[#D0D5DD] text-[#344054]"
      >
        {{ t("shifts.modals.schedules.back") }}
      </Button>
      <Button
        variant="primary"
        size="md"
        @click="goToEdit"
        v-if="!isPast(schedule) && !loading"
      >
        {{ t("common.edit") }}
      </Button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAppToast } from "@/composables/useAppToast";
import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Table from "@/components/ui/Table.vue";
import { shiftService } from "@/services/shifts";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const setBreadcrumbLabel = inject("setBreadcrumbLabel", null);
const setShiftBreadcrumbLabel = inject("setShiftBreadcrumbLabel", null);

const shiftId = computed(() => route.params.id);
const scheduleId = computed(() => route.params.scheduleId);

const shift = ref(null);
const schedule = ref(null);
const loading = ref(true);

const headers = computed(() => [
  { key: "index", label: "#" },
  { key: "dayName", label: t("common.day") },
  { key: "formattedDate", label: t("common.date") },
  { key: "morning", label: t("shifts.modals.schedules.fields.morning") },
  { key: "evening", label: t("shifts.modals.schedules.fields.evening") },
  { key: "night", label: t("shifts.modals.schedules.fields.night") },
]);

const shiftName = computed(() => {
  if (!shift.value) return "";
  return locale.value === "ar" ? shift.value.name_ar : shift.value.name;
});

const pageTitle = computed(() => {
  if (!schedule.value) return t("shifts.modals.schedules.viewSachedule");
  const prefix = locale.value === "ar" ? "عرض" : "View";
  return `${prefix} ${schedule.value.period_label}`;
});

watch(
  pageTitle,
  (newVal) => {
    if (setBreadcrumbLabel) {
      setBreadcrumbLabel(newVal);
    }
  },
  { immediate: true },
);

watch(
  shiftName,
  (newVal) => {
    if (setShiftBreadcrumbLabel) {
      setShiftBreadcrumbLabel(newVal);
    }
  },
  { immediate: true },
);

const isPast = (schedule) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (schedule?.year < currentYear) return true;
  if (schedule?.year === currentYear && schedule?.month < currentMonth)
    return true;
  return false;
};

/**
 * Build the list of days for the schedule month.
 * Each item carries a `day` number (1-based) used to look up assignments.
 */
const monthDays = computed(() => {
  if (!schedule.value) return [];
  const { year, month } = schedule.value;
  const lastDay = new Date(year, month, 0).getDate();
  const days = [];
  for (let i = 1; i <= lastDay; i++) {
    const date = new Date(year, month - 1, i);
    days.push({
      day: i,
      dayName: date.toLocaleDateString(
        locale.value === "ar" ? "ar-EG" : "en-US",
        { weekday: "long" },
      ),
      formattedDate: `${month}/${i}/${year}`,
    });
  }
  return days;
});

/**
 * Look up a period assignment by day number and period name.
 * API structure: assignments[].day  &  assignments[].periods.{ morning, evening, night }
 */
const getAssignment = (day, period) => {
  const assignment = schedule.value?.assignments?.find((a) => a.day === day);
  return assignment?.periods?.[period] ?? null;
};

const loadData = async () => {
  loading.value = true;
  try {
    const shiftRes = await shiftService.getById(shiftId.value);
    shift.value = shiftRes.data?.shift || shiftRes.data || shiftRes;

    const scheduleRes = await shiftService.getSchedule(
      shiftId.value,
      scheduleId.value,
    );
    schedule.value =
      scheduleRes.data?.schedule || scheduleRes.data || scheduleRes;
  } catch (error) {
    console.error(error);
    toast.error(error);
  } finally {
    loading.value = false;
  }
};

const goToEdit = () => {
  const prefix = locale.value === "en" ? "/en" : "";
  router.push(
    `${prefix}/attendance/settings/shifts/${shiftId.value}/schedules/${scheduleId.value}/edit`,
  );
};

const goBack = () => {
  const prefix = locale.value === "en" ? "/en" : "";
  router.push(
    `${prefix}/attendance/settings/shifts/${shiftId.value}/schedules`,
  );
};

onMounted(loadData);
</script>
