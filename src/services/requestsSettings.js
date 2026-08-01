import api from '@/services/api'

export const requestsSettingsService = {
  /**
   * Get permission settings
   */
  async getPermissions() {
    const response = await api.get('/requests-settings/permissions')
    return response.data
  },

  /**
   * Update permission settings
   */
  async updatePermissions(data) {
    const response = await api.put('/requests-settings/permissions', data)
    return response.data
  },

  /**
   * Get overtime settings
   */
  async getOvertime() {
    const response = await api.get('/requests-settings/overtime')
    return response.data
  },

  /**
   * Update overtime settings
   */
  async updateOvertime(data) {
    const response = await api.put('/requests-settings/overtime', data)
    return response.data
  },
}

export default requestsSettingsService
