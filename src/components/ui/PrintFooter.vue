<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/stores/auth";

const props = defineProps({
  totalPages: {
    type: [Number, String],
    default: 1,
  },
});

const { t, locale } = useI18n();
const authStore = useAuthStore();

const lang = computed(() => locale.value);
const userName = computed(() => authStore.user?.name || "---");
</script>

<template>
  <div class="print-footer-container" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
    <div class="footer-divider"></div>

    <div class="footer-content">
      <!-- Page Numbers -->
      <div class="footer-item page-info">
        <span class="label">
          {{ t("print.footer.page") || "Page" }}
        </span>

        <span class="value">
          <span class="page-number"></span>
          /
          <span>{{ props.totalPages }}</span>
        </span>
      </div>

      <!-- User -->
      <div class="footer-item user-info">
        <span class="label">
          {{ t("print.footer.user") || "User" }}
        </span>
        <span class="value">{{ userName }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
html,
body {
  counter-reset: page;
}
.print-footer-container {
  width: 100%;
  padding: 0;
  background: white;
  color: #000;
  font-family: "IBMPlexSansArabic", sans-serif;
  font-weight: 400;
  font-size: 14px;
}

.footer-divider {
  height: 1px;
  background: #0e5f4a;
  width: 100%;
  margin: 3px 0;
}

.footer-content {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 14px;
  font-weight: 400;
  padding: 3px 0;
  gap: 20px;
}

.footer-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.label {
  font-weight: 400;
  color: #000;
}

.value {
  font-weight: 400;
  color: #000;
}

@media screen {
  .print-footer-container {
    display: none;
  }
}

@media print {
  .print-footer-container {
    display: block !important;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 8px 30px !important;
    background: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Browser auto-manages the 'page' counter — just consume it here */
  /* .page-number::before {
    content: counter(page);
  } */
}

@media print {
  @page {
    counter-increment: page;
  }

  body {
    counter-reset: page;
  }

  .page-number::before {
    content: counter(page);
  }
}
</style>
