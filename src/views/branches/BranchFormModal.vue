<script setup>
import { ref, computed, watch, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { toTypedSchema } from "@vee-validate/yup";

import Modal from "@/components/ui/Modal.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import Button from "@/components/ui/Button.vue";
import UploadFile from "@/components/ui/UploadFile.vue";
import Icon from "@/components/ui/Icon.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import countriesData from "@/assets/countries.json";
const { locale } = useI18n();

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  branch: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const { t } = useI18n();

const isEdit = computed(() => !!props.branch);

const schema = toTypedSchema(
  yup.object({
    name: yup
      .string()
      .required(t("branches.fields.nameEn") + " " + t("common.required"))
      .min(2, t("validation.nameRange"))
      .max(30, t("validation.nameRange"))
      .matches(
        /^[a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\u2013\u2014]+$/,
        t("validation.englishOnly"),
      ),
    name_ar: yup
      .string()
      .required(t("branches.fields.nameAr") + " " + t("common.required"))
      .min(2, t("validation.nameRange"))
      .max(30, t("validation.nameRange"))
      .matches(
        /^[\u0600-\u06FF0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\u2013\u2014]+$/,
        t("validation.arabicOnly"),
      ),
    email: yup
      .string()
      .email(t("validation.emailInvalid"))
      .optional(t("branches.fields.email") + " " + t("common.required")),
    // phone: yup
    //   .string()
    //   .optional(t("branches.fields.phone") + " " + t("common.required"))
    //   .matches(/^[0-9]+$/, t("validation.numbersOnly")),
    country_code: yup.string().optional(),
    code: yup.string().optional(),
    address: yup.string().optional(),
    manager_name: yup.string().nullable().optional(),
    logo: yup.mixed().nullable().optional(),
  }),
);

const {
  handleSubmit: validateAndSubmit,
  errors,
  resetForm,
  setValues,
} = useForm({
  validationSchema: schema,
  validateOnModelUpdate: true,
  initialValues: {
    name: "",
    name_ar: "",
    email: "",
    phone: "",
    country_code: "",
    code: "",
    address: "",
    manager_name: "",
    logo: null,
  },
});

const { value: name } = useField("name");
const { value: name_ar } = useField("name_ar");
const { value: email } = useField("email");
const { value: phone } = useField("phone");
const { value: country_code } = useField("country_code");
const { value: code } = useField("code");
const { value: address } = useField("address");
const { value: manager_name } = useField("manager_name");
const { value: logo } = useField("logo");

const isLogoDeleted = ref(false);

watch(
  () => props.branch,
  (newBranch) => {
    if (newBranch) {
      isLogoDeleted.value = false;
      setValues({
        name: newBranch.name || "",
        name_ar: newBranch.name_ar || "",
        email: newBranch.email || "",
        phone: newBranch.phone || "",
        country_code: newBranch.country_code || "+966",
        code: newBranch.code || "",
        address: newBranch.address || "",
        manager_name: newBranch.manager_name || newBranch.manager_name || "",
        logo: null,
      });
    } else {
      resetForm();
      isLogoDeleted.value = false;
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      resetForm();
      isLogoDeleted.value = false;
      if (logoPreview.value) {
        URL.revokeObjectURL(logoPreview.value);
        logoPreview.value = null;
      }
    }
  },
);

const onSubmit = validateAndSubmit((values) => {
  const payload = { ...values };
  payload.country_code = values.country_code || "+966";
  // Combine phone and country_code for API if needed
  if (values.phone && values.country_code) {
    payload.phone = values.phone;
    payload.country_code = values.country_code || "+966";
  }

  // Logo Logic:
  // 1. If a new file is uploaded, send it as "logo"
  // 2. If editing and existing logo was deleted, send "logo" as null
  // 3. If no changes to logo, do not send "logo" field at all

  if (values.logo && typeof values.logo === "object" && "name" in values.logo) {
    payload.logo = values.logo;
  } else if (isEdit.value && isLogoDeleted.value) {
    payload.logo = null;
  } else {
    // Don't send logo if it wasn't edited
    delete payload.logo;
  }

  emit("save", payload);
});

const logoPreview = ref(null);

watch(logo, (newLogo) => {
  if (newLogo && typeof newLogo === "object" && "name" in newLogo) {
    if (logoPreview.value) {
      URL.revokeObjectURL(logoPreview.value);
    }
    logoPreview.value = URL.createObjectURL(newLogo);
  } else {
    if (logoPreview.value) {
      URL.revokeObjectURL(logoPreview.value);
      logoPreview.value = null;
    }
  }
});

onUnmounted(() => {
  if (logoPreview.value) {
    URL.revokeObjectURL(logoPreview.value);
  }
});

const close = () => {
  emit("update:modelValue", false);
};

// Prepare country options for the select dropdown
const countryOptions = computed(() => {
  return countriesData
    .map((country) => ({
      label: `${country.dial_code}`,
      value: country.dial_code,
      code: country.dial_code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="
      isEdit ? t('branches.modals.editTitle') : t('branches.modals.addTitle')
    "
    width="xl"
    @update:model-value="close"
  >
    <form
      class="grid grid-cols-1 md:grid-cols-2 gap-4 py-2"
      @submit.prevent="onSubmit"
    >
      <Input
        v-model="name_ar"
        class="md:col-span-2"
        :label="t('branches.fields.nameAr')"
        :placeholder="t('branches.placeholders.nameAr')"
        :error="errors.name_ar"
        required
      />

      <Input
        v-model="name"
        class="md:col-span-2"
        :label="t('branches.fields.nameEn')"
        :placeholder="t('branches.placeholders.nameEn')"
        :error="errors.name"
        required
      />

      <Input
        v-model="manager_name"
        class="md:col-span-2"
        :label="t('branches.fields.managerName')"
        :placeholder="t('branches.placeholders.managerName')"
        :error="errors.manager_name"
      />

      <Input
        v-model="email"
        type="email"
        class="md:col-span-2"
        :label="t('branches.fields.email')"
        :placeholder="t('branches.placeholders.email')"
        :error="errors.email"
      />

      <div class="md:col-span-2 flex items-end" dir="rtl">
        <div class="flex-1">
          <Input
            :label="locale == 'ar' ? t('branches.fields.phone') : ''"
            :class="locale == 'en' ? 'text-left' : 'text-right'"
            :phoneField="true"
            v-model="phone"
            :placeholder="t('branches.placeholders.phone')"
            type="tel"
            pattern="[0-9]*"
            inputmode="numeric"
          />
        </div>
        <div class="w-32">
          <Select
            :label="locale == 'en' ? t('branches.fields.phone') : ''"
            v-model="country_code"
            :options="countryOptions"
            class="!border-none"
            :class="locale == 'en' ? 'text-left' : 'text-right'"
            :placeholder="t('+966')"
            :phoneField="true"
          />
        </div>
      </div>

      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-[#384250] mb-1.5">{{
          t("branches.fields.logo")
        }}</label>

        <UploadFile
          v-model="logo"
          :placeholder="t('common.dragDropOrClick')"
          :placeholderHint="t('common.filesHint')"
          accept=".jpg,.jpeg,.png"
          :error="errors.logo"
          :show-file-list="false"
        />

        <!-- Existing logo preview -->
        <div
          v-if="isEdit && props.branch?.logo && !isLogoDeleted && !logo"
          class="mb-4"
        >
          <div
            class="flex items-center gap-2 p-2 bg-[#F3F4F6] rounded-lg border border-[#D2D6DB] mt-3 hover:shadow-sm"
          >
            <a
              :href="props.branch.logo"
              target="_blank"
              class="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
            >
              <div>
                <SvgIcon name="check" classes="w-full h-full object-contain" />
              </div>
              <span class="text-sm text-[#161616] truncate font-semibold">
                {{ props.branch.logo?.split("/").pop() }}
              </span>
            </a>
            <button
              type="button"
              @click="isLogoDeleted = true"
              class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              <Icon name="xMark" size="sm" />
            </button>
          </div>
        </div>

        <!-- New logo preview (Uploaded) -->
        <div
          v-if="logo && typeof logo === 'object' && 'name' in logo"
          class="mt-4"
        >
          <div
            class="flex items-center gap-2 p-2 bg-[#F3F4F6] rounded-lg border border-[#D2D6DB] mt-3 hover:shadow-sm"
          >
            <a
              :href="logoPreview"
              target="_blank"
              class="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
            >
              <div>
                <SvgIcon name="check" classes="w-full h-full object-contain" />
              </div>
              <span class="flex-1 text-sm text-[#384250] truncate">{{
                logo.name
              }}</span>
            </a>
            <button
              type="button"
              @click="logo = null"
              class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              <Icon name="xMark" size="sm" />
            </button>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex gap-2 md:w-[30%] w-[50%] mt-4">
        <Button variant="secondary" class="flex-1" @click="close">
          {{ t("common.cancel") }}
        </Button>
        <Button
          variant="primary"
          class="flex-1"
          :loading="loading"
          @click="onSubmit"
        >
          {{ isEdit ? t("common.save") : t("common.save") }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.dir-ltr {
  direction: ltr;
  display: inline-block;
}
</style>
