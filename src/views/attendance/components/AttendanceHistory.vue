<template>
  <div class="no-print space-y-6">
    <!-- Filters -->
    <Card class="no-print my-6">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("notifications.searchTitle") }}
        </h2>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          v-if="!authStore.isEmployee"
          v-model="filters.employee_id"
          :options="employeeOptions"
          :placeholder="t('employees.fields.employeeName')"
          :label="t('employees.fields.employeeName')"
          size="md"
          searchable
        />
        <!-- Date Range -->
        <DateRangePicker
          v-model:start-date="filters.date_from"
          v-model:end-date="filters.date_to"
          :placeholder="t('holidays.placeholders.selectTime')"
          :label="t('common.date')"
        />
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <Button variant="ghost" @click="resetFilters" class="md:w-26">{{
          t("roles.resetFilters")
        }}</Button>
        <Button
          variant="primary"
          @click="applyFilters"
          :loading="loading"
          class="md:w-26"
          >{{ t("common.search") }}</Button
        >
      </div>
    </Card>

    <!-- Performance Indicators (Statistics) -->
    <Card class="relative no-print">
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("dailyAttendance.statistics.title") }}
        </h2>
      </template>

      <div class="relative">
        <swiper
          :modules="[Autoplay]"
          :slides-per-view="'auto'"
          :space-between="12"
          :loop="true"
          :autoplay="{
            delay: 2000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }"
          class="statistics-swiper w-full"
          :dir="lang === 'ar' ? 'rtl' : 'ltr'"
          :key="lang"
        >
          <swiper-slide class="!w-[230px]">
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="history_actual_hours" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                  t("dailyAttendance.statistics.totalWorkingHours")
                }}</span>
              </div>
              <span class="text-[#1F2A37] font-[600] text-[24px]">{{
                formatMinutesToHHMM(statistics.total_working_minutes) || "00:00"
              }}</span>
            </Card>
          </swiper-slide>

          <swiper-slide class="!w-[230px]">
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="history_fingerprint" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                  t("dailyAttendance.statistics.absentDays")
                }}</span>
              </div>
              <span class="text-[#1F2A37] font-[600] text-[24px]">{{
                statistics.absent_days || 0
              }}</span>
            </Card>
          </swiper-slide>

          <swiper-slide class="!w-[230px]">
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="history_holidays" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                  t("dailyAttendance.statistics.holidayDays")
                }}</span>
              </div>
              <span class="text-[#1F2A37] font-[600] text-[24px]">{{
                statistics.leave_days || 0
              }}</span>
            </Card>
          </swiper-slide>

          <swiper-slide class="!w-[230px]">
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="history_permissions" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                  t("dailyAttendance.statistics.excusalHours")
                }}</span>
              </div>
              <span class="text-[#1F2A37] font-[600] text-[24px]">{{
                formatMinutesToHHMM(statistics.total_permission_minutes) ||
                "00:00"
              }}</span>
            </Card>
          </swiper-slide>

          <swiper-slide class="!w-[230px]">
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="history_positive_balance" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                  t("dailyAttendance.statistics.positiveBalance")
                }}</span>
              </div>
              <span class="text-[#1F2A37] font-[600] text-[24px]">{{
                formatMinutesToHHMM(
                  statistics.total_positive_balance_minutes,
                ) || "00:00"
              }}</span>
            </Card>
          </swiper-slide>

          <swiper-slide class="!w-[230px]">
            <Card
              class="!p-3 flex flex-col items-center justify-center !bg-[#F8FBFA] border border-[#F1F7F5] h-[102px]"
            >
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="history_missions" />
                <span class="text-[#1F2A37] text-[14px] font-[500]">{{
                  t("dailyAttendance.statistics.missions")
                }}</span>
              </div>
              <span class="text-[#1F2A37] font-[600] text-[24px]">{{
                statistics.total_external_mission_days || "0"
              }}</span>
            </Card>
          </swiper-slide>
        </swiper>
      </div>
    </Card>

    <!-- Attendance Log Table -->
    <Card class="no-print">
      <template #header>
        <div class="flex gap-2 items-center justify-between w-full">
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("dailyAttendance.tabs.history") }}
          </h2>
        </div>
      </template>

      <Table
        :items="attendances"
        :headers="headers"
        :loading="loading"
        :page="page"
        :total-pages="totalPages"
        @change-page="changePage"
        wrapper-class="rounded-b-xl"
      >
        <template v-for="h in headers" :key="h.key" #[`header-${h.key}`]>
          <div
            class="flex justify-between items-center cursor-pointer"
            @click="handleSort(h.key)"
          >
            {{ h.label }}

            <SvgIcon
              name="sort"
              class="w-4 h-4"
              :class="{
                'text-primary': filters.sort_by === h.key,
                'text-gray-400': filters.sort_by !== h.key,
                'rotate-180':
                  filters.sort_by === h.key &&
                  filters.sort_direction === 'desc',
              }"
            />
          </div>
        </template>

        <template #cell-date="{ item }">
          <div class="flex gap-2">
            <span>{{ lang === "ar" ? item.day_name_ar : item.day_name }}</span>
            <span>{{ item.date }}</span>
          </div>
        </template>

        <template #cell-status="{ item }">
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
            :class="getStatusClass(item)"
            v-if="item.status"
          >
            <span
              class="w-2 h-2 rounded-full"
              :class="getStatusDotClass(item)"
            ></span>
            {{ item.status_label }}
          </div>
          <div v-else>--</div>
        </template>

        <template #cell-check_in="{ item }">
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
            <span v-else>--:--</span>
            <img
              v-if="item?.check_in_selfie"
              :src="item.check_in_selfie"
              class="w-6 h-6 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              v-tooltip="item.employee?.name"
              @click="openSelfieModal(item.check_in_selfie)"
            />
          </div>
        </template>

        <template #cell-check_out="{ item }">
          <div class="flex items-center gap-2">
            <span v-if="item.check_out_time" class="flex items-center gap-1">
              {{ formatTime12(item.check_out_time) }}
              <div
                v-if="item.check_out_location"
                v-tooltip="
                  lang === 'ar'
                    ? item.check_out_location?.name_ar ||
                      item.check_out_location?.name
                    : item.check_out_location?.name ||
                      item.check_out_location?.name_ar
                "
              >
                <SvgIcon name="location" />
              </div>
            </span>
            <span v-else>--:--</span>
            <img
              v-if="item?.check_out_selfie"
              :src="item.check_out_selfie"
              class="w-6 h-6 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              v-tooltip="item.employee?.name"
              @click="openSelfieModal(item.check_out_selfie)"
            />
          </div>
        </template>

        <template #cell-actual_hours="{ item }">
          {{ formatMinutesToHHMM(item.actual_working_minutes) }}
        </template>

        <template #cell-expand="{ isExpanded, toggleExpand }">
          <div class="flex items-center justify-center h-full">
            <button
              @click="toggleExpand"
              class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <SvgIcon
                name="table_arrow"
                classes="w-5 h-5 m-auto cursor-pointer transition-transform duration-200"
                :class="
                  locale === 'ar'
                    ? isExpanded
                      ? '!rotate-270'
                      : 'rotate-0'
                    : isExpanded
                      ? '!rotate-270'
                      : '!rotate-180'
                "
              />
            </button>
          </div>
        </template>

        <!-- Expandable Details -->
        <template #expand="{ item }">
          <div class="bg-white border-x border-b border-gray-100">
            <div class="grid grid-cols-9 border-b-2 border-[#D2D6DB]">
              <div
                class="p-3 text-[12px] text-[#384250] font-[500] bg-[#F3F4F6]"
              >
                {{ t("dailyAttendance.fields.shiftStart") }}
              </div>
              <div class="p-3 text-[12px] text-[#384250] font-[500]">
                {{ t("dailyAttendance.fields.shiftEnd") }}
              </div>
              <div
                class="p-3 text-[12px] text-[#384250] font-[500] bg-[#F3F4F6]"
              >
                {{ t("dailyAttendance.fields.lateness") }}
              </div>
              <div class="p-3 text-[12px] text-[#384250] font-[500]">
                {{
                  item.positive_balance_minutes === 0 &&
                  item.positive_balance_used > 0
                    ? t("dailyAttendance.fields.positiveBalanceUsed")
                    : t("dailyAttendance.fields.positiveBalance")
                }}
              </div>
              <div
                class="p-3 text-[12px] text-[#384250] font-[500] bg-[#F3F4F6]"
              >
                {{ t("dailyAttendance.fields.earlyLeave") }}
              </div>
              <div class="p-3 text-[12px] text-[#384250] font-[500]">
                {{ t("dailyAttendance.fields.workingHours") }}
              </div>
              <div
                class="p-3 text-[12px] text-[#384250] font-[500] bg-[#F3F4F6]"
              >
                {{ t("dailyAttendance.fields.excusals") }}
              </div>
              <div class="p-3 text-[11px] text-[#384250] font-[500]">
                {{ t("dailyAttendance.fields.overtimePunch") }}
              </div>
              <div
                class="p-3 text-[12px] text-[#384250] font-[500] bg-[#F3F4F6]"
              >
                {{ t("dailyAttendance.fields.overtime") }}
              </div>
            </div>
            <div class="grid grid-cols-9">
              <div class="p-3 text-[14px] text-[#161616] bg-[#F3F4F6]">
                {{ formatTime12(item.scheduled_start_time) || "--:--" }}
              </div>
              <div class="p-3 text-[14px] text-[#161616]">
                {{ formatTime12(item.scheduled_end_time) || "--:--" }}
              </div>
              <div class="p-3 text-[14px] bg-[#F3F4F6]">
                {{ formatMinutesToHHMM(item.lateness_minutes) }}
              </div>
              <div class="p-3 text-[14px]">
                {{
                  formatMinutesToHHMM(
                    item.positive_balance_minutes > 0
                      ? item.positive_balance_minutes
                      : item.positive_balance_used,
                  )
                }}
              </div>
              <div class="p-3 text-[14px] bg-[#F3F4F6]">
                {{ formatMinutesToHHMM(item.early_leave_minutes) }}
              </div>
              <div class="p-3 text-[14px] text-[#161616]">
                {{ formatMinutesToHHMM(item.scheduled_working_hours) }}
              </div>
              <div class="p-3 text-[14px] bg-[#F3F4F6]">
                {{ formatMinutesToHHMM(item.permissions_minutes) }}
              </div>
              <div class="p-3 text-[14px]">
                <div class="flex items-center gap-2">
                  <span
                    v-if="item.overtime_check_in_time"
                    class="flex items-center gap-1 text-[14px]"
                  >
                    {{ formatTime12(item.overtime_check_in_time) }}
                    <div
                      v-tooltip="
                        lang === 'ar'
                          ? item.overtime_check_in_location?.name_ar
                          : item.overtime_check_in_location?.name
                      "
                    >
                      <SvgIcon name="location" />
                    </div>
                  </span>
                  <span v-else class="text-[14px]">--:--</span>
                  <img
                    v-if="item?.overtime_check_in_selfie"
                    :src="item.overtime_check_in_selfie"
                    class="w-6 h-6 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                    v-tooltip="item.employee?.name"
                    @click="openSelfieModal(item.overtime_check_in_selfie)"
                  />
                </div>
              </div>
              <div class="p-3 text-[14px] bg-[#F3F4F6]">
                {{ formatMinutesToHHMM(item.overtime_minutes) }}
              </div>
            </div>
          </div>
        </template>

        <template #footer v-if="attendances.length > 0">
          <tr class="bg-white font-semibold border-t-2 border-[#D2D6DB]">
            <!-- Total Label (Far Right cell in RTL) -->
            <td
              class="p-4 text-center align-middle font-bold text-[16px] text-[#161616] bg-[#F3F4F6]"
            >
              {{ t("common.total") }}
            </td>

            <!-- Stats Grid Spanning across remaining columns -->
            <td :colspan="headers.length - 1" class="p-0 overflow-hidden">
              <div class="grid grid-cols-6">
                <!-- Labels Row -->
                <div
                  v-for="(label, index) in [
                    t('dailyAttendance.fields.positiveBalance'),
                    t('dailyAttendance.fields.lateness'),
                    t('dailyAttendance.fields.earlyLeave'),
                    t('dailyAttendance.fields.actualHours'),
                    t('dailyAttendance.fields.excusals'),
                    t('dailyAttendance.fields.overtime'),
                  ]"
                  :key="label"
                  :class="index % 2 === 1 ? 'bg-[#F3F4F6]' : 'bg-white'"
                  class="p-4 text-[12px] font-medium text-[#384250] border-b border-[#D2D6DB]"
                >
                  {{ label }}
                </div>

                <!-- Values Row -->
                <div
                  v-for="(val, index) in [
                    statistics.total_positive_balance_minutes,
                    statistics.total_lateness_minutes,
                    statistics.total_early_leave_minutes,
                    statistics.total_working_minutes,
                    statistics.total_permission_minutes,
                    statistics.total_overtime_minutes,
                  ]"
                  :key="index"
                  :class="[
                    index % 2 === 1 ? 'bg-[#F3F4F6]' : 'bg-white',
                    index === 5 ? 'rounded-bl-xl' : '',
                  ]"
                  class="p-4 text-[14px] text-[#161616]"
                >
                  {{ formatMinutesToHHMM(val) }}
                </div>
              </div>
            </td>
          </tr>
        </template>
      </Table>
    </Card>
  </div>

  <!-- Print Area -->
  <div class="print-only" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th colspan="12" class="!bg-transparent !border-none !p-0">
            <PrintHeader
              :title="t('dailyAttendance.tabs.attendanceLog')"
              :fromDate="filters.date_from"
              :toDate="filters.date_to"
            />
          </th>
        </tr>
        <tr class="bg-[#0E5F4A] text-white">
          <th
            class="border border-[#D2D6DB] p-2 text-[8px] font-bold uppercase"
          >
            {{ t("employees.fields.employeeName") }}
          </th>
          <th
            class="border border-[#D2D6DB] p-2 text-[8px] font-bold uppercase"
          >
            {{ t("dailyAttendance.fields.day") }}
          </th>
          <th
            class="border border-[#D2D6DB] p-2 text-[8px] font-bold uppercase"
          >
            {{ t("dailyAttendance.fields.checkIn") }}
          </th>
          <th
            class="border border-[#D2D6DB] p-2 text-[8px] font-bold uppercase"
          >
            {{ t("dailyAttendance.fields.checkOut") }}
          </th>
          <th
            class="border border-[#D2D6DB] p-2 text-[8px] font-bold uppercase"
          >
            {{ t("dailyAttendance.fields.lateness") }}
          </th>
          <th
            class="border border-[#D2D6DB] p-2 text-[8px] font-bold uppercase"
          >
            {{ t("dailyAttendance.fields.positiveBalance") }}
          </th>
          <th
            class="border border-[#D2D6DB] p-2 text-[8px] font-bold uppercase"
          >
            {{ t("dailyAttendance.fields.earlyLeave") }}
          </th>
          <th
            class="border border-[#D2D6DB] p-2 text-[8px] font-bold uppercase"
          >
            {{ t("dailyAttendance.fields.actualHours2") }}
          </th>
          <th
            class="border border-[#D2D6DB] p-2 text-[8px] font-bold uppercase"
          >
            {{ t("dailyAttendance.fields.excusals") }}
          </th>
          <th
            class="border border-[#D2D6DB] p-2 text-[8px] font-bold uppercase"
          >
            {{ t("dailyAttendance.fields.overtimePunch") }}
          </th>
          <th
            class="border border-[#D2D6DB] p-2 text-[8px] font-bold uppercase"
          >
            {{ t("dailyAttendance.fields.overtime") }}
          </th>
          <th
            class="border border-[#D2D6DB] p-2 text-[8px] font-bold uppercase"
          >
            {{ t("dailyAttendance.fields.status") }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in printAttendances" :key="item.id">
          <td class="border border-[#D2D6DB] p-2 text-[8px]">
            {{ item.employee?.name || "--" }}
          </td>
          <td class="border border-[#D2D6DB] p-2 text-[8px]">
            {{ item.date }} ({{
              lang === "ar" ? item.day_name_ar : item.day_name
            }})
          </td>
          <td class="border border-[#D2D6DB] p-2 text-[8px]">
            {{ formatTime12(item.check_in_time) }}
          </td>
          <td class="border border-[#D2D6DB] p-2 text-[8px]">
            {{ formatTime12(item.check_out_time) }}
          </td>
          <td class="border border-[#D2D6DB] p-2 text-[8px]">
            {{ formatMinutesToHHMM(item.lateness_minutes) }}
          </td>
          <td class="border border-[#D2D6DB] p-2 text-[8px]">
            {{
              formatMinutesToHHMM(
                item.positive_balance_minutes > 0
                  ? item.positive_balance_minutes
                  : item.positive_balance_used,
              )
            }}
          </td>
          <td class="border border-[#D2D6DB] p-2 text-[8px]">
            {{ formatMinutesToHHMM(item.early_leave_minutes) }}
          </td>
          <td class="border border-[#D2D6DB] p-2 text-[8px]">
            {{ formatMinutesToHHMM(item.actual_working_minutes) }}
          </td>
          <td class="border border-[#D2D6DB] p-2 text-[8px]">
            {{ formatMinutesToHHMM(item.permissions_minutes) }}
          </td>
          <td class="border border-[#D2D6DB] p-2 text-[8px]">
            {{ formatTime12(item.overtime_check_in_time) || "--:--" }}
          </td>
          <td class="border border-[#D2D6DB] p-2 text-[8px]">
            {{ formatMinutesToHHMM(item.overtime_minutes) }}
          </td>
          <td class="border border-[#D2D6DB] p-2 text-[8px]">
            {{ item.status_label }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="footer-spacer-row">
          <td colspan="12" class="!border-none !p-0">
            <div class="h-[60px]"></div>
          </td>
        </tr>
      </tfoot>
    </table>
    <PrintFooter :totalPages="printTotalPages" />
  </div>

  <!-- Selfie Viewer -->
  <SelfieViewer
    v-model="isSelfieModalOpen"
    :image-url="selfieUrl"
    :title="t('dailyAttendance.fields.selfie')"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";
import { attendanceHistoryService } from "@/services/attendanceHistory";
import { employeeService } from "@/services/employees";
import { useAuthStore } from "@/stores/auth";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";
import "swiper/css";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import Table from "@/components/ui/Table.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Modal from "@/components/ui/Modal.vue";
import DateRangePicker from "@/components/ui/DateRangePicker.vue";
import SelfieViewer from "@/components/common/SelfieViewer.vue";

import PrintHeader from "@/components/ui/PrintHeader.vue";
import PrintFooter from "@/components/ui/PrintFooter.vue";
import { drawPdfHeader } from "@/utils/pdfHeader";
import { drawPdfFooter } from "@/utils/pdfFooter";

import IBMPlexSansArabicRegular from "@/assets/fonts/IBMPlexSansArabic-Regular.ttf?url";
import IBMPlexSansArabicBold from "@/assets/fonts/IBMPlexSansArabic-Bold.ttf?url";

const { t, locale } = useI18n();
const router = useRouter();
const lang = computed(() => locale.value);
const toast = useAppToast();
const authStore = useAuthStore();

// Permissions
const canViewEmployees = computed(() => !authStore.isEmployee);

// State
const loading = ref(false);
const attendances = ref([]);
const printAttendances = ref([]);
const statistics = ref({
  total_days: 0,
  present_days: 0,
  absent_days: 0,
  holiday_days: 0,
  total_working_hours: 0,
  total_working_minutes: 0,
  total_lateness_minutes: 0,
  total_early_leave_minutes: 0,
  total_positive_balance_minutes: 0,
  total_overtime_minutes: 0,
  total_permission_minutes: 0,
});
const page = ref(1);
const totalPages = ref(1);
const perPage = ref(10);
const printTotalPages = ref(1);

const isSelfieModalOpen = ref(false);
const selfieUrl = ref("");

const openSelfieModal = (url) => {
  selfieUrl.value = url;
  isSelfieModalOpen.value = true;
};

// Default Date Range: Current Month
const getDefaultDates = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    date_from: firstDay.toLocaleDateString("en-CA"),
    date_to: lastDay.toLocaleDateString("en-CA"),
  };
};

const filters = ref({
  date_from: null,
  date_to: null,
  employee_id: authStore.user?.id ? String(authStore.user.id) : "",

  //  add this
  sort_by: "",
  sort_direction: "asc",
});

const handleSort = (key) => {
  const sortFieldMap = {
    date: "date",
    status: "status",
    check_in: "check_in_time",
    check_out: "check_out_time",
    actual_hours: "actual_working_minutes",
  };

  const apiKey = sortFieldMap[key] || key;

  // toggle direction if same column
  if (filters.value.sort_by === apiKey) {
    filters.value.sort_direction =
      filters.value.sort_direction === "asc" ? "desc" : "asc";
  } else {
    filters.value.sort_by = apiKey;
    filters.value.sort_direction = "asc";
  }

  applyFilters();
};

const allEmployees = ref([]);
const employeeOptions = computed(() => {
  const options = allEmployees.value.map((e) => ({
    label: e.name,
    value: String(e.id),
  }));

  if (
    authStore.user &&
    !options.some((o) => o.value === String(authStore.user.id))
  ) {
    options.unshift({
      label: authStore.user.name,
      value: String(authStore.user.id),
    });
  }
  return options;
});

const statusOptions = computed(() => [
  { label: t("dailyAttendance.status.present"), value: "present" },
  { label: t("dailyAttendance.status.absent"), value: "absent" },
  { label: t("dailyAttendance.status.late"), value: "late" },
  { label: t("dailyAttendance.status.leave"), value: "leave" },
  { label: t("dailyAttendance.status.mission"), value: "mission" },
  { label: t("dailyAttendance.status.rest_day"), value: "rest_day" },
  { label: t("dailyAttendance.status.holiday"), value: "holiday" },
  { label: t("dailyAttendance.status.half_day"), value: "half_day" },
]);

const headers = computed(() => [
  { key: "expand", label: "" },
  { key: "date", label: t("dailyAttendance.fields.day") },
  { key: "check_in", label: t("dailyAttendance.fields.checkIn") },
  { key: "check_out", label: t("dailyAttendance.fields.checkOut") },
  { key: "actual_hours", label: t("dailyAttendance.fields.actualHours2") },
  { key: "status", label: t("dailyAttendance.fields.status") },
]);

// Methods
const fetchData = async () => {
  if (
    !authStore.hasPermission("attendance_history.view") &&
    !authStore.hasPermission("attendance.history")
  )
    return;
  loading.value = true;
  try {
    const params = {
      ...filters.value,
      date_from: filters.value.date_from
        ? new Date(filters.value.date_from).toLocaleDateString("en-CA")
        : null,
      date_to: filters.value.date_to
        ? new Date(filters.value.date_to).toLocaleDateString("en-CA")
        : null,
      page: page.value,
      per_page: perPage.value,
    };

    if (!params.employee_id) {
      delete params.employee_id;
    }

    const [historyRes, statsRes] = await Promise.all([
      attendanceHistoryService.getAttendanceHistory(params),
      attendanceHistoryService.getStatistics(params),
    ]);

    if (historyRes.success) {
      attendances.value = historyRes.data.attendances || [];
      const pagination = historyRes.data.pagination;
      if (pagination) {
        totalPages.value = pagination.last_page || 1;
        perPage.value = pagination.per_page || 10;
      }
    }

    if (statsRes.success) {
      statistics.value = statsRes.data.statistics || statistics.value;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  page.value = 1;
  fetchData();
};

const resetFilters = () => {
  filters.value = {
    date_from: null,
    date_to: null,
    employee_id: authStore.user?.id ? String(authStore.user.id) : "",
  };
  page.value = 1;
  fetchData();
};

const changePage = (newPage) => {
  page.value = newPage;
  fetchData();
};

const loadEmployees = async () => {
  if (!authStore.hasPermission("employee.view")) return;
  try {
    const res = await employeeService.list({ paginated: false });
    allEmployees.value = res.data || [];
  } catch (error) {
    console.error(error);
  }
};

// Utilities
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

const formatMinutesToHHMM = (minutes) => {
  if (minutes === null || minutes === undefined) return "00:00";
  const absMinutes = Math.abs(minutes);
  const h = Math.floor(absMinutes / 60);
  const m = absMinutes % 60;
  const sign = minutes < 0 ? "-" : "";
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const getStatusClass = (item) => {
  const status = item.status;
  switch (status) {
    case "present":
      return "bg-[#ECFDF3] text-[#085D3A]";
    case "absent":
      return "bg-[#FEF3F2] text-[#912018]";
    case "late":
      return "bg-[#FFFAEB] text-[#B54708]";
    case "mission":
      return "bg-[#F3FCF6] text-[#54C08A]";
    case "leave":
      return "bg-[#EFF8FF] text-[#1849A9]";
    case "rest_day":
      return "bg-[#E5E7EB] text-[#1F2A37]";
    case "holiday":
      return "bg-[#FEF6EE] text-[#B93815]";
    case "half_day":
      return "bg-[#F9FAFB] text-[#374151]";
    default:
      return "bg-gray-50 text-gray-600";
  }
};

const getStatusDotClass = (item) => {
  const status = item.status;
  switch (status) {
    case "present":
      return "bg-[#085D3A]";
    case "absent":
      return "bg-[#912018]";
    case "late":
      return "bg-[#B54708]";
    case "mission":
      return "bg-[#54C08A]";
    case "leave":
      return "bg-[#1849A9]";
    case "rest_day":
      return "bg-[#1F2A37]";
    case "holiday":
      return "bg-[#B93815]";
    case "half_day":
      return "bg-[#374151]";
    default:
      return "bg-gray-600";
  }
};

// Export & Print
const handlePrint = async () => {
  try {
    loading.value = true;
    const params = {
      ...filters.value,
      date_from: filters.value.date_from
        ? new Date(filters.value.date_from).toLocaleDateString("en-CA")
        : null,
      date_to: filters.value.date_to
        ? new Date(filters.value.date_to).toLocaleDateString("en-CA")
        : null,
      paginate: false,
    };

    if (!params.employee_id) {
      delete params.employee_id;
    }

    const res = await attendanceHistoryService.getAttendanceHistory(params);
    const data = res.data?.attendances || [];

    if (!data.length) {
      toast.warning(t("common.noDataToExport"));
      return;
    }

    printAttendances.value = data;

    // Calculate total pages for PrintFooter
    const rowsPerPage = 18; // Increased rows per page for print
    printTotalPages.value = Math.ceil(data.length / rowsPerPage) || 1;

    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 300));
    window.print();
  } catch (error) {
    console.error(error);
    toast.error(t("common.errors.printFailed"));
  } finally {
    loading.value = false;
  }
};

const handleExport = async (format = "excel") => {
  try {
    loading.value = true;
    const params = {
      ...filters.value,
      date_from: filters.value.date_from
        ? new Date(filters.value.date_from).toLocaleDateString("en-CA")
        : null,
      date_to: filters.value.date_to
        ? new Date(filters.value.date_to).toLocaleDateString("en-CA")
        : null,
      paginate: false,
    };

    if (!params.employee_id) {
      delete params.employee_id;
    }
    const res = await attendanceHistoryService.getAttendanceHistory(params);
    const data = res.data.attendances || [];

    if (!data.length) {
      toast.warning(t("common.noDataToExport") || "No data to export");
      return;
    }

    if (format === "excel") {
      const flattened = data.map((item, index) => ({
        "#": index + 1,
        [t("employees.fields.employeeName")]: item.employee?.name || "--",
        [t("common.date")]: item.date,
        [t("dailyAttendance.fields.day")]:
          lang.value === "ar" ? item.day_name_ar : item.day_name,
        [t("dailyAttendance.fields.checkIn")]:
          formatTime12(item.check_in_time) || "--:--",
        [t("dailyAttendance.fields.checkOut")]:
          formatTime12(item.check_out_time) || "--:--",
        [t("dailyAttendance.fields.lateness")]: formatMinutesToHHMM(
          item.lateness_minutes,
        ),
        [t("dailyAttendance.fields.positiveBalance")]: formatMinutesToHHMM(
          item.positive_balance_minutes,
        ),
        [t("dailyAttendance.fields.earlyLeave")]: formatMinutesToHHMM(
          item.early_leave_minutes,
        ),
        [t("dailyAttendance.fields.actualHours2")]: formatMinutesToHHMM(
          item.actual_working_minutes,
        ),
        [t("dailyAttendance.fields.excusals")]: formatMinutesToHHMM(
          item.permissions_minutes,
        ),
        [t("dailyAttendance.fields.overtimePunch")]:
          formatTime12(item.overtime_check_in_time) || "--:--",
        [t("dailyAttendance.fields.overtime")]: formatMinutesToHHMM(
          item.overtime_minutes,
        ),
        [t("dailyAttendance.fields.status")]: item.status_label,
      }));

      const ws = XLSX.utils.json_to_sheet(flattened);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance History");
      XLSX.writeFile(wb, `attendance_history_${new Date().getTime()}.xlsx`);
    } else if (format === "pdf") {
      const doc = new jsPDF({ orientation: "l", unit: "mm", format: "a4" });

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
      const title = t("dailyAttendance.tabs.attendanceLog");

      let pdfHeaders = [
        t("employees.fields.employeeName"),
        t("common.date"),
        t("dailyAttendance.fields.day"),
        t("dailyAttendance.fields.checkIn"),
        t("dailyAttendance.fields.checkOut"),
        t("dailyAttendance.fields.lateness"),
        t("dailyAttendance.fields.positiveBalance"),
        t("dailyAttendance.fields.earlyLeave"),
        t("dailyAttendance.fields.actualHours2"),
        t("dailyAttendance.fields.excusals"),
        t("dailyAttendance.fields.overtimePunch"),
        t("dailyAttendance.fields.overtime"),
        t("dailyAttendance.fields.status"),
      ];

      if (isArabic) {
        pdfHeaders.reverse();
      }

      const rows = data.map((item) => {
        let row = [
          item.employee?.name || "--",
          item.date,
          isArabic ? item.day_name_ar : item.day_name,
          formatTime12(item.check_in_time) || "--:--",
          formatTime12(item.check_out_time) || "--:--",
          formatMinutesToHHMM(item.lateness_minutes),
          formatMinutesToHHMM(item.positive_balance_minutes),
          formatMinutesToHHMM(item.early_leave_minutes),
          formatMinutesToHHMM(item.actual_working_minutes),
          formatMinutesToHHMM(item.permissions_minutes),
          formatTime12(item.overtime_check_in_time) || "--:--",
          formatMinutesToHHMM(item.overtime_minutes),
          item.status_label,
        ];
        return isArabic ? row.reverse() : row;
      });

      autoTable(doc, {
        startY: 52,
        head: [pdfHeaders],
        body: rows,
        styles: {
          font: "IBMPlexSansArabic",
          halign: isArabic ? "right" : "left",
          fontSize: 7,
          fontStyle: "normal",
          cellPadding: 1.5,
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
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawPdfFooter(doc, authStore, i, totalPages, isArabic);
      }

      doc.save(`attendance_history_${new Date().getTime()}.pdf`);
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

onMounted(() => {
  if (authStore.user && !filters.value.employee_id) {
    filters.value.employee_id = String(authStore.user.id);
  }
  fetchData();
  loadEmployees();
});

defineExpose({
  handlePrint,
  handleExport,
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

  th {
    background-color: #0e5f4a !important;
    color: white !important;
    padding: 10px 6px !important;
    font-size: 8px !important;
    border: 1px solid #d2d6db !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    text-align: center !important;
  }

  td {
    padding: 8px 6px !important;
    font-size: 8px !important;
    border: 1px solid #d2d6db !important;
    text-align: center !important;
  }
}

/* Hide scrollbar but keep functionality */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

.rotate-270 {
  transform: rotate(270deg);
}
</style>
