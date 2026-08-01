import api, { crudService } from '@/services/api'

// Base CRUD for /ss-notification-settings
const baseSettings = crudService('ss-notification-settings')

export const ssNotificationSettingsService = {
  ...baseSettings,

  /**
   * Get all self service notification settings with pagination and filters
   */
  async list(params = {}) {
    const response = await api.get('/ss-notification-settings', { params })
    return response.data
  },

  /**
   * Get a single self service notification setting by ID
   */
  async show(id) {
    const response = await api.get(`/ss-notification-settings/${id}`)
    return response.data
  },

  /**
   * Update self service notification settings (using PATCH as per user request)
   */
  async update(id, data) {
    const response = await api.patch(`/ss-notification-settings/${id}`, data)
    return response.data
  },

  /**
   * Toggle self service notification active status
   */
  async toggleStatus(id) {
    const response = await api.patch(`/ss-notification-settings/${id}/toggle`)
    return response.data
  }
}

export default ssNotificationSettingsService
