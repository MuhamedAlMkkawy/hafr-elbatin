<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import SvgIcon from "./SvgIcon.vue";

const props = defineProps({
  items: {
    type: Array,
    required: true,
    // [ { label: '...', to: '...', icon: '...' }, ... ]
  },
});

const router = useRouter();

const navigate = (to) => {
  if (to) {
    router.push(to);
  }
};
</script>

<template>
  <nav class="flex mb-4" aria-label="Breadcrumb">
    <ol
      class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse"
    >
      <li
        v-for="(item, index) in items"
        :key="index"
        class="inline-flex items-center"
      >
        <div class="flex items-center">
          <SvgIcon
            v-if="index !== 0"
            name="chevron-right"
            classes="w-4 h-4 text-[#0E5F4A] mx-1 rtl:rotate-180"
          />

          <button
            v-if="item.to"
            @click="navigate(item.to)"
            class="cursor-pointer hover:underline inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors duration-200"
          >
            <SvgIcon
              v-if="item.icon"
              :name="item.icon"
              classes="w-4 h-4 me-2"
            />
            {{ item.label }}
          </button>

          <span v-else class="ms-1 text-sm font-medium text-gray-400 md:ms-2">
            <SvgIcon
              v-if="item.icon"
              :name="item.icon"
              classes="w-4 h-4 me-2"
            />
            {{ item.label }}
          </span>
        </div>
      </li>
    </ol>
  </nav>
</template>
