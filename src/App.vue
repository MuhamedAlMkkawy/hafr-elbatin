<template>
  <div>
    <RouterView />
    <Notification
      v-if="showNotification"
      :dir="lang === 'ar' ? 'rtl' : 'ltr'"
      :title="notificationPayload?.notification?.title"
      :body="notificationPayload?.notification?.body"
      :url="notificationPayload?.action_url"
      @close="showNotification == false"
    />

    <audio ref="notificationAudio" preload="auto" controls class="hidden">
      <source src="@/assets/media/notification.mp3" type="audio/ogg" />
      <source src="@/assets/media/notification.mp3" type="audio/mpeg" />
    </audio>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed } from "vue";
import { useNotificationStore } from "@/stores/notifications";
import { useAuthStore } from "@/stores/auth";
import Notification from "./components/ui/Notification.vue";
import { getMessaging, onMessage } from "firebase/messaging";
import { useAppToast } from "./composables/useAppToast";
import { useI18n } from "vue-i18n";

const toast = useAppToast();
const { t, locale } = useI18n();
const lang = computed(() => locale.value);

// ===== Notification State =====
const showNotification = ref(false);
const notificationAudio = ref(null);
const notificationPayload = ref("");

// ===== Play Sound =====
const playNotificationAudio = () => {
  if (notificationAudio?.value) {
    notificationAudio.value.play();
  }
};

// ===== Firebase Listener =====
const initFirebaseMessaging = () => {
  const authStore = useAuthStore();
  if (!authStore.isAuthenticated) return;

  const messaging = getMessaging();

  onMessage(messaging, (payload) => {
    console.log("Message received:", payload);

    notificationPayload.value = payload;
    showNotification.value = true;

    setTimeout(() => {
      showNotification.value = false;
    }, 4000);

    playNotificationAudio();
  });
};

// ===== Visibility Recovery (your original logic improved) =====
let lastActive = Date.now();
const INACTIVITY_THRESHOLD = 15 * 60 * 1000; // 15 min

const handleVisibilityChange = () => {
  if (document.visibilityState === "visible") {
    const authStore = useAuthStore();

    if (authStore.isAuthenticated) {
      const notificationStore = useNotificationStore();
      notificationStore.fetchUnreadCount();
    }

    const now = Date.now();
    const timeHidden = now - lastActive;

    if (timeHidden > INACTIVITY_THRESHOLD) {
      console.warn("[Recovery] Long inactivity → refreshing");
      window.location.reload();
    }
  } else {
    lastActive = Date.now();
  }
};

// =====   Freeze Recovery: refresh ONLY on FIRST interaction after freeze =====
let isIdle = false;
let hasRecovered = false;
let idleTimer = null;

const IDLE_TIME = 60 * 1000; // 1 minute

const markRefreshTime = () =>
  sessionStorage.setItem("last_refresh_time", Date.now().toString());

const canRefresh = () => {
  const last = Number(sessionStorage.getItem("last_refresh_time") || 0);
  const now = Date.now();
  return now - last > 5000; // 5s cooldown
};

// Step 1: detect idle state
const startIdleTimer = () => {
  clearTimeout(idleTimer);

  idleTimer = setTimeout(() => {
    isIdle = true;
    hasRecovered = false; // allow ONE recovery only per freeze
    console.log("[Idle] App considered frozen/idle");
  }, IDLE_TIME);
};

// Step 2: FIRST user interaction after idle → refresh once
const handleUserActivity = () => {
  if (!isIdle) {
    startIdleTimer();
    return;
  }

  // only FIRST interaction after freeze
  if (isIdle && !hasRecovered && canRefresh()) {
    hasRecovered = true;
    isIdle = false;

    markRefreshTime();

    console.warn("[Recovery] First interaction after freeze → refreshing once");
    window.location.reload();
    return;
  }

  // reset timer after recovery
  startIdleTimer();
};
// ===== Lifecycle =====
onMounted(() => {
  window.addEventListener("visibilitychange", handleVisibilityChange);

  initFirebaseMessaging();

  const events = ["mousemove", "mousedown", "keydown", "touchstart"];

  events.forEach((event) => {
    window.addEventListener(event, handleUserActivity);
  });

  startIdleTimer();
});

onUnmounted(() => {
  window.removeEventListener("visibilitychange", handleVisibilityChange);

  const events = ["mousemove", "mousedown", "keydown", "touchstart"];

  events.forEach((event) => {
    window.removeEventListener(event, handleUserActivity);
  });

  clearTimeout(idleTimer);
});
</script>
