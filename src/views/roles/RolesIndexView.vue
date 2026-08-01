<template>
  <section class="space-y-6">
    <!-- <Breadcrumb :items="breadcrumbItems" /> -->
    <header class="md:flex items-center justify-between space-y-2 md:space-y-0">
      <div>
        <h1 class="text-[20px] font-[600] text-[#000000]">
          {{ t("roles.title") }}
        </h1>
        <!-- <p class="mt-1 text-sm text-gray-500">
          {{ t("roles.description") }}
        </p> -->
      </div>

      <Button variant="primary" icon="plus" size="md" @click="goToCreate">
        {{ t("roles.addRole") }}
      </Button>
    </header>

    <Card>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("roles.searchTitle") }}
          </h2>
        </div>
      </template>

      <div class="md:flex gap-2 space-y-2 md:space-y-0 items-end">
        <Input
          v-model="filters.name"
          :label="t('roles.fields.name')"
          :placeholder="t('roles.placeholders.name')"
          size="md"
        >
          <template #suffix>
            <Icon name="magnifyingGlass" size="lg" class="text-[#0E5F4A]" />
          </template>
        </Input>

        <Select
          v-model="filters.status"
          :options="statusOptions"
          :label="t('roles.fields.status')"
          :placeholder="t('roles.placeholders.status')"
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

    <Card>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("roles.listTitle") }}
          </h2>
        </div>
      </template>

      <Table
        :loading="loading"
        :items="roles"
        :headers="tableHeaders"
        :page="page"
        :total-pages="totalPages"
        :loading-text="t('common.loading')"
        :empty-text="t('roles.empty')"
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
          <span class="font-[14px] text-[#161616]">{{
            lang === "ar" ? item.name_ar : item.name
          }}</span>
        </template>

        <template #cell-status="{ item }">
          <Toggle
            :model-value="!!item.is_active"
            :loading="togglingId === item.id"
            :disabled="togglingId === item.id"
            @change="toggleStatus(item)"
          />
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center gap-2">
            <button
              class="cursor-pointer"
              @click="goToView(item)"
              v-tooltip="{
                title: t('common.actionTooltips.view.title', {
                  target: t('roles.entityName'),
                }),
                content: t('common.actionTooltips.view.content', {
                  target: t('roles.entityName'),
                  name: lang === 'ar' ? item.name_ar : item.name,
                }),
              }"
            >
              <SvgIcon name="eye" classes="w-8 h-8" />
            </button>
            <template
              v-if="
                item.name?.toLowerCase() !== 'super-admin' &&
                item.name?.toLowerCase() !== 'super admin' &&
                item.name_ar !== 'ادمن' &&
                item.id !== 1
              "
            >
              <button
                class="cursor-pointer"
                @click="goToEdit(item)"
                v-tooltip="{
                  title: t('common.actionTooltips.edit.title', {
                    target: t('roles.entityName'),
                  }),
                  content: t('common.actionTooltips.edit.content', {
                    target: t('roles.entityName'),
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
                    target: t('roles.entityName'),
                  }),
                  content: t('common.actionTooltips.delete.content', {
                    target: t('roles.entityName'),
                    name: lang === 'ar' ? item.name_ar : item.name,
                  }),
                }"
              >
                <SvgIcon name="trash" classes="w-8 h-8" />
              </button>
            </template>
          </div>
        </template>
      </Table>
    </Card>

    <!-- Delete confirm modal -->
    <Modal
      v-model="showDeleteConfirm"
      width="md"
      icon="error"
      border-color="#e76d62"
      :cancel-text="t('common.cancel')"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("roles.modals.deleteTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("roles.modals.deleteMessage") }}
        </p>
      </div>

      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button
            class="w-full bg-[#FEF3F2] !text-[#B42318] border-none hover:bg-[#FDE4E2]"
            size="md"
            @click="confirmDelete"
          >
            {{ t("roles.modals.deleteConfirm") }}
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

    <!-- Cannot delete modal -->
    <Modal
      v-model="showCannotDelete"
      width="md"
      icon="warning"
      border-color="#e6964d"
      :cancel-text="t('common.ok') || 'OK'"
      @close="closeCannotDelete"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("roles.modals.cannotDeleteTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("roles.modals.cannotDeleteMessage") }}
        </p>
      </div>
    </Modal>

    <!-- Cannot deactivate modal -->
    <Modal
      v-model="showCannotDeactivate"
      width="md"
      icon="warning"
      border-color="#e6964d"
      :cancel-text="t('common.ok') || 'OK'"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("roles.modals.cannotDeactivateTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("roles.modals.cannotDeactivateMessage") }}
        </p>
      </div>
    </Modal>
  </section>
</template>
<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Icon from "@/components/ui/Icon.vue";
import Table from "@/components/ui/Table.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Modal from "@/components/ui/Modal.vue";
import Toggle from "@/components/ui/Toggle.vue";

import api from "@/services/api";
import { roleService } from "@/services/roles";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import Select from "@/components/ui/Select.vue";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const router = useRouter();
const route = useRoute();
const toast = useAppToast();

const roles = ref([]);
const loading = ref(false);

const page = ref(1);
const perPage = ref(10);
const total = ref(0);

const filters = ref({
  name: "",
  status: "",
  sort_by: "created_at",
  sort_direction: "desc",
});

const statusOptions = computed(() => [
  { label: t("roles.statusOptions.active"), value: "active" },
  { label: t("roles.statusOptions.inactive"), value: "inactive" },
]);

const breadcrumbItems = computed(() => [{ label: t("roles.title") }]);

const showDeleteConfirm = ref(false);
const showCannotDelete = ref(false);
const showCannotDeactivate = ref(false);
const roleToDelete = ref(null);

const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

const loadRoles = async () => {
  loading.value = true;

  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      sort_by:
        filters.value.sort_by === "name"
          ? lang.value === "ar"
            ? "name_ar"
            : "name"
          : filters.value.sort_by,
      sort_direction: filters.value.sort_direction,
    };

    if (filters.value.name) {
      params.search = filters.value.name;
    }

    if (filters.value.status !== "") {
      params.status = filters.value.status;
    }

    const response = await roleService.list(params);

    roles.value = response.data || [];
    total.value = response.meta?.total || roles.value.length;
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  page.value = 1;
  loadRoles();
};

const resetFilters = () => {
  filters.value.name = "";
  filters.value.status = "";
  filters.value.sort_by = "created_at";
  filters.value.sort_direction = "desc";
  applyFilters();
};

const handleSort = (key) => {
  // Map 'status' header key to 'is_active' for API sorting
  const apiKey = key === "status" || key === "is_active" ? "is_active" : key;

  if (filters.value.sort_by === apiKey) {
    filters.value.sort_direction =
      filters.value.sort_direction === "asc" ? "desc" : "asc";
  } else {
    filters.value.sort_by = apiKey;
    filters.value.sort_direction = "asc";
  }
  applyFilters();
};

const goToCreate = () => {
  const isEn = route.path.startsWith("/en");
  router.push(isEn ? "/en/settings/roles/create" : "/settings/roles/create");
};

const goToEdit = (role) => {
  const isEn = route.path.startsWith("/en");
  const base = isEn ? "/en/settings/roles" : "/settings/roles";
  router.push(`${base}/${role.id}`);
};

const goToView = (role) => {
  const isEn = route.path.startsWith("/en");
  const base = isEn ? "/en/settings/roles" : "/settings/roles";
  router.push(`${base}/view/${role.id}`);
};

const openDelete = (role) => {
  if (role.users_count && role.users_count > 0) {
    showCannotDelete.value = true;
    return;
  }

  roleToDelete.value = role;
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!roleToDelete.value) return;

  try {
    await roleService.delete(roleToDelete.value.id);
    showDeleteConfirm.value = false;
    roleToDelete.value = null;
    toast.success(t("roles.messages.deleted"));
    await loadRoles();
  } catch (e) {
    console.error(e);
    toast.error(e);
  }
};

const closeCannotDelete = () => {
  showCannotDelete.value = false;
};

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  loadRoles();
};

onMounted(() => {
  if (route.query.message === "created") {
    toast.success(t("roles.messages.created"));
  } else if (route.query.message === "updated") {
    toast.success(t("roles.messages.updated"));
  }

  // Clear message query to prevent duplicate toasts on reload
  if (route.query.message) {
    const { message, ...rest } = route.query;
    router.replace({ path: route.path, query: { ...rest } });
  }

  loadRoles();
});

const togglingId = ref(null);

const toggleStatus = async (item) => {
  if (item.is_active && item.users_count > 0) {
    showCannotDeactivate.value = true;
    return;
  }

  const originalState = item.is_active;
  togglingId.value = item.id;
  try {
    await api.patch(`/roles/${item.id}/toggle`);
    item.is_active = !originalState;
    toast.success(
      item.is_active
        ? t("roles.messages.activated")
        : t("roles.messages.deactivated"),
    );
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    togglingId.value = null;
  }
};

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "name", label: t("roles.fields.name") },
  { key: "status", label: t("roles.fields.status") },
  { key: "actions", label: t("roles.fields.actions"), cellClass: "w-10" },
]);
</script>
