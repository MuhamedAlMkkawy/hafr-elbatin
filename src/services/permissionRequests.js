import api, { crudService } from '@/services/api'

// Base CRUD for /permission-requests
const basePermissionRequests = crudService('permission-requests')

export const permissionRequestsService = {
  ...basePermissionRequests,

  /**
   * Get all permission requests with pagination and filters
   * Example params: { search: 'enas', status: 'pending', date_from: '2026-03-01', date_to: '2026-03-31' }
   */
  async list(params = {}) {
    const response = await api.get('/permission-requests', { params })
    return response.data
  },

  /**
   * Get single request
   */
  async get(id) {
    const response = await api.get(`/permission-requests/${id}`)
    return response.data
  },

  /**
   * Create new request
   */
  async create(data) {
    const response = await api.post('/permission-requests', data)
    return response.data
  },

  /**
   * Update a request
   */
  async update(id, data) {
    const response = await api.put(`/permission-requests/${id}`, data)
    return response.data
  },

  /**
   * Withdraw a request
   */
  async withdraw(id) {
    const response = await api.patch(`/permission-requests/${id}/withdraw`)
    return response.data
  },

  /**
   * Approve a request
   */
  async approve(id) {
    const response = await api.patch(`/permission-requests/${id}/approve`)
    return response.data
  },

  /**
   * Reject a request
   */
  async reject(id, reason = null) {
    const response = await api.patch(`/permission-requests/${id}/reject`, { rejection_reason: reason })
    return response.data
  },

  /**
   * Get permission balance for an employee
   */
  async getBalance(employeeId, month = null) {
    const params = {}
    if (employeeId) params.employee_id = employeeId
    if (month) params.month = month
    const response = await api.get('/permission-requests/balance', { params })
    return response.data
  },

  /**
   * Get positive balance
   */
  async getEmployees() {
    const response = await api.get('/permission-requests/employees')
    return response.data
  },
  /**
   * Get positive balance
   */
  async getPositiveBalance() {
    const response = await api.get('/profile/positive-balance')
    return response.data
  }
}

export default permissionRequestsService
