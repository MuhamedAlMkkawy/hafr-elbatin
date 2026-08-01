<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    width="lg"
    :title="isEdit ? t('shifts.modals.editTitle') : t('shifts.modals.addTitle')"
  >
    <form id="shiftForm" @submit.prevent="submit" class="space-y-4 py-4">
      <Input
        v-model="form.name_ar"
        :label="t('shifts.fields.nameAr')"
        :placeholder="t('shifts.placeholders.name')"
        required
        :error="errors.name_ar"
      />
      <Input
        v-model="form.name"
        :label="t('shifts.fields.nameEn')"
        :placeholder="t('shifts.placeholders.name')"
        required
        :error="errors.name"
      />

      <Select
        v-model="form.department_id"
        :options="departmentOptions"
        :label="t('shifts.fields.department')"
        :placeholder="t('shifts.placeholders.department')"
        required
        :error="errors.department_id"
        :loading="loadingDepartments"
        :disabled="fieldsDisabled"
      />

      <Select
        v-model="form.type"
        :options="typeOptions"
        :label="t('shifts.fields.type')"
        :placeholder="t('shifts.placeholders.type')"
        required
        :error="errors.type"
        :disabled="fieldsDisabled"
      />
    </form>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <Button
          type="button"
          variant="secondary"
          @click="$emit('update:modelValue', false)"
          class="px-8"
        >
          {{ t("common.cancel") }}
        </Button>
        <Button
          type="submit"
          form="shiftForm"
          variant="primary"
          class="px-8"
          :loading="loading"
        >
          {{ t("common.save") }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import Modal from "@/components/ui/Modal.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import Button from "@/components/ui/Button.vue";
import { departmentService } from "@/services/departments";

const props = defineProps({
  modelValue: Boolean,
  shift: Object,
  loading: Boolean,
});

const emit = defineEmits(["update:modelValue", "save"]);

const { t, locale } = useI18n();
const isEdit = computed(() => !!props.shift);

const form = ref({
  name: "",
  name_ar: "",
  department_id: null,
  type: "",
});

const errors = ref({});
const submitted = ref(false);
const departments = ref([
  { id: 1, name: "Human Resources", name_ar: "الموارد البشرية" },
  { id: 2, name: "Information Technology", name_ar: "تكنولوجيا المعلومات" },
  { id: 3, name: "Finance", name_ar: "المالية" },
]);
const loadingDepartments = ref(false);

const typeOptions = computed(() => [
  { label: t("shifts.types.annual"), value: "annual" },
  { label: t("shifts.types.monthly"), value: "monthly" },
]);

const departmentOptions = computed(() =>
  departments.value.map((dept) => ({
    label: locale.value === "ar" ? dept.name_ar : dept.name,
    value: dept.id,
  })),
);

// Re-validate on change after first submit attempt
watch(
  () => form.value.name_ar,
  () => {
    if (submitted.value) validate();
  },
);
watch(
  () => form.value.name,
  () => {
    if (submitted.value) validate();
  },
);
watch(
  () => form.value.department_id,
  () => {
    if (submitted.value) validate();
  },
);
watch(
  () => form.value.type,
  () => {
    if (submitted.value) validate();
  },
);

const fieldsDisabled = computed(() => {
  return isEdit.value && props.shift?.has_schedules;
});

const fetchDepartments = async () => {
  loadingDepartments.value = true;
  try {
    const response = await departmentService.listAll();
    departments.value = response.data || [];
  } catch (error) {
    console.error(error);
  } finally {
    loadingDepartments.value = false;
  }
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      submitted.value = false;
      if (props.shift) {
        form.value = {
          name: props.shift.name || "",
          name_ar: props.shift.name_ar || "",
          department_id:
            props.shift.department?.id || props.shift.department_id || null,
          type: props.shift.type || "",
        };
      } else {
        form.value = {
          name: "",
          name_ar: "",
          department_id: null,
          type: "",
        };
      }
      errors.value = {};
      if (departments.value.length === 0) {
        fetchDepartments();
      }
    }
  },
);

const validate = () => {
  errors.value = {};
  let valid = true;

  const specialCharsRegex = "!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?";
  const englishRegex = new RegExp(`^[a-zA-Z0-9\\s${specialCharsRegex}]+$`);
  const arabicRegex = new RegExp(`^[\\u0600-\\u06FF0-9\\s${specialCharsRegex}]+$`);

  if (!form.value.name_ar) {
    errors.value.name_ar = t("validation.fieldRequired");
    valid = false;
  } else if (form.value.name_ar.length < 2 || form.value.name_ar.length > 30) {
    errors.value.name_ar = t("validation.nameRange");
    valid = false;
  } else if (!arabicRegex.test(form.value.name_ar)) {
    errors.value.name_ar = t("validation.arabicOnly");
    valid = false;
  }

  if (!form.value.name) {
    errors.value.name = t("validation.fieldRequired");
    valid = false;
  } else if (form.value.name.length < 2 || form.value.name.length > 30) {
    errors.value.name = t("validation.nameRange");
    valid = false;
  } else if (!englishRegex.test(form.value.name)) {
    errors.value.name = t("validation.englishOnly");
    valid = false;
  }

  if (!form.value.department_id) {
    errors.value.department_id = t("validation.fieldRequired");
    valid = false;
  }
  if (!form.value.type) {
    errors.value.type = t("validation.fieldRequired");
    valid = false;
  }
  return valid;
};

const submit = () => {
  submitted.value = true;
  if (validate()) {
    const payload = { ...form.value };

    if (fieldsDisabled.value) {
      delete payload.department_id;
      delete payload.type;
    }

    emit("save", payload);
  }
};

onMounted(() => {
  // We can fetch preemptively or on modal open
});
</script>
