import api, { crudService } from '@/services/api'

// Base CRUD for /work-systems
const baseWorkSystems = crudService('work-systems')

export const workSystemService = {
  ...baseWorkSystems,

  /**
   * Get all work systems with pagination and filters
   */
  async list(params = {}) {
    const response = await api.get('/work-systems', { params })
    return response.data
  },

  /**
   * Toggle work system status
   */
  async toggleStatus(id, confirm = true) {
    const response = await api.patch(`/work-systems/${id}/toggle`, { confirm })
    return response.data
  },

  /**
   * Check for conflicts when enabling/creating a system
   */
  async checkConflict(type) {
    const response = await api.post('/work-systems/check-conflict', { type })
    return response.data
  }
}

export default workSystemService
