<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import Logo from '@/assets/images/export_logo.png';

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  fromDate: {
    type: String,
    default: ''
  },
  toDate: {
    type: String,
    default: ''
  },
  month: {
    type: String,
    default: ''
  },
  year: {
    type: String,
    default: ''
  }
});

const { t, locale } = useI18n();
const authStore = useAuthStore();
const lang = computed(() => locale.value);

const userName = computed(() => authStore.user?.name || '---');

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-CA');
});

const currentTime = computed(() => {
  return new Date().toLocaleTimeString(lang.value === 'ar' ? 'ar-EG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

const ministryText = computed(() => ({
  line1: t('print.ministry.line1'),
  line2: t('print.ministry.line2'),
  line3: t('print.ministry.line3')
}));
</script>

<template>
  <div class="print-header-container" :dir="lang === 'ar' ? 'rtl' : 'ltr'">
    <div class="header-top">
      <!-- Ministry Section -->
      <div class="side-info ministry-info">
        <p class="line-1">{{ ministryText.line1 }}</p>
        <p class="line-2">{{ ministryText.line2 }}</p>
        <p class="line-3">{{ ministryText.line3 }}</p>
      </div>

      <!-- Logo Section -->
      <div class="logo-center">
        <img :src="Logo" alt="Logo" class="print-logo" />
      </div>

      <!-- Meta Section -->
      <div class="side-info user-meta">
        <div class="meta-row">
          <span class="label">{{ t('print.header.user') }}</span>
          <span class="value">{{ userName }}</span>
        </div>
        <div class="meta-row">
          <span class="label">{{ t('print.header.date') }}</span>
          <span class="value">{{ currentDate }}</span>
        </div>
        <div class="meta-row">
          <span class="label">{{ t('print.header.time') }}</span>
          <span class="value">{{ currentTime }}</span>
        </div>
      </div>
    </div>

    <div class="header-divider"></div>

    <!-- Subtitle Section (Moved below divider) -->
    <div class="header-subtitle" v-if="title || fromDate || toDate || month || year">
      <div class="subtitle-row" v-if="title">
        <div class="title-item">
          <span class="label">{{ t('print.header.reportTitle') }}</span>
          <span class="colon"></span>
          <span class="value">{{ title }}</span>
        </div>
      </div>
      <div class="subtitle-row dates" v-if="fromDate || toDate || month || year">
        <template v-if="fromDate && !toDate && !month && !year">
          <div class="date-item">
            <span class="label">{{ t('print.header.date') }}</span>
            <span class="colon"></span>
            <span class="value">{{ fromDate }}</span>
          </div>
        </template>
        <template v-else-if="month || year">
          <div class="date-item" v-if="month">
            <span class="label">{{ t('common.month') || 'الشهر' }}</span>
            <span class="colon">:</span>
            <span class="value">{{ month }}</span>
          </div>
          <div class="date-item" v-if="year">
            <span class="label">{{ t('common.year') || 'السنة' }}</span>
            <span class="colon">:</span>
            <span class="value">{{ year }}</span>
          </div>
        </template>
        <template v-else>
          <div class="date-item" v-if="fromDate">
            <span class="label">{{ t('print.header.fromDate') }}</span>
            <span class="colon">:</span>
            <span class="value">{{ fromDate }}</span>
          </div>
          <div class="date-item" v-if="toDate">
            <span class="label">{{ t('print.header.toDate') }}</span>
            <span class="colon">:</span>
            <span class="value">{{ toDate }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.print-header-container {
  width: 100%;
  padding: 0;
  background: white;
  color: #000;
  font-family: 'IBMPlexSansArabic', sans-serif;
  font-size: 12px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0;
}

.side-info {
  flex: 0 0 30%;
  font-size: 11px;
  line-height: 1.4;
}

.ministry-info {
  text-align: start;
}

.ministry-info p {
  margin: 0;
  padding: 0;
  line-height: 1.6;
}

.ministry-info .line-1 {
  color: #0E5F4A;
  font-weight: 600;
  margin-bottom: 2px;
}

.ministry-info .line-2,
.ministry-info .line-3 {
  color: #000000;
  font-weight: 500;
  margin-bottom: 2px;
}

.logo-center {
  flex: 0 0 40%;
  display: flex;
  justify-content: center;
  align-items: center;
  border-left: 1px solid #F1F1F1;
  border-right: 1px solid #F1F1F1;
}

.print-logo {
  height: 80px;
  width: auto;
  object-fit: contain;
}

.user-meta {
  text-align: end;
}

.meta-row {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin: 0;
  line-height: 1.6;
  margin-bottom: 2px;
}

.label {
  font-weight: 400;
  color: #000;
  font-size: 12px;
}

.value {
  font-weight: 400;
  color: #000;
  font-size: 12px;
}

.header-divider {
  height: 1px;
  background: #0E5F4A;
  width: 100%;
  margin: 4px 0;
}

.header-subtitle {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 0 20px 0;
  line-height: 1.6;
}

.subtitle-row {
  display: flex;
  justify-content: flex-start;
  gap: 20px;
}

.title-item, .date-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-item .label,
.date-item .label {
  color: #384250;
  font-weight: 500;
  font-size: 14px;
}

.colon {
  color: #384250;
  font-weight: 500;
  font-size: 14px;
}

.title-item .value,
.date-item .value {
  color: #000000;
  font-weight: 600;
  font-size: 14px;
}

.bottom-divider {
  margin-top: 10px !important;
}

@media screen {
  .print-header-container {
    display: none;
  }
}

@media print {
  .print-header-container {
    display: block !important;
    position: relative;
    width: 100% !important;
    padding: 10px 0 !important;
    background: white !important;
  }
  
  .header-divider {
    display: block !important;
    height: 1.5px !important;
    background: #0E5F4A !important;
    margin: 8px 0 !important;
    border: none !important;
    opacity: 1 !important;
  }

  .logo-center {
    border-left: 1px solid #F1F1F1 !important;
    border-right: 1px solid #F1F1F1 !important;
  }
}
</style>
