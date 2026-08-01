<template>
  <section class="space-y-6">
    <Breadcrumb :items="breadcrumbItems" />

    <header>
      <h1 class="text-[20px] font-[600] text-[#000000] mx-2">
        {{ t("settings.generalTitle") }}
      </h1>
    </header>

    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E5F4A]"
      />
    </div>

    <template v-else>
      <!-- Tabs -->
      <div class="xl:w-[40%] md:w-[55%] w-full">
        <nav class="flex" aria-label="Tabs">
          <button
            type="button"
            class="py-2 px-6 border-b-3 text-[14px] transition-colors cursor-pointer"
            :class="
              activeTab === 'systemInfo'
                ? 'border-[#1B8354] text-[#161616] font-[700]'
                : 'border-b-3 border-[#D2D6DB]  text-[#384250] hover:text-[#0E5F4A]'
            "
            @click="activeTab = 'systemInfo'"
          >
            {{ t("settings.tabs.systemInfo") }}
          </button>
          <button
            type="button"
            class="py-2 px-6 border-b-3 text-[14px] transition-colors cursor-pointer"
            :class="
              activeTab === 'languageTimezone'
                ? 'border-[#1B8354] text-[#161616] font-[700]'
                : 'border-b-3 border-[#D2D6DB]  text-[#384250] hover:text-[#384250]'
            "
            @click="activeTab = 'languageTimezone'"
          >
            {{ t("settings.tabs.languageTimezone") }}
          </button>
        </nav>
      </div>

      <!-- Tab: System Information -->
      <Card v-show="activeTab === 'systemInfo'">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            v-model="system_name_ar"
            :label="t('settings.fields.systemNameAr')"
            :placeholder="t('settings.placeholders.systemNameAr')"
            :error="formErrors.system_name_ar"
            required
            size="md"
          />
          <Input
            v-model="system_name_en"
            :label="t('settings.fields.systemNameEn')"
            :placeholder="t('settings.placeholders.systemNameEn')"
            :error="formErrors.system_name_en"
            required
            size="md"
          />
          <Input
            v-model="email"
            :label="t('settings.fields.email')"
            :placeholder="t('settings.placeholders.email')"
            type="email"
            size="md"
            :error="formErrors.email"
          />
          <div class="flex items-end" :dir="locale == 'ar' ? 'rtl' : 'ltr'">
            <div class="w-full">
              <Input
                :label="locale == 'ar' ? t('settings.fields.phone') : ''"
                :class="locale == 'en' ? 'text-left' : 'text-right'"
                :phoneField="true"
                v-model="phone"
                :placeholder="t('settings.placeholders.phone')"
                type="tel"
                pattern="[0-9]*"
                inputmode="numeric"
                :error="formErrors.phone"
              />
            </div>

            <div>
              <Select
                :label="locale == 'en' ? t('settings.fields.phone') : ''"
                v-model="country_code"
                :options="countryOptions"
                class="!border-none"
                :class="locale == 'en' ? 'text-left' : 'text-right'"
                :placeholder="'+966'"
                :phoneField="true"
              />
            </div>
          </div>

          <Input
            v-model="website"
            :label="t('settings.fields.website')"
            :placeholder="t('settings.placeholders.website')"
            type="url"
            size="md"
            :error="formErrors.website"
          />
          <Input
            v-model="form.location"
            :label="t('settings.fields.location')"
            :placeholder="t('settings.placeholders.location')"
            size="md"
          />
        </div>

        <div class="md:w-[40%] mt-6">
          <label class="block text-sm font-medium text-[#161616] mb-1.5">
            {{ t("settings.fields.logo") }}
          </label>

          <UploadFile
            v-model="form.logo"
            :placeholder="t('common.dragDropOrClickLogo')"
            :placeholderHint="t('common.filesHint')"
            accept=".jpg,.jpeg,.png"
            :show-file-list="false"
          />

          <!-- Existing logo preview -->
          <div
            v-if="settings?.logo && !isLogoDeleted && !form.logo"
            class="mb-4"
          >
            <div
              class="flex items-center gap-2 p-2 bg-[#F3F4F6] rounded-lg border border-[#D2D6DB] mt-3"
            >
              <a
                :href="logoPreviewUrl"
                target="_blank"
                class="flex items-center gap-3 flex-1 min-w-0"
              >
                <img
                  :src="logoPreviewUrl"
                  alt="logo"
                  class="w-10 h-10 object-cover rounded"
                />
                <span class="text-sm text-[#161616] truncate font-semibold">
                  {{ settings.logo?.split("/").pop() }}
                </span>
              </a>

              <button
                type="button"
                @click="removeLogo"
                class="cursor-pointer p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- New uploaded logo preview -->
          <div v-if="form.logo && typeof form.logo === 'object'" class="mt-4">
            <div
              class="flex items-center gap-2 p-2 bg-[#F3F4F6] rounded-lg border border-[#D2D6DB] mt-3"
            >
              <a
                :href="logoBlobUrl"
                target="_blank"
                class="flex items-center gap-3 flex-1 min-w-0"
              >
                <img
                  :src="logoBlobUrl"
                  alt="logo"
                  class="w-10 h-10 object-cover rounded"
                />
                <span class="flex-1 text-sm text-[#384250] truncate">
                  {{ form.logo.name }}
                </span>
              </a>

              <button
                type="button"
                @click="form.logo = null"
                class="cursor-pointer p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </Card>
      <div class="mt-6 flex justify-end" v-if="activeTab === 'systemInfo'">
        <Button
          variant="primary"
          size="md"
          :loading="saving"
          @click="saveSystemInfo"
        >
          {{ t("common.save") }}
        </Button>
      </div>

      <!-- Tab: Language & Time Zone -->
      <Card v-show="activeTab === 'languageTimezone'">
        <template #header>
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("settings.tabs.languageTimezone") }}
          </h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            v-model="form.default_language"
            :options="languageOptions"
            :label="t('settings.fields.defaultLanguage')"
            :placeholder="t('settings.placeholders.defaultLanguage')"
            :error="errors.default_language"
            required
            size="md"
          />
          <Select
            v-model="form.timezone"
            :options="timezoneOptions"
            :label="t('settings.fields.timezone')"
            :placeholder="t('settings.placeholders.timezone')"
            :error="errors.timezone"
            required
            size="md"
            searchable
          />
        </div>
      </Card>
      <div
        class="mt-6 flex justify-end"
        v-if="activeTab === 'languageTimezone'"
      >
        <Button
          variant="primary"
          size="md"
          :loading="saving"
          @click="saveLanguageTimezone"
        >
          {{ t("common.save") }}
        </Button>
      </div>
    </template>
  </section>
</template>
<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { toTypedSchema } from "@vee-validate/yup";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import UploadFile from "@/components/ui/UploadFile.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";

import { generalSettingsService } from "@/services/generalSettings";
import { useSettingsStore } from "@/stores/settings";
import countriesData from "@/assets/countries.json";

const { t, locale } = useI18n();
const route = useRoute();
const toast = useAppToast();
const settingsStore = useSettingsStore();

const activeTab = ref("systemInfo");
const loading = ref(true);
const saving = ref(false);
const removingLogo = ref(false);
const logoBlobUrl = ref(null);
const isLogoDeleted = ref(false);

const settings = ref(null);
const availableLanguages = ref([]);
const availableTimezones = ref([]);

const schema = computed(() =>
  toTypedSchema(
    yup.object({
      system_name_ar: yup
        .string()
        .required(t("settings.validation.systemNameArRequired"))
        .min(2, t("validation.nameRange"))
        .max(100, t("validation.nameRange"))
        .matches(
          /^[\u0600-\u06FF0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/,
          t("validation.arabicOnly"),
        ),
      system_name_en: yup
        .string()
        .required(t("settings.validation.systemNameEnRequired"))
        .min(2, t("validation.nameRange"))
        .max(100, t("validation.nameRange"))
        .matches(
          /^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/,
          t("validation.englishOnly"),
        ),
      phone: yup
        .string()
        .nullable()
        .transform((v) => (v === "" || v == null ? null : v))
        .test("phone-format", t("validation.phoneInvalid"), (value) => {
          if (!value || !String(value).trim()) return true;
          const digits = String(value).replace(/\D/g, "");
          return digits.length >= 8 && digits.length <= 15;
        }),
      email: yup
        .string()
        .nullable()
        .transform((v) => (v === "" || v == null ? null : v))
        .email(t("validation.emailInvalid")),
      website: yup
        .string()
        .nullable()
        .transform((v) => (v === "" || v == null ? null : v))
        .test("website-format", t("validation.websiteInvalid"), (value) => {
          if (!value || !String(value).trim()) return true;
          const v = String(value).trim();
          if (v.includes(" ")) return false;
          // Allow: https://..., http://..., www...., or domain.com (e.g. facebook.com)
          const withProtocol = /^https?:\/\/.+\..+/.test(v);
          const withWww = /^(www\.).+\..+/.test(v);
          const domainOnly = /^[\w][\w.-]*\.[\w]{2,}(\/.*)?$/.test(v);
          return withProtocol || withWww || domainOnly;
        }),
    }),
  ),
);

const {
  setValues,
  errors: formErrors,
  handleSubmit: validateAndSubmit,
} = useForm({
  validationSchema: schema,
  initialValues: {
    system_name_ar: "",
    system_name_en: "",
    phone: "",
    country_code: "+966",
    email: "",
    website: "",
  },
  validateOnMount: false,
  validateOnModelUpdate: true,
});

const { value: system_name_ar } = useField("system_name_ar");
const { value: system_name_en } = useField("system_name_en");
const { value: phone } = useField("phone");
const { value: email } = useField("email");
const { value: website } = useField("website");
const { value: country_code } = useField("country_code");

const form = ref({
  location: "",
  default_language: "ar",
  timezone: "Asia/Riyadh",
  logo: null,
});

const errors = ref({
  default_language: "",
  timezone: "",
});

watch(
  () => form.value.default_language,
  (val) => {
    errors.value.default_language = val
      ? ""
      : t("settings.validation.defaultLanguageRequired");
  },
);

watch(
  () => form.value.timezone,
  (val) => {
    errors.value.timezone = val
      ? ""
      : t("settings.validation.timezoneRequired");
  },
);

const breadcrumbItems = computed(() => [
  {
    label: t("sidebar.settings"),
  },
  { label: t("settings.generalTitle") },
]);

const countryOptions = computed(() => {
  return countriesData
    .map((country) => ({
      label: `${country.dial_code}`,
      value: country.dial_code,
      code: country.dial_code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const languageOptions = computed(() => {
  const list = availableLanguages.value || [];
  const isAr = locale.value === "ar";
  return list.map((l) => ({
    label: isAr ? l.name || l.name_en : l.name_en || l.name,
    value: l.code,
  }));
});

const timezoneOptions = computed(() => {
  const list = availableTimezones.value || [];
  return list.map((tz) => ({ label: tz, value: tz }));
});

const logoPreviewUrl = computed(() => {
  if (!settings.value?.logo) return null;

  const base =
    import.meta.env.VITE_API_BASE_URL || "https://back-end.att-batin.roqay.dev";

  return settings.value.logo.startsWith("http")
    ? settings.value.logo
    : `${base}${settings.value.logo}`;
});

watch(
  () => form.value.logo,
  (file) => {
    if (logoBlobUrl.value) {
      URL.revokeObjectURL(logoBlobUrl.value);
      logoBlobUrl.value = null;
    }

    if (isFile(file)) {
      logoBlobUrl.value = URL.createObjectURL(file);
      isLogoDeleted.value = false;
    }
  },
);

function buildFormData() {
  const fd = new FormData();

  fd.append("system_name_ar", system_name_ar.value || "");
  fd.append("system_name_en", system_name_en.value || "");
  fd.append("email", email.value || "");
  fd.append("website", website.value || "");
  fd.append("location", form.value.location || "");

  // Combine phone + country_code like modal
  if (phone.value) {
    fd.append("phone", phone.value);
    fd.append("country_code", country_code.value || "+966");
  } else {
    fd.append("phone", "");
    fd.append("country_code", "");
  }

  if (form.value.default_language) {
    fd.append("default_language", form.value.default_language);
  }

  if (form.value.timezone) {
    fd.append("timezone", form.value.timezone);
  }

  if (isLogoDeleted.value) {
    fd.append("delete_logo", "1");
  }

  if (isFile(form.value.logo)) {
    fd.append("logo", form.value.logo);
  }

  return fd;
}

function validateLanguageTimezone() {
  errors.value.default_language = "";
  errors.value.timezone = "";
  let valid = true;
  if (!form.value.default_language) {
    errors.value.default_language = t(
      "settings.validation.defaultLanguageRequired",
    );
    valid = false;
  }
  if (!form.value.timezone) {
    errors.value.timezone = t("settings.validation.timezoneRequired");
    valid = false;
  }
  return valid;
}

function isFile(value) {
  return value && typeof File !== "undefined" && value instanceof File;
}

async function load() {
  loading.value = true;
  try {
    const res = await generalSettingsService.get();
    const data = res.data || res;
    const s = data.settings || {};
    settings.value = s;
    availableLanguages.value = data.available_languages || [];
    availableTimezones.value = data.available_timezones || [];

    form.value.location = s.location || "";
    form.value.default_language = s.default_language || "ar";
    form.value.timezone = s.timezone || "Asia/Riyadh";
    form.value.logo = null;
    isLogoDeleted.value = false;

    setValues({
      system_name_ar: s.system_name_ar || "",
      system_name_en: s.system_name_en || "",
      email: s.email || "",
      website: s.website || "",
    });

    if (s.phone) {
      setValues({
        phone: s.phone || "",
        country_code: s.country_code,
      });
    } else {
      setValues({
        phone: "",
        country_code: s.country_code,
      });
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
}

function syncSettingsStore() {
  settingsStore.settings = settings.value ? { ...settings.value } : {};
}

async function saveSystemInfo() {
  const submit = async () => {
    saving.value = true;
    try {
      await generalSettingsService.update(buildFormData());
      toast.success(t("settings.messages.saved"));
      await load();
      syncSettingsStore();
    } catch (e) {
      console.error(e);
      toast.error(e);
    } finally {
      saving.value = false;
    }
  };
  validateAndSubmit(submit)();
}

async function saveLanguageTimezone() {
  if (!validateLanguageTimezone()) return;
  saving.value = true;
  try {
    await generalSettingsService.update(buildFormData());
    toast.success(t("settings.messages.saved"));
    await load();
    syncSettingsStore();
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    saving.value = false;
  }
}
function handleRemoveExistingLogo() {
  isLogoDeleted.value = true;
  settings.value.logo = null;
}
async function removeLogo() {
  removingLogo.value = true;
  try {
    await generalSettingsService.deleteLogo();
    toast.success(t("settings.messages.logoRemoved"));
    form.value.logo = null;
    isLogoDeleted.value = false;
    await load();
    syncSettingsStore();
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    removingLogo.value = false;
  }
}

const LOGO_MAX_SIZE = 2 * 1024 * 1024; // 2 MB

watch(
  () => form.value.logo,
  (file) => {
    if (logoBlobUrl.value) {
      URL.revokeObjectURL(logoBlobUrl.value);
      logoBlobUrl.value = null;
    }
    if (isFile(file) && file.type.startsWith("image/")) {
      logoBlobUrl.value = URL.createObjectURL(file);
    }
  },
);

onBeforeUnmount(() => {
  if (logoBlobUrl.value) URL.revokeObjectURL(logoBlobUrl.value);
});

onMounted(load);
</script>
