<template>
  <section class="space-y-5" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
    <!-- BREADCRUMB -->
    <Breadcrumb :items="breadcrumbItems" />

    <h2 class="lg:text-[20px] mb-[8px] text-[16px] font-[800] text-[#333333]">
      {{ t("sidebar.supportContact") }}
    </h2>
    <p class="font-[500] text-[#4D5761] text-[16px]">
      {{ t("add_message.text") }}
    </p>

    <div class="grid lg:grid-cols-[30%_69%] md:grid-cols-1 justify-between">
      <!-- وسائل التواصل -->
      <Card class="flex flex-col gap-5 p-[12px] h-[fit-content]">
        <template v-if="loading">
          <!-- Skeleton Item -->
          <div
            v-for="i in 4"
            :key="i"
            class="flex flex-col gap-[8px] py-[16px] px-[12px] bg-[#F8FBFA] rounded-lg mb-[12px]"
          >
            <!-- Title -->
            <div class="flex items-center gap-[8px]">
              <div
                class="w-[20px] h-[20px] bg-gray-200 rounded animate-pulse"
              ></div>
              <div
                class="h-[16px] w-[120px] bg-gray-200 rounded animate-pulse"
              ></div>
            </div>

            <!-- Content -->
            <div class="flex flex-col gap-[6px]">
              <div
                class="h-[12px] w-full bg-gray-200 rounded animate-pulse"
              ></div>
              <div
                class="h-[12px] w-[80%] bg-gray-200 rounded animate-pulse"
              ></div>
            </div>
          </div>
        </template>

        <template v-else>
          <!-- Address -->
          <div
            class="flex flex-col gap-[8px] py-[16px] px-[12px] bg-[#F8FBFA] rounded-lg mb-[12px]"
          >
            <div class="flex gap-[8px] items-center">
              <SvgIcon name="location" />
              <h3 class="text-[16px] text-[#1F2A37] font-[600]">
                {{ t("add_message.contacts.address") }}
              </h3>
            </div>
            <div class="text-[14px] text-[#384250] font-[500]">
              {{ contacts?.location || "--" }}
            </div>
          </div>

          <!-- Phone -->
          <div
            class="flex flex-col gap-[8px] py-[16px] px-[12px] bg-[#F8FBFA] rounded-lg mb-[12px]"
          >
            <div class="flex gap-[8px] items-center">
              <SvgIcon name="phone" />
              <h3 class="text-[16px] text-[#1F2A37] font-[600]">
                {{ t("add_message.contacts.phone") }}
              </h3>
            </div>
            <div
              class="text-[14px] text-[#384250] font-[500] flex flex-col gap-[4px] hover:underline"
            >
              <a :href="`tel:${contacts.phone}`">
                {{ contacts?.phone || "--" }}
              </a>
            </div>
          </div>

          <!-- Email -->
          <div
            class="flex flex-col gap-[8px] py-[16px] px-[12px] bg-[#F8FBFA] rounded-lg mb-[12px]"
          >
            <div class="flex gap-[8px] items-center">
              <SvgIcon name="email" />
              <h3 class="text-[16px] text-[#1F2A37] font-[600]">
                {{ t("add_message.contacts.email") }}
              </h3>
            </div>
            <div
              class="text-[14px] text-[#384250] font-[500] flex flex-col gap-[4px] hover:underline"
            >
              <a :href="`mailto:${contacts.email}`">
                {{ contacts?.email || "--" }}
              </a>
            </div>
          </div>

          <!-- Working Hours -->
          <div
            class="flex flex-col gap-[8px] py-[16px] px-[12px] bg-[#F8FBFA] rounded-lg mb-[12px]"
          >
            <div class="flex gap-[8px] items-center">
              <SvgIcon name="working_hours" />
              <h3 class="text-[16px] text-[#1F2A37] font-[600]">
                {{ t("add_message.contacts.working_hours") }}
              </h3>
            </div>
            <div
              class="text-[14px] text-[#384250] font-[500] flex flex-col gap-[4px]"
            >
              {{ contacts?.working_hours || "--" }}
            </div>
          </div>
        </template>
      </Card>
      <!-- إرسال الرسالة  -->
      <Card>
        <div class="flex gap-5 flex-wrap">
          <template v-if="loading">
            <!-- Row (Name + Email) -->
            <div class="flex w-full gap-5">
              <div class="flex flex-col gap-2 w-full">
                <div
                  class="h-[14px] w-[80px] bg-gray-200 rounded animate-pulse"
                ></div>
                <div
                  class="h-[40px] w-full bg-gray-200 rounded animate-pulse"
                ></div>
              </div>

              <div class="flex flex-col gap-2 w-full">
                <div
                  class="h-[14px] w-[80px] bg-gray-200 rounded animate-pulse"
                ></div>
                <div
                  class="h-[40px] w-full bg-gray-200 rounded animate-pulse"
                ></div>
              </div>
            </div>

            <!-- Subject -->
            <div class="flex flex-col gap-2 w-full">
              <div
                class="h-[14px] w-[100px] bg-gray-200 rounded animate-pulse"
              ></div>
              <div
                class="h-[40px] w-full bg-gray-200 rounded animate-pulse"
              ></div>
            </div>

            <!-- Message -->
            <div class="flex flex-col gap-2 w-full">
              <div
                class="h-[14px] w-[120px] bg-gray-200 rounded animate-pulse"
              ></div>
              <div
                class="h-[80px] w-full bg-gray-200 rounded animate-pulse"
              ></div>
            </div>

            <!-- Priority Select -->
            <div class="flex flex-col gap-2 w-full">
              <div
                class="h-[14px] w-[90px] bg-gray-200 rounded animate-pulse"
              ></div>
              <div
                class="h-[40px] w-full bg-gray-200 rounded animate-pulse"
              ></div>
            </div>

            <!-- Upload -->
            <div class="w-full mt-5">
              <div
                class="h-[14px] w-[140px] bg-gray-200 rounded animate-pulse mb-2"
              ></div>
              <div
                class="h-[100px] w-full bg-gray-200 rounded animate-pulse"
              ></div>
            </div>
          </template>

          <template v-else>
            <!-- Row -->
            <div class="flex w-full gap-5">
              <Input
                v-model="name"
                :label="t('add_message.fields.name')"
                :error="errors.name"
                required
                :disabled="!!authStore.user"
                :placeholder="t('add_message.fields.name')"
              />

              <Input
                v-model="email"
                :label="t('add_message.fields.email')"
                type="email"
                :error="errors.email"
                required
                :disabled="!!authStore.user"
                class="flex-grow-1"
                :placeholder="t('add_message.fields.email')"
              />
            </div>

            <!-- Subject -->
            <Input
              v-model="subject"
              :label="t('add_message.fields.subject')"
              type="subject"
              :error="errors.subject"
              required
              class="flex-grow-1"
              :placeholder="t('add_message.fields.subject')"
            />

            <!-- Message -->
            <Textarea
              v-model="body"
              :label="t('add_message.fields.message')"
              :error="errors.body"
              required
              class="flex-grow-1"
              :placeholder="t('add_message.fields.message')"
              :rows="4"
            />

            <!-- Priority -->
            <Select
              v-model="priority"
              :options="priorityOptions"
              :label="t('add_message.fields.priority')"
              :placeholder="t('add_message.fields.priority')"
              :error="errors.priority"
              required
              size="md"
              searchable
            />

            <!-- Upload -->
            <div class="md:col-span-2 mt-5 flex-grow-1">
              <UploadFile
                v-model="attachments"
                :max-files="5"
                :max-size="2097152"
                :placeholder="t('common.dragDropOrClick')"
                :placeholderHint="t('common.fileSizeHint')"
                :error="errors.attachments"
                multiple
                :show-file-list="false"
              />

              <!-- Attachments -->
              <div
                v-if="attachments.length > 0"
                class="mt-4 grid gap-3"
                :class="attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'"
              >
                <div
                  v-for="(file, index) in attachments"
                  :key="index"
                  class="flex items-center gap-2 p-2 bg-[#F3F4F6] rounded-lg border border-[#D2D6DB] hover:shadow-sm transition-shadow"
                >
                  <a
                    :href="getAttachmentPreview(file)"
                    target="_blank"
                    class="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                  >
                    <div class="flex-shrink-0">
                      <SvgIcon name="check" classes="w-5 h-5 text-gray-500" />
                    </div>
                    <span class="flex-1 text-sm text-[#384250] truncate">
                      {{ file.name }}
                    </span>
                  </a>

                  <button
                    type="button"
                    @click="removeNewAttachment(index)"
                    class="flex-shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Icon name="xMark" size="sm" />
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </Card>
    </div>
    <!-- Submit Button -->
    <div class="flex justify-end w-full gap-3 pt-4">
      <Button
        variant="secondary"
        size="md"
        @click="router.push({ name: 'login' })"
      >
        {{ t("common.cancel") }}
      </Button>
      <Button variant="primary" size="md" :disabled="loading" @click="submit">
        {{ t("add_message.fields.submit") }}
      </Button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { toTypedSchema } from "@vee-validate/yup";

import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import Card from "@/components/ui/Card.vue";
import Input from "@/components/ui/Input.vue";
import Textarea from "@/components/ui/Textarea.vue";
import Select from "@/components/ui/Select.vue";
import Button from "@/components/ui/Button.vue";
import UploadFile from "@/components/ui/UploadFile.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";

import { useAppToast } from "@/composables/useAppToast";
import Icon from "@/components/ui/Icon.vue";
import { useRouter, useRoute } from "vue-router";
import { generalSettingsService } from "@/services/generalSettings";
import { messageService } from "@/services/message";
import { useAuthStore } from "@/stores/auth";

const { t, locale } = useI18n();
const toast = useAppToast();
const authStore = useAuthStore();

const lang = computed(() => locale.value);
const route = useRoute();
const router = useRouter();

const contacts = ref([]);

// ================= VALIDATION =================
const schema = toTypedSchema(
  yup.object({
    name: yup
      .string()
      .required(t("add_message.validation.nameRequired"))
      .min(2, t("add_message.validation.nameMin")),
    email: yup
      .string()
      .required(t("add_message.validation.emailRequired"))
      .email(t("add_message.validation.emailInvalid")),
    subject: yup.string().required(t("add_message.validation.subjectRequired")),
    body: yup.string().required(t("add_message.validation.messageRequired")),
    priority: yup.string().required(t("add_message.validation.priorityRequired")),
  }),
);

const { handleSubmit, errors } = useForm({
  validationSchema: schema,
});

const { value: name } = useField("name");
const { value: email } = useField("email");
const { value: subject } = useField("subject");
const { value: body } = useField("body");
const { value: priority } = useField("priority");

// ================= STATE =================
const loading = ref(true);

const priorityOptions = [
  { label: t("add_message.priority.low"), value: "low" },
  { label: t("add_message.priority.medium"), value: "medium" },
  { label: t("add_message.priority.high"), value: "high" },
];

// ================= RESET =================
const resetForm = () => {
  name.value = "";
  email.value = "";
  subject.value = "";
  body.value = "";
  priority.value = "low";
  file.value = null;
};

// ================= SUBMIT =================
const submit = handleSubmit(async () => {
  loading.value = true;

  try {
    const formData = new FormData();
    formData.append("name", name.value);
    formData.append("email", email.value);
    formData.append("subject", subject.value);
    formData.append("body", body.value);
    formData.append("priority", priority.value);

    attachments.value?.forEach((file, index) => {
  formData.append(`attachments[${index}]`, file);
});

    const response = await messageService.sendMessage(formData);

    if (response?.data?.success) {
      toast.success(t("add_message.success"));

      const prefix = locale.value === "en" ? "/en" : "";
      const path = authStore.hasPermission("employee_message.view")
        ? "/support/contact"
        : "/";

      // Build the full redirect path while cleaning double slashes
      const redirectPath = `${prefix}${path}`.replace(/\/+/g, "/");

      setTimeout(() => {
        router.push(redirectPath);
        resetForm();
      }, 500);
    }
  } catch (e) {
    console.error(e);
    toast.error(e?.response?.data?.message || t("common.error"));
  } finally {
    loading.value = false;
  }
});

// ================> FILE HANDLING
const attachments = ref([]);
const currentFile = ref(null);

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// const allowedTypes = [
//   "image/jpeg",
//   "image/png",
//   "application/pdf",
//   "application/msword",
//   "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
// ];
const handleFileUpload = (files) => {
  if (!files) return;

  const fileList = Array.isArray(files) ? files : [files];

  fileList.forEach((file) => {
    // TYPE VALIDATION
    // if (!allowedTypes.includes(file.type)) {
    //   toast.error(t("add_message.validation.invalidFileType"));
    //   return;
    // }

    // SIZE VALIDATION
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("add_message.validation.fileTooLarge"));
      return;
    }

    // PREVENT DUPLICATES
    const exists = attachments.value.some(
      (f) => f.name === file.name && f.size === file.size,
    );

    if (exists) return;

    // ADD FILE
    attachments.value.push({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
    });
  });

  // RESET INPUT
  currentFile.value = null;
};
const getAttachmentPreview = (file) => {
  if (file.url) return file.url; // API file

  if (file.preview) return file.preview;

  const preview = URL.createObjectURL(file);
  file.preview = preview;
  return preview;
};

const removeNewAttachment = (index) => {
  attachments.value.splice(index, 1);
};

// ================= BREADCRUMB =================
const breadcrumbItems = computed(() => [
  { label: t("sidebar.support"), to: "/support" },
  { label: t("sidebar.supportContact") },
]);

onMounted(async () => {
  // Pre-fill user data
  if (authStore.user) {
    name.value = authStore.user.name;
    email.value = authStore.user.email;
  }

  const response = await generalSettingsService.get();
  if (response) {
    contacts.value = response.data.settings;
    loading.value = false;
  }
});
</script>
