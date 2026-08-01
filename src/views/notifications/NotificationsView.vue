<template>
  <div class="notifications-view p-6 bg-[#F9F9F9] min-h-screen">
    <Breadcrumb :items="breadcrumbItems" />

    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold text-[#161616]">
          {{ t("userNotifications.title") }}
        </h1>
        <div
          v-if="notificationStore.unreadCount > 0"
          class="bg-[#DFF6E7] text-[#0E5F4A] px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
        >
          {{
            t("userNotifications.unreadCount", {
              count: notificationStore.unreadCount,
            })
          }}
        </div>
      </div>
      <Button
        @click="handleMarkAllRead"
        :disabled="markingAllRead || notifications.length === 0"
      >
        <template v-if="!markingAllRead">
          <div class="flex items-center me-2">
            <SvgIcon name="read" />
          </div>
        </template>
        <span
          v-else
          class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"
        />
        <span class="font-medium">{{
          t("userNotifications.markAllRead")
        }}</span>
      </button>
    </div>
    <Card class="mb-2.5">
      <!-- Search -->
      <div>
        <div class="relative w-full">
          <Input
            v-model="searchQuery"
            type="text"
            :placeholder="t('userNotifications.search')"
            :label="t('common.search')"
          >
            <template #suffix>
              <SvgIcon name="search" />
            </template>
          </Input>
        </div>
      </div>
    </Card>
    <Card>
      <template #header>
      <div>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("userNotifications.listTitle") }}
        </h2>
      </div>
      </template>

      <!-- Notifications List -->
      <div v-if="loading && page === 1" class="flex justify-center py-20">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E5F4A]"
        ></div>
      </div>

      <div
        v-else-if="notifications.length === 0"
        class="flex flex-col items-center justify-center py-20"
      >
        <img
          src="@/assets/images/no_results.png"
          alt="No Data"
          class="w-64 mb-6"
        />
        <p class="text-[#616161] text-lg font-medium">
          {{ t("userNotifications.empty") }}
        </p>
      </div>

      <div v-else class="space-y-4 mt-5">
        <div
          v-for="notification in filteredNotifications"
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
            :class="notification.is_read ? 'bg-[#E5E7EB]' : 'bg-[#0E5F4A]'"
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
              {{ formatDateTime(notification.created_at) }}
            </span>
            <span
              class="text-[12px] font-[500] text-[#6C737F] shrink-0 whitespace-nowrap"
            >
              {{ formatRelativeTime(notification.created_at) }}
            </span>
            
          </div>
        </div>

        <!-- Load More Sentinel -->
        <div 
          v-if="hasMore" 
          ref="loadMoreTrigger" 
          class="flex justify-center p-4 h-10"
        >
          <div
            v-if="loading"
            class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0E5F4A]"
          ></div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notifications";
import notificationService from "@/services/notifications";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Card from "@/components/ui/Card.vue";
import Input from "@/components/ui/Input.vue";
import Button from "@/components/ui/Button.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import { useNotificationRouter } from "@/composables/useNotificationRouter";

const { t, locale } = useI18n();
const router = useRouter();
const notificationStore = useNotificationStore();
const { handleRedirect } = useNotificationRouter();

const breadcrumbItems = computed(() => [
  { label: t("sidebar.home"), to: locale.value === "en" ? "/en" : "/" },
  { label: t("userNotifications.title") },
]);

const notifications = ref([]);
const loading = ref(false);
const markingAllRead = ref(false);
const searchQuery = ref("");
const page = ref(1);
const hasMore = ref(false);
const loadMoreTrigger = ref(null);
let observer = null;

// Watch for real-time notification trigger
watch(() => notificationStore.refreshListTrigger, () => {
  page.value = 1;
  loadNotifications(false);
});

const filteredNotifications = computed(() => {
  if (!searchQuery.value) return notifications.value;
  const query = searchQuery.value.toLowerCase();
  return notifications.value.filter((n) => {
    const title = (getLocalizedField(n, "title") || "").toLowerCase();
    const body = (getLocalizedField(n, "body") || "").toLowerCase();
    return title.includes(query) || body.includes(query);
  });
});

const loadNotifications = async (isLoadMore = false) => {
  if (loading.value) return;

  loading.value = true;
  try {
    const response = await notificationService.getAll({
      page: page.value,
      per_page: 10,
    });

    if (response.data?.success) {
      const data = response.data.data;
      const newNotifications = data.notifications || [];
      if (isLoadMore) {
        notifications.value = [...notifications.value, ...newNotifications];
      } else {
        notifications.value = newNotifications;
      }

      const p = data.pagination;
      if (p) {
        hasMore.value = Number(p.current_page) < Number(p.last_page);
      }

      if (!isLoadMore) {
        setTimeout(setupObserver, 100);
      }
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  page.value++;
  loadNotifications(true);
};

const handleMarkAllRead = async () => {
  if (markingAllRead.value) return;

  markingAllRead.value = true;
  try {
    const response = await notificationService.markAllRead();
    if (response.data?.success) {
      notifications.value = notifications.value.map((n) => ({
        ...n,
        is_read: true,
        read_at: new Date().toISOString(),
      }));
      notificationStore.resetUnreadCount();
    }
  } catch (error) {
    console.error("Error marking all as read:", error);
  } finally {
    markingAllRead.value = false;
  }
};

const handleNotificationClick = async (notification) => {
  if (!notification.is_read) {
    try {
      await notificationService.markAsRead(notification.id);
      notification.is_read = true;
      notification.read_at = new Date().toISOString();
      notificationStore.decrementUnreadCount();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  // Redirect based on action_type
  handleRedirect(notification);
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

const setupObserver = () => {
  if (observer) observer.disconnect();
  
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !loading.value && hasMore.value) {
      loadMore();
    }
  }, {
    threshold: 0.1,
    rootMargin: '100px'
  });

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }
};

onMounted(() => {
  loadNotifications();
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
.notifications-view {
  min-height: calc(100vh - 80px);
}
</style>
