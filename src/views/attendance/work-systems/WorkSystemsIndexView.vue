<template>
  <div class="space-y-6">
    <!-- Top Actions -->
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <h1 class="text-[18px] font-[600]">
        {{ t("workSystems.title") }}
      </h1>
      <div class="flex gap-2">
        <Button
          variant="primary"
          icon="plus"
          size="md"
          @click="goToCreate('fixed')"
        >
          {{ t("workSystems.addFixed") }}
        </Button>
        <Button
          variant="primary"
          icon="plus"
          size="md"
          @click="goToCreate('shift')"
        >
          {{ t("workSystems.addShift") }}
        </Button>
      </div>
    </div>

    <!-- Search Card -->
    <Card>
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("workSystems.searchTitle") }}
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <Input
          v-model="filters.name"
          :label="t('workSystems.fields.name')"
          :placeholder="t('workSystems.placeholders.name')"
          size="md"
        >
          <template #suffix>
            <Icon name="magnifyingGlass" size="lg" class="text-[#0E5F4A]" />
          </template>
        </Input>

        <Select
          v-model="filters.type"
          :options="typeOptions"
          :label="t('workSystems.fields.type')"
          :placeholder="t('workSystems.placeholders.type')"
          size="md"
        />

        <Select
          v-model="filters.status"
          :options="statusOptions"
          :label="t('workSystems.fields.status')"
          :placeholder="t('workSystems.placeholders.status')"
          size="md"
        />
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
          {{ t("workSystems.listTitle") }}
        </h2>
      </template>

      <Table
        :loading="loading"
        :items="workSystems"
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

        <template #header-status="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-colors cursor-pointer"
              :class="
                filters.sort_by === 'is_active'
                  ? 'text-primary'
                  : 'text-gray-400'
              "
              @click="handleSort('is_active')"
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
          {{ t(`workSystems.types.${item.type}`) }}
        </template>

        <template #cell-status="{ item }">
          <Toggle
            :model-value="!!item.is_active"
            :loading="togglingId === item.id"
            :disabled="togglingId === item.id"
            @change="handleToggleStatus(item)"
          />
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center gap-2">
            <button
              class="cursor-pointer"
              @click="goToView(item)"
              v-tooltip="{
                title: t('common.actionTooltips.view.title', {
                  target: t('workSystems.entityName'),
                }),
                content: t('common.actionTooltips.view.content', {
                  target: t('workSystems.entityName'),
                  name: lang === 'ar' ? item.name_ar : item.name,
                }),
              }"
            >
              <SvgIcon name="eye" classes="w-8 h-8" />
            </button>
            <button
              class="cursor-pointer"
              @click="goToEdit(item)"
              v-tooltip="{
                title: t('common.actionTooltips.edit.title', {
                  target: t('workSystems.entityName'),
                }),
                content: t('common.actionTooltips.edit.content', {
                  target: t('workSystems.entityName'),
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
                  target: t('workSystems.entityName'),
                }),
                content: t('common.actionTooltips.delete.content', {
                  target: t('workSystems.entityName'),
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

    <!-- Delete Confirm Modal -->
    <Modal
      v-model="showDeleteConfirm"
      width="md"
      icon="error"
      border-color="#e76d62"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("workSystems.modals.deleteTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("workSystems.modals.deleteMessage") }}
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

    <!-- Activation Conflict Modal -->
    <Modal
      v-model="showConflictModal"
      width="md"
      icon="error"
      border-color="#e76d62"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("workSystems.modals.cannotActivateTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("workSystems.modals.cannotActivateMessage") }}
        </p>
      </div>
      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button
            class="w-full bg-[#FEF3F2] !text-[#B42318] border-none hover:bg-[#FDE4E2]"
            size="md"
            @click="confirmConflict"
          >
            {{ t("workSystems.modals.confirmAndActivate") }}
          </Button>
          <Button
            variant="ghost"
            class="w-full"
            size="md"
            @click="showConflictModal = false"
          >
            {{ t("common.cancel") }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Cannot Delete Modal -->
    <Modal
      v-model="showDeleteError"
      width="md"
      icon="warning"
      border-color="#e6964d"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("workSystems.modals.cannotDeleteTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("workSystems.modals.cannotDeleteMessage") }}
        </p>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          class="w-full"
          size="md"
          @click="showDeleteError = false"
        >
          {{ t("common.ok") || "OK" }}
        </Button>
      </template>
    </Modal>

    <!-- Deactivation Not Allowed Modal -->
    <Modal
      v-model="showDeactivateInfo"
      width="md"
      icon="warning"
      border-color="#e6964d"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("workSystems.modals.deactivationNotAllowedTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("workSystems.modals.deactivationNotAllowedMessage") }}
        </p>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          class="w-full"
          size="md"
          @click="showDeactivateInfo = false"
        >
          {{ t("common.ok") || "OK" }}
        </Button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { useAppToast } from "@/composables/useAppToast";
import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import Table from "@/components/ui/Table.vue";
import Modal from "@/components/ui/Modal.vue";
import Toggle from "@/components/ui/Toggle.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { workSystemService } from "@/services/workSystems";
import Icon from "@/components/ui/Icon.vue";
import { useAuthStore } from "@/stores/auth";
const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const router = useRouter();
const route = useRoute();
const toast = useAppToast();
const authStore = useAuthStore();

const workSystems = ref([]);
const loading = ref(false);
const togglingId = ref(null);
const showDeleteConfirm = ref(false);
const showDeleteError = ref(false);
const showConflictModal = ref(false);
const showDeactivateInfo = ref(false);
const itemToDelete = ref(null);
const itemToToggle = ref(null);

const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const totalPages = computed(() => Math.ceil(total.value / perPage.value) || 1);

const filters = ref({
  name: "",
  type: "",
  status: "",
  sort_by: "created_at",
  sort_direction: "desc",
});

const typeOptions = computed(() => [
  { label: t("workSystems.types.fixed"), value: "fixed" },
  { label: t("workSystems.types.shift"), value: "shift" },
]);

const statusOptions = computed(() => [
  { label: t("roles.statusOptions.active"), value: "active" },
  { label: t("roles.statusOptions.inactive"), value: "inactive" },
]);

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "name", label: t("workSystems.fields.name") },
  { key: "type", label: t("workSystems.fields.typeLabel") },
  { key: "status", label: t("workSystems.fields.status") },
  { key: "actions", label: t("workSystems.fields.actions"), cellClass: "w-24" },
]);

const loadWorkSystems = async () => {
  if (!authStore.hasPermission("work_system.view")) return;
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      search: filters.value.name,
      type: filters.value.type,
      status: filters.value.status,
      sort_by:
        filters.value.sort_by === "name"
          ? lang.value === "ar"
            ? "name_ar"
            : "name"
          : filters.value.sort_by,
      sort_direction: filters.value.sort_direction,
    };
    const response = await workSystemService.list(params);
    workSystems.value = response.data;
    total.value = response.meta?.total || workSystems.value.length;
  } catch (error) {
    console.error(error);
    toast.error(error);
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  page.value = 1;
  loadWorkSystems();
};

const handleSort = (key) => {
  // Map 'status' header key to 'is_active' for API sorting
  const apiKey = key === "status" ? "is_active" : key;

  if (filters.value.sort_by === apiKey) {
    filters.value.sort_direction =
      filters.value.sort_direction === "asc" ? "desc" : "asc";
  } else {
    filters.value.sort_by = apiKey;
    filters.value.sort_direction = "asc";
  }
  applyFilters();
};

const resetFilters = () => {
  filters.value = {
    name: "",
    type: "",
    status: "",
    sort_by: "created_at",
    sort_direction: "desc",
  };
  applyFilters();
};

const changePage = (newPage) => {
  page.value = newPage;
  loadWorkSystems();
};

const goToCreate = (type) => {
  const prefix = lang.value === "en" ? "/en" : "";
  router.push(`${prefix}/attendance/settings/work-systems/create?type=${type}`);
};

const goToEdit = (item) => {
  const prefix = lang.value === "en" ? "/en" : "";
  router.push(`${prefix}/attendance/settings/work-systems/${item.id}/edit`);
};

const goToView = (item) => {
  const prefix = lang.value === "en" ? "/en" : "";
  router.push(`${prefix}/attendance/settings/work-systems/${item.id}`);
};

const openDelete = (item) => {
  if (item.is_active) {
    showDeleteError.value = true;
    return;
  }
  itemToDelete.value = item;
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!itemToDelete.value) return;
  try {
    await workSystemService.delete(itemToDelete.value.id);
    toast.success(t("workSystems.messages.deleted"));
    showDeleteConfirm.value = false;
    loadWorkSystems();
  } catch (error) {
    if (
      error.response?.status === 422 ||
      error.response?.data?.message?.includes("active")
    ) {
      showDeleteConfirm.value = false;
      showDeleteError.value = true;
    } else {
      toast.error(error);
    }
  }
};

const handleToggleStatus = async (item) => {
  // Active -> Inactive: show informational popup, do NOT change status
  if (item.is_active) {
    showDeactivateInfo.value = true;
    return;
  }

  // Inactive -> Active: check for conflict globally via API
  try {
    const conflictResult = await workSystemService.checkConflict(item.type);
    // Support different possible shapes from backend
    const apiHasConflict =
      conflictResult?.has_conflict ??
      conflictResult?.hasConflict ??
      conflictResult?.data?.has_conflict ??
      false;
    // Fallback: also check current page (previous behaviour)
    const pageHasConflict = workSystems.value.some(
      (s) => s.type === item.type && s.is_active && s.id !== item.id,
    );
    const hasConflict = apiHasConflict || pageHasConflict;

    if (hasConflict) {
      itemToToggle.value = item;
      showConflictModal.value = true;
      return;
    }
  } catch (error) {
    toast.error(error);
    return;
  }

  // No conflict: activate normally without confirmation
  await performToggle(item, false);
};

const confirmConflict = async () => {
  if (!itemToToggle.value) return;
  await performToggle(itemToToggle.value, true);
  showConflictModal.value = false;
  itemToToggle.value = null;
};

const performToggle = async (item, confirm) => {
  const originalState = item.is_active;
  togglingId.value = item.id;
  try {
    await workSystemService.toggleStatus(item.id, confirm);
    item.is_active = !originalState;
    toast.success(
      item.is_active
        ? t("workSystems.messages.activated")
        : t("workSystems.messages.deactivated"),
    );
    await loadWorkSystems();
  } catch (error) {
    toast.error(error);
  } finally {
    togglingId.value = null;
  }
};

onMounted(() => {
  loadWorkSystems();
});
</script>
