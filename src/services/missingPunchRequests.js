import api, { crudService } from '@/services/api'

// Base CRUD for /missing-punch-requests
const baseMissingPunchRequests = crudService('missing-punch-requests')

export const missingPunchRequestsService = {
  ...baseMissingPunchRequests,

  /**
   * Get all missing punch requests with pagination and filters
   * Example params: { page: 1, per_page: 20, search: '', status: '', date_from: '', date_to: '' }
   */
  async list(params = {}) {
    const response = await api.get('/missing-punch-requests', { params })
    return response.data
  },

  /**
   * Get single request
   */
  async get(id) {
    const response = await api.get(`/missing-punch-requests/${id}`)
    return response.data
  },

  /**
   * Create new request
   */
  async create(data) {
    const response = await api.post('/missing-punch-requests', data)
    return response.data
  },

  /**
   * Update a request
   */
  async update(id, data) {
    const response = await api.put(`/missing-punch-requests/${id}`, data)
    return response.data
  },

  /**
   * Withdraw a request
   */
  async withdraw(id) {
    const response = await api.patch(`/missing-punch-requests/${id}/withdraw`)
    return response.data
  },

  /**
   * Approve a request
   */
  async approve(id) {
    const response = await api.patch(`/missing-punch-requests/${id}/approve`)
    return response.data
  },

  /**
   * Reject a request
   */
  async reject(id, reason = null) {
    const response = await api.patch(`/missing-punch-requests/${id}/reject`, { reason })
    return response.data
  },

  /**
   * Get available employees within scope
   */
  async getEmployees() {
    const response = await api.get('/missing-punch-requests/employees')
    return response.data
  }
}

export default missingPunchRequestsService
