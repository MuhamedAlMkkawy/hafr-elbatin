<script setup>
import { useI18n } from "vue-i18n";
import Modal from "@/components/ui/Modal.vue";
import Icon from "@/components/ui/Icon.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import Button from "@/components/ui/Button.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  branch: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "edit"]);

const { t } = useI18n();

const close = () => {
  emit("update:modelValue", false);
};

const handleEdit = () => {
  emit("edit", props.branch);
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="t('branches.modals.viewTitle')"
    width="xl"
    @update:model-value="close"
  >
    <div v-if="branch" class="space-y-6 py-4">
      <div class="grid grid-cols-1 gap-y-4">
        <div class="flex items-center pb-3 gap-12">
          <span class="text-sm font-medium text-[#6C737F] w-[170px]">{{
            t("branches.fields.nameAr")
          }}</span>
          <span class="text-sm font-semibold text-[#384250]">{{
            branch.name_ar || branch.name
          }}</span>
        </div>

        <div class="flex items-center pb-3 gap-12">
          <span class="text-sm font-medium text-[#6C737F] w-[170px]">{{
            t("branches.fields.nameEn")
          }}</span>
          <span class="text-sm font-semibold text-[#384250]">{{
            branch.name
          }}</span>
        </div>

        <div class="flex items-center pb-3 gap-12">
          <span class="text-sm font-medium text-[#6C737F] w-[170px]">{{
            t("branches.fields.managerName")
          }}</span>
          <span class="text-sm font-semibold text-[#384250]">{{
            branch.manager_name || "-"
          }}</span>
        </div>

        <div class="flex items-center pb-3 gap-12">
          <span class="text-sm font-medium text-[#6C737F] w-[170px]">{{
            t("branches.fields.email")
          }}</span>
          <span class="text-sm font-semibold text-[#384250]">{{
            branch.email || "-"
          }}</span>
        </div>

        <div class="flex items-center pb-3 gap-12">
          <span class="text-sm font-medium text-[#6C737F] w-[170px]">{{
            t("branches.fields.phone")
          }}</span>
          <span class="text-sm font-semibold text-[#384250] dir-ltr">{{ branch.country_code + branch.phone || "-" }}</span>
        </div>

        <div class="flex items-center pb-3 gap-12">
          <span class="text-sm font-medium text-[#6C737F] w-[170px]">{{
            t("branches.fields.status")
          }}</span>
          <div
            class="flex items-center gap-2 px-3 py-1 rounded-full"
            :class="branch.is_active ? 'bg-[#ECFDF3]' : 'bg-[#E5E7EB]'"
          >
            <span
              class="w-2 h-2 rounded-full"
              :class="branch.is_active ? 'bg-[#085D3A]' : 'bg-[#1F2A37]'"
            ></span>
            <span
              class="text-sm font-semibold"
              :class="branch.is_active ? 'text-[#085D3A]' : 'text-[#1F2A37]'"
            >
              {{
                branch.is_active
                  ? t("branches.status.active")
                  : t("branches.status.inactive")
              }}
            </span>
          </div>
        </div>

        <!-- Logo/File Attachment display -->
        <div v-if="branch.logo">
          <span class="block text-sm font-medium text-[#6C737F] mb-2">{{
            t("branches.fields.logo")
          }}</span>
          <div
            class="flex items-center gap-2 p-2 bg-[#F3F4F6] rounded-lg border border-[#D2D6DB] hover:shadow-sm"
          >
            <a
              :href="branch.logo"
              target="_blank"
              class="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
            >
              <div>
                <SvgIcon name="check" classes="w-full h-full object-contain" />
              </div>
              <span class="text-sm text-[#161616] truncate font-semibold">
                {{ branch.logo.split("/").pop() }}
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-3 md:w-[40%] w-full">
        <Button variant="secondary" class="flex-1" size="md" @click="close">
          {{ t("common.cancel") }}
        </Button>
        <Button variant="primary" class="flex-1" size="md" @click="handleEdit">
          {{ t("common.edit") }}
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
