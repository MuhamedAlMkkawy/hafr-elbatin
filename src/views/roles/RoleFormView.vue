<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import { useForm, useField } from "vee-validate";
import * as yup from "yup";
import { toTypedSchema } from "@vee-validate/yup";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";

import { roleService, permissionService } from "@/services/roles";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const route = useRoute();
const router = useRouter();
const toast = useAppToast();

const isEdit = computed(() => !!route.params.id);

const breadcrumbItems = computed(() => [
  {
    label: t("roles.title"),
    to: route.path.startsWith("/en") ? "/en/settings/roles" : "/settings/roles",
  },
  { label: isEdit.value ? t("roles.editTitle") : t("roles.createTitle") },
]);

const schema = toTypedSchema(
  yup.object({
    name: yup
      .string()
      .required(t("roles.errors.nameRequired"))
      .min(2, t("roles.errors.nameMin"))
      .max(30, t("roles.errors.nameMax"))
      .matches(
        /^[a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\u2013\u2014]+$/,
        t("validation.englishOnly"),
      ),
    name_ar: yup
      .string()
      .required(t("roles.errors.nameRequired"))
      .min(2, t("roles.errors.nameMin"))
      .max(30, t("roles.errors.nameMax"))
      .matches(
        /^[\u0600-\u06FF0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\u2013\u2014]+$/,
        t("validation.arabicOnly"),
      ),
    permissions: yup
      .array()
      .min(1, t("roles.errors.minPermissions"))
      .required(t("roles.errors.minPermissions")),
  }),
);

const {
  handleSubmit: validateAndSubmit,
  errors,
  setValues,
} = useForm({
  validationSchema: schema,
  validateOnModelUpdate: true,
  initialValues: {
    name: "",
    name_ar: "",
    permissions: [],
  },
});

const { value: name } = useField("name");
const { value: name_ar } = useField("name_ar");
const { value: selectedPermissions } = useField("permissions");

const loading = ref(false);
const error = ref("");
const saving = ref(false);

// permissions grouped from /permissions/grouped
const permissionGroups = ref([]);

const groupedPermissions = computed(() => permissionGroups.value);

const isChecked = (permissionName) => {
  return selectedPermissions.value.includes(permissionName);
};

const togglePermission = (permissionName) => {
  if (isChecked(permissionName)) {
    selectedPermissions.value = selectedPermissions.value.filter(
      (p) => p !== permissionName,
    );
  } else {
    selectedPermissions.value = [...selectedPermissions.value, permissionName];
  }
};

const isGroupAllSelected = (group) => {
  if (!group.permissions?.length) return false;
  return group.permissions.every((p) =>
    selectedPermissions.value.includes(p.name),
  );
};

const toggleGroup = (group) => {
  const allNames = group.permissions.map((p) => p.name);
  if (isGroupAllSelected(group)) {
    selectedPermissions.value = selectedPermissions.value.filter(
      (p) => !allNames.includes(p),
    );
  } else {
    const current = [...selectedPermissions.value];
    allNames.forEach((name) => {
      if (!current.includes(name)) current.push(name);
    });
    selectedPermissions.value = current;
  }
};

const isAllSelected = computed(() => {
  if (!permissionGroups.value?.length) return false;
  return permissionGroups.value.every((group) => isGroupAllSelected(group));
});

const toggleAllPermissions = () => {
  if (isAllSelected.value) {
    selectedPermissions.value = [];
  } else {
    const allNames = [];
    permissionGroups.value.forEach((group) => {
      group.permissions.forEach((p) => allNames.push(p.name));
    });
    selectedPermissions.value = allNames;
  }
};

const loadPermissions = async () => {
  try {
    const response = await permissionService.grouped();
    permissionGroups.value = response.data?.groups || [];
  } catch (e) {
    console.error(e);
    toast.error(e);
  }
};

const loadRole = async () => {
  if (!isEdit.value) return;
  loading.value = true;
  error.value = "";

  try {
    const response = await roleService.getById(route.params.id);
    const role = response.data?.role || response.role || response;

    // Normalize permissions
    const perms = role.permissions || [];
    const normalizedPerms = perms.map((p) =>
      typeof p === "string" ? p : p.name,
    );

    setValues({
      name: role.name || "",
      name_ar: role.name_ar || "",
      permissions: normalizedPerms,
    });
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  const isEn = route.path.startsWith("/en");
  const base = isEn ? "/en/settings/roles" : "/settings/roles";
  router.push(base);
};

const onSubmit = validateAndSubmit(async (values) => {
  saving.value = true;

  try {
    const payload = {
      name: values.name,
      name_ar: values.name_ar,
      permissions: values.permissions,
    };

    if (isEdit.value) {
      await roleService.update(route.params.id, payload);
    } else {
      await roleService.create(payload);
    }

    const isEn = route.path.startsWith("/en");
    const base = isEn ? "/en/settings/roles" : "/settings/roles";
    const message = isEdit.value ? "updated" : "created";

    router.push({ path: base, query: { message } });
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    saving.value = false;
  }
});

onMounted(async () => {
  await loadPermissions();
  await loadRole();
});
</script>

<template>
  <section class="space-y-6">
    <Breadcrumb :items="breadcrumbItems" />
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-[20px] font-[600] text-[#000000]">
          {{ isEdit ? t("roles.editTitle") : t("roles.createTitle") }}
        </h1>
        <!-- <p class="mt-1 text-sm text-gray-500">
          {{ t("roles.formDescription") }}
        </p> -->
      </div>
    </header>

    <Card>
      <template #header>
        <h2 class="text-[16px] font-[600] text-[#333333]">
          {{ t("roles.basicInfo") }}
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          v-model="name_ar"
          :label="t('roles.fields.nameAr')"
          :placeholder="t('roles.placeholders.nameAr')"
          :error="errors.name_ar"
          required
        />
        <Input
          v-model="name"
          :label="t('roles.fields.nameEn')"
          :placeholder="t('roles.placeholders.nameEn')"
          :error="errors.name"
          required
        />
      </div>
    </Card>

    <Card>
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("roles.permissionsTitle") }}
          </h2>
        </div>
      </template>

      <div v-if="loading" class="text-sm text-gray-500">
        {{ t("common.loading") }}
      </div>

      <div v-else>
        <label
          class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mb-5"
        >
          <input
            type="checkbox"
            class="cursor-pointer h-4 w-4 rounded border-gray-300 text-[#0E5F4A] focus:ring-[#0E5F4A]"
            :checked="isAllSelected"
            @change="toggleAllPermissions"
          />
          <span class="font-[500] text-[#000000]">{{
            t("roles.selectAll")
          }}</span>
        </label>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="group in groupedPermissions"
            :key="group.group"
            class="border border-[#F4FAF4] rounded-lg"
          >
            <div class="flex items-center mb-3 gap-2 bg-[#F4FAF4] p-3">
              <input
                type="checkbox"
                class="cursor-pointer h-4 w-4 rounded border-gray-300 text-[#0E5F4A] focus:ring-[#0E5F4A]"
                :checked="isGroupAllSelected(group)"
                @change="toggleGroup(group)"
              />
              <h3 class="text-[14px] font-[500] text-[#190802]">
                {{ group.group_label }}
              </h3>
            </div>

            <div
              class="px-3 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar"
            >
              <label
                v-for="permission in group.permissions"
                :key="permission.id"
                class="flex items-center gap-2 text-[14px] font-[500] text-[#666666] cursor-pointer hover:bg-white p-1 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-[#0E5F4A] focus:ring-[#0E5F4A]"
                  :checked="isChecked(permission.name)"
                  @change="togglePermission(permission.name)"
                />
                <span>{{ permission.label }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <p
        v-if="errors.permissions"
        class="mt-2 text-xs font-medium text-[#B42318]"
      >
        {{ errors.permissions }}
      </p>
    </Card>

    <div class="flex items-center justify-end gap-3">
      <Button variant="secondary" size="md" @click="goBack">
        {{ t("common.cancel") }}
      </Button>
      <Button variant="primary" size="md" :loading="saving" @click="onSubmit">
        {{ isEdit ? t("common.update") : t("common.save") }}
      </Button>
    </div>
  </section>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}
</style>
