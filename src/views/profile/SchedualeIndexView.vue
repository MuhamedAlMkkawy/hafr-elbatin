<template>
  <div
    class="schedule-page font-[Tajawal] bg-[#f4f6f9] text-[#1a2332] lg:mx-2"
    :class="calendarWeeks?.length ? 'min-h-screen' : ''"
    :dir="lang === 'ar' ? 'rtl' : 'ltr'"
  >
    <!-- ====== Loading Skeleton ====== -->
    <template v-if="loading">
      <!-- Breadcrumb Skeleton -->
      <div class="flex items-center gap-1.5 px-3 pt-3">
        <Skeleton width="w-24" height="h-4" />
        <Skeleton width="w-24" height="h-4" />
        <Skeleton width="w-32" height="h-4" />
      </div>

      <!-- Page Title Skeleton -->
      <div class="mt-2.5 mb-4">
        <Skeleton height="h-12" customClass="rounded-lg" />
      </div>

      <!-- Controls Skeleton -->
      <div
        class="bg-white mt-2.5 mb-4 px-3 rounded-lg flex justify-between items-center flex-wrap gap-3 py-[15px]"
      >
        <div class="flex flex-wrap gap-3">
          <Skeleton v-for="n in 4" :key="n" width="w-16" height="h-4" />
        </div>
        <div class="flex items-center gap-3">
          <Skeleton width="w-24" height="h-6" />
        </div>
      </div>

      <!-- Calendar Grid Skeleton -->
      <div class="rounded-xl overflow-x-auto">
        <!-- Day Headers Skeleton -->
        <div class="hidden lg:grid grid-cols-7 gap-[10px]">
          <Skeleton v-for="n in 7" :key="n" height="h-10" />
        </div>

        <!-- Weeks Skeleton -->
        <div
          v-for="week in 5"
          :key="week"
          class="grid grid-cols-1 lg:grid-cols-7 gap-[10px] mt-2"
        >
          <div
            v-for="day in 7"
            :key="day"
            class="min-h-[190px] bg-white rounded-[8px] p-2 flex flex-col gap-2"
          >
            <Skeleton width="w-6" height="h-4" />
            <hr class="border-t border-gray-200" />
            <div class="flex flex-col gap-2 mt-2">
              <Skeleton width="w-20" height="h-5" />
              <div class="flex gap-3">
                <Skeleton width="w-10" height="h-4" />
                <Skeleton width="w-10" height="h-4" />
              </div>
              <Skeleton width="w-full" height="h-4" customClass="mt-auto" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ====== Actual Content ====== -->
    <template v-else>
      <template v-if="calendarWeeks?.length">
        <!-- BREADCRUMB -->
        <Breadcrumb :items="breadcrumbItems" class="mb-2" />

        <!-- Page Title -->
        <header
          class="bg-white mt-2.5 mb-4 px-3 rounded-lg flex items-center justify-between no-print"
        >
          <h1 class="text-[16px] py-[15px] font-[600] text-[#333333]">
            {{ t("scheduale.title") }}
          </h1>
        </header>

        <!-- Controls Row -->
        <div
          class="bg-white mt-2.5 mb-4 px-3 rounded-lg flex justify-between items-center flex-wrap gap-3 py-[15px]"
        >
          <!-- Legend -->
          <div class="flex flex-wrap items-center gap-3">
            <div
              v-for="shift in shifts"
              :key="shift.type"
              class="flex items-center gap-2"
            >
              <span
                class="w-2.5 h-2.5 rounded-full"
                :style="{ background: getShiftColor(shift.type) }"
              ></span>
              <span class="text-[16px] font-[500] text-[#1F2A37]">{{
                getShiftName(shift.type)
              }}</span>
            </div>
          </div>

          <!-- Month Navigator -->
          <div class="flex items-center gap-2.5 px-2 py-1.5">
            <button
              @click="prevMonth"
              class="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f3f4f6] transition-colors"
              :title="t('common.previous')"
            >
              <SvgIcon
                name="chevron-right"
                :classes="lang === 'ar' ? '' : 'rotate-180'"
              />
            </button>
            <span
              class="text-[16px] font-semibold text-[#303236]\ text-center"
              >{{ currentMonthLabel }}</span
            >
            <button
              @click="nextMonth"
              class="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f3f4f6] transition-colors"
              :title="t('common.next')"
            >
              <SvgIcon
                name="chevron-right"
                :classes="lang === 'ar' ? 'rotate-180' : ''"
              />
            </button>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="rounded-xl overflow-x-auto">
          <div
            class="hidden lg:grid grid-cols-7 !gap-[10px] justify-between rounded-[8px]"
          >
            <div
              v-for="day in dayNames"
              :key="day"
              class="text-start px-2 py-3 text-[16px] rounded-[8px] font-[600] text-[#303236] border-b border-[#e8ecf2] bg-white max-w-[98%] mb-[8px]"
            >
              {{ day }}
            </div>
          </div>

          <!-- Weeks -->
          <div
            v-for="(week, wi) in calendarWeeks"
            :key="wi"
            class="grid grid-cols-1 lg:grid-cols-7 !gap-[10px] !mb-[12px] justify-between rounded-[15px]"
          >
            <div
              v-for="(cell, ci) in week"
              :key="ci"
              class="min-h-[190px] h-full p-2 bg-white flex flex-col gap-2 relative transition-colors duration-150 user-select-none max-w-[98%] !rounded-[8px]"
              :class="{
                'hidden lg:block opacity-50 border border-transparent': !cell,
                'bg-[#fafbfc] opacity-50': cell && !cell.currentMonth,
                'bg-[#f0f9f6]': cell && cell.isToday,
                'hover:bg-[#f8fafb]': cell,
              }"
            >
              <template v-if="cell">
                <!-- Day number -->
                <div class="flex justify-between items-center">
                  <span
                    class="text-[14px] font-bold text-[#1a2332]"
                    :class="{
                      'bg-[#0e5f4a] text-white w-[22px] h-[22px] flex items-center justify-center rounded-full':
                        cell.isToday,
                    }"
                  >
                    {{ cell.day }}
                  </span>
                  <span
                    class="lg:hidden text-[14px] font-medium text-[#6C737F]"
                  >
                    {{ dayNames[ci] }}
                  </span>
                </div>
                <hr class="border-t border-[1px] border-[#F0F1F3]" />

                <!-- Shift Card -->
                <div
                  v-if="cell.shiftType"
                  class="rounded-lg flex flex-col h-full"
                >
                  <!-- Header with icon and label -->
                  <div class="flex items-center gap-[10px] px-2 mb-auto">
                    <span>
                      <SvgIcon
                        v-if="
                          ['rest', 'official_holiday', 'leave'].includes(
                            cell?.shiftType,
                          )
                        "
                        name="rest_icon"
                        classes="scale-[150%]"
                      />
                      <SvgIcon
                        v-else
                        name="working_icon"
                        classes="scale-[150%]"
                      />
                    </span>
                    <!-- <span class="text-[14px] font-[500] text-[#0D121C]">{{
                      getShiftName(cell.shiftType) || "--"
                    }}</span> -->
                    <span class="text-[14px] font-[500] text-[#0D121C]">
                      {{
                        ["rest", "official_holiday", "leave"].includes(
                          cell?.shiftType,
                        )
                          ? t("scheduale.shifts.leave")
                          : workSystemType == "shift"
                            ? t("scheduale.shifts.shift")
                            : getShiftName(cell?.shiftType)
                      }}
                    </span>
                  </div>

                  <!-- Time info -->
                  <div
                    v-if="cell?.details?.from_time && cell?.details?.to_time"
                    class="flex gap-3 text-[12px] text-[#1a2332]"
                  >
                    <div
                      class="flex flex-col flex-grow-1 items-center gap-[5px]"
                    >
                      <span class="text-[#9ca3af] text-[12px] font-[500]">{{
                        t("scheduale.from")
                      }}</span>
                      <span class="text-[14px] font-[500] text-[#0D121C]">{{
                        cell?.details?.from_time
                      }}</span>
                    </div>
                    <div
                      class="flex flex-col flex-grow-1 items-center gap-[5px]"
                    >
                      <span class="text-[#9ca3af] text-[12px] font-[500]">{{
                        t("scheduale.to")
                      }}</span>
                      <span class="text-[14px] font-[500] text-[#0D121C]">{{
                        cell?.details?.to_time
                      }}</span>
                    </div>
                  </div>

                  <!-- Event label -->
                  <div
                    v-if="
                      ['leave', 'official_holiday', 'rest'].includes(cell?.type)
                    "
                    class="text-[12px] text-[#6C737F] rounded px-2 py-1 mt-1"
                  >
                    {{ formatEventLabel(cell.eventLabel) || "---" }}
                  </div>

                  <!-- Shift type badge -->
                  <div
                    class="flex items-center justify-center gap-1.5 text-[14px] font-medium h-[35px] rounded-[6px] w-full max-w-full mt-[12px]"
                    :style="{
                      background: getShiftBG(cell.shiftType),
                      color: getShiftColor(cell.shiftType),
                    }"
                  >
                    <span
                      class="w-[6px] h-[6px] rounded-full flex-shrink-0"
                      :style="{ background: getShiftColor(cell.shiftType) }"
                    ></span>
                    {{
                      formatEventLabel(
                        getShiftName(
                          cell.details?.leave_type ||
                            cell?.details?.work_type_label ||
                            cell?.details?.holiday_name ||
                            cell?.details?.mission_title ||
                            cell?.shiftType,
                        ),
                      )
                    }}
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <Empty v-else :text="t('scheduale.empty')" />
    </template>
  </div>
</template>

<script setup>
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import Skeleton from "@/components/ui/Skeleton.vue";
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import schedualeService from "@/services/scheduale";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Empty from "@/components/ui/Empty.vue";

const { t, locale } = useI18n();
const route = useRoute();
const lang = computed(() => locale.value);

// ===== Breadcrumb =====
const breadcrumbItems = computed(() => {
  const prefix = locale.value === "en" ? "/en" : "";
  const fromEmployee = !!route.query.employee_id;

  return [
    { label: t("sidebar.home"), to: `${prefix}/` },
    fromEmployee
      ? { label: t("sidebar.employees"), to: `${prefix}/employees` }
      : { label: t("profile.title"), to: `${prefix}/profile` },
    { label: t("scheduale.title") },
  ];
});

// ===== State =====
const currentMonthLabel = ref("");
const calendarWeeks = ref([]);
const workSystemType = ref();
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);

// ===== Days Header =====
const dayNames = computed(() => [
  t("scheduale.days.sun"),
  t("scheduale.days.mon"),
  t("scheduale.days.tue"),
  t("scheduale.days.wed"),
  t("scheduale.days.thu"),
  t("scheduale.days.fri"),
  t("scheduale.days.sat"),
]);

// ===== Legend (dynamic) =====
const shifts = computed(() => {
  const allTypes = [
    "leave",
    "official_holiday",
    "rest",
    "fixed_system",
    "morning_shift",
    "evening_shift",
    "night_shift",
    "external_mission",
  ];
  return allTypes.map((type) => ({ type }));
});

// ===== Shift Names from scheduale translations =====
const getShiftName = (type) => {
  const map = {
    leave: t("scheduale.shifts.leave"),
    official_holiday: t("scheduale.shifts.official_holiday"),
    rest: t("scheduale.shifts.rest"),
    shift: t("scheduale.shifts.shift"),
    fixed_system: t("scheduale.shifts.fixed_system"),
    morning_shift: t("scheduale.shifts.morning"),
    evening_shift: t("scheduale.shifts.evening"),
    night_shift: t("scheduale.shifts.night"),
    external_mission:
      t("scheduale.shifts.external_mission") ||
      t("scheduale.shifts.external") ||
      (lang.value === "ar" ? "مهمة خارجية" : "External Mission"),
  };
  return map[type] || type;
};

// ===== AM/PM Labels =====
const getAmLabel = () => t("scheduale.am");
const getPmLabel = () => t("scheduale.pm");

// ===== Shift Colors =====
const getShiftColor = (type) => {
  const map = {
    morning_shift: "#77B810",
    evening_shift: "#567523",
    night_shift: "#0E5F4A",
    official_holiday: "#1849A9",
    rest: "#384250",
    leave: "#DC6803",
    fixed_system: "#085D3A",
    external_mission: "#5925DC",
  };
  return map[type] || "#ccc";
};

// ===== Shift Background Colors =====
const getShiftBG = (type) => {
  const map = {
    fixed_system: "#E7EFED",
    morning_shift: "#E7EFED",
    evening_shift: "#E7EFED",
    night_shift: "#E7EFED",
    rest: "#E5E7EB",
    official_holiday: "#D1E9FF",
    leave: "#FFFAEB",
    external_mission: "#F4F3FF",
  };
  return map[type] || "#F3F4F6";
};

// ===== Format Event Label Helper =====
const formatEventLabel = (label) => {
  if (!label) return "";
  if (typeof label === "string") return label;

  // Handle object cases based on common keys
  const val =
    label.mission_title ||
    label.leave_type ||
    label.work_type_label ||
    label.title || // generic fallback
    label.name; // generic fallback

  return val || "";
};

// ===== Fetch Data =====
const loading = ref(true);

const fetchData = async () => {
  loading.value = true;

  const params = {
    year: currentYear.value,
    month: currentMonth.value,
  };
  if (route.query.employee_id) {
    params.employee_id = route.query.employee_id;
  }

  const response = await schedualeService.listAll(params);
  const data = response?.data;
  if (!data) {
    loading.value = false;
    return;
  }

  currentMonthLabel.value = data?.month_label;

  workSystemType.value = data?.work_system_type;

  calendarWeeks.value = data?.weeks?.map((week, index) => {
    let days = week.days.map(
      (day) =>
        ({
          day: day.day_of_month,
          date: day.date,
          isToday: day.date === new Date().toISOString().slice(0, 10),
          currentMonth: true,
          shiftType: day.type === "work" ? "fixed_system" : day.type,
          shiftLabel: getShiftName(
            day.type === "work" ? "fixed_system" : day.type,
          ),
          shiftIcon: day.type,
          timeFrom: day?.details?.time_from,
          timeTo: day?.details?.time_to,
          details: day?.details,
          eventLabel: day?.description,
        }) || [],
    );

    // Add empty cells at start of first week
    if (index === 0 && days.length) {
      const firstDayName = week.days[0].day_name;
      const offset = dayNames.value.findIndex((d) => d === firstDayName);
      days = [...Array(offset >= 0 ? offset : 0).fill(null), ...days];
    }

    const missing = 7 - days.length;
    return [...days, ...Array(missing > 0 ? missing : 0).fill(null)];
  });

  loading.value = false;
};

onMounted(fetchData);

// ===== Month Navigation =====
const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value -= 1;
  } else {
    currentMonth.value -= 1;
  }
  fetchData();
};

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value += 1;
  } else {
    currentMonth.value += 1;
  }
  fetchData();
};
</script>
