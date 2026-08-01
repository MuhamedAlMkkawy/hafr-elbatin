import api from '@/services/api'

export const externalMissionsService = {
  /**
   * Get all external missions with pagination and filters
   */
  async list(params = {}) {
    const response = await api.get('/external-missions', { params })
    return response.data
  },

  /**
   * Get single external mission
   */
  async get(id) {
    const response = await api.get(`/external-missions/${id}`)
    return response.data
  },

  /**
   * Calculate working days for a mission
   */
  async calculateDays(params = {}) {
    const response = await api.get('/external-missions/calculate-days', { params })
    return response.data
  },

  /**
   * Create new external mission
   */
  async create(data) {
    const response = await api.post('/external-missions', data)
    return response.data
  },

  /**
   * Update an external mission
   */
  async update(id, data) {
    const response = await api.put(`/external-missions/${id}`, data)
    return response.data
  },

  /**
   * Withdraw an external mission
   */
  async withdraw(id) {
    const response = await api.patch(`/external-missions/${id}/withdraw`)
    return response.data
  },

  /**
   * Cancel an external mission
   */
  async cancel(id) {
    const response = await api.patch(`/external-missions/${id}/cancel`)
    return response.data
  },

  /**
   * Approve an external mission
   */
  async approve(id) {
    const response = await api.patch(`/external-missions/${id}/approve`)
    return response.data
  },

  /**
   * Reject an external mission
   */
  async reject(id, reason = '') {
    const response = await api.patch(`/external-missions/${id}/reject`, { reason })
    return response.data
  },

  /**
   * Get available employees within scope
   */
  async getEmployees() {
    const response = await api.get('/external-missions/employees')
    return response.data
  }
}

export default externalMissionsService
