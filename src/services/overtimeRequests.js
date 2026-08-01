import api, { crudService } from '@/services/api'

// Base CRUD for /overtime-requests
const baseOvertimeRequests = crudService('overtime-requests')

export const overtimeRequestsService = {
  ...baseOvertimeRequests,

  /**
   * Get all overtime requests with pagination and filters
   * Example params: { page: 1, per_page: 20, search: '', status: '', date_from: '', date_to: '' }
   */
  async list(params = {}) {
    const response = await api.get('/overtime-requests', { params })
    return response.data
  },

  /**
   * Get single request
   */
  async get(id) {
    const response = await api.get(`/overtime-requests/${id}`)
    return response.data
  },

  /**
   * Create new request
   */
  async create(data) {
    const response = await api.post('/overtime-requests', data)
    return response.data
  },

  /**
   * Withdraw a request
   */
  async withdraw(id) {
    const response = await api.patch(`/overtime-requests/${id}/withdraw`)
    return response.data
  },

  /**
   * Cancel a request
   */
  async cancel(id) {
    const response = await api.patch(`/overtime-requests/${id}/cancel`)
    return response.data
  },

  /**
   * Update a request
   */
  async update(id, data) {
    const response = await api.put(`/overtime-requests/${id}`, data)
    return response.data
  },

  /**
   * Get available employees within scope
   */
  async getEmployees() {
    const response = await api.get('/overtime-requests/employees')
    return response.data
  }
}

export default overtimeRequestsService
