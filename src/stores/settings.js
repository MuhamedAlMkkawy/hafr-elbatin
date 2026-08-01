import { defineStore } from 'pinia'
import { generalSettingsService } from '@/services/generalSettings'
import { SUPPORT_LOCALES } from '@/i18n/messages'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: null,
    availableLanguages: [],
    availableTimezones: [],
    loading: false,
    loaded: false,
    error: null
  }),
  getters: {
    /** Full logo URL from API, or null if no logo set */
    logoUrl: (state) => {
      const logo = state.settings?.logo
      if (!logo) return null
      const base = import.meta.env.VITE_API_BASE_URL || 'https://back-end.att-batin.roqay.dev'
      const baseNormalized = base.replace(/\/api\/?$/, '')
      return logo.startsWith('http') ? logo : `${baseNormalized}${logo}`
    },
    systemName: (state) => (locale) => {
      const settings = state.settings || {}
      const fallbackAr = 'أمانة محافظة حفر الباطن'
      const fallbackEn = 'Hafr Al Batin Municipality'

      if (locale === SUPPORT_LOCALES.ar) {
        return settings.system_name_ar || settings.system_name_en || fallbackAr
      }

      return settings.system_name_en || settings.system_name_ar || fallbackEn
    },
    defaultLanguage: (state) =>
      state.settings?.default_language || SUPPORT_LOCALES.ar
  },
  actions: {
    async fetchSettings() {
      if (this.loaded || this.loading) return
      this.loading = true
      this.error = null
      try {
        const res = await generalSettingsService.get()
        const data = res?.data || res
        this.settings = data?.settings || {}
        this.availableLanguages = data?.available_languages || []
        this.availableTimezones = data?.available_timezones || []
        this.loaded = true
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    }
  }
})

