import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";
import profileService from "./profile";
import { useNotificationStore } from "@/stores/notifications";
import router from "@/router";

// Replace with your Firebase Web config
const firebaseConfig = {
  apiKey: "AIzaSyB5LBp8r-UmFg4CBjtJQPjrJTqdWX77wzs",
  authDomain: "hafr-albatin.firebaseapp.com",
  projectId: "hafr-albatin",
  storageBucket: "hafr-albatin.firebasestorage.app",
  messagingSenderId: "1066498448151",
  appId: "1:1066498448151:web:668f911a5fc24d74e07552",
  measurementId: "G-TN52ZEV3ZQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);
const messaging = getMessaging(app);

let isForegroundListenerRegistered = false;

// Request permission and save FCM token
export const requestPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const vapidKey =
      "BAYQvJ9odkXwkUTAZsquZaN6WhwrFQJJDycHFJ0UsqYJoQXdUEcxH0X5qbH4wYLMntMg6qI5t00CTtJv37ZiiKE";
    const token = await getToken(messaging, { vapidKey });

    if (token) {
      // console.log("FCM Token:", token);
      await profileService.updateDeviceToken({
        device_token: token,
        device_type: "web",
      });
    }
  } catch (err) {
    console.error("FCM permission error:", err);
  }
};

// Foreground message handler
export const onForegroundMessage = () => {
  if (isForegroundListenerRegistered) return;

  onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    const store = useNotificationStore();

    store.incrementUnreadCount();
    store.triggerListRefresh();

    // Show native notification if permission granted
    if (Notification.permission === "granted" && payload.notification) {
      const { title, body } = payload.notification;
      const nativeNotification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: payload.messageId,
      });

      nativeNotification.onclick = (event) => {
        event.preventDefault();
        window.focus();

        const actionType = payload.action_type || payload.data?.action_type;
        const actionId = payload.action_id || payload.data?.id;
        const actionUrl = payload.action_url || payload.data?.action_url;

        const isEn = window.location.pathname.startsWith("/en");
        let routeName = "";
        let params = {};

        switch (actionType) {
          case "evaluation_form":
            routeName = isEn ? "evaluation-en" : "evaluation";
            break;
          case "external_mission":
            routeName = isEn ? "requests-en-delegation" : "requests-delegation";
            break;
          case "leave_request":
            routeName = isEn ? "requests-en-leave" : "requests-leave";
            break;
          case "missing_punch":
            routeName = isEn
              ? "requests-en-missing-punch"
              : "requests-missing-punch";
            break;
          case "overtime_request":
            routeName = isEn ? "requests-en-overtime" : "requests-overtime";
            break;
          case "permission_request":
            routeName = isEn ? "requests-en-permission" : "requests-permission";
            break;
          case "performance_charter":
            routeName = isEn ? "charter_en" : "charter";
            break;
          case "internal_memo":
            routeName = isEn ? "memos-en" : "memos";
            if (actionId) params = { id: actionId };
            break;
          case "profile":
            routeName = isEn ? "profile-en" : "profile";
            break;
          case "shift_schedule":
            routeName = isEn ? "shifts-en" : "shifts";
            break;
          case "work_system":
            routeName = isEn ? "work-systems-en" : "work-systems";
            break;
        }

        if (routeName) {
          router.push({ name: routeName, params });
        } else if (
          actionUrl &&
          actionUrl.startsWith("/") &&
          !actionUrl.startsWith("//")
        ) {
          router.push(isEn ? `/en${actionUrl}` : actionUrl);
        } else {
          router.push(isEn ? "/en/notifications-list" : "/notifications-list");
        }

        nativeNotification.close();
      };
    }
  });

  isForegroundListenerRegistered = true;
};

// Background message listener (from Service Worker)
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "FCM_BACKGROUND_MESSAGE") {
      console.log("Background message received:", event.data.payload);
      const store = useNotificationStore();
      store.fetchUnreadCount();
      store.triggerListRefresh();
    }
  });
}

export default messaging;
