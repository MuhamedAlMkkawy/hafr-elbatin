import api, { crudService } from '@/services/api'

// Base CRUD for /notification-settings
const baseSettings = crudService('notification-settings')

export const notificationSettingsService = {
  ...baseSettings,

  /**
   * Get all notification settings with pagination and filters
   */
  async list(params = {}) {
    const response = await api.get('/notification-settings', { params })
    return response.data
  },

  /**
   * Get a single notification setting by ID
   */
  async show(id) {
    const response = await api.get(`/notification-settings/${id}`)
    return response.data
  },

  /**
   * Update notification settings (using PATCH as per user request)
   */
  async update(id, data) {
    const response = await api.patch(`/notification-settings/${id}`, data)
    return response.data
  },

  /**
   * Toggle notification active status
   */
  async toggleStatus(id) {
    const response = await api.patch(`/notification-settings/${id}/toggle`)
    return response.data
  }
}

export default notificationSettingsService
