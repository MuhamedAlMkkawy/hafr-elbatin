<template>
  <div class="min-h-screen flex flex-col bg-[#f7f7f8] lg:flex-row">
    <Sidebar
      :open="isSidebarOpen"
      @close="isSidebarOpen = false"
      class="hidden lg:flex no-print"
    >
      <template #footer>
        <div
          class="text-xs text-gray-600 p-3 rounded-xl bg-gray-50 border border-gray-200"
        >
          <div class="font-semibold text-gray-900 mb-1">
            {{ auth.user?.name }}
          </div>
          <div class="text-gray-500">
            {{ auth.user?.email }}
          </div>
        </div>
      </template>
    </Sidebar>

    <Sidebar
      :open="isSidebarOpen"
      @close="isSidebarOpen = false"
      class="lg:hidden no-print"
    >
      <template #footer>
        <div
          class="text-xs text-gray-600 p-3 rounded-xl bg-gray-50 border border-gray-200"
        >
          <div class="font-semibold text-gray-900 mb-1">
            {{ auth.user?.name }}
          </div>
          <div class="text-gray-500">
            {{ auth.user?.email }}
          </div>
        </div>
      </template>
    </Sidebar>

    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 z-[105] bg-black/40 backdrop-blur-sm lg:hidden"
      @click="isSidebarOpen = false"
    />

    <div class="flex-1 flex flex-col min-w-0 lg:ml-0">
      <Navbar class="no-print">
        <template #leading>
          <button
            class="p-2 rounded-lg hover:bg-gray-100 transition lg:hidden cursor-pointer"
            @click="isSidebarOpen = true"
            aria-label="Open sidebar"
          >
            ☰
          </button>
        </template>
      </Navbar>
      <main class="p-4 sm:p-6 flex-1 overflow-auto print:overflow-visible print:h-auto print:static">
        <RouterView :key="locale" />
      </main>
    </div>

    <!-- Preview Mode Badge -->
    <PreviewBadge />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import Sidebar from "@/components/layout/Sidebar.vue";
import Navbar from "@/components/layout/Navbar.vue";
import PreviewBadge from "@/components/ui/PreviewBadge.vue";
import { useAuthStore } from "@/stores/auth";
import { useRoute, useRouter } from "vue-router";
import { useSettingsStore } from "@/stores/settings";
import { onMounted } from "vue";

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const isSidebarOpen = ref(false);

// ================> GET THE LOGO
const settingsStore = useSettingsStore();
const logoUrl = computed(() => settingsStore.logoUrl);

const handleLogout = () => {
  if (auth.logout()) {
    router.push({ name: "login" });
  }
};

onMounted(() => {
  // FCM service logic is handled centraly in bootstrapper (main.js)
});
</script>
