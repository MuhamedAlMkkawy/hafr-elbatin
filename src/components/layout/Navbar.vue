<template>
  <div
    class="px-8 sticky top-0 z-[103] min-h-[72px] flex flex-wrap items-center justify-between gap-3 lg:py-4 py-2 bg-white"
  >
    <div class="flex items-center gap-3">
      <slot name="leading" />
    </div>
    <div class="flex items-center gap-6 flex-wrap">
      <div class="relative">
        <div
          class="relative cursor-pointer hover:bg-gray-50 p-2 rounded-full transition-colors"
          id="notification-bell"
          v-if="authStore?.user?.name"
          @click="toggleNotificationDropdown"
        >
          <SvgIcon name="bell" classes="w-6 h-6 text-[#161616]" />
          <span
            v-if="notificationStore.unreadCount > 0"
            class="absolute top-0.5 right-0.5 bg-[#6dca3c] text-[#161616] text-[12px] font-[500] rounded-full min-w-4 h-4 flex items-center justify-center"
          >
            {{
              notificationStore.unreadCount > 99
                ? "99+"
                : notificationStore.unreadCount
            }}
          </span>
        </div>

        <!-- Notification Dropdown -->
        <div
          v-if="isNotificationOpen"
          class="absolute end-[-50px] mt-3 w-[420px] bg-white rounded-[20px] shadow-[0px_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 z-[110] overflow-hidden animate-in fade-in zoom-in duration-200"
          id="notification-dropdown"
          v-click-outside="() => (isNotificationOpen = false)"
        >
          <!-- Header -->
          <div
            class="px-6 py-5 flex items-center justify-between border-b border-gray-50"
          >
            <div class="flex items-center gap-2">
              <h3 class="text-[20px] font-[600] text-[#000000]">
                {{ t("userNotifications.title") }}
              </h3>
              <span
                v-if="notificationStore.unreadCount > 0"
                class="bg-[#0E5F4A] text-white px-2 py-0.5 rounded-full text-[12px] font-bold"
              >
                {{ notificationStore.unreadCount }}
              </span>
            </div>
            <button
              @click="handleMarkAllRead"
              class="text-[#0E5F4A] font-[500] text-[12px] hover:underline flex items-center gap-1.5 transition-all cursor-pointer"
              :disabled="markingAllRead || recentNotifications?.length === 0"
              :class="
                markingAllRead || recentNotifications?.length === 0
                  ? 'hidden'
                  : 'block'
              "
            >
              <div class="flex items-center" v-if="!markingAllRead">
                <SvgIcon name="read_sm" />
              </div>
              <span
                v-else
                class="animate-spin w-3 h-3 border-2 border-[#0E5F4A] border-t-transparent rounded-full"
              />
              {{ t("userNotifications.markAllRead") }}
            </button>
          </div>

          <!-- List -->
          <div
            ref="dropdownContainer"
            class="max-h-[480px] overflow-y-auto scrollbar-hide py-2"
          >
            <div
              v-if="loadingNotifications && page === 1"
              class="flex justify-center py-10"
            >
              <div
                class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0E5F4A]"
              ></div>
            </div>

            <div
              v-else-if="recentNotifications.length === 0"
              class="flex flex-col items-center justify-center py-12 px-6 text-center"
            >
              <div
                class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"
              >
                <SvgIcon name="bell" classes="text-gray-300" />
              </div>
              <p class="text-gray-500 font-medium">
                {{ t("userNotifications.empty") }}
              </p>
            </div>

            <div v-else class="px-3 space-y-2">
              <div
                v-for="notification in recentNotifications"
                :key="notification.id"
                class="group relative flex flex-col gap-1 p-4 rounded-[8px] transition-all duration-300 cursor-pointer"
                :class="
                  notification.is_read
                    ? 'bg-[#FCFCFD] hover:bg-[#FCFCFD]/80 border border-[#D2D6DB]'
                    : 'bg-[#F6FEF9] hover:bg-[#F6FEF9]/80 border border-[#CFDFDB]'
                "
                @click="handleNotificationClick(notification)"
              >
                <!-- Unread Indicator Line -->
                <div
                  class="absolute start-0 top-0 bottom-0 w-2 h-full rounded-s-[8px]"
                  :class="
                    notification.is_read ? 'bg-[#E5E7EB]' : 'bg-[#0E5F4A]'
                  "
                ></div>

                <div class="flex justify-between items-start gap-4">
                  <h4
                    class="font-[600] text-[16px] leading-tight flex-1"
                    :class="
                      notification.is_read ? 'text-[#1F2A37]' : 'text-[#0E5F4A]'
                    "
                  >
                    {{
                      getLocalizedField(notification, "title") ||
                      t("userNotifications.new_message")
                    }}
                  </h4>
                </div>

                <p
                  class="mt-1 text-[#384250] text-[14px] font-[400] leading-6 line-clamp-2"
                >
                  {{ getLocalizedField(notification, "body") }}
                </p>

                <div class="flex items-center justify-between gap-1.5 mt-1">
                  <span
                    class="text-[12px] font-[500] text-[#6C737F] shrink-0 whitespace-nowrap"
                  >
                    {{ formatRelativeTime(notification.created_at) }}
                  </span>
                  <span
                    class="text-[12px] font-[500] text-[#6C737F] shrink-0 whitespace-nowrap"
                  >
                    {{ formatDateTime(notification.created_at) }}
                  </span>
                </div>
              </div>

              <!-- Load More Sentinel -->
              <div
                v-if="hasMore"
                ref="dropdownTrigger"
                class="flex justify-center p-4 h-10"
              >
                <div
                  v-if="loadingNotifications"
                  class="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0E5F4A]"
                ></div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-4 py-2 border-t border-gray-50">
            <button
              @click="goToNotifications"
              class="w-full py-3.5 text-[#0E5F4A] font-[500] text-[14px] cursor-pointer text-center hover:bg-[#0E5F4A]/[0.04] rounded-xl transition-all duration-200"
            >
              {{ t("userNotifications.view_all") }}
            </button>
          </div>
        </div>
      </div>
      <div class="relative" v-if="authStore?.user?.name">
        <div
          class="flex items-center gap-2 cursor-pointer select-none"
          @click="isMenuOpen = !isMenuOpen"
        >
          <span class="text-[#161616] font-medium">{{
            authStore.user?.name || "User"
          }}</span>
          <SvgIcon
            name="chevron-down"
            classes="w-4 h-4 transition-transform duration-200 text-[#0E5F4A]"
            :class="{ 'rotate-180': isMenuOpen }"
          />
        </div>

        <!-- Dropdown Menu -->
        <div
          v-if="isMenuOpen"
          class="absolute end-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 transition-all duration-200"
          @click.stop
        >
          <router-link
            v-if="authStore.user"
            to="/profile"
            class="group flex w-full px-4 items-center rounded-sm p-2 text-[14px] hover:bg-gray-100 cursor-pointer"
            @click="isMenuOpen = !isMenuOpen"
          >
            {{ t("nav.profile") }}
          </router-link>
          <button
            v-if="authStore.user"
            @click="handleLogout"
            class="cursor-pointer w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <!-- <SvgIcon name="logout" classes="w-4 h-4" /> -->
            {{ t("nav.logout") }}
          </button>
          <button
            v-else
            @click="router.push({ name: 'login' })"
            class="cursor-pointer w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <!-- <SvgIcon name="logout" classes="w-4 h-4" /> -->
            {{ t("nav.login") }}
          </button>
        </div>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { SUPPORT_LOCALES } from "@/i18n/messages";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notifications";
import notificationService from "@/services/notifications";
import { MenuItem } from "@headlessui/vue";
import { useNotificationRouter } from "@/composables/useNotificationRouter";
import profileService from "@/services/profile";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const { handleRedirect } = useNotificationRouter();

const isMenuOpen = ref(false);
const isNotificationOpen = ref(false);
const recentNotifications = ref([]);
const loadingNotifications = ref(false);
const markingAllRead = ref(false);
const dropdownContainer = ref(null);
const dropdownTrigger = ref(null);
const page = ref(1);
const hasMore = ref(false);
let observer = null;

// Watch for real-time notification trigger
watch(
  () => notificationStore.refreshListTrigger,
  () => {
    // Only auto-refresh if dropdown is open, OR always to keep state fresh?
    // So if dropdown is open, refresh.
    if (isNotificationOpen.value) {
      page.value = 1;
      fetchRecentNotifications(false);
    }
  },
);

const toggleNotificationDropdown = () => {
  if (window.innerWidth < 1024) {
    goToNotifications();
    return;
  }
  isNotificationOpen.value = !isNotificationOpen.value;
  if (isNotificationOpen.value) {
    page.value = 1;
    fetchRecentNotifications(false);
  }
};

const fetchRecentNotifications = async (isLoadMore = false) => {
  if (loadingNotifications.value) return;
  loadingNotifications.value = true;
  try {
    const response = await notificationService.getAll({
      per_page: 10,
      page: page.value,
    });
    if (response.data?.success) {
      const data = response.data.data;
      const notifications = data.notifications || [];

      if (isLoadMore) {
        recentNotifications.value = [
          ...recentNotifications.value,
          ...notifications,
        ];
      } else {
        recentNotifications.value = notifications;
      }

      const p = data.pagination;
      if (p) {
        hasMore.value = Number(p.current_page) < Number(p.last_page);
      }

      if (!isLoadMore) {
        setTimeout(setupDropdownObserver, 100);
      }
    }
  } catch (error) {
    console.error("Error fetching recent notifications:", error);
  } finally {
    loadingNotifications.value = false;
  }
};

const loadMore = () => {
  if (hasMore.value && !loadingNotifications.value) {
    page.value++;
    fetchRecentNotifications(true);
  }
};

const setupDropdownObserver = () => {
  if (observer) observer.disconnect();

  if (!dropdownTrigger.value || !dropdownContainer.value) return;

  observer = new IntersectionObserver(
    (entries) => {
      if (
        entries[0].isIntersecting &&
        !loadingNotifications.value &&
        hasMore.value
      ) {
        loadMore();
      }
    },
    {
      root: dropdownContainer.value,
      threshold: 0.1,
      rootMargin: "20px",
    },
  );

  observer.observe(dropdownTrigger.value);
};

const handleMarkAllRead = async () => {
  if (markingAllRead.value) return;
  markingAllRead.value = true;
  try {
    const response = await notificationService.markAllRead();
    if (response.data?.success) {
      recentNotifications.value = recentNotifications.value.map((n) => ({
        ...n,
        is_read: true,
      }));
      notificationStore.resetUnreadCount();
    }
  } catch (error) {
    console.error("Error marking all read:", error);
  } finally {
    markingAllRead.value = false;
  }
};

const handleNotificationClick = async (notification) => {
  if (!notification.is_read) {
    try {
      await notificationService.markAsRead(notification.id);
      notification.is_read = true;
      notificationStore.decrementUnreadCount();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  // Redirect based on action_type
  handleRedirect(notification);
  isNotificationOpen.value = false;
};

const goToNotifications = () => {
  router.push(
    locale.value === "en" ? "/en/notifications-list" : "/notifications-list",
  );
  isNotificationOpen.value = false;
};

const getLocalizedField = (item, field) => {
  const isAr = locale.value === "ar";
  if (isAr) {
    return item[`${field}_ar`] || item[field] || "";
  }
  return item[field] || item[`${field}_ar`] || "";
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return t("userNotifications.time.just_now");

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60)
    return t("userNotifications.time.minutes_ago", { count: diffInMinutes });

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return t("userNotifications.time.hours_ago", { count: diffInHours });

  const diffInDays = Math.floor(diffInHours / 24);
  return t("userNotifications.time.days_ago", { count: diffInDays });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale.value === "ar" ? "ar-EG" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const handleLogout = async () => {
  authStore.logout();
  isMenuOpen.value = false;
  router.push("/login");
};

// Close dropdown when clicking outside
const closeMenu = (e) => {
  if (isMenuOpen.value && !e.target.closest(".relative")) {
    isMenuOpen.value = false;
  }
  if (
    isNotificationOpen.value &&
    !e.target.closest("#notification-bell") &&
    !e.target.closest("#notification-dropdown")
  ) {
    isNotificationOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener("click", closeMenu);
  if (authStore.isAuthenticated) {
    notificationStore.fetchUnreadCount();
  }
});

onUnmounted(() => {
  window.removeEventListener("click", closeMenu);
  if (observer) observer.disconnect();
});

const availableLocales = Object.values(SUPPORT_LOCALES);

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
</script>
