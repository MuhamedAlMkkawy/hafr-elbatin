<template>
  <div class="space-y-4">
    <!-- Page Header Title (Matches Sidebar Parent context but specific to this view) -->
    <div v-if="workSystem" class="flex justify-between items-center mb-2">
      <h2 class="text-[18px] font-[600] text-[#384250] text-[16px]">
        {{
          workSystem.type === "fixed"
            ? t("workSystems.modals.viewTitle") ||
              (lang === "ar"
                ? "عرض نظام الدوام الرسمي"
                : "View Official Work System")
            : t("workSystems.modals.viewShiftTitle") ||
              (lang === "ar" ? "عرض نظام الوردية" : "View Shift System")
        }}
      </h2>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <template v-else-if="workSystem">
      <Card class="!mt-4 !p-0 overflow-hidden border-none shadow-sm">
        <!-- Card Header with Info Icon -->
        <div
          class="bg-[#F3F9F6] py-2 px-4 border-b border-gray-100 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <SvgIcon
              name="info"
              classes="w-12 h-12 transition-transform duration-200"
            />
            <h3 class="font-[600] text-[#384250] text-[16px]">
              {{ lang === "ar" ? "معلومات النظام" : "System Information" }}
            </h3>
          </div>
        </div>

        <div class="p-6" :class="{ 'pb-2': workSystem.type !== 'fixed' }">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <!-- Row 1 -->
            <div class="flex items-center">
              <span class="text-[13px] font-[500] text-[#6C737F] w-[182px]">{{
                t("workSystems.fields.nameAr")
              }}</span>
              <span class="font-[600] text-[#384250] text-[16px]">{{
                workSystem.name_ar
              }}</span>
            </div>

            <div class="flex items-center">
              <span class="text-[13px] font-[500] text-[#6C737F] w-[182px]">{{
                t("workSystems.fields.nameEn")
              }}</span>
              <span class="font-[600] text-[#384250] text-[16px]">{{
                workSystem.name
              }}</span>
            </div>

            <!-- Row 2 -->
            <div class="flex items-center">
              <span class="text-[13px] font-[500] text-[#6C737F] w-[182px]">{{
                t("workSystems.fields.typeLabel")
              }}</span>
              <span class="font-[600] text-[#384250] text-[16px]">{{
                t(`workSystems.types.${workSystem.type}`)
              }}</span>
            </div>

            <div class="flex items-center">
              <span class="text-[13px] font-[500] text-[#6C737F] w-[182px]">{{
                t("workSystems.fields.status")
              }}</span>
              <div
                class="flex items-center gap-1.5 px-2 py-1.5 rounded-full border border-gray-100 w-fit"
                :class="workSystem.is_active ? 'bg-[#ECFDF3]' : 'bg-[#E5E7EB]'"
              >
                <span
                  class="w-2 h-2 rounded-full"
                  :class="
                    workSystem.is_active ? 'bg-[#085D3A]' : 'bg-[#4D5761]'
                  "
                ></span>
                <span
                  class="text-xs font-bold"
                  :class="
                    workSystem.is_active ? 'text[#085D3A]' : 'text-[#1F2A37]'
                  "
                >
                  {{
                    workSystem.is_active
                      ? t("roles.statusOptions.active")
                      : t("roles.statusOptions.inactive")
                  }}
                </span>
              </div>
            </div>

            <!-- Other Fixed Fields -->
            <template v-if="workSystem.type === 'fixed'">
              <!-- Row 3 -->
              <div class="flex items-center">
                <span class="text-[13px] font-[500] text-[#6C737F] w-[182px]">{{
                  t("workSystems.fields.workingDays")
                }}</span>
                <div class="flex flex-wrap gap-1 justify-end">
                  <span
                    v-for="day in workSystem.working_days"
                    :key="day"
                    class="bg-[#E7EFED] text-[#0E5F4A] px-2 py-1 rounded-full text-xs font-medium border border-[#82ACA1]"
                  >
                    {{ t(`common.days.${day.toLowerCase()}`) }}
                  </span>
                </div>
              </div>

              <div class="flex items-center">
                <span class="text-[13px] font-[500] text-[#6C737F] w-[182px]">{{
                  t("workSystems.fields.checkInStart")
                }}</span>
                <span class="font-[600] text-[#384250] text-[16px]">{{
                  formatTime(workSystem.check_in_start)
                }}</span>
              </div>

              <!-- Row 4 -->
              <div class="flex items-center">
                <span class="text-[13px] font-[500] text-[#6C737F] w-[182px]">{{
                  t("workSystems.fields.positiveBalance")
                }}</span>
                <span class="font-[600] text-[#384250] text-[16px]">{{
                  formatDuration(workSystem.positive_balance_duration)
                }}</span>
              </div>

              <div class="flex items-center">
                <span class="text-[13px] font-[500] text-[#6C737F] w-[182px]">{{
                  t("workSystems.fields.positiveBalanceFactor")
                }}</span>
                <span class="font-[600] text-[#384250] text-[16px]"
                  >{{ workSystem.positive_balance_factor }}%</span
                >
              </div>

              <!-- Row 5 -->
              <div class="flex items-center">
                <span class="text-[13px] font-[500] text-[#6C737F] w-[182px]">{{
                  t("workSystems.fields.flexibleGracePeriod")
                }}</span>
                <span class="font-[600] text-[#384250] text-[16px]">{{
                  formatMinutes(workSystem.flexible_grace_period)
                }}</span>
              </div>

              <div class="flex items-center">
                <span class="text-[13px] font-[500] text-[#6C737F] w-[182px]">{{
                  t("workSystems.fields.dailyWorkingHours")
                }}</span>
                <span class="font-[600] text-[#384250] text-[16px]">{{
                  formatMinutes(workSystem.daily_working_hours)
                }}</span>
              </div>

              <!-- Row 6 -->
              <div class="flex items-center">
                <span class="text-[13px] font-[500] text-[#6C737F] w-[182px]">{{
                  t("workSystems.fields.endOfWorkTime")
                }}</span>
                <span class="font-[600] text-[#384250] text-[16px]">{{
                  formatTime(workSystem.end_of_work_time)
                }}</span>
              </div>

              <div class="flex items-center">
                <span class="text-[13px] font-[500] text-[#6C737F] w-[182px]">{{
                  t("workSystems.fields.lastCheckoutTime")
                }}</span>
                <span class="font-[600] text-[#384250] text-[16px]">{{
                  formatTime(workSystem.last_checkout_time)
                }}</span>
              </div>

              <!-- Row 7 -->
              <!-- <div class="flex items-center">
                <span class="text-[13px] font-[500] text-[#6C737F] w-[182px]">{{
                  t("workSystems.fields.maxDailyPermission")
                }}</span>
                <span class="font-[600] text-[#384250] text-[16px]">{{
                  formatMinutes(workSystem.max_daily_permission_minutes)
                }}</span>
              </div> -->
            </template>
          </div>
        </div>
        <div v-if="workSystem.type === 'shift'" class="space-y-4">
          <div v-for="(shift, index) in workSystem.shifts" :key="index">
            <Card class="m-5 !p-0 rounded-[14px] border border-[#E7EFED]">
              <div class="p-4 border-b border-[#E7EFED]">
                <h3 class="font-[600] text-[#384250] text-[16px]">
                  {{ t(`workSystems.shifts.${shift.period}`) }}
                </h3>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  <!-- Row 1: Check-in Start & Positive Balance Duration -->
                  <div class="flex justify-between items-center pb-2">
                    <span class="text-[13px] text-[#6C737F] font-[500]">{{
                      t("workSystems.fields.checkInStart")
                    }}</span>
                    <span class="font-[600] text-[#384250] text-[16px]">{{
                      formatTime(shift.check_in_start)
                    }}</span>
                  </div>
                  <div class="flex justify-between items-center pb-2">
                    <span class="text-[13px] text-[#6C737F] font-[500]">{{
                      t("workSystems.fields.positiveBalance")
                    }}</span>
                    <span class="font-[600] text-[#384250] text-[16px]">{{
                      formatDuration(shift.positive_balance_duration)
                    }}</span>
                  </div>

                  <!-- Row 2: Positive Balance Factor & Flexible Grace Period -->
                  <div class="flex justify-between items-center pb-2">
                    <span class="text-[13px] text-[#6C737F] font-[500]">{{
                      t("workSystems.fields.positiveBalanceFactor")
                    }}</span>
                    <span class="font-[600] text-[#384250] text-[16px]"
                      >{{ shift.positive_balance_factor }}%</span
                    >
                  </div>
                  <div class="flex justify-between items-center pb-2">
                    <span class="text-[13px] text-[#6C737F] font-[500]">{{
                      t("workSystems.fields.flexibleGracePeriod")
                    }}</span>
                    <span class="font-[600] text-[#384250] text-[16px]">{{
                      formatMinutes(shift.flexible_grace_period)
                    }}</span>
                  </div>

                  <!-- Row 3: Daily Working Hours & End of Work Time -->
                  <div class="flex justify-between items-center pb-2">
                    <span class="text-[13px] text-[#6C737F] font-[500]">{{
                      t("workSystems.fields.dailyWorkingHours")
                    }}</span>
                    <span class="font-[600] text-[#384250] text-[16px]">{{
                      formatMinutes(shift.daily_working_hours)
                    }}</span>
                  </div>
                  <div class="flex justify-between items-center pb-2">
                    <span class="text-[13px] text-[#6C737F] font-[500]">{{
                      t("workSystems.fields.endOfWorkTime")
                    }}</span>
                    <span class="font-[600] text-[#384250] text-[16px]">{{
                      formatTime(shift.end_of_work_time)
                    }}</span>
                  </div>

                  <!-- Row 4: Last Checkout Time & Max Daily Permission -->
                  <div class="flex justify-between items-center pb-2">
                    <span class="text-[13px] text-[#6C737F] font-[500]">{{
                      t("workSystems.fields.lastCheckoutTime")
                    }}</span>
                    <span class="font-[600] text-[#384250] text-[16px]">{{
                      formatTime(shift.last_checkout_time)
                    }}</span>
                  </div>
                  <!-- <div class="flex justify-between items-center pb-2">
                    <span class="text-[13px] text-[#6C737F] font-[500]">{{
                      t("workSystems.fields.maxDailyPermission")
                    }}</span>
                    <span class="font-[600] text-[#384250] text-[16px]">{{
                      formatMinutes(shift.max_daily_permission_minutes)
                    }}</span>
                  </div> -->
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Card>

      <!-- Shift Sections (Image 2) -->

      <!-- Footer Buttons -->
      <div class="flex items-center gap-4 pt-4 justify-end">
        <Button
          variant="secondary"
          @click="$router.back()"
        >
          {{ t("common.back") }}
        </Button>
        <Button
          variant="primary"
          class="min-w-[120px]"
          @click="router.push(editUrl)"
        >
          {{ t("common.edit") }}
        </Button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAppToast } from "@/composables/useAppToast";
import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { workSystemService } from "@/services/workSystems";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const route = useRoute();
const router = useRouter();
const toast = useAppToast();

const workSystem = ref(null);
const loading = ref(true);

const editUrl = computed(() => {
  const prefix = lang.value === "en" ? "/en" : "";
  return `${prefix}/attendance/settings/work-systems/${route.params?.id}/edit`;
});

const loadData = async () => {
  loading.value = true;
  try {
    const response = await workSystemService.getById(route.params?.id);
    workSystem.value = response.data.work_system;
  } catch (error) {
    console.error(error);
    toast.error(error);
  } finally {
    loading.value = false;
  }
};

const formatTime = (time) => {
  if (!time) return "--:--";
  // Handle HH:mm:ss if present
  const parts = time.split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0]);
    const mins = parts[1];
    const ampm =
      hours >= 12
        ? lang.value === "ar"
          ? "م"
          : "PM"
        : lang.value === "ar"
          ? "ص"
          : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${String(hours).padStart(2, "0")}:${mins} ${ampm}`;
  }
  return time;
};

const formatMinutes = (mins) => {
  if (mins === null || mins === undefined) return "--";

  const isArabic = lang.value === "ar";

  // Less than 60 minutes → only minutes
  if (mins < 60) {
    const unit =
      isArabic
        ? mins === 1
          ? "دقيقة"
          : "دقائق"
        : mins === 1
          ? "minute"
          : "minutes";
    return `${mins} ${unit}`;
  }

  // 60 minutes or more → hours (+ optional remaining minutes)
  const h = Math.floor(mins / 60);
  const m = mins % 60;

  const hourUnit =
    isArabic
      ? h === 1
        ? "ساعة"
        : "ساعات"
      : h === 1
        ? "hour"
        : "hours";

  const parts = [`${h} ${hourUnit}`];

  if (m > 0) {
    const minUnit =
      isArabic
        ? m === 1
          ? "دقيقة"
          : "دقائق"
        : m === 1
          ? "minute"
          : "minutes";
    parts.push(`${m} ${minUnit}`);
  }

  return parts.join(isArabic ? " و " : " and ");
};

const formatDuration = (val) => {
  if (!val) return "--";
  // Check if it's one of the common duration labels
  if (val === 15 || val === 30 || val === 45 || val === 60) {
    return `${val} ${lang.value === "ar" ? "دقيقة" : "min"}`;
  }
  // Fallback or specific logic if it's months etc.
  if (val === "one_month" || val === 1)
    return lang.value === "ar" ? "شهر واحد" : "One month";
  return val;
};

onMounted(() => {
  loadData();
});
</script>
