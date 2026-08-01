<template>
  <div class="space-y-6">
    <!-- Top Actions -->
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <h1 class="text-[16px] font-[600] text-[#333333]">
        {{ t("shifts.title") }}
      </h1>
      <Button variant="primary" icon="plus" size="md" @click="openCreate">
        {{ t("shifts.addNewShift") }}
      </Button>
    </div>

    <!-- Search Card -->
    <Card>
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("shifts.searchTitle") }}
        </h2>
      </template>

      <div class="grid grid-cols-1 gap-4 items-end">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <Input
            v-model="filters.name"
            :label="t('shifts.fields.name')"
            :placeholder="t('shifts.placeholders.name')"
            size="md"
          >
            <template #suffix>
              <Icon name="magnifyingGlass" size="lg" class="text-[#0E5F4A]" />
            </template>
          </Input>

          <Select
            v-model="filters.type"
            :options="typeOptions"
            :label="t('shifts.fields.type')"
            :placeholder="t('shifts.placeholders.type')"
            size="md"
          />
        </div>
      </div>

      <div class="flex gap-2 mt-5 justify-end">
        <Button
          class="md:w-26"
          variant="ghost"
          size="md"
          @click="resetFilters"
        >
          {{ t("roles.resetFilters") }}
        </Button>
        <Button
          class="md:w-26"
          variant="primary"
          size="md"
          @click="applyFilters"
        >
          {{ t("common.search") }}
        </Button>
      </div>
    </Card>

    <!-- Table Card -->
    <Card>
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("shifts.listTitle") }}
        </h2>
      </template>

      <Table
        :loading="loading"
        :items="shifts"
        :headers="tableHeaders"
        :page="page"
        :total-pages="totalPages"
        @change-page="changePage"
      >
        <template #header-name="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-colors cursor-pointer"
              :class="
                filters.sort_by === 'name' ? 'text-primary' : 'text-gray-400'
              "
              @click="handleSort('name')"
            />
          </div>
        </template>

        <template #header-type="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-colors cursor-pointer"
              :class="
                filters.sort_by === 'type' ? 'text-primary' : 'text-gray-400'
              "
              @click="handleSort('type')"
            />
          </div>
        </template>

        <template #cell-index="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>

        <template #cell-name="{ item }">
          {{ lang === "ar" ? item.name_ar : item.name }}
        </template>

        <template #cell-type="{ item }">
          {{ t(`shifts.types.${item.type}`) }}
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center gap-2">
            <button
              class="cursor-pointer"
              @click="goToSchedules(item)"
              v-tooltip="t('shifts.modals.schedules.title')"
            >
              <Icon name="calendar" size="lg" class="text-[#0E5F4A]" />
            </button>
            <button
              class="cursor-pointer"
              @click="openView(item)"
              v-tooltip="{
                title: t('common.actionTooltips.view.title', {
                  target: t('shifts.entityName'),
                }),
                content: t('common.actionTooltips.view.content', {
                  target: t('shifts.entityName'),
                  name: lang === 'ar' ? item.name_ar : item.name,
                }),
              }"
            >
              <SvgIcon name="eye" classes="w-8 h-8" />
            </button>
            <button
              class="cursor-pointer"
              @click="openEdit(item)"
              v-tooltip="{
                title: t('common.actionTooltips.edit.title', {
                  target: t('shifts.entityName'),
                }),
                content: t('common.actionTooltips.edit.content', {
                  target: t('shifts.entityName'),
                  name: lang === 'ar' ? item.name_ar : item.name,
                }),
              }"
            >
              <SvgIcon name="edit" classes="w-8 h-8" />
            </button>
            <button
              class="cursor-pointer"
              @click="openDelete(item)"
              v-tooltip="{
                title: t('common.actionTooltips.delete.title', {
                  target: t('shifts.entityName'),
                }),
                content: t('common.actionTooltips.delete.content', {
                  target: t('shifts.entityName'),
                  name: lang === 'ar' ? item.name_ar : item.name,
                }),
              }"
            >
              <SvgIcon name="trash" classes="w-8 h-8" />
            </button>
          </div>
        </template>
      </Table>
    </Card>

    <!-- Modals -->
    <ShiftFormModal
      v-model="showFormModal"
      :shift="selectedShift"
      :loading="saving"
      @save="handleSave"
    />

    <ShiftDetailsModal
      v-model="showDetailsModal"
      :shift="selectedShift"
      @edit="openEditFromView"
    />

    <Modal
      v-model="showDeleteConfirm"
      width="md"
      icon="error"
      border-color="#e76d62"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("shifts.modals.deleteTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("shifts.modals.deleteMessage") }}
        </p>
      </div>
      <template #footer>
        <div class="flex flex-col gap-2 w-full">
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

    <!-- Error Modal for Delete -->
    <Modal
      v-model="showDeleteError"
      width="md"
      icon="warning"
      border-color="#e6964d"
    >
      <div class="py-4 text-center">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("shifts.modals.cannotDeleteTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("shifts.modals.cannotDeleteMessage") }}
        </p>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          class="w-full"
          size="md"
          @click="showDeleteError = false"
        >
          {{ t("common.ok") }}
        </Button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useAppToast } from "@/composables/useAppToast";
import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import Table from "@/components/ui/Table.vue";
import Modal from "@/components/ui/Modal.vue";
import Icon from "@/components/ui/Icon.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { shiftService } from "@/services/shifts";
import { useAuthStore } from "@/stores/auth";
import ShiftFormModal from "./ShiftFormModal.vue";
import ShiftDetailsModal from "./ShiftDetailsModal.vue";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();
const router = useRouter();
const authStore = useAuthStore();

const shifts = ref([]);
const loading = ref(false);
const saving = ref(false);
const showFormModal = ref(false);
const showDetailsModal = ref(false);
const showDeleteConfirm = ref(false);
const showDeleteError = ref(false);
const selectedShift = ref(null);
const shiftToDelete = ref(null);

const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const totalPages = computed(() => Math.ceil(total.value / perPage.value) || 1);

const filters = ref({
  name: "",
  type: "",
  sort_by: "created_at",
  sort_direction: "desc",
});

const typeOptions = computed(() => [
  { label: t("shifts.types.annual"), value: "annual" },
  { label: t("shifts.types.monthly"), value: "monthly" },
]);

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "name", label: t("shifts.fields.name") },
  { key: "type", label: t("shifts.fields.type") },
  { key: "actions", label: t("shifts.fields.actions"), cellClass: "w-32" },
]);

const loadShifts = async () => {
  if (!authStore.hasPermission("shift.view")) return;
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      search: filters.value.name,
      type: filters.value.type,
      sort_by:
        filters.value.sort_by === "name"
          ? lang.value === "ar"
            ? "name_ar"
            : "name"
          : filters.value.sort_by,
      sort_direction: filters.value.sort_direction,
    };
    const response = await shiftService.list(params);
    shifts.value = response.data || [];
    total.value = response.meta?.total || shifts.value.length;
  } catch (error) {
    console.error(error);
    toast.error(error);
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  page.value = 1;
  loadShifts();
};

const handleSort = (key) => {
  if (filters.value.sort_by === key) {
    filters.value.sort_direction =
      filters.value.sort_direction === "asc" ? "desc" : "asc";
  } else {
    filters.value.sort_by = key;
    filters.value.sort_direction = "asc";
  }
  applyFilters();
};

const resetFilters = () => {
  filters.value = {
    name: "",
    type: "",
    sort_by: "created_at",
    sort_direction: "desc",
  };
  applyFilters();
};

const changePage = (newPage) => {
  page.value = newPage;
  loadShifts();
};

const openCreate = () => {
  selectedShift.value = null;
  showFormModal.value = true;
};

const openEdit = (item) => {
  selectedShift.value = item;
  showFormModal.value = true;
};

const openEditFromView = (item) => {
  showDetailsModal.value = false;
  openEdit(item);
};

const openView = (item) => {
  selectedShift.value = item;
  showDetailsModal.value = true;
};

const goToSchedules = (item) => {
  const routeName =
    lang.value === "en" ? "shift-schedules-en" : "shift-schedules";
  router.push({
    name: routeName,
    params: { id: item.id },
    query: { department_id: item?.department?.id },
  });
};

const openDelete = (item) => {
  shiftToDelete.value = item;
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!shiftToDelete.value) return;
  try {
    await shiftService.delete(shiftToDelete.value.id);
    toast.success(t("shifts.messages.deleted"));
    showDeleteConfirm.value = false;
    loadShifts();
  } catch (error) {
    if (
      error.response?.status === 422 ||
      error.response?.data?.message?.includes("users")
    ) {
      showDeleteConfirm.value = false;
      showDeleteError.value = true;
    } else {
      toast.error(error);
    }
  }
};

const handleSave = async (payload) => {
  saving.value = true;
  try {
    if (selectedShift.value) {
      await shiftService.update(selectedShift.value.id, payload);
      toast.success(t("shifts.messages.updated"));
    } else {
      await shiftService.create(payload);
      toast.success(t("shifts.messages.created"));
    }
    showFormModal.value = false;
    loadShifts();
  } catch (error) {
    toast.error(error);
  } finally {
    saving.value = false;
  }
};

const currentYear = new Date().getFullYear();

const canEdit = (item) => {
  if (!item.year) return false;
  return Number(item.year) >= currentYear;
};

onMounted(() => {
  loadShifts();
});
</script>
