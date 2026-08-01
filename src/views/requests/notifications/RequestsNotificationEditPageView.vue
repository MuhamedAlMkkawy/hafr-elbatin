<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-[18px] font-[600] text-[#000000]">
        {{
          t("notifications.modals.editTitle", {
            name: lang === "ar" ? originalNameAr : originalNameEn,
          })
        }}
      </h2>
    </div>

    <Card class="!pt-3 !pb-4 !px-0">
      <div v-if="fetching" class="flex justify-center py-12">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
        ></div>
      </div>

      <div v-else class="space-y-8">
        <!-- Delivery Channels -->
        <section class="space-y-4">
          <h3
            class="text-[16px] font-[600] text-[#333333] border-b border-[#F4F5F6] pb-3 px-4"
          >
            {{ t("notifications.fields.channels") }}
          </h3>
          <div class="grid grid-cols-2 gap-8 items-center mt-5 px-4">
            <div class="flex items-center gap-3">
              <Toggle v-model="has_mail" />
              <span class="text-[14px] text-[#000000] font-[500]">{{
                t("notifications.channels.mail")
              }}</span>
            </div>
            <div class="flex items-center gap-3">
              <Toggle v-model="has_push" />
              <span class="text-[14px] text-[#000000] font-[500]">{{
                t("notifications.channels.push")
              }}</span>
            </div>

            <div class="flex items-center gap-3">
              <Toggle v-model="has_sms" />
              <span class="text-[14px] text-[#000000] font-[500]">{{
                t("notifications.channels.sms")
              }}</span>
            </div>
          </div>
          <p
            v-if="channelError"
            class="text-[12px] text-[#B42318] font-[500] px-4"
          >
            {{
              t("validation.atLeastOneChannel") ||
              "At least one channel must be selected"
            }}
          </p>
        </section>
      </div>
    </Card>
    <Card v-if="has_push || has_sms" class="!pt-3 !pb-4 !px-0">
      <div>
        <!-- Notification Template (Push/SMS) -->
        <section class="space-y-4">
          <h3
            class="text-[16px] font-[600] text-[#333333] border-b border-[#F4F5F6] pb-3 px-4"
          >
            {{ t("notifications.modals.templateTitle") }}
          </h3>
          <div class="grid grid-cols-1 gap-5 px-4">
            <Input
              v-model="title_ar"
              :label="t('notifications.fields.titleAr')"
              :placeholder="t('notifications.placeholders.titleAr')"
              :error="showError('title_ar')"
              @update:modelValue="field_title_ar.setTouched(true)"
              @blur="field_title_ar.handleBlur"
              required
            />
            <Input
              v-model="title_en"
              :label="t('notifications.fields.titleEn')"
              :placeholder="t('notifications.placeholders.titleEn')"
              :error="showError('title_en')"
              @update:modelValue="field_title_en.setTouched(true)"
              @blur="field_title_en.handleBlur"
              required
            />
            <Textarea
              v-model="content_ar"
              :label="t('notifications.fields.contentAr')"
              :placeholder="t('notifications.placeholders.contentAr')"
              :error="showError('content_ar')"
              :rows="4"
              @update:modelValue="field_content_ar.setTouched(true)"
              @blur="field_content_ar.handleBlur"
              required
            />
            <Textarea
              v-model="content_en"
              :label="t('notifications.fields.contentEn')"
              :placeholder="t('notifications.placeholders.contentEn')"
              :error="showError('content_en')"
              :rows="4"
              @update:modelValue="field_content_en.setTouched(true)"
              @blur="field_content_en.handleBlur"
              required
            />
          </div>
        </section>
      </div>
    </Card>
    <Card v-if="has_mail" class="!pt-3 !pb-4 !px-0">
      <div>
        <!-- Email Template -->
        <section class="space-y-4">
          <h3
            class="text-[16px] font-[600] text-[#333333] border-b border-[#F4F5F6] pb-3 px-4"
          >
            {{ t("notifications.modals.emailTemplateTitle") }}
          </h3>
          <div class="grid grid-cols-1 gap-5 px-4">
            <Input
              v-model="email_subject_ar"
              :label="t('notifications.fields.emailSubjectAr')"
              :placeholder="t('notifications.placeholders.emailSubjectAr')"
              :error="showError('email_subject_ar')"
              @update:modelValue="field_email_subject_ar.setTouched(true)"
              @blur="field_email_subject_ar.handleBlur"
              required
            />
            <Input
              v-model="email_subject_en"
              :label="t('notifications.fields.emailSubjectEn')"
              :placeholder="t('notifications.placeholders.emailSubjectEn')"
              :error="showError('email_subject_en')"
              @update:modelValue="field_email_subject_en.setTouched(true)"
              @blur="field_email_subject_en.handleBlur"
              required
            />
            <Textarea
              v-model="email_body_ar"
              :label="t('notifications.fields.emailBodyAr')"
              :placeholder="t('notifications.placeholders.emailBodyAr')"
              :error="showError('email_body_ar')"
              :rows="4"
              @update:modelValue="field_email_body_ar.setTouched(true)"
              @blur="field_email_body_ar.handleBlur"
              required
            />
            <Textarea
              v-model="email_body_en"
              :label="t('notifications.fields.emailBodyEn')"
              :placeholder="t('notifications.placeholders.emailBodyEn')"
              :error="showError('email_body_en')"
              :rows="4"
              @update:modelValue="field_email_body_en.setTouched(true)"
              @blur="field_email_body_en.handleBlur"
              required
            />
          </div>
        </section>
      </div>
    </Card>
    <!-- Actions -->
    <div class="flex gap-3 justify-end pt-6">
      <Button
        variant="secondary"
        class="w-32 bg-[#E5E7EB] !text-[#161616] hover:bg-gray-300 border-none"
        @click="handleCancel"
      >
        {{ t("common.cancel") }}
      </Button>
      <Button
        variant="primary"
        class="w-32"
        @click="handleSave"
        :loading="saving"
        :disabled="isSaveDisabled"
      >
        {{ t("common.save") }}
      </Button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { toTypedSchema } from "@vee-validate/yup";
import { useAppToast } from "@/composables/useAppToast";
import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Textarea from "@/components/ui/Textarea.vue";
import Toggle from "@/components/ui/Toggle.vue";
import { ssNotificationSettingsService } from "@/services/ssNotificationSettings";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();
const route = useRoute();
const router = useRouter();

const eventKey = computed(() => route.params.eventKey);
const notificationId = ref(null);

const fetching = ref(false);
const saving = ref(false);
const channelError = ref(false);

const originalNameAr = ref("");
const originalNameEn = ref("");

const schema = toTypedSchema(
  yup.object({
    has_push: yup.boolean(),
    has_mail: yup.boolean(),
    has_sms: yup.boolean(),
    title_ar: yup
      .string()
      .when(["has_push", "has_sms"], ([has_push, has_sms], schema) => {
        return has_push || has_sms
          ? schema
              .required(
                t("notifications.fields.titleAr") + " " + t("common.required"),
              )
              .max(255, t("validation.nameMax255"))
          : schema.nullable().optional();
      }),
    title_en: yup
      .string()
      .when(["has_push", "has_sms"], ([has_push, has_sms], schema) => {
        return has_push || has_sms
          ? schema
              .required(
                t("notifications.fields.titleEn") + " " + t("common.required"),
              )
              .max(255, t("validation.nameMax255"))
          : schema.nullable().optional();
      }),
    content_ar: yup
      .string()
      .when(["has_push", "has_sms"], ([has_push, has_sms], schema) => {
        return has_push || has_sms
          ? schema
              .required(
                t("notifications.fields.contentAr") +
                  " " +
                  t("common.required"),
              )
          : schema.nullable().optional();
      }),
    content_en: yup
      .string()
      .when(["has_push", "has_sms"], ([has_push, has_sms], schema) => {
        return has_push || has_sms
          ? schema
              .required(
                t("notifications.fields.contentEn") +
                  " " +
                  t("common.required"),
              )
          : schema.nullable().optional();
      }),
    email_subject_ar: yup.string().when("has_mail", {
      is: true,
      then: (schema) =>
        schema
          .required(
            t("notifications.fields.emailSubjectAr") +
              " " +
              t("common.required"),
          )
          .max(255, t("validation.nameMax255")),
      otherwise: (schema) => schema.nullable().optional(),
    }),
    email_subject_en: yup.string().when("has_mail", {
      is: true,
      then: (schema) =>
        schema
          .required(
            t("notifications.fields.emailSubjectEn") +
              " " +
              t("common.required"),
          )
          .max(255, t("validation.nameMax255")),
      otherwise: (schema) => schema.nullable().optional(),
    }),
    email_body_ar: yup.string().when("has_mail", {
      is: true,
      then: (schema) =>
        schema
          .required(
            t("notifications.fields.emailBodyAr") + " " + t("common.required"),
          ),
      otherwise: (schema) => schema.nullable().optional(),
    }),
    email_body_en: yup.string().when("has_mail", {
      is: true,
      then: (schema) =>
        schema
          .required(
            t("notifications.fields.emailBodyEn") + " " + t("common.required"),
          ),
      otherwise: (schema) => schema.nullable().optional(),
    }),
  }),
);

const {
  handleSubmit: validateAndSubmit,
  errors,
  setValues,
  values: formValues,
  submitCount,
  meta,
} = useForm({
  validationSchema: schema,
  validateOnMount: false,
  validateOnBlur: true,
  validateOnChange: true,
  validateOnInput: true,
  validateOnModelUpdate: true,
  initialValues: {
    has_push: false,
    has_mail: false,
    has_sms: false,
    title_ar: "",
    title_en: "",
    content_ar: "",
    content_en: "",
    email_subject_ar: "",
    email_subject_en: "",
    email_body_ar: "",
    email_body_en: "",
  },
});

const { value: has_push } = useField("has_push");
const { value: has_mail } = useField("has_mail");
const { value: has_sms } = useField("has_sms");

const field_title_ar = useField("title_ar");
const title_ar = field_title_ar.value;

const field_title_en = useField("title_en");
const title_en = field_title_en.value;

const field_content_ar = useField("content_ar");
const content_ar = field_content_ar.value;

const field_content_en = useField("content_en");
const content_en = field_content_en.value;

const field_email_subject_ar = useField("email_subject_ar");
const email_subject_ar = field_email_subject_ar.value;

const field_email_subject_en = useField("email_subject_en");
const email_subject_en = field_email_subject_en.value;

const field_email_body_ar = useField("email_body_ar");
const email_body_ar = field_email_body_ar.value;

const field_email_body_en = useField("email_body_en");
const email_body_en = field_email_body_en.value;

const allFields = {
  title_ar: field_title_ar,
  title_en: field_title_en,
  content_ar: field_content_ar,
  content_en: field_content_en,
  email_subject_ar: field_email_subject_ar,
  email_subject_en: field_email_subject_en,
  email_body_ar: field_email_body_ar,
  email_body_en: field_email_body_en,
};

const showError = (field) => {
  const f = allFields[field];
  if (!f) return errors.value[field] || "";
  if (submitCount.value > 0) return errors.value[field] || "";
  return f.meta.touched ? errors.value[field] || "" : "";
};

const isSaveDisabled = computed(() => {
  return !has_push.value && !has_mail.value && !has_sms.value;
});

watch(
  () => [has_push.value, has_mail.value, has_sms.value],
  () => {
    channelError.value = isSaveDisabled.value;
  },
);

const fetchNotification = async () => {
  if (!eventKey.value) return;
  fetching.value = true;
  try {
    const response = await ssNotificationSettingsService.list({
      search: eventKey.value,
    });
    const notification =
      response.data.notification_settings.find(
        (n) => n.event_key === eventKey.value,
      ) || response.data.notification_settings[0];

    if (notification) {
      notificationId.value = notification.id;
      originalNameAr.value = notification.name_ar;
      originalNameEn.value = notification.name_en;
      setValues({
        has_push:
          notification.channels?.includes("push") ||
          notification.channels?.includes("database") ||
          false,
        has_mail: notification.channels?.includes("mail") || false,
        has_sms: notification.channels?.includes("sms") || false,
        title_ar: notification.title_ar || "",
        title_en: notification.title_en || "",
        content_ar: notification.content_ar || "",
        content_en: notification.content_en || "",
        email_subject_ar: notification.email_subject_ar || "",
        email_subject_en: notification.email_subject_en || "",
        email_body_ar: notification.email_body_ar || "",
        email_body_en: notification.email_body_en || "",
      });
    }
  } catch (error) {
    console.error(error);
    toast.error(error);
  } finally {
    fetching.value = false;
  }
};

const handleCancel = () => {
  router.back();
};

const handleSave = validateAndSubmit(async (values) => {
  if (!notificationId.value || isSaveDisabled.value) return;

  saving.value = true;
  try {
    const channels = [];
    if (values.has_push) channels.push("push");
    if (values.has_mail) channels.push("mail");
    if (values.has_sms) channels.push("sms");

    const data = {
      title_ar: values.has_push || values.has_sms ? values.title_ar : "",
      title_en: values.has_push || values.has_sms ? values.title_en : "",
      content_ar: values.has_push || values.has_sms ? values.content_ar : "",
      content_en: values.has_push || values.has_sms ? values.content_en : "",
      email_subject_ar: values.has_mail ? values.email_subject_ar : "",
      email_subject_en: values.has_mail ? values.email_subject_en : "",
      email_body_ar: values.has_mail ? values.email_body_ar : "",
      email_body_en: values.has_mail ? values.email_body_en : "",
      channels: channels,
    };

    await ssNotificationSettingsService.update(notificationId.value, data);
    toast.success(t("notifications.messages.updated"));
    router.back();
  } catch (error) {
    console.error(error);
    toast.error(error);
  } finally {
    saving.value = false;
  }
});

onMounted(() => {
  fetchNotification();
});
</script>
