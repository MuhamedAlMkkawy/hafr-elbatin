import api, { crudService } from '@/services/api'

// Base CRUD for /attendance-locations
const baseLocations = crudService('attendance-locations')

export const attendanceLocationService = {
  ...baseLocations,

  /**
   * Get all attendance locations with pagination and filters
   */
  async list(params = {}) {
    const response = await api.get('/attendance-locations', { params })
    return response.data
  },
  /**
   * Toggle attendance location status
   */
  async toggleStatus(id) {
    const response = await api.patch(`/attendance-locations/${id}/toggle`)
    return response.data
  },
  /**
   * Organizational units list (for selection dropdown)
   */
  async listOrganizationalUnits(params = {}) {
    const response = await api.get('/organizational-units/list', { params })
    return response.data
  }
}

export default attendanceLocationService
