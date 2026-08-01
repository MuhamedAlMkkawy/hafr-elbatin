<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import SvgIcon from "@/components/ui/SvgIcon.vue";

const props = defineProps({
  unit: {
    type: Object,
    required: true,
  },
  depth: {
    type: Number,
    default: 0,
  },
  searchQuery: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["select"]);

const { t, locale } = useI18n();
const lang = computed(() => locale.value);

const isExpanded = ref(props.depth === 0); // Expand root by default
const hasChildren = computed(
  () => props.unit.allChildren && props.unit.allChildren.length > 0,
);

const containsMatch = (unit, query) => {
  const q = query.toLowerCase();
  const name = lang.value === "ar" ? (unit.name_ar || "") : (unit.name_en || "");

  if (name.toLowerCase().includes(q)) return true;

  if (unit.allChildren) {
    return unit.allChildren.some((child) => containsMatch(child, query));
  }

  return false;
};

// Auto-expand if search query matches children
watch(
  () => props.searchQuery,
  (newQuery) => {
    if (newQuery) {
      if (containsMatch(props.unit, newQuery)) {
        isExpanded.value = true;
      }
    } else {
      // Reset expansion when search is cleared, keeping root expanded
      isExpanded.value = props.depth === 0;
    }
  },
  { immediate: true },
);

const toggleExpand = () => {
  if (hasChildren.value && props.unit.level !== 0) {
    isExpanded.value = !isExpanded.value;
  }
};

const handleRowClick = () => {
  if (hasChildren.value) {
    toggleExpand();
  }
};

const handleViewDetails = (e) => {
  e.stopPropagation();
  emit("select", props.unit);
};

const getIcon = (type) => {
  switch (type) {
    case "secretary":
      return "structure_filled";
    case "office":
      return "branches";
    case "general_department":
      return "branches";
    case "agency":
      return "structure";
    case "department":
      return "branches";
    default:
      return "branches";
  }
};

const highlightText = (text, query) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(
    regex,
    '<span class="search-highlight">$1</span>',
  );
};

const displayName = computed(() => {
  const name = lang.value === "ar" ? (props.unit.name_ar || "") : (props.unit.name_en || "");
  return highlightText(name, props.searchQuery);
});
</script>

<template>
  <div class="org-tree-node" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
    <div
      class="flex items-center py-2.5 px-3 transition-colors group relative"
      :class="[
        props.unit.level === 0 ? 'sticky top-0 bg-white z-20' : 'node-content',
        isExpanded && hasChildren && props.unit.level === 1 ? 'bg-[#E7EFED] text-[#0E5F4A]' : '',
        hasChildren && props.unit.level !== 0 ? 'cursor-pointer' : '',
      ]"
      :style="{
        paddingRight: lang === 'ar' ? depth * 32 + 12 + 'px' : '12px',
        paddingLeft: lang === 'en' ? depth * 32 + 12 + 'px' : '12px',
      }"
      @click="handleRowClick"
    >
      <!-- Expand Icon -->
      <div
        class="w-6 h-6 flex items-center justify-center z-10"
        v-if="hasChildren && props.unit?.level !== 0"
        @click.stop="toggleExpand"
      >
        <template v-if="hasChildren && props.unit?.level !== 0">
          <div class="rounded-sm p-0.5 transition-colors">
            <SvgIcon
              name="structure_arrow"
              classes="transition-transform duration-200"
              :class="[
                !isExpanded ?  (lang === 'ar' ? 'rotate-90' : 'rotate-270') : 'rotate-0',
                isExpanded && props.unit.level === 1 ? 'text-[#0E5F4A]' : ''
              ]"
            />
          </div>
        </template>
      </div>

      <!-- Name -->
      <div class="flex-grow min-w-0">
        <p
          class="font-[600] truncate"
          :class="[
             props.unit?.level == 0
              ? 'text-[18px] text-[#0E5F4A]'
              : props.unit?.level == 1
                ? 'text-[16px]'
                : props.unit?.level == 2
                  ? 'text-[14px]'
                  : 'text-[12px] text-[#6C737F]',
             isExpanded && hasChildren && props.unit.level === 1 ? 'text-[#0E5F4A]' : props.unit.level === 0 ? 'text-[#0E5F4A]' : 'text-[#1F2A37]'
          ]"
          v-html="displayName"
        ></p>
      </div>

      <!-- Detail View Icon (Eye) -->
      <button
        v-if="props.unit.level !== 0"
        class="opacity-0 group-hover:opacity-100 cursor-pointer p-1.5 hover:bg-[#E7EFED] rounded-lg text-[#6C737F] hover:text-[#0E5F4A] flex items-center justify-center"
        @click="handleViewDetails"
        v-tooltip="t('common.view')"
      >
        <SvgIcon name="eye_square" />
      </button>
    </div>

    <!-- Children -->
    <div 
      v-if="hasChildren" 
      v-show="isExpanded" 
      class="node-children relative"
      :class="props.unit.level > 0 ? 'bg-[#F9FAFB]' : ''"
    >
      <!-- Vertical line for children -->
      <div
        v-if="isExpanded && props.unit.level > 0"
        class="absolute top-0 bottom-4 w-[1px] bg-[#9FBFB7] z-10"
        :style="{
          insetInlineStart: (depth * 32 + 35) + 'px'
        }"
      ></div>

      <StructureTreeItem
        v-for="child in unit.allChildren"
        :key="child.id"
        :unit="child"
        :depth="depth + 1"
        :search-query="searchQuery"
        @select="(u) => $emit('select', u)"
      />
    </div>
  </div>
</template>

<style scoped>
.org-tree-node {
  user-select: none;
}

.node-content:hover {
  background-color: rgba(14, 95, 74, 0.03);
}

:deep(.search-highlight) {
  background: #E7EFED !important;
  border-radius: 2px;
  padding: 0 1px;
}
</style>
