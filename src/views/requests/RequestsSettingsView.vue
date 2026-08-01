<template>
  <section class="space-y-6">
    <Breadcrumb :items="breadcrumbItems" />
    <header class="md:flex items-center justify-between space-y-2 md:space-y-0">
      <div>
        <h1 class="text-[20px] font-[600] text-[#000000]">
          {{ t("requestsSettings.title") }}
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
              {{ t(`requestsSettings.tabs.${tab.name}`) }}
            </RouterLink>
          </nav>
        </Card>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter, RouterView, RouterLink } from "vue-router";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import Card from "@/components/ui/Card.vue";
import { useAuthStore } from "@/stores/auth";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const breadcrumbItems = computed(() => {
  const prefix = locale.value === "en" ? "/en" : "";
  const items = [
    { label: t("sidebar.requests") },
    {
      label: t("requestsSettings.title"),
      to:
        route.name !== "requests-settings" &&
        route.name !== "requests-en-settings"
          ? `${prefix}/requests/settings`
          : undefined,
    },
  ];

  const currentPath = route.path;

  if (currentPath.includes("holidays")) {
    items.push({
      label: t("requestsSettings.tabs.holidays"),
    });
  } else if (currentPath.includes("leave-types")) {
    items.push({
      label: t("requestsSettings.tabs.leaveTypes"),
    });
  } else if (currentPath.includes("notifications")) {
    items.push({
      label: t("requestsSettings.tabs.notifications"),
    });
  } else if (currentPath.includes("permissions")) {
    items.push({
      label: t("requestsSettings.tabs.permissions"),
    });
  } else if (currentPath.includes("overtime")) {
    items.push({
      label: t("requestsSettings.tabs.overtime"),
    });
  }

  return items;
});

const tabs = computed(() => {
  const prefix = locale.value === "en" ? "/en" : "";
  const allTabs = [
    { 
      name: "leaveTypes", 
      to: `${prefix}/requests/settings/leave-types`,
      permission: "leave_type.view"
    },
    { 
      name: "permissions", 
      to: `${prefix}/requests/settings/permissions`,
      permission: "permission_setting.view"
    },
    { 
      name: "overtime", 
      to: `${prefix}/requests/settings/overtime`,
      permission: "overtime_settings.view"
    },
    { 
      name: "holidays", 
      to: `${prefix}/requests/settings/holidays`,
      permission: "holiday.view"
    },
    { 
      name: "notifications", 
      to: `${prefix}/requests/settings/notifications`,
      permission: "general_setting.view"
    },
  ];

  return allTabs.filter(tab => !tab.permission || authStore.hasPermission(tab.permission));
});

const isTabActive = (tab) => {
  const currentPath = route.path.replace(/\/$/, "");
  const tabPath = tab.to.replace(/\/$/, "");

  // Handle the case where holidays is the default child or similar if needed
  if (
    tab.name === "leaveTypes" &&
    (currentPath === tabPath ||
      currentPath === tabPath.replace("/leave-types", ""))
  ) {
    return true;
  }

  return currentPath.startsWith(tabPath);
};

onMounted(() => {
  const currentPath = route.path.replace(/\/$/, "");
  const prefix = locale.value === "en" ? "/en" : "";
  const rootPath = `${prefix}/requests/settings`.replace(/\/$/, "");

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
