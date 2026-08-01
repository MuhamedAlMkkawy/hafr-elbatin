<template>
  <div class="space-y-6">
    <!-- Breadcrumbs -->
    <!-- <Breadcrumb :items="breadcrumbItems" /> -->

    <!-- Top Actions -->
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <h1 class="text-[20px] font-[600] text-[#000000]">
        {{
          isMonthly
            ? t("shifts.modals.schedules.monthlyTitle")
            : t("shifts.modals.schedules.title")
        }}
        - {{ shiftName }}
        <span
          class="bg-[#E7EFED] text-[#0E5F4A] text-[16px] font-medium px-2.5 pb-0.5 rounded-full mr-2 border border-[#82ACA1]"
          v-if="shift"
        >
          {{ t(`shifts.types.${shift?.type}`) }}
        </span>
      </h1>
      <Button variant="primary" icon="plus" size="md" @click="openCreate">
        {{
          isMonthly
            ? t("shifts.modals.schedules.monthlySchedule")
            : t("shifts.modals.schedules.annualSchedule")
        }}
      </Button>
    </div>

    <!-- Search Card -->
    <Card>
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("shifts.searchTitle") }}
        </h2>
      </template>

      <div v-if="isMonthly" class="grid grid-cols-1 gap-2">
        <div class="grid grid-cols-2 gap-2">
          <Select
            v-model="filters.month"
            :options="monthOptions"
            :label="t('shifts.modals.schedules.fields.month')"
            :placeholder="t('shifts.modals.schedules.placeholders.month')"
            size="md"
          >
            <template #suffix>
              <SvgIcon name="calender_icon" />
            </template>
          </Select>

          <Select
            v-model="filters.status"
            :options="statusOptions"
            :label="t('shifts.modals.schedules.fields.status')"
            :placeholder="t('shifts.modals.schedules.placeholders.status')"
            size="md"
          />
        </div>

        <div class="flex gap-2 mt-4 justify-end">
          <Button variant="ghost" size="md" @click="resetFilters" class="md:w-26">
            {{ t("roles.resetFilters") }}
          </Button>
          <Button variant="primary" size="md" @click="applyFilters" class="md:w-26">
            {{ t("common.search") }}
          </Button>
        </div>
      </div>

      <!-- Annual Filter -->
      <div v-else class="grid grid-cols-1 gap-4 items-end">
        <Select
          v-model="filters.year"
          :options="yearOptions"
          :label="t('shifts.modals.schedules.fields.year')"
          :placeholder="t('shifts.modals.schedules.placeholders.year')"
        >
          <template #suffix>
            <SvgIcon name="calender_icon" />
          </template>
        </Select>

        <div class="flex gap-2 justify-end">
          <Button variant="ghost" size="md" @click="resetFilters" class="md:w-26">
            {{ t("roles.resetFilters") }}
          </Button>
          <Button variant="primary" size="md" @click="applyFilters" class="md:w-26">
            {{ t("common.search") }}
          </Button>
        </div>
      </div>
    </Card>

    <!-- Table Card -->
    <Card>
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{
            isMonthly
              ? t("shifts.modals.schedules.monthlyTitle")
              : t("shifts.modals.schedules.title")
          }}
          - {{ shiftName }}
        </h2>
      </template>

      <Table
        :loading="loading"
        :items="schedules"
        :headers="tableHeaders"
        :page="page"
        :total-pages="totalPages"
        @change-page="changePage"
      >
        <template #cell-index="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>

        <!-- Monthly Specific Columns -->
        <template v-if="isMonthly" #cell-period_label="{ item }">
          {{ item.period_label }}
        </template>

        <template v-if="isMonthly" #cell-status="{ item }">
          <span
            :class="[
              'px-2 py-1 rounded-full text-[14px] font-[500] flex items-center gap-2 w-fit',
              item.status === 'published'
                ? 'bg-[#ECFDF3] text-[#085D3A]'
                : 'bg-[#F9FAFB] text-[#1F2A37]',
            ]"
          >
            <span
              :class="[
                'w-[10px] h-[10px] rounded-full',
                item.status === 'published' ? 'bg-[#085D3A]' : 'bg-[#4D5761]',
              ]"
            ></span>
            {{ t(`shifts.modals.schedules.status.${item.status}`) }}
          </span>
        </template>

        <!-- Annual Specific Columns -->
        <template v-if="isAnnual" #cell-year="{ item }">
          {{ item.year }}
        </template>

        <template v-if="isAnnual" #cell-morning="{ item }">
          <div class="flex items-center gap-2">
            <!-- <span class="w-2 h-2 rounded-full bg-blue-400"></span> -->
            {{ getAssignment(item, "morning")?.employee?.name || "-" }}
          </div>
        </template>

        <template v-if="isAnnual" #cell-evening="{ item }">
          <div class="flex items-center gap-2">
            <!-- <span class="w-2 h-2 rounded-full bg-orange-400"></span> -->
            {{ getAssignment(item, "evening")?.employee?.name || "-" }}
          </div>
        </template>

        <template v-if="isAnnual" #cell-night="{ item }">
          <div class="flex items-center gap-2">
            <!-- <span class="w-2 h-2 rounded-full bg-indigo-400"></span> -->
            {{ getAssignment(item, "night")?.employee?.name || "-" }}
          </div>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center gap-2">
            <button
              class="cursor-pointer"
              @click="openView(item)"
              v-tooltip="{
                title: isMonthly
                  ? t('shifts.modals.schedules.viewMonthlySchedule')
                  : t('shifts.modals.schedules.viewSchedule'),
                content: t('common.actionTooltips.view.content', {
                  target: t('shifts.modals.schedules.entityName'),
                  name: isMonthly ? item.period_label : item.year,
                }),
              }"
            >
              <SvgIcon name="eye" classes="w-8 h-8" />
            </button>
            <button
              v-if="!isPast(item)"
              class="cursor-pointer"
              @click="openEdit(item)"
              v-tooltip="{
                title: isMonthly
                  ? t('shifts.modals.schedules.editMonthlySchedule')
                  : t('shifts.modals.schedules.editSchedule'),
                content: t('common.actionTooltips.edit.content', {
                  target: t('shifts.modals.schedules.entityName'),
                  name: isMonthly ? item.period_label : item.year,
                }),
              }"
            >
              <SvgIcon name="edit" classes="w-8 h-8" />
            </button>
            <button
              v-if="canDelete(item)"
              class="cursor-pointer"
              @click="openDelete(item)"
              v-tooltip="{
                title: t('common.delete'),
                content: t('common.actionTooltips.delete.content', {
                  target: t('shifts.modals.schedules.entityName'),
                  name: isMonthly ? item.period_label : item.year,
                }),
              }"
            >
              <SvgIcon name="trash" classes="w-8 h-8" />
            </button>
          </div>
        </template>
      </Table>
    </Card>

    <!-- Modals (for Annuals) -->
    <ScheduleFormModal
      v-if="isAnnual"
      v-model="showFormModal"
      :shift="shift"
      :schedule="selectedSchedule"
      :loading="saving"
      @save="handleSave"
    />

    <ScheduleDetailsModal
      v-if="isAnnual"
      v-model="showDetailsModal"
      :schedule="selectedSchedule"
      @edit="openEditFromView"
    />

    <Modal
      v-model="showDeleteConfirm"
      width="lg"
      icon="error"
      border-color="#e76d62"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("shifts.modals.schedules.messages.confirmDeleteTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{
            isMonthly
              ? t("shifts.modals.schedules.messages.confirmDeleteMessage", {
                  month: scheduleToDelete?.period_label,
                })
              : t("shifts.modals.deleteMessage")
          }}
        </p>
      </div>
      <template #footer>
        <div class="flex flex-col gap-3 w-full">
          <Button
            class="w-full bg-[#FEF3F2] !text-[#B42318] border-none hover:bg-[#FDE4E2]"
            size="md"
            @click="confirmDelete"
          >
            {{ t("common.delete") }}
          </Button>
          <Button
            variant="ghost"
            class="w-full"
            size="md"
            @click="showDeleteConfirm = false"
          >
            {{ t("common.cancel") }}
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, inject } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAppToast } from "@/composables/useAppToast";
import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Select from "@/components/ui/Select.vue";
import Table from "@/components/ui/Table.vue";
import Modal from "@/components/ui/Modal.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { shiftService } from "@/services/shifts";
import ScheduleFormModal from "./ScheduleFormModal.vue";
import ScheduleDetailsModal from "./ScheduleDetailsModal.vue";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const setShiftBreadcrumbLabel = inject("setShiftBreadcrumbLabel", null);

const shiftId = computed(() => route.params.id);
const shift = ref(null);
const schedules = ref([]);
const loading = ref(true);
const saving = ref(false);
const selectedSchedule = ref(null);
const scheduleToDelete = ref(null);
const showDeleteConfirm = ref(false);
const showFormModal = ref(false);
const showDetailsModal = ref(false);

const isMonthly = computed(() => shift.value?.type === "monthly");
const isAnnual = computed(() => shift.value?.type === "annual");

const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const totalPages = computed(() => Math.ceil(total.value / perPage.value) || 1);

const filters = ref({
  year: null,
  month: null,
  status: null,
  sort_by: "created_at",
  sort_direction: "desc",
});

const statusOptions = computed(() => [
  { label: t("shifts.modals.schedules.status.published"), value: "published" },
  { label: t("shifts.modals.schedules.status.draft"), value: "draft" },
]);

const monthOptions = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { month: "long" });
  return Array.from({ length: 12 }, (_, i) => ({
    label: formatter.format(new Date(2024, i, 1)),
    value: i + 1,
  }));
});

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    years.push({ label: i.toString(), value: i });
  }
  return years;
});

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
      label: isMonthly.value
        ? t("shifts.modals.schedules.monthlyTitle")
        : t("shifts.modals.schedules.title"),
    },
  ];
});

const tableHeaders = computed(() => {
  if (isMonthly.value) {
    return [
      { key: "index", label: "#" },
      { key: "period_label", label: t("shifts.modals.schedules.fields.month") },
      {
        key: "created_by.name",
        label: t("shifts.modals.schedules.fields.createdBy"),
      },
      { key: "status", label: t("shifts.modals.schedules.fields.status") },
      {
        key: "actions",
        label: t("shifts.fields.actions"),
        cellClass: "w-32 text-center",
      },
    ];
  } else {
    return [
      { key: "index", label: "#" },
      { key: "year", label: t("shifts.modals.schedules.fields.year") },
      { key: "morning", label: t("shifts.modals.schedules.fields.morning") },
      { key: "evening", label: t("shifts.modals.schedules.fields.evening") },
      { key: "night", label: t("shifts.modals.schedules.fields.night") },
      {
        key: "actions",
        label: t("shifts.fields.actions"),
        cellClass: "w-32 text-center",
      },
    ];
  }
});

const loadShift = async () => {
  try {
    const response = await shiftService.getById(shiftId.value);
    shift.value = response.data?.shift || response.data || response;
  } catch (error) {
    console.error(error);
  }
};

const loadSchedules = async () => {
  loading.value = true;
  try {
    let params = {
      page: page.value,
      per_page: perPage.value,
      sort_by: filters.value.sort_by,
      sort_direction: filters.value.sort_direction,
    };

    if (isMonthly.value) {
      if (filters.value.month) {
        params.year = new Date().getFullYear(); // Default to current year if no year selector
        params.month = filters.value.month;
      }
      if (filters.value.status && filters.value.status !== "all") {
        params.status = filters.value.status;
      }
    } else {
      if (filters.value.year) {
        params.year = filters.value.year;
      }
    }

    const response = await shiftService.getSchedules(shiftId.value, params);
    schedules.value = response.data || [];
    total.value =
      response.meta?.total || response.total || schedules.value.length;
  } catch (error) {
    console.error(error);
    toast.error(error);
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  page.value = 1;
  loadSchedules();
};

const resetFilters = () => {
  filters.value.year = null;
  filters.value.month = null;
  filters.value.status = null;
  filters.value.sort_by = "created_at";
  filters.value.sort_direction = "desc";
  applyFilters();
};

const changePage = (newPage) => {
  page.value = newPage;
  loadSchedules();
};

const getAssignment = (schedule, period) => {
  return schedule.assignments?.find((a) => a.period === period);
};

const openCreate = () => {
  if (isMonthly.value) {
    const prefix = locale.value === "en" ? "/en" : "";
    router.push(
      `${prefix}/attendance/settings/shifts/${shiftId.value}/schedules/create?department_id=${shift.value?.department?.id || route.query?.department_id}`,
    );
  } else {
    selectedSchedule.value = null;
    showFormModal.value = true;
  }
};

const isPast = (item) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  if (isMonthly.value) {
    const currentMonth = now.getMonth() + 1;
    if (item.year < currentYear) return true;
    if (item.year === currentYear && item.month < currentMonth) return true;
    return false;
  } else {
    return item.year < currentYear;
  }
};

const canDelete = (item) => {
  if (isMonthly.value) {
    return item.status === "draft";
  }
  else {
    return false
  }
  return true;
};

const openEdit = (item) => {
  if (isMonthly.value) {
    const prefix = locale.value === "en" ? "/en" : "";
    router.push(
      `${prefix}/attendance/settings/shifts/${shiftId.value}/schedules/${item.id}/edit?department_id=${shift.value?.department?.id || route.query?.department_id}`,
    );
  } else {
    selectedSchedule.value = item;
    showFormModal.value = true;
  }
};

const openEditFromView = (item) => {
  showDetailsModal.value = false;
  openEdit(item);
};

const openView = (item) => {
  if (isMonthly.value) {
    const prefix = locale.value === "en" ? "/en" : "";
    router.push(
      `${prefix}/attendance/settings/shifts/${shiftId.value}/schedules/${item.id}`,
    );
  } else {
    selectedSchedule.value = item;
    showDetailsModal.value = true;
  }
};

const openDelete = (item) => {
  scheduleToDelete.value = item;
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!scheduleToDelete.value) return;
  try {
    await shiftService.deleteSchedule(shiftId.value, scheduleToDelete.value.id);
    toast.success(t("shifts.modals.schedules.messages.deleted"));
    showDeleteConfirm.value = false;
    loadSchedules();
  } catch (error) {
    toast.error(error);
  }
};

const handleSave = async (payload) => {
  saving.value = true;
  try {
    if (selectedSchedule.value) {
      await shiftService.updateSchedule(
        shiftId.value,
        selectedSchedule.value.id,
        payload,
      );
      toast.success(t("shifts.modals.schedules.messages.updated"));
    } else {
      await shiftService.createSchedule(shiftId.value, payload);
      toast.success(t("shifts.modals.schedules.messages.created"));
    }
    showFormModal.value = false;
    loadSchedules();
  } catch (error) {
    toast.error(error);
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await loadShift();
  loadSchedules();
});

watch(shiftId, async () => {
  await loadShift();
  loadSchedules();
});
</script>
