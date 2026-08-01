import { createApp, watch } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import router from '@/router'
import App from '@/App.vue'
import { messages, SUPPORT_LOCALES } from '@/i18n/messages'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { setupInterceptors } from '@/services/api'
import './assets/main.css'
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
import ToastCloseButton from "./components/ui/ToastCloseButton.vue";
import { vTooltip } from "@/directives/tooltip";
import VueApexCharts from "vue3-apexcharts";
import { onForegroundMessage, requestPermission } from "@/services/fcm";

const app = createApp(App)
export const pinia = createPinia()
setActivePinia(pinia)
app.use(pinia)
app.use(router)
app.use(VueApexCharts)
app.directive("tooltip", vTooltip)

// Initialize stores and interceptors
const authStore = useAuthStore(pinia)
const settingsStore = useSettingsStore(pinia)
setupInterceptors(authStore)

const i18n = createI18n({
  legacy: false,
  // Will be overridden by /general-settings once loaded
  locale: SUPPORT_LOCALES.ar,
  fallbackLocale: SUPPORT_LOCALES.en,
  messages
})

app.use(i18n)
app.use(Toast, {
  position: "bottom-left",
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: true,
  closeButton: ToastCloseButton,
  icon: true,
  rtl: true
});

function applyDocumentLocale(locale) {
  document.documentElement.lang = locale
  document.documentElement.dir = locale === SUPPORT_LOCALES.ar ? 'rtl' : 'ltr'
  const settings = settingsStore.settings
  const fallbackAr = 'أمانة محافظة حفر الباطن'
  const fallbackEn = 'Hafr Al Batin Municipality'

  if (locale === SUPPORT_LOCALES.ar) {
    document.title =
      settings?.system_name_ar ||
      settings?.system_name_en ||
      fallbackAr
  } else {
    document.title =
      settings?.system_name_en ||
      settings?.system_name_ar ||
      fallbackEn
  }
}

// Watch for locale changes and persist user's choice (so they are no longer "first time")
watch(() => i18n.global.locale.value, (newVal) => {
  applyDocumentLocale(newVal)
  localStorage.setItem('user-locale', newVal)
})

// React to settings changes (e.g. system_name_ar/en updated) without page refresh
watch(
  () => settingsStore.settings,
  () => {
    applyDocumentLocale(i18n.global.locale.value)
  },
  { deep: true }
)

// Before first paint: load system settings and set locale (saved preference OR system default for first-time users), then mount
async function bootstrap() {
  try {
    await settingsStore.fetchSettings()
  } catch (_) {
    // e.g. not logged in or network error; continue with fallback locale
  }

  const savedLocale = localStorage.getItem('user-locale')
  const hasUserPreferredLocale = savedLocale && Object.values(SUPPORT_LOCALES).includes(savedLocale)

  const nextLocale = hasUserPreferredLocale
    ? savedLocale
    : (Object.values(SUPPORT_LOCALES).includes(settingsStore.defaultLanguage)
        ? settingsStore.defaultLanguage
        : SUPPORT_LOCALES.ar)

  i18n.global.locale.value = nextLocale
  applyDocumentLocale(nextLocale)
  
  // Register FCM foreground message listener
  onForegroundMessage();

  // If already authenticated, request permission/update token
  if (authStore.isAuthenticated) {
    requestPermission().catch(console.error);
  }

  app.mount('#app')
}

bootstrap()
