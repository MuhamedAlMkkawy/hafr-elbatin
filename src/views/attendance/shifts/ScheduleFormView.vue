<template>
  <div class="space-y-6">
    <!-- Breadcrumbs -->
    <!-- <Breadcrumb :items="breadcrumbItems" /> -->

    <!-- Top Actions -->
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <div class="flex items-center gap-3">
        <h1 class="text-[20px] font-[600] text-[#000000]">
          {{
            isEdit
              ? t("shifts.modals.schedules.editMonthlySchedule")
              : t("shifts.modals.schedules.addMonthlySchedule")
          }}
          - {{ shiftName }}
        </h1>
        <span
          v-if="isEdit && schedule?.status"
          class="px-3 py-1 rounded-full text-[14px] font-semibold"
          :class="
            schedule.status === 'published'
              ? 'bg-[#ECFDF3] text-[#085D3A]'
              : 'bg-[#E5E7EB] text-[#1F2A37]'
          "
        >
          <div class="flex gap-2 items-center">
            <div
              class="rounded-full w-[10px] h-[10px]"
              :class="
                schedule?.status === 'published'
                  ? 'bg-[#085D3A]'
                  : 'bg-[#4D5761]'
              "
            ></div>
            <div>
              {{ t(`shifts.modals.schedules.status.${schedule?.status}`) }}
            </div>
          </div>
        </span>
      </div>
      <div class="flex gap-2">
        <Button
          v-if="!isEdit || (isEdit && schedule?.status === 'draft')"
          size="md"
          @click="showCopyModal = true"
          class="gap-2 bg-[#0E5F4A] text-white"
        >
          <SvgIcon name="copy" classes="w-5 h-5 text-white" />
          {{ t("shifts.modals.schedules.copyPreviousMonth") }}
        </Button>
      </div>
    </div>

    <!-- Form Section -->
    <Card>
      <div class="space-y-6">
        <Select
          v-model="monthValue"
          :options="monthOptions"
          :label="t('shifts.modals.schedules.fields.month')"
          :placeholder="t('shifts.modals.schedules.placeholders.month')"
          size="md"
          :error="validationErrors.month"
          @update:model-value="handleMonthChange"
        >
          <template #suffix>
            <SvgIcon name="calender_icon" />
          </template>
        </Select>

        <!-- Incomplete Days Banner (Edit Mode) -->
        <div
          v-if="isEdit && incompleteDaysCount > 0"
          class="flex gap-3 p-4 rounded-[8px] border border-[#FEDF89] bg-[#FFFCF5] text-sm border-r-[8px] border-r-[#DC6803]"
        >
          <SvgIcon name="incomplete" size="sm" class="md:block hidden" />

          <div>
            <!-- Message -->
            <p class="leading-5 text-[#B54708] font-[600] text-[16px]">
              {{
                t("shifts.modals.schedules.messages.incompleteBanner", {
                  count: incompleteDaysCount,
                })
              }}
            </p>

            <p class="text-[#384250] text-[14px] mt-2">
              {{ t("shifts.modals.schedules.messages.incompleteModalMessage") }}
            </p>

            <!-- Button -->
            <div
              class="font-semibold text-[#161616] cursor-pointer mt-3 hover:underline max-w-[150px]"
              @click="handleShowIncompleteDays"
            >
              {{ t("shifts.modals.schedules.messages.showIncompleteDays") }}
            </div>
          </div>
        </div>

        <!-- Monthly Days Assignment Table -->
        <Table
          :items="monthDays"
          :headers="tableHeaders"
          :row-class="tableRowClass"
          :loading="loading"
          table-class="min-w-[800px]"
          class="shadow-sm"
          max-height="600px"
          overflow-visible
        >
          <!-- Custom Headers for periods with asterisk -->
          <template #header-morning="{ header }">
            <div class="text-center">
              {{ header.label }}
              <span class="text-[#B42318]" v-if="status === 'published'"
                >*</span
              >
            </div>
          </template>
          <template #header-evening="{ header }">
            <div class="text-center">
              {{ header.label }}
              <span class="text-[#B42318]" v-if="status === 'published'"
                >*</span
              >
            </div>
          </template>
          <template #header-night="{ header }">
            <div class="text-center">
              {{ header.label }}
              <span class="text-[#B42318]" v-if="status === 'published'"
                >*</span
              >
            </div>
          </template>

          <!-- Cells -->
          <template #cell-index="{ index }">
            <div class="text-center font-medium">
              {{ index + 1 }}
            </div>
          </template>

          <template #cell-dayName="{ item }">
            <span class="text-[#344054]">{{ item.dayName }}</span>
          </template>

          <template #cell-copy="{ index }">
            <div class="flex justify-center">
              <button
                v-if="index > 0"
                type="button"
                @click="copyFromPreviousDay(index)"
                class="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                v-tooltip="{
                  title: t('shifts.modals.schedules.copyPreviousDay'),
                }"
              >
                <SvgIcon name="copy" classes="w-5 h-5 text-[#0E5F4A]" />
              </button>
            </div>
          </template>

          <template #cell-formattedDate="{ item }">
            <span class="text-[#344054]">{{ item.formattedDate }}</span>
          </template>

          <template #cell-morning="{ item, index }">
            <div class="px-2">
              <Select
                v-model="item.assignments.morning"
                :options="employeeOptions"
                :placeholder="
                  t('shifts.modals.schedules.placeholders.selectEmployee')
                "
                size="sm"
                searchable
                @update:model-value="validateEmployee(index, 'morning')"
                insideTable
                :teleport="false"
              />
            </div>
          </template>

          <template #cell-evening="{ item, index }">
            <div class="px-2">
              <Select
                v-model="item.assignments.evening"
                :options="employeeOptions"
                :placeholder="
                  t('shifts.modals.schedules.placeholders.selectEmployee')
                "
                size="sm"
                searchable
                @update:model-value="validateEmployee(index, 'evening')"
                insideTable
                :teleport="false"
              />
            </div>
          </template>

          <template #cell-night="{ item, index }">
            <div class="px-2">
              <Select
                v-model="item.assignments.night"
                :options="employeeOptions"
                :placeholder="
                  t('shifts.modals.schedules.placeholders.selectEmployee')
                "
                size="sm"
                searchable
                @update:model-value="validateEmployee(index, 'night')"
                insideTable
                :teleport="false"
              />
            </div>
          </template>
        </Table>
      </div>
    </Card>
    <!-- Actions -->
    <div class="flex flex-wrap gap-3 justify-end mb-8">
      <Button
        type="button"
        variant="secondary"
        @click="handleCancel"
        class="border-[#D0D5DD] text-[#344054]"
      >
        {{ t("common.cancel") }}
      </Button>
      <Button
        type="button"
        class="bg-[#E7EFED] !border !border-[#0E5F4A] !text-[#0E5F4A] hover:!bg-[#DDE6E4]"
        @click="handleSubmit('draft')"
        :loading="saving && status === 'draft'"
        :disabled="loading"
        v-if="schedule?.status !== 'published'"
      >
        {{ t("shifts.modals.schedules.saveAsDraft") }}
      </Button>
      <Button
        type="button"
        variant="primary"
        @click="handleSubmit('published')"
        :loading="saving && status === 'published'"
        :disabled="loading"
      >
        {{ t("shifts.modals.schedules.publish") }}
      </Button>
    </div>

    <!-- Cancel Confirmation Modal (Image 1) -->
    <Modal
      v-model="showCancelConfirmModal"
      width="md"
      icon="warning"
      border-color="#e6964d"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("shifts.modals.schedules.messages.cancelTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("shifts.modals.schedules.messages.cancelMessage") }}
        </p>
      </div>
      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button
            class="!bg-[#FFFAEB] !text-[#DC6803] border-none hover:!bg-[#FFF5D6]"
            size="md"
            @click="showCancelConfirmModal = false"
          >
            {{ t("shifts.modals.schedules.messages.cancelContinueEditing") }}
          </Button>
          <Button
            variant="ghost"
            class="w-full"
            size="md"
            @click="confirmCancel"
          >
            {{ t("common.cancel") }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Copy From Previous Day Modals (Images 2 & 3) -->
    <Modal
      v-model="showCopyDaySuccessModal"
      width="md"
      icon="success"
      border-color="#54b387"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("shifts.modals.schedules.messages.copyDaySuccessTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("shifts.modals.schedules.messages.copyDaySuccessMessage") }}
        </p>
      </div>
      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button
            size="md"
            @click="showCopyDaySuccessModal = false"
            class="bg-[#ECFDF3] !text-[#51B488] w-full hover:bg-[#D4F1E1]"
          >
            {{ t("shifts.modals.schedules.messages.reviewSchedule") }}
          </Button>
          <Button
            variant="ghost"
            class="w-full"
            size="md"
            @click="showCopyDaySuccessModal = false"
          >
            {{ t("common.cancel") }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Incomplete Days Modal (Image 5) -->
    <Modal
      v-model="showIncompleteDaysModal"
      width="md"
      icon="warning"
      border-color="#e6964d"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("shifts.modals.schedules.messages.incompleteModalTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("shifts.modals.schedules.messages.incompleteModalMessage") }}
        </p>
      </div>
      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button
            class="w-full bg-[#FFFAEB] !text-[#E7954F] hover:bg-[#FFF5D6]"
            size="md"
            @click="showIncompleteDaysModal = false"
          >
            {{ t("shifts.modals.schedules.messages.incompleteModalContinue") }}
          </Button>
          <Button variant="ghost" size="md" @click="saveIncompleteAsDraft">
            {{ t("shifts.modals.schedules.messages.incompleteModalSaveDraft") }}
          </Button>
        </div>
      </template>
    </Modal>

    <Modal
      v-model="showCopyDayEmptyModal"
      width="md"
      icon="error"
      border-color="#e76d62"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("shifts.modals.schedules.messages.copyDayEmptyTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("shifts.modals.schedules.messages.copyDayEmptyMessage") }}
        </p>
      </div>
      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button
            class="w-full bg-[#FEF3F2] !text-[#B42318] border-none hover:bg-[#FDE4E2]"
            size="md"
            @click="showCopyDayEmptyModal = false"
          >
            {{ t("shifts.modals.schedules.messages.assignManually") }}
          </Button>
          <Button
            size="md"
            @click="showCopyDayEmptyModal = false"
            variant="ghost"
          >
            {{ t("common.cancel") }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Draft Saved & Publish Success Modals (Images 5 & 6) -->
    <Modal
      v-model="showDraftSuccessModal"
      width="md"
      icon="success"
      border-color="#54b387"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("shifts.modals.schedules.messages.draftSavedTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("shifts.modals.schedules.messages.draftSavedMessage") }}
        </p>
      </div>
      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button
            class="bg-[#ECFDF3] !text-[#51B488] w-full hover:bg-[#D4F1E1]"
            size="md"
            @click="showDraftSuccessModal = false"
          >
            {{ t("shifts.modals.schedules.messages.continueSchedule") }}
          </Button>
          <Button variant="ghost" class="w-full" size="md" @click="goBack">
            {{ t("common.cancel") }}
          </Button>
        </div>
      </template>
    </Modal>

    <Modal
      v-model="showPublishSuccessModal"
      width="md"
      icon="success"
      border-color="#54b387"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("shifts.modals.schedules.messages.publishedTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("shifts.modals.schedules.messages.publishedMessage") }}
        </p>
      </div>
      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button
            size="md"
            @click="goToDetailsPage"
            class="bg-[#ECFDF3] !text-[#51B488] w-full hover:bg-[#D4F1E1]"
          >
            {{ t("shifts.modals.schedules.messages.viewPublishedSchedule") }}
          </Button>
          <Button
            class="w-full"
            size="md"
            @click="((showPublishSuccessModal = false), goBack())"
            variant="ghost"
          >
            {{ t("common.cancel") }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Copy From Previous Month Modal -->
    <Modal
      v-model="showCopyModal"
      width="xl"
      :title="t('shifts.modals.schedules.copyPreviousMonth')"
      overflow-visible
    >
      <div class="space-y-4">
        <Select
          v-model="selectedPreviousMonth"
          :options="previousMonthOptions"
          :label="t('shifts.modals.schedules.fields.month')"
          :placeholder="t('shifts.modals.schedules.placeholders.month')"
          searchable
          :loading="loadingPreviousMonths"
        >
          <template #suffix>
            <SvgIcon name="calender_icon" size="sm" />
          </template>
        </Select>
        <div
          class="px-3 pb-3 text-[#384250] text-sm rounded-lg flex items-start gap-2"
        >
          <SvgIcon name="copy_info" size="sm" class="mt-0.5" />
          {{ t("shifts.modals.schedules.messages.copyConfirm") }}
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2">
          <Button
            variant="secondary"
            class="flex-1"
            @click="showCopyModal = false"
          >
            {{ t("common.cancel") }}
          </Button>
          <Button
            variant="primary"
            class="flex-1"
            @click="handleCopy"
            :disabled="!selectedPreviousMonth"
            :icon="'copy'"
          >
            {{ t("common.copy") }}
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, inject, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { toTypedSchema } from "@vee-validate/yup";
import { useAppToast } from "@/composables/useAppToast";
import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Select from "@/components/ui/Select.vue";
import Icon from "@/components/ui/Icon.vue";
import Modal from "@/components/ui/Modal.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Table from "@/components/ui/Table.vue";
import api from "@/services/api";
import { shiftService } from "@/services/shifts";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const setShiftBreadcrumbLabel = inject("setShiftBreadcrumbLabel", null);

const shiftId = computed(() => route.params.id);
const scheduleId = computed(() => route.params.scheduleId);
const isEdit = computed(() => !!scheduleId.value);

const shift = ref(null);
const schedule = ref(null);
const createdScheduleId = ref(null);

const schema = toTypedSchema(
  yup.object({
    month: yup
      .string()
      .required(t("shifts.modals.schedules.messages.monthRequired")),
  }),
);

const { errors: validationErrors, handleSubmit: validateAndSubmit } = useForm({
  validationSchema: schema,
});

const { value: monthValue } = useField("month");
const monthDays = ref([]);
const errors = ref({});
const status = ref("draft");
const saving = ref(false);
const loading = ref(true);
const employees = ref([]);
const loadingEmployees = ref(false);
const highlightIncompleteDays = ref(false);

const isPublished = computed(() => schedule.value?.status === "published");

const shiftName = computed(() => {
  if (!shift.value) return "";
  return locale.value === "ar" ? shift.value.name_ar : shift.value.name;
});

watch(
  shiftName,
  (newVal) => {
    if (setShiftBreadcrumbLabel) {
      setShiftBreadcrumbLabel(newVal);
    }
  },
  { immediate: true },
);

const breadcrumbItems = computed(() => {
  const prefix = locale.value === "en" ? "/en" : "";
  return [
    { label: t("sidebar.attendance") },
    {
      label: t("attendanceSettings.title"),
      to: `${prefix}/attendance/settings/shifts`,
    },
    { label: t("shifts.title"), to: `${prefix}/attendance/settings/shifts` },
    {
      label: t("shifts.modals.schedules.monthlyTitle"),
      to: `${prefix}/attendance/settings/shifts/${shiftId.value}/schedules`,
    },
    {
      label: isEdit.value
        ? t("shifts.modals.schedules.editMonthlySchedule")
        : t("shifts.modals.schedules.addMonthlySchedule"),
    },
  ];
});

const employeeOptions = computed(() => {
  const options =
    employees.value?.map((e) => ({ label: e.name, value: e.id })) || [];

  // If editing, add current assigned employees from all days to options if not present
  if (schedule.value?.assignments) {
    schedule.value.assignments.forEach((day) => {
      ["morning", "evening", "night"].forEach((period) => {
        const periodData = day.periods?.[period];
        if (periodData?.employee) {
          if (!options.some((opt) => opt.value === periodData.employee.id)) {
            options.push({
              label: periodData.employee.name,
              value: periodData.employee.id,
            });
          }
        }
      });
    });
  }

  return options;
});

const tableHeaders = computed(() => [
  { key: "index", label: "#", headerClass: "w-12 text-center" },
  { key: "dayName", label: t("common.day"), headerClass: "border-none" },
  { key: "copy", label: "", headerClass: "w-12 text-center" },
  { key: "formattedDate", label: t("common.date") },
  {
    key: "morning",
    label: t("shifts.modals.schedules.fields.morning"),
    headerClass: "text-center",
  },
  {
    key: "evening",
    label: t("shifts.modals.schedules.fields.evening"),
    headerClass: "text-center",
  },
  {
    key: "night",
    label: t("shifts.modals.schedules.fields.night"),
    headerClass: "text-center",
  },
]);

const tableRowClass = (day) => ({
  "opacity-50 pointer-events-none": isPastDate(day.date),
  "bg-[#FFF8F7] hover:!bg-[#FEF3F2]":
    highlightIncompleteDays.value && isDayIncomplete(day),
});

const isDayIncomplete = (day) => {
  if (isPastDate(day.date)) return false;
  if (!day?.assignments) return true;
  const { morning, evening, night } = day.assignments;
  return !(morning && evening && night);
};

const incompleteDaysCount = computed(
  () => monthDays.value.filter((day) => isDayIncomplete(day)).length,
);

const fetchEmployees = async () => {
  const departmentId = route.query.department_id || shift.value?.department_id;
  if (!departmentId) return;

  loadingEmployees.value = true;
  try {
    const response = await api.get("/employees", {
      params: {
        paginate: false,
        department_id: departmentId,
        work_system_type: "shift",
      },
    });
    employees.value = response.data?.data || response.data || [];
  } catch (error) {
    console.error(error);
  } finally {
    loadingEmployees.value = false;
  }
};

const loadData = async () => {
  try {
    const shiftRes = await shiftService.getById(shiftId.value);
    shift.value = shiftRes.data?.shift || shiftRes.data || shiftRes;

    if (isEdit.value) {
      const scheduleRes = await shiftService.getSchedule(
        shiftId.value,
        scheduleId.value,
      );
      schedule.value =
        scheduleRes.data?.schedule || scheduleRes.data || scheduleRes;
      monthValue.value = `${schedule.value.year}-${String(
        schedule.value.month,
      ).padStart(2, "0")}`;
      generateMonthDays(schedule.value.year, schedule.value.month);
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      monthValue.value = `${year}-${String(month).padStart(2, "0")}`;
      generateMonthDays(year, month);
    }
    fetchEmployees();
    fetchPreviousMonths();
  } catch (error) {
    console.error(error);
    toast.error(error);
  }
};

const getEmployeeId = (periodData) => {
  if (!periodData) return null;
  if (typeof periodData === "object") {
    return periodData.employee?.id || periodData.id || null;
  }
  return periodData; // already an ID
};

const generateMonthDays = (year, month, preserveExisting = false) => {
  const lastDay = new Date(year, month, 0).getDate();
  const days = [];

  const existingDays = preserveExisting ? monthDays.value : [];

  for (let i = 1; i <= lastDay; i++) {
    const date = new Date(year, month - 1, i);
    const dateStr = date.toISOString().split("T")[0];

    // Try to preserve current UI selections if requested
    const existingDay = existingDays[i - 1];
    let assignments;

    if (preserveExisting && existingDay?.assignments) {
      // Clone to avoid shared references between days
      assignments = { ...existingDay.assignments };
    } else {
      // Fallback to assignments coming from the loaded schedule (edit mode)
      const existingSchedule = schedule.value?.assignments?.find(
        (a) => a.day === i,
      );

      assignments = {
        morning: getEmployeeId(existingSchedule?.periods?.morning),
        evening: getEmployeeId(existingSchedule?.periods?.evening),
        night: getEmployeeId(existingSchedule?.periods?.night),
      };
    }

    days.push({
      date: dateStr,
      dayName: date.toLocaleDateString(
        locale.value === "ar" ? "ar-EG" : "en-US",
        { weekday: "long" },
      ),
      formattedDate: `${month}/${i}/${year}`,
      assignments,
    });
  }

  monthDays.value = days;
};

const handleMonthChange = () => {
  if (!monthValue.value) return;

  const [year, month] = monthValue.value.split("-").map(Number);

  // Preserve already-entered assignments when user changes the month
  generateMonthDays(year, month, true);
};

const isPastDate = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return target < today;
};

const copyFromPreviousDay = (index) => {
  const prev = monthDays.value[index - 1];
  if (prev) {
    const hasData =
      prev.assignments.morning ||
      prev.assignments.evening ||
      prev.assignments.night;

    if (!hasData) {
      showCopyDayEmptyModal.value = true;
      return;
    }

    monthDays.value[index].assignments = { ...prev.assignments };
    showCopyDaySuccessModal.value = true;
  }
};

const validateEmployee = (index, period) => {
  const day = monthDays.value[index];
  const selected = day.assignments[period];
  if (!selected) return;

  const others = Object.entries(day.assignments)
    .filter(([p]) => p !== period)
    .map(([, id]) => id);

  if (others.includes(selected)) {
    toast.warning(t("shifts.modals.schedules.messages.employeeUnique"));
    day.assignments[period] = null;
  }
};

const handleShowIncompleteDays = () => {
  highlightIncompleteDays.value = true;

  const firstIncompleteIndex = monthDays.value.findIndex((day) =>
    isDayIncomplete(day),
  );

  if (firstIncompleteIndex !== -1) {
    nextTick(() => {
      const row = document.querySelector(
        `[data-row-index="${firstIncompleteIndex}"]`,
      );
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }
};

const handleSubmit = (targetStatus) => {
  status.value = targetStatus;

  if (targetStatus === "published" && incompleteDaysCount.value > 0) {
    showIncompleteDaysModal.value = true;
    return;
  }

  // Wrap the actual processing in VeeValidate's handleSubmit
  onSubmit();
};

const onSubmit = validateAndSubmit(async () => {
  if (status.value === "published") {
    const hasAssignments = monthDays.value.some(
      (day) =>
        day.assignments.morning ||
        day.assignments.evening ||
        day.assignments.night,
    );
    if (!hasAssignments) {
      toast.error(t("shifts.modals.schedules.messages.employeeRequired"));
      return;
    }
  }

  saving.value = true;

  const [year, month] = monthValue.value.split("-").map(Number);

  const assignments = monthDays.value
    .map((day, index) => {
      // If the day is in the past, don't send its assignments to the API
      if (isPastDate(day.date)) return null;

      const periods = {};
      if (day.assignments.morning) periods.morning = day.assignments.morning;
      if (day.assignments.evening) periods.evening = day.assignments.evening;
      if (day.assignments.night) periods.night = day.assignments.night;

      return {
        day: index + 1,
        periods,
      };
    })
    .filter((a) => a && Object.keys(a.periods).length > 0);

  try {
    const payload = {
      year,
      month,
      working_days: ["sunday", "monday", "tuesday", "wednesday", "thursday"], // لو عندك ديناميك خليه computed
      status: status.value,
      assignments,
    };

    if (isEdit.value) {
      await shiftService.updateSchedule(
        shiftId.value,
        scheduleId.value,
        payload,
      );
      if (status.value === "draft") {
        showDraftSuccessModal.value = true;
      } else {
        showPublishSuccessModal.value = true;
      }
    } else {
      const res = await shiftService.createSchedule(shiftId.value, payload);
      createdScheduleId.value = res.data?.schedule?.id || res.data?.id;
      if (status.value === "draft") {
        showDraftSuccessModal.value = true;
      } else {
        showPublishSuccessModal.value = true;
      }
    }
  } catch (error) {
    toast.error(error);
  } finally {
    saving.value = false;
  }
});

const handleCancel = () => {
  // if (!isEdit.value) {
  //   showCancelConfirmModal.value = true;
  // } else {
  //   goBack();
  // }
  showCancelConfirmModal.value = true;
};

const confirmCancel = () => {
  showCancelConfirmModal.value = false;
  goBack();
};

const goBack = () => {
  const prefix = locale.value === "en" ? "/en" : "";
  router.push({
    path: `${prefix}/attendance/settings/shifts/${shiftId.value}/schedules`,
    query: route.query,
  });
};

const goToDetailsPage = () => {
  const prefix = locale.value === "en" ? "/en" : "";

  const id = scheduleId.value || createdScheduleId.value;

  router.push({
    path: `${prefix}/attendance/settings/shifts/${shiftId.value}/schedules/${id}`,
    query: route.query,
  });
};

// Copy Previous Month Logic
const showCopyModal = ref(false);
const selectedPreviousMonth = ref(null);
const previousMonthSchedules = ref([]);
const loadingPreviousMonths = ref(false);

const previousMonthOptions = computed(() =>
  previousMonthSchedules.value.map((s) => ({
    label: s.period_label,
    value: s.id,
  })),
);

const currentYear = new Date().getFullYear();

const monthOptions = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { month: "long" });
  const year = new Date().getFullYear();

  return Array.from({ length: 12 }, (_, i) => ({
    label: formatter.format(new Date(year, i, 1)),
    value: `${year}-${String(i + 1).padStart(2, "0")}`,
  }));
});

const fetchPreviousMonths = async () => {
  if (!shiftId.value) return;
  loadingPreviousMonths.value = true;
  try {
    const response = await shiftService.getSchedules(shiftId.value, {
      status: "published",
      paginate: false,
    });
    const data = response.data || [];
    // استخدام نفس منطق سنة التعديل من شاشة ShiftsIndexView:
    // إتاحة النسخ فقط من جداول السنة الحالية أو الأحدث (إن وُجدت).
    previousMonthSchedules.value = data.filter((s) =>
      s.year ? Number(s.year) >= currentYear : true,
    );
  } catch (error) {
    console.error(error);
  } finally {
    loadingPreviousMonths.value = false;
  }
};

const handleCopy = async () => {
  if (!selectedPreviousMonth.value) return;
  try {
    const response = await shiftService.getSchedule(
      shiftId.value,
      selectedPreviousMonth.value,
    );
    const prevAssignments =
      response.data?.schedule?.assignments || response.data?.assignments || [];

    monthDays.value.forEach((day, index) => {
      const dayNum = index + 1;
      const prevDay = prevAssignments.find((a) => a.day === dayNum);
      if (prevDay) {
        const getActiveId = (period) => {
          const id = getEmployeeId(period);
          return id && employees.value.some((e) => e.id === id) ? id : null;
        };

        day.assignments = {
          morning: getActiveId(prevDay.periods?.morning),
          evening: getActiveId(prevDay.periods?.evening),
          night: getActiveId(prevDay.periods?.night),
        };
      }
    });

    showCopyModal.value = false;
    toast.success(t("shifts.modals.schedules.messages.monthlyCopied"));
  } catch (error) {
    toast.error(error);
  }
};

const showCancelConfirmModal = ref(false);
const showCopyDaySuccessModal = ref(false);
const showCopyDayEmptyModal = ref(false);
const showDraftSuccessModal = ref(false);
const showPublishSuccessModal = ref(false);
const showIncompleteDaysModal = ref(false);

const saveIncompleteAsDraft = async () => {
  showIncompleteDaysModal.value = false;
  await handleSubmit("draft");
};

onMounted(async () => {
  loading.value = true;
  try {
    await loadData();
  } finally {
    loading.value = false;
  }
});
</script>
