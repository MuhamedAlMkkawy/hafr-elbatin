<template>
  <div v-if="(!items || items.length === 0) && !loading" class="m-auto">
    <div
      :colspan="headers.length"
      class="px-5 py-10 text-center text-sm text-gray-500"
    >
      <div class="flex flex-col items-center justify-center gap-2">
        <img
          src="@/assets/images/no_results.png"
          alt="no_results"
          class="mx-1 max-w-[201px] max-h-[163px] mb-3"
        />
        <span
          class="text-[#6C737F] leading-7 text-[14px] font-[600] max-w-[400px]"
          >{{ emptyText || $t("common.no_results") }}</span
        >
      </div>
    </div>
  </div>
  <div
    class="overflow-x-auto border border-[#D2D6DB] rounded-md"
    :class="wrapperClass"
    :style="maxHeight ? { maxHeight: maxHeight, overflowY: 'auto' } : {}"
    v-else
  >
    <table
      class="min-w-full divide-y divide-[#D2D6DB] border-separate border-spacing-0"
      :class="tableClass"
    >
      <thead class="bg-[#F3F4F6] sticky top-0 z-[60]">
        <tr>
          <th
            v-for="(header, index) in headers"
            :key="header.key"
            class="px-5 py-4 text-xs font-semibold text-[#384250] uppercase text-start border-e border-b border-[#D2D6DB]"
            :class="[
              header.headerClass,
              {
                'max-w-[50px] truncate px-5 py-4':
                  index === 0 && (isIdFirst || isExpand),
              },
              { 'no-print': header.key === 'actions' },
            ]"
          >
            <slot :name="`header-${header.key}`" :header="header">
              {{ header.label }}
            </slot>
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-[#D2D6DB]">
        <template v-if="loading">
          <tr v-for="n in 3" :key="n" class="animate-pulse">
            <td
              v-for="(header, index) in headers"
              :key="header.key"
              class="px-5 py-5 whitespace-nowrap border-b border-[#D2D6DB]"
              :class="{
                'bg-[#F3F4F6] border-e border-[#D2D6DB] max-w-[50px]':
                  index === 0 && (isIdFirst || isExpand),
              }"
            >
              <div class="h-4 bg-gray-100 rounded w-full"></div>
            </td>
          </tr>
        </template>
        <template v-else>
          <slot name="body" :items="monthItems" :headers="headers">
            <template
              v-for="(item, index) in monthItems"
              :key="item.id || index"
            >
              <tr
                class="hover:bg-gray-50/80 transition-colors group"
                :class="getRowClass(item, index)"
                :data-row-index="index"
              >
                <td
                  v-for="(header, hIndex) in headers"
                  :key="header.key"
                  :class="[
                    'px-5 py-4 whitespace-nowrap text-sm text-start border-b border-[#D2D6DB] max-w-[250px] whitespace-nowrap overflow-hidden text-ellipsis',
                    {
                      'bg-[#F3F4F6] border-e border-[#D2D6DB] w-[52px] truncate':
                        hIndex === 0 && isIdFirst,
                    },
                    {
                      'bg-[#F3F4F6] border-e border-[#D2D6DB] w-[40px] truncate':
                        hIndex === 0 && isExpand,
                    },
                    { 'no-print': header.key === 'actions' },
                    header.cellClass,
                    overflowVisible ? '!overflow-visible' : 'overflow-hidden',
                  ]"
                >
                  <slot
                    :name="`cell-${header.key}`"
                    :item="item"
                    :index="index"
                    :toggle-expand="() => toggleExpand(index)"
                    :is-expanded="isExpanded(index)"
                  >
                    {{ getCellValue(item, header.key) }}
                  </slot>
                </td>
              </tr>
              <tr v-if="isExpanded(index)">
                <td
                  :colspan="headers.length"
                  class="p-0 border-b border-[#D2D6DB]"
                >
                  <slot name="expand" :item="item" :index="index"></slot>
                </td>
              </tr>
            </template>
          </slot>
        </template>
      </tbody>
      <!-- class="bg-[#F9FAFB]" -->
      <tfoot v-if="$slots.footer">
        <slot name="footer" />
      </tfoot>
    </table>
  </div>
  <!-- Pagination -->
  <div
    v-if="totalPages > 1"
    class="flex items-center justify-center gap-4 px-5 py-6 border-t border-gray-100"
  >
    <Pagination
      :model-value="page"
      :total-pages="totalPages"
      @update:model-value="$emit('change-page', $event)"
    />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import Pagination from "./Pagination.vue";

const props = defineProps({
  headers: {
    type: Array,
    required: true,
  },
  items: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  loadingText: {
    type: String,
    default: "Loading...",
  },
  // Pagination props
  page: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
  rowClass: {
    type: [String, Function, Object],
    default: "",
  },
  maxHeight: {
    type: String,
    default: "",
  },
  tableClass: {
    type: String,
    default: "",
  },
  emptyText: {
    type: String,
    default: "",
  },
  wrapperClass: {
    type: String,
    default: "",
  },
  overflowVisible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["change-page"]);

const expandedRows = ref([]);

const toggleExpand = (index) => {
  const pos = expandedRows.value.indexOf(index);
  if (pos === -1) {
    expandedRows.value.push(index);
  } else {
    expandedRows.value.splice(pos, 1);
  }
};

const isExpanded = (index) => expandedRows.value.includes(index);

const getRowClass = (item, index) => {
  if (typeof props.rowClass === "function") {
    return props.rowClass(item, index);
  }
  return props.rowClass;
};

const isIdFirst = computed(() => {
  return (
    props.headers.length > 0 &&
    (props.headers[0].key === "id" || props.headers[0].key === "index")
  );
});

const isExpand = computed(() => {
  return props.headers.length > 0 && props.headers[0].key === "expand";
});

const monthItems = computed(() => props.items);

const getCellValue = (item, key) => {
  if (!key) return "";
  return key
    .split(".")
    .reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : ""), item);
};
</script>

<style scoped>
@media print {
  /* Remove scrolling container behavior */
  :deep(.overflow-x-auto) {
    overflow: visible !important;
  }

  /* Remove borders & spacing that may push content */
  :deep(table) {
    width: 100% !important;
    table-layout: auto !important;
  }

  /* Prevent breaking inside table */
  :deep(tr) {
    page-break-inside: avoid !important;
  }

  /* Remove pagination area completely */
  :deep(.pagination) {
    display: none !important;
  }
}
</style>
