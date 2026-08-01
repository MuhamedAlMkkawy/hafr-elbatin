<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useAppToast } from "@/composables/useAppToast";
import Card from "@/components/ui/Card.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Icon from "@/components/ui/Icon.vue";
import SvgIcon from "@/components/ui/SvgIcon.vue";
import { organizationalUnitService } from "@/services/organizationalUnits";
import StructureTreeItem from "./components/StructureTreeItem.vue";

const { t, locale } = useI18n();
const lang = computed(() => locale.value);
const toast = useAppToast();

const structureData = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const appliedSearchQuery = ref("");
const selectedUnit = ref(null);

const loadStructure = async () => {
  loading.value = true;
  try {
    const response = await organizationalUnitService.getStructure();
    structureData.value = response.data.organizational_units || [];

    // If we have a selected unit, try to find it in the new data to update it
    if (selectedUnit.value) {
      updateSelectedUnit(structureData.value);
    }
  } catch (e) {
    console.error(e);
    toast.error(e);
  } finally {
    loading.value = false;
  }
};

const updateSelectedUnit = (units) => {
  for (const unit of units) {
    if (unit.id === selectedUnit.value.id) {
      selectedUnit.value = unit;
      return;
    }
    if (unit.allChildren && unit.allChildren.length > 0) {
      updateSelectedUnit(unit.allChildren);
    }
  }
};

const filteredStructure = computed(() => {
  if (!appliedSearchQuery.value) return structureData.value;
  const query = appliedSearchQuery.value.toLowerCase();

  const filterTree = (units) => {
    return units
      .map((unit) => {
        const name =
          lang.value === "ar" ? unit.name_ar || "" : unit.name_en || "";
        const isMatch = name.toLowerCase().includes(query);

        const children = unit.allChildren ? filterTree(unit.allChildren) : [];

        if (isMatch || children.length > 0) {
          return { ...unit, allChildren: children };
        }
        return null;
      })
      .filter(Boolean);
  };

  return filterTree(structureData.value);
});

const handleSearch = () => {
  appliedSearchQuery.value = searchQuery.value;
};

const clearSearch = () => {
  searchQuery.value = "";
  appliedSearchQuery.value = "";
};

const selectUnit = (unit) => {
  selectedUnit.value = unit;
};

onMounted(() => {
  loadStructure();
});

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toISOString().replace("T", " ").substring(0, 19);
};
</script>

<template>
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <h1 class="text-[20px] font-[600] text-[#000000]">
        {{ t("structure.title") }}
      </h1>
    </header>

    <!-- Search Section -->
    <Card>
      <template #header>
        <h2 class="text-[18px] font-[600] text-[#0D121C]">
          {{ t("structure.searchFilter") }}
        </h2>
      </template>

      <div class="space-y-4">
        <div>
          <label class="mb-2 block">
            {{ t("structure.searchPlaceholder") }}
          </label>
          <Input
            v-model="searchQuery"
            :placeholder="t('structure.searchPlaceholder')"
            size="md"
            class="w-full"
            @keyup.enter="handleSearch"
          >
            <template #suffix>
              <Icon name="magnifyingGlass" size="lg" class="text-[#0E5F4A]" />
            </template>
          </Input>
        </div>

        <div class="flex gap-2 justify-end mt-4">
          <Button class="w-32" variant="ghost" size="md" @click="clearSearch">
            {{ t("roles.resetFilters") }}
          </Button>
          <Button
            class="w-32"
            variant="primary"
            size="md"
            @click="handleSearch"
          >
            {{ t("common.search") }}
          </Button>
        </div>
      </div>
    </Card>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Tree View Section -->
      <div class="lg:col-span-2">
        <Card class="h-full min-h-[500px] !p-0">
          <div v-if="loading" class="flex justify-center py-12">
            <div
              class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
            ></div>
          </div>
          <div
            v-else-if="filteredStructure.length === 0"
            class="flex flex-col justify-center items-center h-full py-12"
          >
            <img
              src="@/assets/images/no_results.png"
              alt="Empty"
              width="200"
              class="mb-4"
            />
            <p>{{ t("common.noResults") }}</p>
          </div>
          <div v-else class="py-4">
            <StructureTreeItem
              v-for="unit in filteredStructure"
              :key="unit.id"
              :unit="unit"
              :depth="0"
              :search-query="appliedSearchQuery"
              @select="selectUnit"
            />
          </div>
        </Card>
      </div>

      <!-- Details Section -->
      <div class="lg:col-span-1 self-start">
        <Card class="h-full sticky top-6">
          <template #header>
            <h2 class="text-[18px] font-[600] text-[#0D121C]">
              {{ t("structure.departmentDetails") }}
            </h2>
          </template>

          <div v-if="selectedUnit" class="space-y-4">
            <div class="space-y-3">
              <label class="text-[12px] text-[#6C737F] block font-[500]">{{
                t("structure.departmentName")
              }}</label>
              <p class="text-[16px] font-[600] text-[#384250]">
                {{
                  lang === "ar" ? selectedUnit.name_ar : selectedUnit.name_en
                }}
              </p>
            </div>

            <div class="space-y-3">
              <label class="text-[12px] text-[#6C737F] block font-[500]">{{
                t("structure.municipalityName")
              }}</label>
              <p class="text-[16px] font-[600] text-[#384250]">
                {{ selectedUnit.municipality_name || "-" }}
              </p>
            </div>

            <div class="space-y-3">
              <label class="text-[12px] text-[#6C737F] block font-[500]">{{
                t("structure.departmentManager")
              }}</label>
              <p class="text-[16px] font-[600] text-[#384250]">
                {{ selectedUnit.department_manager_name || "-" }}
              </p>
            </div>

            <div class="space-y-3">
              <label class="text-[12px] text-[#6C737F] block font-[500]">{{
                t("structure.managerId")
              }}</label>
              <p class="text-[16px] font-[600] text-[#384250]">
                {{ selectedUnit.department_manager_civil_id || "-" }}
              </p>
            </div>

            <div class="space-y-3">
              <label class="text-[12px] text-[#6C737F] block font-[500]">{{
                t("structure.location")
              }}</label>
              <p class="text-[16px] font-[600] text-[#384250]">
                {{ selectedUnit.address || "-" }}
              </p>
            </div>

            <div class="space-y-3">
              <label class="text-[12px] text-[#6C737F] block font-[500]">{{
                t("structure.lastModified")
              }}</label>
              <p class="text-[16px] font-[600] text-[#384250]">
                {{ formatDate(selectedUnit.updated_at) }}
              </p>
            </div>
          </div>

          <div
            v-else
            class="flex flex-col items-center justify-center h-64 text-center"
          >
            <img src="@/assets/images/no_results.png" alt="Empty" width="200" />
          </div>
        </Card>
      </div>
    </div>
  </section>
</template>

<style scoped>
.search-highlight {
  background: rgba(255, 255, 255, 0.35);
  border-radius: 2px;
  padding: 0 1px;
}
</style>
