<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Table from "@/components/ui/Table.vue";
import Modal from "@/components/ui/Modal.vue";
import Toggle from "@/components/ui/Toggle.vue";
import Select from "@/components/ui/Select.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import Icon from "@/components/ui/Icon.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";

import { branchService } from "@/services/branches";
import BranchFormModal from "./BranchFormModal.vue";
import BranchDetailsModal from "./BranchDetailsModal.vue";

import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import api from "@/services/api";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();
const auth = useAuthStore();
const router = useRouter();

const branches = ref([]);
const loading = ref(false);
const saving = ref(false);
const accessingId = ref(null);

const page = ref(1);
const perPage = ref(10);
const total = ref(0);

const filters = ref({
  search: "",
  status: "",
  sort_by: "created_at",
  sort_direction: "desc",
});

const statusOptions = computed(() => [
  { label: t("branches.status.active"), value: "active" },
  { label: t("branches.status.inactive"), value: "inactive" },
]);

const breadcrumbItems = computed(() => [{ label: t("branches.title") }]);

// Modals state
const showFormModal = ref(false);
const showDetailsModal = ref(false);
const showToggleConfirm = ref(false);
const showDeleteConfirm = ref(false);

const selectedBranch = ref(null);
const branchToToggle = ref(null);
const branchToDelete = ref(null);
const togglingId = ref(null);

const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

watch([showFormModal, showDetailsModal], ([formOpen, detailsOpen]) => {
  if (!formOpen && !detailsOpen) {
    selectedBranch.value = null;
  }
});

const loadBranches = async () => {
  loading.value = true;

  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...filters.value,
      sort_by:
        filters.value.sort_by === "name"
          ? lang.value === "ar"
            ? "name_ar"
            : "name"
          : filters.value.sort_by,
    };

    const response = await branchService.list(params);

    branches.value = response.data || [];
    total.value = response.meta?.total || branches.value.length;
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  page.value = 1;
  loadBranches();
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
  filters.value.search = "";
  filters.value.status = "";
  filters.value.sort_by = "created_at";
  filters.value.sort_direction = "desc";
  applyFilters();
};

const openCreate = () => {
  selectedBranch.value = null;
  showFormModal.value = true;
};

const openEdit = (branch) => {
  selectedBranch.value = branch;
  showFormModal.value = true;
};

const openView = (branch) => {
  selectedBranch.value = branch;
  showDetailsModal.value = true;
};

const openToggle = (branch) => {
  branchToToggle.value = branch;
  // If we are activating (item.is_active is currently false/0), just do it
  if (!branch.is_active) {
    confirmToggle();
  } else {
    // Otherwise, if deactivating, show the modal
    showToggleConfirm.value = true;
  }
};

const openDelete = (branch) => {
  branchToDelete.value = branch;
  showDeleteConfirm.value = true;
};

const handleSave = async (payload) => {
  saving.value = true;
  try {
    const formData = new FormData();

    // Construct FormData correctly
    Object.keys(payload).forEach((key) => {
      const value = payload[key];
      if (value && typeof value === "object" && "name" in value) {
        // Handle binary file
        formData.append(key, value);
      } else if (value === null) {
        // If logo is null, it means it was removed.
        // We send it to indicate the backend should clear it.
        formData.append(key, "");
      } else if (value !== undefined) {
        // Handle strings/numbers
        formData.append(key, value);
      }
    });

    if (selectedBranch.value) {
      await branchService.update(selectedBranch.value.id, formData);
    } else {
      formData.append("is_active", "1");
      await branchService.create(formData);
    }

    toast.success(
      selectedBranch.value
        ? t("branches.messages.updated")
        : t("branches.messages.created"),
    );
    showFormModal.value = false;
    loadBranches();
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    saving.value = false;
  }
};

const confirmToggle = async () => {
  if (!branchToToggle.value) return;

  const originalState = branchToToggle.value.is_active;
  togglingId.value = branchToToggle.value.id;
  try {
    await branchService.toggleStatus(branchToToggle.value.id);
    branchToToggle.value.is_active = !originalState;
    toast.success(
      branchToToggle.value.is_active
        ? t("branches.messages.activated")
        : t("branches.messages.deactivated"),
    );
    showToggleConfirm.value = false;
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    togglingId.value = null;
    branchToToggle.value = null;
  }
};

const confirmDelete = async () => {
  if (!branchToDelete.value) return;

  try {
    await branchService.delete(branchToDelete.value.id);
    toast.success(t("branches.messages.deleted"));
    showDeleteConfirm.value = false;
    loadBranches();
  } catch (e) {
    console.error(e);
    toast.error(e);
  }
};

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  loadBranches();
};

const accessBranch = async (item) => {
  accessingId.value = item.id;
  try {
    const response = await api.put("/user/active-branch", {
      branch_id: 1, // static as requested
    });

    if (response.data?.success) {
      const data = response.data.data;
      const branchName = lang.value === 'ar' ? item.name_ar : item.name;
      auth.startPreview(item.id, branchName, data.manager_permissions);
      toast.success(t("branches.messages.accessStarted") || "Preview mode started");
      router.push("/");
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    accessingId.value = null;
  }
};

onMounted(() => {
  loadBranches();
});

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "name", label: t("branches.fields.name") },
  { key: "is_active", label: t("branches.fields.status") },
  { key: "actions", label: t("branches.fields.actions"), cellClass: "w-10" },
]);
</script>

<template>
  <section class="space-y-6">
    <!-- <Breadcrumb :items="breadcrumbItems" /> -->

    <header class="flex items-center justify-between">
      <h1 class="text-[20px] font-[600] text-[#000000]">
        {{ t("branches.title") }}
      </h1>

      <Button variant="primary" icon="plus" size="md" @click="openCreate">
        {{ t("branches.addBranch") }}
      </Button>
    </header>

    <Card>
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("branches.searchTitle") }}
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <Input
          v-model="filters.search"
          :label="t('branches.fields.name')"
          :placeholder="t('branches.placeholders.name')"
          size="md"
        >
          <template #suffix>
            <Icon name="magnifyingGlass" size="lg" class="text-[#0E5F4A]" />
          </template>
        </Input>

        <Select
          v-model="filters.status"
          :options="statusOptions"
          :label="t('branches.fields.status')"
          :placeholder="t('branches.placeholders.status')"
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
          {{ t("branches.resetFilters") }}
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

    <Card>
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("branches.listTitle") }}
        </h2>
      </template>

      <Table
        :loading="loading"
        :items="branches"
        :headers="tableHeaders"
        :page="page"
        :total-pages="totalPages"
        :loading-text="t('common.loading')"
        :empty-text="t('branches.empty')"
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

        <template #header-is_active="{ header }">
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
          <span class="font-medium text-[#161616]">{{
            lang === "ar" ? item.name_ar : item.name
          }}</span>
        </template>

        <template #cell-is_active="{ item }">
          <Toggle
            :model-value="!!item.is_active"
            :loading="togglingId === item.id"
            :disabled="togglingId === item.id"
            @change="openToggle(item)"
          />
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center gap-2">
            <button
              class="hover:opacity-75 transition-opacity cursor-pointer"
              @click="openView(item)"
              v-tooltip="{
                title: t('common.actionTooltips.view.title', {
                  target: t('branches.entityName'),
                }),
                content: t('common.actionTooltips.view.content', {
                  target: t('branches.entityName'),
                  name: lang === 'ar' ? item.name_ar : item.name,
                }),
              }"
            >
              <SvgIcon name="eye" classes="w-8 h-8" />
            </button>
            <button
              class="hover:opacity-75 transition-opacity cursor-pointer"
              @click="openEdit(item)"
              v-tooltip="{
                title: t('common.actionTooltips.edit.title', {
                  target: t('branches.entityName'),
                }),
                content: t('common.actionTooltips.edit.content', {
                  target: t('branches.entityName'),
                  name: lang === 'ar' ? item.name_ar : item.name,
                }),
              }"
            >
              <SvgIcon name="edit" classes="w-8 h-8" />
            </button>
            <button 
              class="hover:opacity-75 transition-opacity cursor-pointer disabled:opacity-50"
              @click="accessBranch(item)"
              :disabled="accessingId === item.id"
              v-tooltip="{
                title: t('branches.messages.accessBranch'),
                content: t('branches.messages.accessBranchTooltip', { name: lang === 'ar' ? item.name_ar : item.name })
              }"
            >
              <SvgIcon v-if="accessingId !== item.id" name="access" classes="w-8 h-8" />
              <!-- <div v-else class="w-8 h-8 flex items-center justify-center animate-spin">
                <Icon name="spinner" class="text-primary" />
              </div> -->
            </button>
          </div>
        </template>
      </Table>
    </Card>

    <!-- Form Modal (Create/Edit) -->
    <BranchFormModal
      v-model="showFormModal"
      :branch="selectedBranch"
      :loading="saving"
      @save="handleSave"
    />

    <!-- Details Modal -->
    <BranchDetailsModal
      v-model="showDetailsModal"
      :branch="selectedBranch"
      @edit="
        (branch) => {
          showDetailsModal = false;
          openEdit(branch);
        }
      "
    />

    <!-- Toggle Status Confirm Modal -->
    <Modal
      v-model="showToggleConfirm"
      width="md"
      icon="error"
      border-color="#e76d62"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("branches.modals.toggleTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("branches.modals.toggleMessage") }}
        </p>
      </div>

      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button
            class="w-full bg-[#FEF3F2] !text-[#B42318] border-none hover:bg-[#FDE4E2]"
            size="md"
            @click="confirmToggle"
          >
            {{ t("branches.modals.toggleConfirm") }}
          </Button>
          <Button
            variant="ghost"
            class="w-full"
            size="md"
            @click="showToggleConfirm = false"
          >
            {{ t("common.cancel") }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirm Modal -->
    <Modal
      v-model="showDeleteConfirm"
      width="md"
      icon="error"
      border-color="#e76d62"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("branches.modals.deleteTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("branches.modals.deleteMessage") }}
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
  </section>
</template>
