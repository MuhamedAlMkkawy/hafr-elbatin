<template>
  <div class="memos_page space-y-6">
    <!-- BREADCRUMB -->
    <Breadcrumb :items="breadcrumbItems" />
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <h2 class="text-[20px] font-[600]">
        {{ t("memoPage.title") }}
      </h2>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="loading && !memo" class="space-y-6">
      <Card class="p-6 space-y-4 animate-pulse">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 bg-gray-100 rounded-full"></div>
          <div class="h-6 bg-gray-100 rounded w-32"></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          <div v-for="i in 6" :key="i" class="flex items-center gap-2">
            <div class="h-4 bg-gray-100 rounded w-32"></div>
            <div class="h-4 bg-gray-100 rounded flex-1 ml-4"></div>
          </div>
        </div>
      </Card>
    </div>

    <template v-else-if="memo">
      <!-- Memo Information Section -->
      <Card class="!mt-4 !p-0 overflow-hidden border-none">
        <div
          class="bg-[#F3F9F6] py-2 px-4 border-b border-gray-100 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <SvgIcon
              name="info"
              classes="w-12 h-12 transition-transform duration-200"
            />
            <h3 class="font-[500] text-[#1F2A37] text-[16px]">
              {{ t("memoPage.title") }}
            </h3>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <DetailRow
              :label="t('memoPage.memo_number')"
              :value="memo.memo_number"
            />
            <DetailRow :label="t('memoPage.subject')" :value="memo.subject" />
            <DetailRow
              :label="t('memoPage.publisher')"
              :value="memo.publisher?.name || '--------'"
            />

            <!-- Memo Status -->
            <div class="flex items-center">
              <span class="text-[13px] font-[500] text-[#6C737F] w-[170px]">
                {{ t("memoPage.memo_status") }}
              </span>
              <div
                class="flex items-center gap-1.5 px-3 py-1 rounded-full"
                :class="
                  memo.memo_status === 'active'
                    ? 'bg-[#ECFDF3]'
                    : 'bg-[#E5E7EB]'
                "
              >
                <span
                  class="w-[10px] h-[10px] rounded-full"
                  :class="
                    memo.memo_status === 'active'
                      ? 'bg-[#085D3A]'
                      : 'bg-[#4D5761]'
                  "
                ></span>
                <span
                  class="text-[14px] font-[500]"
                  :class="
                    memo.memo_status === 'active'
                      ? 'text-[#085D3A]'
                      : 'text-[#1F2A37]'
                  "
                >
                  {{
                    memo.memo_status_label ||
                    (memo.memo_status === "active"
                      ? t("supportComplaints.status.active")
                      : t("supportComplaints.status.inactive"))
                  }}
                </span>
              </div>
            </div>

            <!-- <DetailRow
              :label="t('memoPage.category')"
              :value="memo.classification_label || '--------'"
            /> -->

            <!-- Category -->
            <div class="flex items-center">
              <span class="text-[13px] font-[500] text-[#6C737F] w-[170px]">
                {{ t("memoPage.category") }}
              </span>
              <span
                class="inline-flex items-center gap-1.5 text-[14px] font-[500] px-3 py-0.5 rounded-full bg-[#ECFDF3] text-[#065F46]"
                v-if="memo.classification_label"
              >
                {{ memo.classification_label }}
              </span>
              <span v-else>---</span>
            </div>

            <!-- Publish Status -->
            <div class="flex items-center">
              <span class="text-[13px] font-[500] text-[#6C737F] w-[170px]">
                {{ t("memoPage.publish_status") }}
              </span>
              <span
                class="inline-flex items-center gap-1.5 text-[14px] font-[500] px-3 py-0.5 rounded-full"
                :class="{
                  'bg-[#FEF3C7] text-[#92400E]':
                    memo.publish_status === 'pending',
                  'bg-[#ECFDF3] text-[#065F46]':
                    memo.publish_status === 'posted' ||
                    memo.publish_status === 'published',
                  'bg-[#E5E7EB] text-[#1F2A37]':
                    memo.publish_status === 'draft',
                  'bg-[#FEE2E2] text-[#B91C1C]':
                    memo.publish_status === 'expired',
                }"
              >
                <span
                  class="w-2 h-2 rounded-full"
                  :class="{
                    'bg-[#92400E]': memo.publish_status === 'pending',
                    'bg-[#065F46]':
                      memo.publish_status === 'posted' ||
                      memo.publish_status === 'published',
                    'bg-[#4D5761]': memo.publish_status === 'draft',
                    'bg-[#B91C1C]': memo.publish_status === 'expired',
                  }"
                />
                {{
                  memo.publish_status_label ||
                  t(
                    "supportComplaints.status." +
                      (memo.publish_status || "draft"),
                  )
                }}
              </span>
            </div>

            <DetailRow
              :label="t('memoPage.publish_date')"
              :value="formatDate(memo.publish_date) || '--------'"
            />

            <DetailRow
              :label="t('memoPage.expiry_date')"
              :value="formatDate(memo.expiry_date) || '--------'"
            />

            <DetailRow
              :label="t('memoPage.department')"
              :value="
                memo?.department?.[`name_${isEn ? 'en' : 'ar'}`] || '--------'
              "
            />
          </div>
          <DetailRow
            class="flex flex-col items-start mt-8 justify-start gap-[8px]"
            :label="t('memoPage.memo_content')"
            :value="memo.body || '--------'"
            :isHtml="true"
          />
        </div>
      </Card>

      <!-- Attachments Section (if applicable) -->
      <Card
        v-if="attachments && attachments.length"
        class="!mt-6 !p-0 overflow-hidden border-none"
      >
        <div
          class="bg-[#F3F9F6] py-2 px-4 border-b border-gray-100 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <h3 class="font-[500] text-[#1F2A37] text-[16px]">
              {{ t("memoPage.attachments") }}
            </h3>
          </div>
        </div>

        <div class="p-6">
          <div class="flex flex-wrap gap-3">
            <div v-for="(attachment, index) in attachments" :key="index">
              <div
                v-if="attachment"
                class="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 p-2"
              >
                <SvgIcon
                  name="check"
                  v-if="attachment"
                  classes="w-5 h-5 text-gray-500"
                />
                <a
                  v-if="attachment"
                  :href="attachment"
                  target="_blank"
                  class="text-[14px] text-primary hover:underline max-w-[300px] truncate"
                >
                  {{ attachment }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Footer Buttons -->
      <div class="flex items-center gap-3 pt-6 justify-end no-print">
        <Button variant="secondary" @click="goBack">
          {{ t("common.back") }}
        </Button>
        <Button
          v-if="memo.available_actions?.includes('edit')"
          variant="primary"
          @click="goToEdit(memo.id)"
        >
          <div class="flex items-center gap-2">
            <SvgIcon name="editWhite" classes="w-4 h-4" />
            <span>{{ t("common.edit") }}</span>
          </div>
        </Button>
        <Button
          variant="primary"
          size="md"
          :loading="loading"
          v-if="memo.publish_status == 'draft'"
          @click="handlePublishDraftedMemo"
        >
          {{ t("common.publish") }}
        </Button>
        <Button
          variant="primary"
          size="md"
          :loading="loading"
          v-if="memo?.action_required"
          @click="handleAction(memo?.action_type)"
        >
          {{ memo?.action_type_label }}
        </Button>
      </div>
    </template>
    <!-- Upload Files Modal -->
    <Modal
      :model-value="showUploadFilePopup"
      @update:modelValue="showUploadFilePopup = $event"
      :title="t('memoPage.attachments')"
    >
      <div class="space-y-4">
        <!-- Upload -->
        <UploadFile
          v-model="files"
          :placeholder="t('common.dragDropOrClick')"
          :error="errors.files"
          multiple
          :show-file-list="false"
        />

        <!-- Files Preview -->
        <div v-if="files.length" class="space-y-2">
          <div
            v-for="(file, index) in files"
            :key="index"
            class="flex items-center gap-2 p-2 bg-[#F3F4F6] rounded-lg border border-[#D2D6DB] hover:shadow-sm"
          >
            <!-- File Type -->
            <div class="w-5 h-5 flex items-center justify-center">
              <SvgIcon name="check" size="sm" class="text-[#0E5F4A]" />
            </div>

            <!-- Name -->
            <span class="flex-1 text-sm text-[#384250] truncate">
              {{ file.name }}
            </span>

            <!-- View -->
            <a
              v-if="isImage(file)"
              :href="getFilePreview(file)"
              target="_blank"
              class="text-xs text-primary hover:underline"
            >
              {{ t("common.view") }}
            </a>

            <!-- Remove -->
            <button
              type="button"
              @click="removeFile(index)"
              class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Icon name="xMark" size="sm" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Slot -->
      <template #footer>
        <div class="mt-[10px] flex justify-end gap-2">
          <Button variant="secondary" @click="showUploadFilePopup = false">
            {{ t("common.cancel") }}
          </Button>

          <Button variant="primary" @click="handleSubmitFiles">
            {{ memo?.action_type_label }}
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, h, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { memoService } from "@/services/memos";
import { useAppToast } from "@/composables/useAppToast";
import { useRouter, useRoute } from "vue-router";
import Modal from "../../../components/ui/Modal.vue";
import UploadFile from "@/components/ui/UploadFile.vue";
import Icon from "@/components/ui/Icon.vue";

const toast = useAppToast();
const { t, locale } = useI18n();
const loading = ref(true);
const memo = ref(null);
const router = useRouter();
const route = useRoute();
const attachments = ref([]);
const isEn = computed(() => route.path.startsWith("/en"));
const basePath = computed(() => (isEn.value ? "/en/support" : "/support"));

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
      label: t("memoPage.title"),
    },
  ];
  return items;
});

// ==================> HANDLE THE DETAIL ROW
// Local component for detail rows to match WorkSystemDetailsView design
const DetailRow = (props) => {
  return h("div", { class: "flex  items-center" }, [
    h(
      "span",
      { class: "text-[13px] font-[500] text-[#6C737F] w-[170px]" },
      props.label,
    ),
    h(
      "span",
      { class: "font-[600] text-[#384250] text-[16px]" },
      props.value || "--------",
    ),
  ]);
};

// ====================> HANDLE THE DATA
const loadData = async () => {
  loading.value = true;
  try {
    const res = await memoService.getById(route.params.id);
    memo.value = res.data?.internal_memo ?? res.internal_memo ?? null;

    //  RESET FIRST (this is the missing part)
    attachments.value = [];

    // memo main attachments
    if (memo.value?.attachments?.length) {
      attachments.value.push(...memo.value.attachments);
    }

    // responses attachments
    memo.value?.responses?.forEach((response) => {
      if (response.attachments?.length) {
        attachments.value.push(...response.attachments);
      }
    });

    //  OPTIONAL: remove duplicates
    attachments.value = [...new Set(attachments.value)];

    if (!memo.value) {
      toast.error(t("common.error"));
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

// ======================> HANDLE FORMAT THE DATE
// Add these functions to your script
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

const goBack = () => {
  router.go(-1);
};

// HANDLE PUBLISH THE DRAFTED MEMO
const handlePublishDraftedMemo = async () => {
  loading.value = true;
  try {
    const response = await memoService.handlePublish(memo.value.id);

    if (response.success) {
      await loadData();
      toast.success(response?.message);
    }
  } catch (error) {
    console.error(error);
    toast.error(error);
  } finally {
    loading.value = false;
  }
};

const showUploadFilePopup = ref(false);
const files = ref([]); // generic files

const errors = ref({
  files: "",
});

// preview cache
const previews = ref({});

const isImage = (file) => file?.type?.startsWith("image/");

// preview generator
const getFilePreview = (file) => {
  if (!isImage(file)) return null;

  if (previews.value[file.name]) {
    return previews.value[file.name];
  }

  const url = URL.createObjectURL(file);
  previews.value[file.name] = url;

  return url;
};

// remove file
const removeFile = (index) => {
  files.value.splice(index, 1);
};

// submit (static for now)
const handleSubmitFiles = async () => {
  if (!files.value.length) {
    errors.value.files = t("common.required");
    return;
  }

  const formData = new FormData();

  //  append files as files[index]
  files.value.forEach((file, index) => {
    formData.append(`files[${index}]`, file);
  });

  try {
    const response = await memoService.upload_memo_files(
      route.params.id,
      formData,
    );

    if (response) {
      toast.success(response?.message);
      loadData();
    }
  } catch (error) {
    console.error(error);
    toast.error(error);
  }

  // reset
  showUploadFilePopup.value = false;
  files.value = [];
  errors.value.files = "";
};

const handleAction = async (action) => {
  if (action == "confirm") {
    try {
      const response = await memoService.handleConfirmMemo(route.params.id);
      if (response) {
        toast.success(response?.message);
        loadData();
      }
    } catch (error) {
      toast.error(error);
    }
  } else {
    showUploadFilePopup.value = true;
  }
};

// HANDLE EDIT THE SINGLE MEMO
const goToEdit = (id) => {
  router.push(`${basePath?.value}/${id}/edit`);
};

onMounted(() => {
  loadData();
});

watch(
  () => route.params.id,
  (newValue) => {
    if (newValue) {
      loadData();
    }
  },
);
</script>
