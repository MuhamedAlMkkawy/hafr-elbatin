<template>
  <div class="space-y-6">
    <!-- Top Actions -->
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <h1 class="text-[18px] font-[600]">
        {{ t("locations.title") }}
      </h1>
      <div class="flex gap-2">
        <Button variant="primary" icon="plus" size="md" @click="openAddModal">
          {{ t("locations.addLocation") }}
        </Button>
      </div>
    </div>

    <!-- Search Card -->
    <Card>
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("locations.searchTitle") }}
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <Input
          v-model="filters.search"
          :label="t('locations.placeholders.searchAgency')"
          :placeholder="t('locations.placeholders.searchAgency')"
          size="md"
          clearable
        >
          <template #suffix>
            <SvgIcon name="search" />
          </template>
        </Input>

        <Select
          v-model="filters.status"
          :options="statusOptions"
          :label="t('locations.fields.status')"
          :placeholder="t('locations.fields.status')"
          size="md"
        />
      </div>

      <div class="flex gap-2 mt-5 justify-end">
        <Button class="md:w-26" variant="ghost" size="md" @click="resetFilters">
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
          {{ t("locations.title") }}
        </h2>
      </template>

      <Table
        :loading="loading"
        :items="locations"
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

        <template #header-organizational_unit_id="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-colors cursor-pointer"
              :class="
                filters.sort_by === 'organizational_unit_id'
                  ? 'text-primary'
                  : 'text-gray-400'
              "
              @click="handleSort('organizational_unit_id')"
            />
          </div>
        </template>

        <template #header-allowed_radius="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-colors cursor-pointer"
              :class="
                filters.sort_by === 'allowed_radius'
                  ? 'text-primary'
                  : 'text-gray-400'
              "
              @click="handleSort('allowed_radius')"
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
          {{ lang === "ar" ? item.name_ar : item.name }}
        </template>

        <template #cell-organizational_unit_id="{ item }">
          {{
            item.organizational_unit
              ? lang === "ar"
                ? item.organizational_unit.name_ar
                : item.organizational_unit.name_en
              : "-"
          }}
        </template>

        <template #cell-allowed_radius="{ item }">
          {{ item.allowed_radius }} {{ t("locations.placeholders.radius") }}
        </template>

        <template #cell-is_active="{ item }">
          <Toggle
            :model-value="item.is_active"
            :loading="togglingId === item.id"
            :disabled="togglingId === item.id"
            @change="handleToggleStatus(item)"
          />
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center gap-2">
            <button
              class="cursor-pointer"
              @click="openViewModal(item)"
              v-tooltip="{
                title: t('common.actionTooltips.view.title', {
                  target: t('locations.entityName'),
                }),
                content: t('common.actionTooltips.view.content', {
                  target: t('locations.entityName'),
                  name:
                    lang === 'ar'
                      ? item.organizational_unit.name_ar
                      : item.organizational_unit.name_en,
                }),
              }"
            >
              <SvgIcon name="eye" classes="w-8 h-8" />
            </button>
            <button
              class="cursor-pointer"
              @click="openEditModal(item)"
              v-tooltip="{
                title: t('common.actionTooltips.edit.title', {
                  target: t('locations.entityName'),
                }),
                content: t('common.actionTooltips.edit.content', {
                  target: t('locations.entityName'),
                  name:
                    lang === 'ar'
                      ? item.organizational_unit.name_ar
                      : item.organizational_unit.name_en,
                }),
              }"
            >
              <SvgIcon name="edit" classes="w-8 h-8" />
            </button>
            <button
              class="cursor-pointer"
              @click="openDeleteModal(item)"
              v-tooltip="{
                title: t('common.actionTooltips.delete.title', {
                  target: t('locations.entityName'),
                }),
                content: t('common.actionTooltips.delete.content', {
                  target: t('locations.entityName'),
                  name:
                    lang === 'ar'
                      ? item.organizational_unit.name_ar
                      : item.organizational_unit.name_en,
                }),
              }"
            >
              <SvgIcon name="trash" classes="w-8 h-8" />
            </button>
          </div>
        </template>
        <template #no-data>
          {{ t("locations.messages.noData") }}
        </template>
      </Table>
    </Card>

    <!-- Location Form Modal -->
    <LocationFormModal
      v-model="showFormModal"
      :mode="formMode"
      :location-data="selectedLocation"
      @saved="loadLocations"
    />

    <!-- Location Details Modal -->
    <LocationDetailsModal
      v-model="showDetailsModal"
      :location-data="selectedLocation"
      @edit="openEditModalFromDetails"
    />

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model="showDeleteConfirm"
      width="md"
      icon="error"
      border-color="#e76d62"
    >
      <div class="py-4">
        <h3 class="text-[16px] font-[600] text-[#1F2A37] mb-1">
          {{ t("locations.modals.deleteTitle") }}
        </h3>
        <p class="text-[14px] text-[#384250]">
          {{ t("locations.modals.deleteMessage") }}
        </p>
      </div>
      <template #footer>
        <div class="flex flex-col gap-2 w-full">
          <Button
            class="w-full bg-[#FEF3F2] !text-[#B42318] border-none hover:bg-[#FDE4E2]"
            size="md"
            @click="confirmDelete"
            :loading="deleting"
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
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";
import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import Table from "@/components/ui/Table.vue";
import Modal from "@/components/ui/Modal.vue";
import Toggle from "@/components/ui/Toggle.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Icon from "@/components/ui/Icon.vue";
import LocationFormModal from "./LocationFormModal.vue";
import LocationDetailsModal from "./LocationDetailsModal.vue";
import { attendanceLocationService } from "@/services/attendanceLocations";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();

const locations = ref([]);
const loading = ref(false);
const deleting = ref(false);
const togglingId = ref(null);

const showFormModal = ref(false);
const showDetailsModal = ref(false);
const formMode = ref("add");
const selectedLocation = ref(null);

const showDeleteConfirm = ref(false);
const itemToDelete = ref(null);

const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const totalPages = computed(() => Math.ceil(total.value / perPage.value) || 1);

const filters = ref({
  search: "",
  status: "",
  sort_by: "created_at",
  sort_direction: "desc",
});

const organizationalUnits = ref([]);
const organizationalUnitsLoading = ref(false);

const fetchOrganizationalUnits = async () => {
  if (organizationalUnitsLoading.value) return;
  organizationalUnitsLoading.value = true;
  try {
    const response = await attendanceLocationService.listOrganizationalUnits({
      paginate: false,
    });
    organizationalUnits.value = response?.data?.organizational_units ?? [];
  } catch (error) {
    console.error("Failed to fetch organizational units", error);
    organizationalUnits.value = [];
  } finally {
    organizationalUnitsLoading.value = false;
  }
};

const organizationalUnitOptions = computed(() => {
  return organizationalUnits.value?.map((u) => ({
    label: lang.value === "ar" ? u.name_ar : u.name_en,
    value: u.id,
  }));
});

const statusOptions = computed(() => [
  { label: t("roles.statusOptions.active"), value: "active" },
  { label: t("roles.statusOptions.inactive"), value: "inactive" },
]);

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  // { key: "name", label: t("locations.fields.location") },
  { key: "organizational_unit_id", label: t("locations.fields.agencyName") },
  { key: "allowed_radius", label: t("locations.fields.radius") },
  { key: "is_active", label: t("locations.fields.status") },
  { key: "actions", label: t("locations.fields.actions"), cellClass: "w-24" },
]);

const loadLocations = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      search: filters.value.search,
      status: filters.value.status,
      sort_by:
        filters.value.sort_by === "name"
          ? lang.value === "ar"
            ? "name_ar"
            : "name"
          : filters.value.sort_by,
      sort_direction: filters.value.sort_direction,
    };
    const response = await attendanceLocationService.list(params);
    locations.value = response.data;
    total.value =
      response.meta?.total || (response.data ? response.data.length : 0);
  } catch (error) {
    console.error(error);
    toast.error(error);
  } finally {
    loading.value = false;
  }
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

const applyFilters = () => {
  page.value = 1;
  loadLocations();
};

const resetFilters = () => {
  filters.value = {
    organizational_unit_id: null,
    status: "",
    sort_by: "created_at",
    sort_direction: "desc",
  };
  applyFilters();
};

const changePage = (newPage) => {
  page.value = newPage;
  loadLocations();
};

const openAddModal = () => {
  formMode.value = "add";
  selectedLocation.value = null;
  showFormModal.value = true;
};

const openEditModal = (item) => {
  formMode.value = "edit";
  selectedLocation.value = item;
  showFormModal.value = true;
};

const openViewModal = (item) => {
  selectedLocation.value = item;
  showDetailsModal.value = true;
};

const openEditModalFromDetails = (item) => {
  showDetailsModal.value = false;
  openEditModal(item);
};

const openDeleteModal = (item) => {
  itemToDelete.value = item;
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!itemToDelete.value) return;
  deleting.value = true;
  try {
    await attendanceLocationService.delete(itemToDelete.value.id);
    toast.success(t("locations.messages.deleted"));
    showDeleteConfirm.value = false;
    loadLocations();
  } catch (error) {
    toast.error(error);
  } finally {
    deleting.value = false;
  }
};

const handleToggleStatus = async (item) => {
  const originalState = item.is_active;
  togglingId.value = item.id;
  try {
    await attendanceLocationService.toggleStatus(item.id);
    item.is_active = !originalState;
    toast.success(
      item.is_active
        ? t("locations.messages.activated")
        : t("locations.messages.deactivated"),
    );
  } catch (error) {
    toast.error(error);
  } finally {
    togglingId.value = null;
  }
};

onMounted(() => {
  loadLocations();
  fetchOrganizationalUnits();
});
</script>
