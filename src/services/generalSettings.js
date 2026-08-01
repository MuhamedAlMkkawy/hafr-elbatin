import api from '@/services/api'

const BASE = '/general-settings'

/**
 * General settings – system-wide configuration (system info, language, timezone, logo).
 */
export const generalSettingsService = {
  /**
   * GET /general-settings
   * @returns {Promise<{ success, data: { settings, available_languages, available_timezones }, active_branch_id, current_user_branches }>}
   */
  async get() {
    const response = await api.get(BASE)
    return response.data
  },

  /**
   * PUT /general-settings – send FormData with:
   * system_name_ar, system_name_en, phone, email, website, location, default_language, timezone, logo (file, optional)
   * @param {FormData} formData
   */
  async update(formData) {
    const response = await api.put(BASE, formData)
    return response.data
  },

  /**
   * DELETE /general-settings/logo – remove current logo
   */
  async deleteLogo() {
    const response = await api.delete(`${BASE}/logo`)
    return response.data
  }
}

export default generalSettingsService
