<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";

import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";

import { roleService, permissionService } from "@/services/roles";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useAppToast();

const loading = ref(true);
const role = ref(null);
const allPermissionGroups = ref([]);

const breadcrumbItems = computed(() => [
  {
    label: t("roles.title"),
    to: route.path.startsWith("/en") ? "/en/settings/roles" : "/settings/roles",
  },
  { label: t("roles.viewTitle") },
]);

const isAdmin = computed(() => {
  const name = role.value?.name?.toLowerCase() || "";
  return (
    name === "super-admin" ||
    name === "super admin" ||
    name === "ادمن" ||
    role.value?.id === 1
  );
});

const displayGroups = computed(() => {
  if (isAdmin.value && allPermissionGroups.value.length > 0) {
    return allPermissionGroups.value;
  }

  if (!role.value || !role.value.permissions) return [];

  const rolePermNames = role.value.permissions.map((p) =>
    typeof p === "string" ? p : p.name,
  );

  // If we have allPermissionGroups, we can maintain the original grouping labels
  if (allPermissionGroups.value.length > 0) {
    return allPermissionGroups.value
      .map((group) => {
        const filteredPerms = group.permissions.filter((p) =>
          rolePermNames.includes(p.name),
        );
        return {
          ...group,
          permissions: filteredPerms,
        };
      })
      .filter((group) => group.permissions.length > 0);
  }

  // Fallback to building groups from assigned permissions if allPermissionGroups is empty
  const groupsMap = {};
  role.value.permissions.forEach((perm) => {
    const groupName = perm.group || "General";
    const groupLabel = perm.group_label || groupName;
    if (!groupsMap[groupName]) {
      groupsMap[groupName] = {
        group: groupName,
        group_label: groupLabel,
        permissions: [],
      };
    }
    groupsMap[groupName].permissions.push(perm);
  });
  return Object.values(groupsMap);
});

const loadData = async () => {
  loading.value = true;
  try {
    const [roleRes, permRes] = await Promise.all([
      roleService.getById(route.params.id),
      permissionService.grouped().catch(() => ({ data: { groups: [] } })),
    ]);

    role.value = roleRes.data?.role || roleRes.role || roleRes;
    allPermissionGroups.value = permRes.data?.groups || [];
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

const goToEdit = () => {
  const isEn = route.path.startsWith("/en");
  const base = isEn ? "/en/settings/roles" : "/settings/roles";
  router.push(`${base}/${route.params.id}`);
};

onMounted(loadData);
</script>

<template>
  <section class="space-y-6">
    <Breadcrumb :items="breadcrumbItems" />
    <header v-if="role" class="flex items-center justify-between">
      <div>
        <h1 class="text-[20px] font-[600] text-[#000000]">
          {{ t("roles.viewTitle") }}
        </h1>
      </div>
    </header>

    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E5F4A]"
      ></div>
    </div>

    <template v-else-if="role">
      <Card>
        <template #header>
          <h2 class="text-[16px] font-[600] text-[#333333]">
            {{ t("roles.basicInfo") }}
          </h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            :model-value="role.name_ar"
            :label="t('roles.fields.nameAr')"
            disabled
          />
          <Input
            :model-value="role.name"
            :label="t('roles.fields.nameEn')"
            disabled
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

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="group in displayGroups"
            :key="group.group"
            class="border border-[#F4FAF4] rounded-lg"
          >
            <div class="flex items-center mb-3 gap-2 bg-[#F4FAF4] p-3">
              <h3 class="text-[14px] font-[500] text-[#190802]">
                {{ group.group_label }}
              </h3>
            </div>

            <div
              class="px-3 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar"
            >
              <div
                v-for="permission in group.permissions"
                :key="permission.id"
                class="flex items-center gap-2 text-[14px] font-[500] text-[#666666] p-1"
              >
                <span>{{ permission.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="displayGroups.length === 0" class="text-center py-8">
          <p class="text-gray-500">{{ t("roles.emptyPermissions") }}</p>
        </div>
      </Card>

      <div class="flex items-center justify-end gap-3">
        <Button variant="secondary" size="md" @click="goBack">
          {{ t("common.back") }}
        </Button>
        <Button
          variant="primary"
          size="md"
          @click="goToEdit"
          v-if="!isAdmin"
        >
          {{ t("common.edit") }}
        </Button>
      </div>
    </template>
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
