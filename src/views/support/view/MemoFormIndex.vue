<template>
  <div class="space-y-4">
    <!-- Breadcrumb -->
    <Breadcrumb :items="breadcrumbItems" class="no-print" />
    <div class="mb-6 flex flex-wrap gap-2 justify-between items-center">
      <h2 class="text-[24px] font-[600]">
        {{
          route.path.endsWith("edit") ? t("add_memo.edit") : t("add_memo.title")
        }}
      </h2>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-[50vh] py-12">
      <div
        class="animate-spin rounded-full h-20 w-20 border-b-2 border-primary"
      ></div>
    </div>

    <template v-else>
      <Card class="!p-4">
        <!-- موضوع المذكرة -->
        <div class="space-y-4">
          <Input
            v-model="subject"
            :label="t('add_memo.fields.memoSubject')"
            :placeholder="t('add_memo.placeholders.memoSubject')"
            :error="errors.subject"
            required
            size="md"
          />
        </div>
        <!-- محتوى المذكرة -->
        <div class="mt-5 space-y-4">
          <Textarea
            v-model="body"
            :label="t('add_memo.fields.memoContent')"
            :placeholder="t('add_memo.placeholders.memoContent')"
            :error="errors.body"
            required
            size="md"
            :rows="5"
          />
        </div>
        <!-- التصنيف -->
        <div class="mt-5 space-y-4">
          <Select
            v-model="classification"
            :options="classificationOptions"
            :label="t('add_memo.fields.classification')"
            :placeholder="t('add_memo.placeholders.selectClassification')"
            :error="errors.classification"
            searchable
            size="md"
          />
        </div>
        <div class="mt-5 space-y-4 flex gap-4">
          <!-- اسم أو رمز الجهة -->
          <Select
            v-model="target_entity_id"
            :options="target_entity_id_options"
            :label="t('add_memo.fields.entityNameCode')"
            :placeholder="t('add_memo.placeholders.entityNameCode')"
            :error="errors.target_entity_id"
            searchable
            visibilityType="all"
            size="md"
          />
          <!-- الإدارة أو القسم -->
          <Select
            v-model="department_id"
            :options="organizationOptions"
            :label="t('add_memo.fields.department')"
            :placeholder="t('add_memo.placeholders.selectDepartment')"
            :error="errors.department_id"
            searchable
            size="md"
          />
        </div>
        <div class="space-y-4 mt-5 flex gap-4">
          <!-- تاريخ النشر -->
          <DatePicker
            v-model="publish_date"
            :label="t('add_memo.fields.publish_date')"
            :error="errors.publish_date"
            required
            size="md"
            :min-date="new Date().toISOString().split('T')[0]"
          />

          <!-- تاريخ الانتهاء -->
          <DatePicker
            v-model="expiry_date"
            :label="t('add_memo.fields.expiryDate')"
            :error="errors.expiry_date"
            required
            size="md"
            :min-date="publish_date || new Date().toISOString().split('T')[0]"
          />
        </div>
        <!-- اتخاذ إجراء / الإجراء -->
        <div class="mt-5 space-y-4">
          <div class="flex items-center gap-2">
            <Toggle
              :model-value="take_action"
              @change="take_action = !take_action"
            />
            <label>{{ t("add_memo.fields.takeAction") }}</label>
          </div>
          <Select
            v-if="take_action"
            v-model="action_type"
            :options="actionOptions"
            :label="t('add_memo.fields.actionTaken')"
            :placeholder="t('add_memo.placeholders.selectAction')"
            :error="errors.action_type"
            required
            searchable
            size="md"
          />
        </div>

        <!-- المرفقات -->
        <div class="md:col-span-2 mt-5">
          <label class="block text-sm font-medium text-[#384250] mb-1.5">{{
            t("add_memo.fields.attachments")
          }}</label>

          <UploadFile
            v-model="currentFile"
            :placeholder="t('common.dragDropOrClick')"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            :error="errors.attachments"
            multiple
            :show-file-list="false"
            @update:model-value="handleFileUpload"
          />

          <!-- FETCHED ATTACHEMENTS -->
          <div
            v-if="existingAttachments.length > 0"
            class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <div
              v-for="(file, index) in existingAttachments"
              :key="index"
              class="flex items-center gap-2 p-2 bg-[#F3F4F6] rounded-lg border border-[#D2D6DB] hover:shadow-sm transition-shadow"
            >
              <a
                :href="file?.url"
                target="_blank"
                class="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <div class="flex-shrink-0">
                  <SvgIcon name="check" classes="w-5 h-5 text-gray-500" />
                </div>
                <span class="flex-1 text-sm text-[#384250] truncate">
                  {{ file?.name }}
                </span>
              </a>

              <button
                type="button"
                @click="removeExistingAttachment(index)"
                class="flex-shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Icon name="xMark" size="sm" />
              </button>
            </div>
          </div>

          <div
            v-if="newAttachments.length > 0"
            class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <div
              v-for="(file, index) in newAttachments"
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
      </Card>

      <!-- Submit Button -->
      <div class="flex justify-end gap-3 pt-4">
        <Button variant="ghost" size="md" @click="handleCancel">
          {{ t("common.cancel") }}
        </Button>
        <Button
          :variant="route.path.endsWith('edit') ? 'primary' : 'outline'"
          :class="
            !route.path.endsWith('edit')
              ? '!bg-[#E7EFED] hover:!bg-[#0E5F4A] hover:!text-white'
              : ''
          "
          size="md"
          :loading="loading"
          @click="onSubmit('draft')"
        >
          {{
            route.path.endsWith("edit")
              ? t("add_memo.edit")
              : t("common.draftSave")
          }}
        </Button>
        <Button
          variant="primary"
          size="md"
          :loading="loading"
          v-if="!route.path.endsWith('edit')"
          @click="onSubmit('publish')"
        >
          {{ t("common.publish") }}
        </Button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onUnmounted, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  Breadcrumb,
  Card,
  Input,
  Textarea,
  Select,
  Button,
  SvgIcon,
  Icon,
  UploadFile,
  Toggle,
  DatePicker,
} from "@/components/ui";
import memoService from "@/services/memos";
import adminDashboard from "@/services/adminDashboard";
import { useAppToast } from "@/composables/useAppToast";
import { useRoute, useRouter } from "vue-router";
import organizationalUnitService from "@/services/organizationalUnits";
import departmentService from "@/services/departments";
import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { toTypedSchema } from "@vee-validate/yup";

const loading = ref(true);
const toast = useAppToast();
const router = useRouter();
const route = useRoute();

const emit = defineEmits(["save", "cancel"]);

const { t, locale } = useI18n();

// GET THE LANG
const lang = computed(() => locale.value);
const isEn = computed(() => route.path.startsWith("/en"));
const basePath = computed(() => (isEn.value ? "/en/support" : "/support"));

// Check if editing
const isEdit = computed(() => route.path.endsWith("edit") && route?.params?.id);

// Track deleted attachments
const deletedAttachments = ref([]);
const isAttachmentDeleted = ref(false);

// Store attachments as an array
const attachmentsList = ref([]);
const existingAttachments = ref([]); // from API
const newAttachments = ref([]); // newly uploaded

const currentFile = ref(null);

// ================> HANDLE OPTIONS DATA
const classificationOptions = ref([]);
const target_entity_id_options = ref([]);
const organizationOptions = ref([]);

const actionOptions = ref([
  { label: t("add_memo.options.action.confirm"), value: "confirm" },
  { label: t("add_memo.options.action.upload_file"), value: "upload_file" },
]);

// ================> HANDLE THE BREADCRUMB
const breadcrumbItems = computed(() => {
  const prefix = locale.value === "en" ? "/en" : "";
  const items = [
    {
      label: t("sidebar.support"),
    },
    {
      label: t("sidebar.supportComplaints"),
      to: `${prefix}/support/complaints`,
    },
    {
      label: route.path.endsWith("edit")
        ? t("add_memo.edit")
        : t("add_memo.title"),
    },
  ];
  return items;
});

// DEFINE THE TOGGLE VARIABLE FOR TAKE ACTION
const take_action = ref(false);

// ================> HANDLE THE SCHEMA
const schema = toTypedSchema(
  yup.object({
    subject: yup
      .string()
      .required(t("add_memo.fields.memoSubject") + " " + t("common.required")),
    body: yup
      .string()
      .required(t("add_memo.fields.memoContent") + " " + t("common.required")),
    classification: yup
      .string()
      .required(
        t("add_memo.fields.classification") + " " + t("common.required"),
      ),
    target_entity_id: yup.string().nullable().optional(),
    department_id: yup.string().nullable().optional(),
    publish_date: yup
      .string()
      .required(t("add_memo.fields.publish_date") + " " + t("common.required")),
    expiry_date: yup
      .string()
      .required(t("add_memo.fields.expiryDate") + " " + t("common.required")),
    action_type: yup.string().when([], {
      is: () => take_action.value,
      then: (schema) =>
        schema.required(
          t("add_memo.fields.actionTaken") + " " + t("common.required"),
        ),
      otherwise: (schema) => schema.nullable().optional(),
    }),
  }),
);

// ================> HANDLE THE FORM
const {
  handleSubmit: validateAndSubmit,
  errors,
  resetForm,
  setValues,
} = useForm({
  validationSchema: schema,
  validateOnModelUpdate: true,
  initialValues: {
    subject: "",
    body: "",
    classification: "",
    target_entity_id: "",
    department_id: "",
    publish_date: "",
    expiry_date: "",
    action_type: "",
  },
});

// ================> HANDLE THE FORM VALUES
const { value: subject } = useField("subject");
const { value: body } = useField("body");
const { value: classification } = useField("classification");
const { value: target_entity_id } = useField("target_entity_id");
const { value: department_id } = useField("department_id");
const { value: publish_date } = useField("publish_date");
const { value: expiry_date } = useField("expiry_date");
const { value: action_type } = useField("action_type");

// ================> FILE HANDLING
const handleFileUpload = (files) => {
  if (!files) return;

  const isDuplicate = (file) => {
    return newAttachments.value.some(
      (f) =>
        f.name === file.name && f.size === file.size && f.type === file.type,
    );
  };

  const addFile = (file) => {
    if (isDuplicate(file)) return; //  skip duplicates

    file.id = Date.now() + Math.random();
    newAttachments.value.push(file);
  };

  if (Array.isArray(files)) {
    files.forEach(addFile);
  } else if (files?.name) {
    addFile(files);
  }

  currentFile.value = null;
};
const getAttachmentPreview = (file) => {
  if (file.url) return file.url; // API file

  if (file.preview) return file.preview;

  const preview = URL.createObjectURL(file);
  file.preview = preview;
  return preview;
};

const removeExistingAttachment = (index) => {
  const file = existingAttachments.value[index];

  if (file?.id) {
    deletedAttachments.value.push(file.id);
  }

  existingAttachments.value.splice(index, 1);
};

const removeNewAttachment = (index) => {
  const file = newAttachments.value[index];

  if (file?.preview) {
    URL.revokeObjectURL(file.preview);
  }

  newAttachments.value.splice(index, 1);
};

// Clean up object URLs on unmount
onUnmounted(() => {
  newAttachments.value.forEach((file) => {
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
  });
});

// WETHER THE MEMO IS PUBLISHED
const isPublished = ref(false);

// ================> SUBMIT HANDLER
const onSubmit = (status) => {
  validateAndSubmit(async (values) => {
    loading.value = true;
    const formData = new FormData();

    formData.append("subject", values.subject);
    formData.append("body", values.body);
    formData.append("classification", values.classification);
    if (values.department_id) {
      formData.append("department_id", Number(values.department_id));
    }
    formData.append("target_entity_id", values.target_entity_id);
    formData.append("publish_date", values.publish_date);
    formData.append("expiry_date", values.expiry_date);

    //   FIXED: use status directly
    formData.append("status", status);

    if (status === "publish" && !route.path.endsWith("edit")) {
      formData.append("is_published", 1);
    }

    if (take_action.value) {
      formData.append("action_required", take_action.value ? 1 : 0);
      formData.append("action_type", values.action_type);
    }

    if (newAttachments.value.length > 0) {
      newAttachments.value.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    if (isEdit.value && deletedAttachments.value.length > 0) {
      formData.append(
        "deleted_attachments",
        JSON.stringify(deletedAttachments.value),
      );
    }

    try {
      if (isEdit.value) {
        await memoService.update(route?.params?.id, formData);
      } else {
        const response = await memoService.create(formData);

        if (response.success) {
          toast.success(response.message);
          router.push({ name: "complaints" });
        }
      }
    } catch (error) {
      toast.error(error);
      console.error("Error saving memo:", error);
    } finally {
      loading.value = false;
    }
  })();
};

const fetchDepartments = async (entityId) => {
  if (!entityId) {
    organizationOptions.value = [];
    return;
  }
  try {
    const params = { organizational_unit_id: entityId };
    const departments = await departmentService.listAll(params);
    organizationOptions.value = departments?.data?.departments.map((item) => ({
      value: item.id,
      label: item[`name_${lang.value}`],
    }));
  } catch (error) {
    console.error("Error fetching departments:", error);
  }
};

watch(
  target_entity_id,
  async (newVal, oldVal) => {
    await fetchDepartments(newVal);
    if (oldVal && newVal !== oldVal) {
      department_id.value = "";
    }
  },
  { immediate: true },
);

const handleCancel = () => {
  if (route.path.endsWith("edit")) {
    router.go(-1);
  } else {
    resetForm();
    take_action.value = false;
    isAttachmentDeleted.value = false;
    deletedAttachments.value = [];
    attachmentsList.value = [];
    currentFile.value = null;
  }
};

// ================> FETCH DATA ON MOUNT
onMounted(async () => {
  try {
    const classifications = await memoService.getClassifications();
    classificationOptions.value = classifications?.data?.classifications || [];

    // Fetch departments
    const orgResponse = await organizationalUnitService.getStructure();
    if (orgResponse) {
      target_entity_id_options.value =
        orgResponse?.data?.organizational_units[0]?.allChildren.map((item) => ({
          value: item.id,
          label: item[`name_${lang.value}`],
        }));
    }

    // FETCH THE MEMO DATA IN CASE OF EDITTING
    if (route.path.endsWith("edit")) {
      const memo = await memoService.getById(route?.params?.id);

      const data = memo?.data?.internal_memo;
      if (data) {
        if (data) {
          take_action.value = !!data.action_required;

          setValues({
            subject: data?.subject || "",
            body: data?.body || "",
            classification: data?.classification || "",
            department_id: data?.department?.id,
            target_entity_id: data?.target_entity?.id || "",
            publish_date: data?.publish_date || "",
            expiry_date: data?.expiry_date || "",
            action_type: data?.action_type || "",
          });

          // Optional: load existing attachments
          if (data.attachments?.length) {
            existingAttachments.value = data?.attachments?.map(
              (file, index) => ({
                id: index,
                url: file, // API returns file URL here
                name: file?.split("/").pop(), // extract filename
              }),
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
  loading.value = false;
});
</script>
