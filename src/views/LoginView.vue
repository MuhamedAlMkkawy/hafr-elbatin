<template>
  <div
    class="flex min-h-screen bg-white"
    :dir="locale === 'ar' ? 'rtl' : 'ltr'"
  >
    <!-- First Side: Logo -->
    <div
      class="hidden lg:flex lg:w-1/2 bg-[#0E5F4A] relative overflow-hidden justify-center text-center p-12"
      :style="{
        backgroundImage: `url(${leftMask})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }"
    >
      <!-- Content -->
      <div class="relative z-10 flex flex-col items-center max-w-sm">
        <div class="mb-10 group">
          <img
            :src="authLogoUrl"
            alt="Logo"
            class="max-w-[271px] max-h-[215px]"
          />
        </div>
      </div>

      <!-- Powered by logo in corner -->
      <!-- <div
        class="absolute bottom-10 start-10 text-white/40 flex flex-col items-end gap-0.5"
      >
        <span class="text-[8px] uppercase tracking-[0.3em] font-medium"
          >powered by</span
        >
        <div>
          <img
            src="@/assets/images/auth_mazaya_logo.png"
            alt="Mazaya Logo"
            width="141"
            height="26"
          />
        </div>
      </div> -->
    </div>
    <!-- Second Side: Login Form -->
    <div
      class="w-full lg:w-1/2 flex flex-col p-8 lg:p-16 relative"
      :style="{
        backgroundImage: `url(${rightMask})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }"
    >
      <!-- Language Switcher -->
      <div
        class="absolute top-8 end-8 z-20 flex gap-[8px] items-center"
        @click.stop
      >
        <div
          class="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-[#0E5F4A] transition-colors"
          @click="isLangDropdownOpen = !isLangDropdownOpen"
        >
          <Icon name="globeAlt" size="md" />
          <span class="text-sm font-medium">{{ currentLocaleLabel }}</span>
          <Icon name="chevronDown" size="sm" />
        </div>
        <div
          v-if="isLangDropdownOpen"
          class="mt-2 rounded-md shadow-lg bg-white ring-1 ring-black/5 py-1 text-sm"
        >
          <button
            v-for="lang in languages"
            :key="lang.code"
            type="button"
            class="w-full text-start px-3 py-1.5 hover:bg-gray-100 cursor-pointer"
            @click="selectLanguage(lang.code)"
          >
            {{ lang.label }}
          </button>
        </div>
      </div>

      <div class="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div class="mb-10 text-center lg:text-start">
          <h1 class="text-3xl font-bold text-[#384250] mb-3">
            {{ t("auth.title") }}
          </h1>
          <p class="text-gray-400 text-sm leading-relaxed">
            {{ t("auth.welcomeText") }}
          </p>
        </div>

        <form @submit.prevent="onSubmit" class="space-y-6">
          <!-- Email Field -->
          <Input
            v-model="email"
            type="email"
            :label="t('auth.email')"
            :placeholder="t('auth.emailPlaceholder')"
            :error="emailError"
            size="md"
          />

          <!-- Password Field -->
          <Input
            v-model="password"
            type="password"
            :label="t('auth.password')"
            placeholder="••••••••"
            :error="passwordError"
            size="md"
          />

          <!-- Submit Button -->
          <Button
            type="submit"
            variant="primary"
            size="md"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            full-width
            class="mt-4"
          >
            {{ isSubmitting ? t("auth.signingIn") : t("auth.signIn") }}
          </Button>
        </form>
        <!-- CONTACT LINK -->
        <div class="flex items-center gap-2 mt-[13px] mx-auto">
          <span class="text-[#161616]">{{ t("auth.needHelp") }}</span>
          <router-link to="/add-message" class="flex items-center gap-2">
            <!-- <SvgIcon name="contact_headphone" size="md" /> -->
            <span
              class="text-[14px] font-[400] text-[#0E5F4A] underline hover:text-[#0E5F4A]/70"
              >{{ t("sidebar.supportContact") }}</span
            >
          </router-link>
        </div>
      </div>
    </div>

    <!-- 2FA Modal -->
    <Modal
      v-model="show2faModal"
      :title="t('auth.twoFactor.otpTitle')"
      width="2xl"
      @close="show2faModal = false"
    >
      <p class="text-[#6C737F] text-start">
        {{ t("auth.twoFactor.otpInstruction") }}
      </p>

      <div class="p-4 flex flex-col items-center mt-4">
        <div
          class="flex gap-2 md:gap-7 mb-8"
          dir="ltr"
          @paste.prevent="handleOtpPaste"
        >
          <input
            v-for="(digit, index) in otpDigits"
            :key="index"
            ref="otpInputs"
            v-model="otpDigits[index]"
            type="number"
            maxlength="1"
            class="w-[50px] h-[60px] md:w-[68px] md:h-[80px] text-center text-[24px] font-[500] rounded-sm outline-none transition-all bg-[#F3F4F6] focus:bg-[#E7EFED] focus:border-[0.5px] focus:border-[#CFDFDB] focus:text-[#0E5F4A] focus:ring-0 focus:outline-none"
            @input="handleOtpInput(index, $event)"
            @keydown="handleOtpKeyDown(index, $event)"
          />
        </div>

        <Button
          variant="primary"
          full-width
          :loading="isVerifying"
          :disabled="otpDigits.join('').length < 6 || isVerifying"
          @click="isSettingUp ? onConfirmSetup() : onVerify2fa()"
        >
          {{ t("auth.twoFactor.otpConfirm") }}
        </Button>

        <!-- <div class="mt-6">
          <div
            v-if="resendTimer === 0"
            class="flex items-center gap-1.5 justify-center"
          >
            <span class="text-[#000000] text-[14px] font-[500]">{{
              t("auth.twoFactor.otpResendText")
            }}</span>
            <button
              type="button"
              class="text-[#0E5F4A] text-[14px] font-[500] hover:underline cursor-pointer"
              @click="regenerateCode"
            >
              {{ t("auth.twoFactor.otpResendAction") }}
            </button>
          </div>
          <span v-else class="text-gray-400 text-sm">
            {{ t("auth.twoFactor.otpResendTimer", { seconds: resendTimer }) }}
          </span>
        </div> -->
      </div>
      <template #footer><span></span></template>
    </Modal>

    <!-- QR Code Modal (Setup) -->
    <Modal
      v-model="showQrModal"
      :title="t('auth.twoFactor.qrcodeTitle')"
      width="xl"
      @close="showQrModal = false"
    >
      <p class="text-[#6C737F] mb-6">
        {{ t("auth.twoFactor.qrcodeInstruction") }}
      </p>
      <div class="p-4 flex flex-col items-center text-center">
        <div class="bg-white p-4 rounded-xl mb-6">
          <img
            :src="`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl || '')}`"
            alt="QR Code"
            v-if="qrCodeUrl"
          />
          <!-- Or use a QR component if available. I'll use a placeholder/proxy for now if the qrCodeUrl is not directly an image -->
        </div>
        <!-- Separator -->
        <div class="relative w-full flex items-center justify-center my-4">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative px-3 bg-white text-gray-400 text-sm">
            {{ t("common.or") }}
          </div>
        </div>

        <div
          class="flex items-center gap-2 mb-8 text-[#0E5F4A] text-sm cursor-pointer"
          @click="
            showAuthModal = true;
            showQrModal = false;
          "
        >
          <Icon name="link" size="sm" />
          <span class="underline font-medium">
            {{ t("auth.twoFactor.qrcodeLink") }}
          </span>
        </div>

        <Button
          variant="primary"
          full-width
          @click="
            showQrModal = false;
            show2faModal = true;
          "
        >
          {{ t("auth.twoFactor.qrcodeButton") }}
        </Button>
      </div>
      <template #footer><span></span></template>
    </Modal>

    <!-- Account Data Modal (Manual Setup) -->
    <Modal
      v-model="showAuthModal"
      :title="t('auth.twoFactor.accountDataTitle')"
      width="xl"
      @close="showAuthModal = false"
    >
      <template #title>
        <div class="flex items-center justify-between w-full" dir="rtl">
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors"
            @click="showAuthModal = false"
          >
            <Icon name="x" size="sm" />
          </button>
          <div class="flex items-center gap-2">
            <span class="font-semibold text-gray-800 text-base">
              {{ t("auth.twoFactor.accountDataTitle") }}
            </span>
            <Icon name="search" size="sm" class="text-gray-500" />
          </div>
          <!-- spacer to center title -->
          <div class="w-5" />
        </div>
      </template>

      <div class="px-2 pb-2">
        <!-- Account Name Row -->
        <div
          class="flex items-center justify-between py-4 border-b border-gray-100"
        >
          <div class="flex flex-col items-start gap-1">
            <span class="text-xs text-gray-400">{{
              t("auth.twoFactor.accountName")
            }}</span>
            <span
              class="text-sm font-medium text-gray-800 tracking-wide"
              dir="ltr"
            >
              {{ email }}
            </span>
          </div>
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
            @click="handleCopy(email)"
          >
            <SvgIcon name="copy" size="sm" />
          </button>
        </div>

        <!-- Secret Key Row -->
        <div
          class="flex items-center justify-between py-4 border-b border-gray-100"
        >
          <div class="flex flex-col items-start gap-1">
            <span class="text-xs text-gray-400">{{
              t("auth.twoFactor.secretKey")
            }}</span>
            <span class="text-sm font-bold text-gray-900 tracking-widest">
              {{ setupSecret }}
            </span>
          </div>
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
            @click="handleCopy(setupSecret)"
          >
            <SvgIcon name="copy" size="sm" />
          </button>
        </div>

        <!-- Options List -->
        <ul class="mt-4 mb-6 space-y-2 text-sm text-gray-500 list-none">
          <li class="flex items-start gap-2 justify-start">
            <span class="mt-0.5 text-gray-400">•</span>
            <span>{{ t("auth.twoFactor.openMicrosoftAuthenticator") }}</span>
          </li>
          <li class="flex items-start gap-2 justify-start">
            <span class="mt-0.5 text-gray-400">•</span>
            <span>{{ t("auth.twoFactor.enterKeyManually") }}</span>
          </li>
          <li class="flex items-start gap-2 justify-start">
            <span class="mt-0.5 text-gray-400">•</span>
            <span>{{ t("auth.twoFactor.enterKeyAutomatic") }}</span>
          </li>
        </ul>

        <!-- CTA Button -->
        <Button
          variant="primary"
          full-width
          class="bg-[#0E5F4A] hover:bg-[#0a4d3b] text-white rounded-xl py-3 text-sm font-semibold transition-colors"
          @click="
            showAuthModal = false;
            show2faModal = true;
          "
        >
          {{ t("auth.twoFactor.enterVerificationCode") }}
        </Button>
      </div>

      <template #footer><span></span></template>
    </Modal>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { toTypedSchema } from "@vee-validate/yup";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { useAppToast } from "@/composables/useAppToast";
import Icon from "@/components/ui/Icon.vue";
import Input from "@/components/ui/Input.vue";
import Button from "@/components/ui/Button.vue";
import Modal from "@/components/ui/Modal.vue";
import rightMask from "@/assets/images/auth_white_mask.png";
import leftMask from "@/assets/images/auth_mask.png";
import authLogoFallback from "@/assets/images/auth_logo.png";
import SvgIcon from "../components/ui/SvgIcon.vue";

const { locale, t } = useI18n();
const auth = useAuthStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const route = useRoute();
const toast = useAppToast();

const show2faModal = ref(false);
const showQrModal = ref(false);
const twoFactorToken = ref(null);
const qrCodeUrl = ref(null);
const setupSecret = ref(null);
const otpDigits = ref(["", "", "", "", "", ""]);
const otpInputs = ref([]);
const resendTimer = ref(0);
const failedAttempts = ref(0);
const isVerifying = ref(false);
const isSettingUp = ref(false);

const showAuthModal = ref(false);

let timerInterval = null;

// Validation Schema
const schema = yup.object({
  email: yup
    .string()
    .email(t("validation.emailInvalid"))
    .required(t("validation.emailRequired")),
  password: yup
    .string()
    .min(6, t("validation.passwordMin"))
    .required(t("validation.passwordRequired")),
});

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    email: "",
    password: "",
  },
});

const { value: email, errorMessage: emailError } = useField("email");
const { value: password, errorMessage: passwordError } = useField("password");

const getDeviceName = () => {
  const userAgent = navigator.userAgent;
  let deviceName = "Web Browser";

  if (userAgent.match(/Windows/i)) deviceName = "Windows PC";
  else if (userAgent.match(/Macintosh/i)) deviceName = "MacBook";
  else if (userAgent.match(/Android/i)) deviceName = "Android Device";
  else if (userAgent.match(/iPhone/i)) deviceName = "iPhone (iOS)";

  return deviceName;
};

const onSubmit = handleSubmit(async (values) => {
  try {
    const response = await auth.login({
      email: values.email,
      password: values.password,
      device_name: getDeviceName(),
    });

    if (response?.requires_2fa) {
      twoFactorToken.value = response.two_factor_token;

      // Determine whether the user needs setup or just verification
      // If 2FA is not enabled or not confirmed, trigger setup flow
      if (
        response.two_factor_enabled === false ||
        !response.two_factor_confirmed_at
      ) {
        isSettingUp.value = true;
        handleSetup2fa();
      } else {
        isSettingUp.value = false;
        show2faModal.value = true;
        failedAttempts.value = 0;
        startResendTimer();
      }
      return;
    }

    const redirect =
      typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await router.replace(redirect);
    toast.success(t("auth.loginSuccess"));
  } catch (e) {
    toast.error(e);
  }
});

const handleOtpInput = (index, event) => {
  const val = event.target.value;
  if (val.length > 1) {
    otpDigits.value[index] = val.slice(-1);
  }

  if (val && index < 5) {
    otpInputs.value[index + 1]?.focus();
  }
};

const handleOtpPaste = (event) => {
  const pastedData = event.clipboardData.getData("text").trim();

  // keep only numbers
  const digits = pastedData.replace(/\D/g, "").slice(0, 6);

  if (!digits) return;

  otpDigits.value = digits.split("");

  // auto focus last filled input
  const lastIndex = digits.length >= 6 ? 5 : digits.length;
  otpInputs.value[lastIndex]?.focus();
};

const handleOtpKeyDown = (index, event) => {
  if (event.key === "Backspace" && !otpDigits.value[index] && index > 0) {
    otpInputs.value[index - 1]?.focus();
  }
};

const startResendTimer = () => {
  resendTimer.value = 60;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (resendTimer.value > 0) {
      resendTimer.value--;
    } else {
      clearInterval(timerInterval);
    }
  }, 1000);
};

const onVerify2fa = async () => {
  const code = otpDigits.value.join("");
  if (code.length < 6) return;

  if (failedAttempts.value >= 5) {
    toast.error(t("auth.twoFactor.sessionLocked"));
    return;
  }

  isVerifying.value = true;
  try {
    await auth.verify2fa({
      code,
      two_factor_token: twoFactorToken.value,
      device_name: getDeviceName(),
    });

    show2faModal.value = false;
    const redirect =
      typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await router.replace(redirect);
    toast.success(t("auth.loginSuccess"));
  } catch (e) {
    failedAttempts.value++;

    let errorMsg = e.message || t("auth.twoFactor.invalidCode");

    // Check if there are specific validation errors
    if (e.errors && typeof e.errors === "object") {
      const firstErrorKey = Object.keys(e.errors)[0];
      const errors = e.errors[firstErrorKey];
      if (Array.isArray(errors) && errors.length > 0) {
        errorMsg = errors[0];
      }
    }

    toast.error(errorMsg);
    if (failedAttempts.value >= 5) {
      // Logic for locking session
    }
  } finally {
    isVerifying.value = false;
  }
};

const handleSetup2fa = async () => {
  try {
    const response = await auth.setup2fa();
    qrCodeUrl.value = response?.data?.qr_code_url;
    setupSecret.value = response.data.secret;
    showQrModal.value = true;
  } catch (e) {
    toast.error(e.message || "Failed to initiate 2FA setup");
  }
};

const onConfirmSetup = async () => {
  const code = otpDigits.value.join("");
  if (code.length < 6) return;

  isVerifying.value = true;
  try {
    await auth.confirm2fa({ code });
    showQrModal.value = false;
    show2faModal.value = true;
    // Let's assume confirm2fa completes the 2FA requirement.
    const redirect =
      typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await router.replace(redirect);
    toast.success(t("auth.loginSuccess"));
  } catch (e) {
    let errorMsg = e.message || t("auth.twoFactor.invalidCode");
    if (e.errors && typeof e.errors === "object") {
      const firstErrorKey = Object.keys(e.errors)[0];
      const errors = e.errors[firstErrorKey];
      if (Array.isArray(errors) && errors.length > 0) {
        errorMsg = errors[0];
      }
    }
    toast.error(errorMsg);
  } finally {
    isVerifying.value = false;
  }
};

const regenerateCode = async () => {
  if (resendTimer.value > 0) return;
  try {
    if (showQrModal.value) {
      await handleSetup2fa();
    } else {
      await auth.regenerate2faCodes(twoFactorToken.value);
      toast.success(t("auth.twoFactor.otpSent") || "Code resent successfully");
    }
    startResendTimer();
  } catch (e) {
    let errorMsg = e.message || "Failed to regenerate code";
    if (e.errors && typeof e.errors === "object") {
      const firstErrorKey = Object.keys(e.errors)[0];
      const errors = e.errors[firstErrorKey];
      if (Array.isArray(errors) && errors.length > 0) {
        errorMsg = errors[0];
      }
    }
    toast.error(errorMsg);
  }
};

const isLangDropdownOpen = ref(false);

const languages = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
];

const selectLanguage = (lang) => {
  if (locale.value === lang) {
    isLangDropdownOpen.value = false;
    return;
  }

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

  isLangDropdownOpen.value = false;
};

const currentLocaleLabel = computed(() => {
  return locale.value === "en" ? "English" : "العربية";
});

const authLogoUrl = computed(() => settingsStore.logoUrl || authLogoFallback);

const focusFirstOtpInput = async () => {
  await nextTick();
  otpInputs.value[0]?.focus();
};

// handle the copy of the values
const handleCopy = async (value) => {
  try {
    await navigator.clipboard.writeText(value || null);
    // optional: show toast
    toast.success(t("auth.twoFactor.copied"));
  } catch (err) {
    console.error("Failed to copy:", err);
    toast.error(t("auth.twoFactor.copyFailed"));
  }
};

watch(show2faModal, (isOpen) => {
  if (isOpen) {
    otpDigits.value = ["", "", "", "", "", ""]; // optional reset
    focusFirstOtpInput();
  }
});
onMounted(() => {
  settingsStore.fetchSettings();
});
</script>
