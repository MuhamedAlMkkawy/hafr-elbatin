<template>
  <section class="space-y-6">
    <Breadcrumb :items="breadcrumbItems" />
    <header class="md:flex items-center justify-between space-y-2 md:space-y-0">
      <div>
        <h1 class="text-[20px] font-[600] text-[#000000]">
          {{ t("attendanceSettings.title") }}
        </h1>
      </div>
    </header>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Main Content Area -->
      <div class="flex-1 order-2 lg:order-2 lg:w-[calc(100%-250px)]">
        <RouterView />
      </div>

      <!-- Tabs Sidebar -->
      <div class="w-full order-1 lg:order-1 lg:w-[220px]">
        <Card class="!p-0 overflow-hidden">
          <nav class="flex flex-col p-3 space-y-1">
            <RouterLink
              v-for="tab in tabs"
              :key="tab.name"
              :to="tab.to"
              class="relative flex items-center px-4 py-3 text-[16px] font-[400] transition-colors rounded-sm"
              :class="[
                isTabActive(tab)
                  ? 'bg-[#F3F9F6] text-[#161616] font-[600] text-[16px]'
                  : 'text-[#384250] hover:bg-[#F3F9F6]/50 text-[16px]',
              ]"
            >
              <!-- Active Indicator Bar -->
              <div
                v-if="isTabActive(tab)"
                class="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#1B8354] rounded-full"
              ></div>
              {{ t(`attendanceSettings.tabs.${tab.name}`) }}
            </RouterLink>
          </nav>
        </Card>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, provide, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter, RouterView, RouterLink } from "vue-router";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import Card from "@/components/ui/Card.vue";
import { useAuthStore } from "@/stores/auth";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const dynamicLabel = ref("");
provide("setBreadcrumbLabel", (label) => {
  dynamicLabel.value = label;
});

const dynamicShiftLabel = ref("");
provide("setShiftBreadcrumbLabel", (label) => {
  dynamicShiftLabel.value = label;
});

const shiftBreadcrumbLabel = computed(() => {
  const base = t("shifts.modals.schedules.title");
  return dynamicShiftLabel.value
    ? `${base} - ${dynamicShiftLabel.value}`
    : base;
});

const breadcrumbItems = computed(() => {
  const prefix = locale.value === "en" ? "/en" : "";
  const items = [
    { label: t("sidebar.attendance") },
    {
      label: t("attendanceSettings.title"),
      to:
        route.name !== "attendance-settings" &&
        route.name !== "attendance-en-settings"
          ? `${prefix}/attendance/settings`
          : undefined,
    },
  ];

  const currentPath = route.path;

  if (currentPath.includes("work-systems")) {
    const isIndex =
      route.name === "work-systems" || route.name === "work-systems-en";
    items.push({
      label: t("attendanceSettings.tabs.workSystem"),
      to: !isIndex ? `${prefix}/attendance/settings/work-systems` : undefined,
    });

    if (
      route.name === "work-systems-view" ||
      route.name === "work-systems-en-view"
    ) {
      items.push({
        label:
          t("workSystems.modals.viewTitle") ||
          (locale.value === "ar" ? "عرض نظام العمل" : "View Work System"),
      });
    } else if (
      route.name === "work-systems-create" ||
      route.name === "work-systems-en-create"
    ) {
      const type = route.query.type;
      items.push({
        label:
          type === "shift"
            ? t("workSystems.modals.addShiftTitle")
            : t("workSystems.modals.addFixedTitle"),
      });
    } else if (
      route.name === "work-systems-edit" ||
      route.name === "work-systems-en-edit"
    ) {
      items.push({ label: t("workSystems.modals.editFixedTitle") });
    }
  } else if (currentPath.includes("shifts")) {
    const isShiftsIndex = route.name === "shifts" || route.name === "shifts-en";
    items.push({
      label: t("attendanceSettings.tabs.shifts"),
      to: !isShiftsIndex ? `${prefix}/attendance/settings/shifts` : undefined,
    });

    // Handle shifts sub-pages (Schedules)
    if (
      route.name === "shift-schedules" ||
      route.name === "shift-schedules-en"
    ) {
      items.push({ label: shiftBreadcrumbLabel.value });
    } else if (
      route.name === "shift-schedules-create" ||
      route.name === "shift-schedules-en-create"
    ) {
      items.push({
        label: shiftBreadcrumbLabel.value,
        to: `${prefix}/attendance/settings/shifts/${route.params.id}/schedules`,
      });
      items.push({ label: t("shifts.modals.schedules.addSchedule") });
    } else if (
      route.name === "shift-schedules-edit" ||
      route.name === "shift-schedules-en-edit"
    ) {
      items.push({
        label: shiftBreadcrumbLabel.value,
        to: `${prefix}/attendance/settings/shifts/${route.params.id}/schedules`,
      });
      items.push({ label: t("shifts.modals.schedules.editSchedule") });
    } else if (
      route.name === "shift-schedules-view" ||
      route.name === "shift-schedules-en-view"
    ) {
      items.push({
        label: shiftBreadcrumbLabel.value,
        to: `${prefix}/attendance/settings/shifts/${route.params.id}/schedules`,
      });
      items.push({
        label: dynamicLabel.value || t("shifts.modals.schedules.viewSchedule"),
      });
    }
  } else if (currentPath.includes("punch-location")) {
    items.push({ label: t("attendanceSettings.tabs.fingerprintLocation") });
  } else if (currentPath.includes("notifications")) {
    items.push({ label: t("attendanceSettings.tabs.notifications") });
  }

  return items;
});

const tabs = computed(() => {
  const prefix = locale.value === "en" ? "/en" : "";
  const allTabs = [
    { 
      name: "workSystem", 
      to: `${prefix}/attendance/settings/work-systems`,
      permission: "work_system.view"
    },
    { 
      name: "shifts", 
      to: `${prefix}/attendance/settings/shifts`,
      permission: ["shift.view", "shift_schedule.view"]
    },
    {
      name: "fingerprintLocation",
      to: `${prefix}/attendance/settings/punch-location`,
      permission: "attendance_location.view"
    },
    {
      name: "notifications",
      to: `${prefix}/attendance/settings/notifications`,
      permission: "general_setting.view"
    },
  ];

  return allTabs.filter(tab => !tab.permission || authStore.hasPermission(tab.permission));
});

const isTabActive = (tab) => {
  // Exact match or sub-path match
  const currentPath = route.path.replace(/\/$/, "");
  const tabPath = tab.to.replace(/\/$/, "");

  // Handle the case where work-systems is the default child
  if (
    tab.name === "workSystem" &&
    (currentPath === tabPath ||
      currentPath === tabPath.replace("/work-systems", ""))
  ) {
    return true;
  }

  return currentPath.startsWith(tabPath);
};

onMounted(() => {
  const currentPath = route.path.replace(/\/$/, "");
  const prefix = locale.value === "en" ? "/en" : "";
  const rootPath = `${prefix}/attendance/settings`.replace(/\/$/, "");

  // If at root or on an unauthorized tab, redirect to first allowed
  const isAuthorized = tabs.value.some(t => currentPath.startsWith(t.to.replace(/\/$/, "")));
  
  if ((currentPath === rootPath || !isAuthorized) && tabs.value.length > 0) {
    router.push(tabs.value[0].to);
  }
});
</script>

<style scoped>
.order-1 {
  order: 1;
}
.order-2 {
  order: 2;
}
@media (min-width: 1024px) {
  .lg\:order-1 {
    order: 1;
  }
  .lg\:order-2 {
    order: 2;
  }
}
</style>
