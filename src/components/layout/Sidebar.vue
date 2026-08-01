<template>
  <aside
    class="right-0 z-[110] w-72 flex-shrink-0 flex flex-col text-white transition-all duration-300 shadow-xl overflow-hidden max-w-[256px]"
    :class="[
      open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
      'fixed inset-y-0 lg:sticky lg:top-0 lg:h-screen',
    ]"
    :dir="locale === 'ar' ? 'rtl' : 'ltr'"
    :style="{
      backgroundImage: `url(${sidenavMask})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundColor: '#0E5F4A',
    }"
  >
    <!-- Header / Logo -->
    <div class="items-center justify-center relative">
      <RouterLink to="/" class="relative block w-full">
        <template v-if="logoUrl">
          <img
            :src="logoUrl"
            alt="Logo"
            class="w-full object-contain max-w-[192px] max-h-[65px] mx-auto block mt-2"
          />

        </template>
        <template v-else>
          <!-- Background Image -->
          <img
            src="@/assets/images/nav_logo_bg.png"
            alt="Logo Background"
            class="w-full object-contain"
          />
          <!-- Centered Overlay Image -->
          <img
            src="@/assets/images/nav_logo.png"
            alt="Logo"
            class="absolute inset-0 m-auto object-contain max-w-[192px] max-h-[72px]"
          />
        </template>
      </RouterLink>
      <!-- Mobile Close Button -->
      <Button
        size="sm"
        @click="$emit('close')"
        class="absolute top-0 left-0 lg:hidden text-white"
      >
        <SvgIcon name="close" classes="w-6 h-6" />
      </Button>
      <template v-if="authStore.user">
        <!-- Search (sticky so it stays visible when nav scrolls) -->
        <div class="pt-3 px-5">
          <div class="w-full relative sticky top-0 z-10 h-[40px]">
            <Input
              :placeholder="t('common.search')"
              size="sm"
              v-model="searchQuery"
              @keydown="handleSearchKeydown"
            >
              <template #suffix>
                <SvgIcon name="search" />
              </template>
            </Input>
          </div>
        </div>
      </template>
    </div>
    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto pb-4 px-4 space-y-1 mt-2 custom-scrollbar">
      <template v-if="authStore.user">
        <template v-for="(item, index) in filteredMenuItems" :key="index">
          <!-- Single Link -->
          <RouterLink
            v-if="!item.children"
            :to="item.to"
            v-slot="{ isActive, isExactActive, navigate, href }"
            custom
          >
            <a
              :href="href"
              @click="navigate"
              class="flex items-center gap-3 px-3 py-2 my-2 transition-colors duration-200 hover:bg-white/10 hover:rounded-sm group relative"
              :class="
                (item.labelKey === 'home' ? isExactActive : isActive)
                  ? 'bg-[#FFFFFF4D] shadow-sm rounded-sm text-white'
                  : ''
              "
            >
              <div
                v-if="item.labelKey === 'home' ? isExactActive : isActive"
                class="active-indicator"
              ></div>
              <SvgIcon
                :key="
                  (item.labelKey === 'home' ? isExactActive : isActive)
                    ? item.icon + '_filled'
                    : item.icon
                "
                :name="
                  ['home', 'branches', 'employees', 'structure'].includes(
                    item.labelKey,
                  ) && (item.labelKey === 'home' ? isExactActive : isActive)
                    ? `${item.icon}_filled`
                    : item.icon
                "
                classes="flex-shrink-0 transition-all duration-200 text-white w-[16px] h-[16px]"
              />
              <span class="text-[14px] font-[600]">
                <template
                  v-for="(seg, si) in highlightSegments(
                    t(`sidebar.${item.labelKey}`),
                    searchQuery,
                  )"
                  :key="si"
                >
                  <span v-if="seg.type === 'match'" class="search-highlight">{{
                    seg.text
                  }}</span>
                  <template v-else>{{ seg.text }}</template>
                </template>
              </span>
            </a>
          </RouterLink>

          <!-- Dropdown Menu -->
          <div v-else class="space-y-1">
            <button
              @click="toggleMenu(item.labelKey)"
              class="w-full flex items-center justify-between px-3 py-2 my-2 transition-colors duration-200 hover:bg-white/10 hover:rounded-sm group text-start cursor-pointer relative"
            >
              <div class="flex items-center gap-3">
                <SvgIcon
                  :name="item.icon"
                  classes="w-[16px] h-[16px] flex-shrink-0 transition-all duration-200 fill-white text-white"
                />
                <span class="text-[14px] font-[600]">
                  <template
                    v-for="(seg, si) in highlightSegments(
                      t(`sidebar.${item.labelKey}`),
                      searchQuery,
                    )"
                    :key="si"
                  >
                    <span
                      v-if="seg.type === 'match'"
                      class="search-highlight"
                      >{{ seg.text }}</span
                    >
                    <template v-else>{{ seg.text }}</template>
                  </template>
                </span>
              </div>
              <SvgIcon
                name="chevron-down"
                classes="w-3 h-3 transition-transform duration-200"
                :class="{
                  'rotate-180': openMenus[item.labelKey],
                }"
              />
            </button>

            <div
              v-show="openMenus[item.labelKey]"
              class="ps-9 space-y-1 overflow-hidden transition-all duration-300"
            >
              <RouterLink
                v-for="(child, childIndex) in item.children"
                :key="childIndex"
                :to="child.to"
                v-slot="{ isActive, navigate, href }"
                custom
              >
                <a
                  :href="href"
                  @click="navigate"
                  class="block px-3 py-2 my-2 text-sm text-white hover:bg-white/10 hover:rounded-sm transition-colors relative"
                  :class="{
                    'text-white bg-[#FFFFFF4D] rounded-sm shadow-sm font-semibold':
                      isActive,
                  }"
                >
                  <div v-if="isActive" class="active-indicator"></div>
                  <template
                    v-for="(seg, si) in highlightSegments(
                      t(`sidebar.${child.labelKey}`),
                      searchQuery,
                    )"
                    :key="si"
                  >
                    <span
                      v-if="seg.type === 'match'"
                      class="search-highlight"
                      >{{ seg.text }}</span
                    >
                    <template v-else>{{ seg.text }}</template>
                  </template>
                </a>
              </RouterLink>
            </div>
          </div>

          <hr class="border-[#FFFFFF4D] max-w-[192px] m-auto" />
        </template>
      </template>
    </nav>

    <!-- Footer -->
    <div class="p-4 border-t border-white/10">
      <div class="flex items-center justify-center gap-4">
        <Button
          size="sm"
          class="text-white hover:bg-white/10 hover:rounded-sm bg-transparent"
          v-if="authStore.hasPermission(['employee_message.view', 'employee_message.create'])"
          @click="handleChatClick"
        >
          <SvgIcon name="headphone_white" classes="w-6 h-6" />
        </Button>
        <Button
          size="sm"
          class="text-white hover:bg-white/10 hover:rounded-sm bg-transparent"
          @click="toggleLocale"
        >
          <SvgIcon name="globe" classes="w-6 h-6" />
        </Button>
      </div>
      <!-- <div class="flex justify-center">
        <img src="@/assets/images/white_logo.png" alt="MAZAYA" class="h-7" />
      </div> -->
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useSettingsStore } from "@/stores/settings";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import sidenavMask from "@/assets/images/sidenav_mask.png";
import Icon from "@/components/ui/Icon.vue";

import { useAuthStore } from "@/stores/auth";

const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const logoUrl = computed(() => settingsStore.logoUrl);

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

// Menu data with permissions
const menuItems = [
  { 
    labelKey: "home", 
    icon: "home", 
    to: "/", 
    permission: ["admin_dashboard.view", "h_r_dashboard.view", "manager_dashboard.view", "employee_dashboard.view"] 
  },
  { 
    labelKey: "branches", 
    icon: "branches", 
    to: "/branches", 
    permission: "branch.view" 
  },
  { 
    labelKey: "employees", 
    icon: "employees", 
    to: "/employees", 
    permission: "employee.view" 
  },
  {
    labelKey: "attendance",
    icon: "attendance",
    permission: ["daily_attendance.view", "attendance.status", "attendance.today", "attendance.history", "attendance_history.view", "instant_attendance.view"],
    children: [
      { labelKey: "attendanceRecord", to: "/attendance/daily", permission: ["daily_attendance.view", "attendance.status", "attendance.today", "attendance.history", "attendance_history.view", "instant_attendance.view"] },
{ labelKey: "attendanceSettings", to: "/attendance/settings", permission: ["attendance_location.view", "work_system.view", "shift.view", "shift_schedule.view"] },
    ],
  },
  {
    labelKey: "requests",
    icon: "requests",
    permission: ["leave_request.view", "overtime_request.view", "missing_punch_request.view", "external_mission.view", "permission_setting.view", "overtime_settings.view", "holiday.view", "leave_type.view"],
    children: [
      { labelKey: "requestsLeaves", to: "/requests/leave", permission: "leave_request.view" },
      { labelKey: "requestsOvertime", to: "/requests/overtime", permission: "overtime_request.view" },
      { labelKey: "requestsFingerprint", to: "/requests/missing-punch", permission: "missing_punch_request.view" },
      { labelKey: "requestsDelegation", to: "/requests/delegation", permission: "external_mission.view" },
      { labelKey: "requestsSettings", to: "/requests/settings", permission: ["permission_setting.view", "overtime_settings.view", "holiday.view", "leave_type.view"] },
    ],
  },
  {
    labelKey: "reports",
    icon: "reports",
    permission: ["attendance_report.view", "employee_working_hours_report.view", "leave_balances_report.summary", "leave_balances.report", "permission_balances_report.summary", "permission_balances.report", "attendance_summary_report.view", "employee_attendance_log.view"],
    children: [
      { labelKey: "reportsAttendance", to: "/reports/attendance", permission: "attendance_report.view" },
      { labelKey: "reportsAbsence", to: "/reports/absence", permission: "attendance_report.view" },
      { labelKey: "reportsHours", to: "/reports/hours", permission: "employee_working_hours_report.view" },
      { labelKey: "reportsLeaves", to: "/reports/leaves", permission: ["leave_balances_report.summary", "leave_balances.report"] },
      { labelKey: "permissions", to: "/reports/permissions", permission: ["permission_balances_report.summary", "permission_balances.report"] },
      { labelKey: "reportsFingerprint", to: "/reports/attendance/logs", permission: ["attendance_report.view", "employee_attendance_log.view"] },
    ],
  },
  {
    labelKey: "performance",
    icon: "performance",
    permission: ["performance_charter.view", "evaluation_form.view", "general_estimate_form.view"],
    children: [
      { labelKey: "performanceCharter", to: "/performance/charter", permission: "performance_charter.view" },
      { labelKey: "performanceEvaluation", to: "/performance/evaluation", permission: "evaluation_form.view" },
      { labelKey: "performanceAppraisal", to: "/performance/appraisal", permission: "general_estimate_form.view" },
    ],
  },
  {
    labelKey: "support",
    icon: "support",
    permission: ["internal_memo.view", "employee_message.view"],
    children: [
      { labelKey: "supportComplaints", to: "/support/complaints", permission: "internal_memo.view" },
      { labelKey: "supportContact", to: "/support/contact", permission: ["employee_message.view", "employee_message.create"] },
    ],
  },
  {
    labelKey: "settings",
    icon: "settings",
    permission: ["general_setting.view", "role.view", "employee.view"],
    children: [
      { labelKey: "settingsGeneral", to: "/settings/general", permission: "general_setting.view" },
      { labelKey: "settingsRoles", to: "/settings/roles", permission: "role.view" },
      { labelKey: "settingsUsers", to: "/settings/users", permission: "employee.view" },
    ],
  },
  { 
    labelKey: "structure", 
    icon: "structure", 
    to: "/structure", 
    permission: "organizational_unit.view" 
  },
  { 
    labelKey: "logs", 
    icon: "logs", 
    to: "/logs", 
    permission: "audit_log.view" 
  },
];

const localizedMenuItems = computed(() => {
  const prefix = locale.value === "en" ? "/en" : "";
  return menuItems
    .filter(item => authStore.hasPermission(item.permission))
    .map((item) => {
      const children = item.children?.filter(child => authStore.hasPermission(child.permission));
      
      // Logic for supportContact routing based on permissions
      if (item.children) {
        const supportContactChild = children.find(c => c.labelKey === "supportContact");
        if (supportContactChild) {
          const hasView = authStore.hasPermission("employee_message.view");
          const hasCreate = authStore.hasPermission("employee_message.create");
          
          if (hasCreate && !hasView) {
            supportContactChild.to = `${prefix}/add-message`.replace(/\/+/g, "/");
          } else {
            supportContactChild.to = `${prefix}/support/contact`.replace(/\/+/g, "/");
          }
        }
      }

      return {
        ...item,
        to: item.to
          ? `${prefix}${item.to}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/"
          : undefined,
        children: children?.map((child) => ({
          ...child,
          to: `${prefix}${child.to}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/",
        })),
        // Hide parent if no children allowed (for items with children)
        ...(item.children && { childrenCount: children.length })
      };
    })
    .filter(item => !item.children || item.childrenCount > 0);
});

const searchQuery = ref("");

const filteredMenuItems = computed(() => {
  if (!searchQuery.value) return localizedMenuItems.value;

  const query = searchQuery.value.toLowerCase();
  return localizedMenuItems.value
    .map((item) => {
      const label = t(`sidebar.${item.labelKey}`).toLowerCase();
      const children = item.children?.filter((child) =>
        t(`sidebar.${child.labelKey}`).toLowerCase().includes(query),
      );

      if (label.includes(query) || (children && children.length > 0)) {
        return { ...item, ...(children && { children }) };
      }
      return null;
    })
    .filter(Boolean);
});

const handleSearchKeydown = (e) => {
  // Add any specific keydown logic if needed,
  // though v-model handles the basic search functionality.
};

function highlightSegments(text, query) {
  if (!query || !query.trim()) return [{ type: "normal", text }];
  const q = query.toLowerCase();
  const lower = text.toLowerCase();
  const segments = [];
  let lastIndex = 0;
  let pos = 0;
  while ((pos = lower.indexOf(q, lastIndex)) !== -1) {
    if (pos > lastIndex)
      segments.push({ type: "normal", text: text.slice(lastIndex, pos) });
    segments.push({ type: "match", text: text.slice(pos, pos + q.length) });
    lastIndex = pos + q.length;
  }
  if (lastIndex < text.length)
    segments.push({ type: "normal", text: text.slice(lastIndex) });
  return segments.length ? segments : [{ type: "normal", text }];
}

const openMenus = ref({});

const hasActiveChild = (item) => {
  if (!item.children) return false;
  return item.children.some((child) => route.path.startsWith(child.to));
};

// Watch for route changes to auto-expand parents of active children
watch(
  () => route.path,
  () => {
    localizedMenuItems.value.forEach((item) => {
      if (hasActiveChild(item)) {
        openMenus.value[item.labelKey] = true;
      }
    });
  },
  { immediate: true },
);

// When searching: open parents that contain a match, close those that don't.
// When search is cleared, close parents that were opened only for search,
// keeping open only those that have the active child route.
watch(
  [searchQuery, filteredMenuItems],
  () => {
    // If query cleared: reset open menus to only those with active children
    if (!searchQuery.value) {
      const next = {};
      localizedMenuItems.value.forEach((item) => {
        if (!item.children) return;
        if (hasActiveChild(item)) {
          next[item.labelKey] = true;
        }
      });
      openMenus.value = next;
      return;
    }

    // With an active query: open parents with matches, close the rest
    const next = { ...openMenus.value };
    localizedMenuItems.value.forEach((item) => {
      if (!item.children) return;
      const label = t(`sidebar.${item.labelKey}`).toLowerCase();
      const query = searchQuery.value.toLowerCase();
      const hasMatchingChild = item.children?.some((child) =>
        t(`sidebar.${child.labelKey}`).toLowerCase().includes(query),
      );
      const parentLabelMatches = label.includes(query);
      if (hasMatchingChild || parentLabelMatches) {
        next[item.labelKey] = true;
      } else {
        next[item.labelKey] = false;
      }
    });
    openMenus.value = next;
  },
  { immediate: true },
);

const switchLanguage = (lang) => {
  if (locale.value === lang) return;

  locale.value = lang;
  localStorage.setItem("user-locale", lang);

  const currentPath = route.fullPath;
  let newPath = currentPath;

  if (lang === "en") {
    if (!currentPath.startsWith("/en")) {
      newPath = currentPath === "/" ? "/en" : `/en${currentPath}`;
    }
  } else {
    if (currentPath.startsWith("/en")) {
      newPath = currentPath.slice(3) || "/";
    }
  }

  if (newPath !== currentPath) {
    router.push(newPath);
  }
};

const toggleLocale = () => {
  switchLanguage(locale.value === "en" ? "ar" : "en");
};

const toggleMenu = (key) => {
  const isCurrentlyOpen = openMenus.value[key];
  if (isCurrentlyOpen) {
    openMenus.value = { ...openMenus.value, [key]: false };
  } else {
    openMenus.value = { [key]: true };
  }
};

const handleChatClick = () => {
  const hasView = authStore.hasPermission("employee_message.view");
  const hasCreate = authStore.hasPermission("employee_message.create");

  if (!hasView && !hasCreate) return;

  const prefix = locale.value === "en" ? "/en" : "";
  let targetPath = "";

  if (hasCreate && !hasView) {
    targetPath = `${prefix}/add-message`.replace(/\/+/g, "/");
  } else {
    targetPath = `${prefix}/support/contact`.replace(/\/+/g, "/");
  }

  router.push(targetPath.replace(/\/$/, "") || "/");
};
</script>

<style scoped>
/* Custom scrollbar for the nav */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.6);
}

.active-indicator {
  position: absolute;
  top: 15%;
  bottom: 15%;
  width: 6px;
  height: 24px;
  background-color: white;
  border-radius: 99px;
}

[dir="rtl"] .active-indicator {
  right: 0;
}

[dir="ltr"] .active-indicator {
  left: 0;
}

.active-indicator-parent {
  border-bottom-color: transparent !important;
}

.search-highlight {
  background: rgba(255, 255, 255, 0.35);
  border-radius: 2px;
  padding: 0 1px;
}
</style>
