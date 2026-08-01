<template>
  <div class="space-y-6">
    <!-- Top Actions -->
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <h1 class="text-[18px] font-[600]">
        {{ t("notifications.title") }}
      </h1>
    </div>

    <!-- Search Card -->
    <Card>
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("notifications.searchTitle") }}
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <Input
          v-model="filters.search"
          :label="t('notifications.fields.name')"
          :placeholder="t('notifications.placeholders.name')"
          size="md"
          @keyup.enter="applyFilters"
        >
          <template #suffix>
            <SvgIcon name="search" />
          </template>
        </Input>

        <Select
          v-model="filters.status"
          :options="statusOptions"
          :label="t('notifications.fields.status')"
          :placeholder="t('notifications.fields.status')"
          size="md"
          clearable
        />
      </div>

      <div class="flex gap-2 mt-5 justify-end">
        <Button class="md:w-26" variant="ghost" size="md" @click="resetFilters">
          {{ t("notifications.resetFilters") }}
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
          {{ t("notifications.listTitle") }}
        </h2>
      </template>

      <Table
        :loading="loading"
        :items="notifications"
        :headers="tableHeaders"
        :page="page"
        :total-pages="totalPages"
        :loading-text="t('common.loading')"
        :empty-text="t('notifications.empty')"
        @change-page="changePage"
      >
        <template #header-index="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-all cursor-pointer"
              :class="[
                filters.sort_by === 'id' ? 'text-primary' : 'text-gray-400',
                filters.sort_by === 'id' && filters.sort_direction === 'desc'
                  ? 'rotate-180'
                  : '',
              ]"
              @click="handleSort('id')"
            />
          </div>
        </template>

        <template #header-name="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-all cursor-pointer"
              :class="[
                filters.sort_by === 'name_en' || filters.sort_by === 'name_ar'
                  ? 'text-primary'
                  : 'text-gray-400',
                (filters.sort_by === 'name_en' ||
                  filters.sort_by === 'name_ar') &&
                filters.sort_direction === 'desc'
                  ? 'rotate-180'
                  : '',
              ]"
              @click="handleSort(lang === 'ar' ? 'name_ar' : 'name_en')"
            />
          </div>
        </template>

        <template #header-is_active="{ header }">
          <div class="flex items-center gap-2 select-none justify-between">
            {{ header.label }}
            <SvgIcon
              name="sort"
              classes="w-5 h-5 transition-all cursor-pointer"
              :class="[
                filters.sort_by === 'is_active'
                  ? 'text-primary'
                  : 'text-gray-400',
                filters.sort_by === 'is_active' &&
                filters.sort_direction === 'desc'
                  ? 'rotate-180'
                  : '',
              ]"
              @click="handleSort('is_active')"
            />
          </div>
        </template>

        <template #cell-index="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>

        <template #cell-name="{ item }">
          {{ lang === "ar" ? item.name_ar : item.name_en }}
        </template>

        <template #cell-channels="{ item }">
          <div class="flex flex-wrap gap-2">
            <template
              v-for="channel in item.channels?.filter((c) =>
                ['mail', 'push', 'sms'].includes(c),
              )"
              :key="channel"
            >
              <span
                class="px-3 py-1 text-[10px] font-[600] rounded-full text-[#0E5F4A] bg-[#E7EFED] border border-[#82ACA1]"
              >
                {{ t(`notifications.channels.${channel}`) }}
              </span>
            </template>
          </div>
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
              @click="goToEdit(item)"
              v-tooltip="{
                title: t('common.actionTooltips.edit.title', {
                  target: t('notifications.entityName'),
                }),
                content: t('common.actionTooltips.edit.content', {
                  target: t('notifications.entityName'),
                  name: lang === 'ar' ? item.name_ar : item.name_en,
                }),
              }"
            >
              <SvgIcon name="edit" classes="w-8 h-8" />
            </button>
          </div>
        </template>
      </Table>
    </Card>
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
import Toggle from "@/components/ui/Toggle.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { notificationSettingsService } from "@/services/notificationSettings";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();
const router = useRouter();

const notifications = ref([]);
const loading = ref(false);
const togglingId = ref(null);

const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const totalPages = computed(() => {
  if (!total.value || !perPage.value) return 1;
  return Math.max(1, Math.ceil(total.value / perPage.value));
});

const filters = ref({
  search: "",
  status: "",
  sort_by: "id",
  sort_direction: "desc",
});

const statusOptions = computed(() => [
  { label: t("roles.statusOptions.active"), value: "active" },
  { label: t("roles.statusOptions.inactive"), value: "inactive" },
]);

const tableHeaders = computed(() => [
  { key: "index", label: "#" },
  { key: "name", label: t("notifications.fields.name") },
  { key: "channels", label: t("notifications.fields.channels") },
  { key: "is_active", label: t("notifications.fields.status") },
  {
    key: "actions",
    label: t("notifications.fields.actions"),
    cellClass: "w-24",
  },
]);

const loadNotifications = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      search: filters.value.search,
      status: filters.value.status,
      sort_by: filters.value.sort_by,
      sort_direction: filters.value.sort_direction,
    };
    const response = await notificationSettingsService.list(params);
    notifications.value = response.data.notification_settings || [];
    total.value = response.data.pagination?.total || notifications.value.length;
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
  loadNotifications();
};

const resetFilters = () => {
  filters.value = {
    search: "",
    status: "",
    sort_by: "id",
    sort_direction: "desc",
  };
  applyFilters();
};

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  loadNotifications();
};

const goToEdit = (item) => {
  const prefix = lang.value === "en" ? "/en" : "";
  router.push(
    `${prefix}/attendance/settings/notifications/${item.event_key}/edit`,
  );
};

const handleToggleStatus = async (item) => {
  const originalState = item.is_active;
  togglingId.value = item.id;
  try {
    await notificationSettingsService.toggleStatus(item.id);
    item.is_active = !originalState;
    toast.success(
      item.is_active
        ? t("notifications.messages.activated")
        : t("notifications.messages.deactivated"),
    );
  } catch (error) {
    toast.error(error);
  } finally {
    togglingId.value = null;
  }
};

onMounted(() => {
  loadNotifications();
});
</script>
