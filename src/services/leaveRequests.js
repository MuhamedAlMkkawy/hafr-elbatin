import api, { crudService } from '@/services/api'

// Base CRUD for /leave-requests
const baseLeaveRequests = crudService('leave-requests')

export const leaveRequestsService = {
  ...baseLeaveRequests,

  /**
   * Get all leave requests with pagination and filters
   * Example params: { page: 1, per_page: 20, employee_id: 1, status: 'pending', leave_type_id: 1, date_from: '2026-03-01', date_to: '2026-03-31' }
   */
  async list(params = {}) {
    console.log("params", params)
    const response = await api.get('/leave-requests', { params })
    return response.data
  },

  /**
   * Get single request
   */
  async get(id) {
    const response = await api.get(`/leave-requests/${id}`)
    return response.data
  },

  /**
   * Create new request
   */
  async create(data) {
    const response = await api.post('/leave-requests', data)
    return response.data
  },

  /**
   * Update a request
   */
  async update(id, data) {
    const response = await api.put(`/leave-requests/${id}`, data)
    return response.data
  },

  /**
   * Withdraw a request
   */
  async withdraw(id) {
    const response = await api.patch(`/leave-requests/${id}/withdraw`)
    return response.data
  },

  /**
   * Approve a request
   */
  async approve(id) {
    const response = await api.patch(`/leave-requests/${id}/approve`)
    return response.data
  },

  /**
   * Reject a request
   */
  async reject(id, reason = null) {
    const response = await api.patch(`/leave-requests/${id}/reject`, { rejection_reason: reason })
    return response.data
  },

  /**
   * Get leave balance for an employee
   */
  async getBalance(employeeId) {
    const response = await api.get('/leave-requests/balance', { params: { employee_id: employeeId } })
    return response.data
  },

  /**
   * Get available leave types
   */
  async getLeaveTypes() {
    const response = await api.get('/leave-requests/leave-types')
    return response.data
  },

  /**
   * Get available employees within scope
   */
  async getEmployees() {
    const response = await api.get('/leave-requests/employees')
    return response.data
  },

  /**
   * Get leave balance summary for an employee
   */
  async getBalanceSummary(employeeId) {
    const response = await api.get('/leave-requests/balance-summary', { params: { employee_id: employeeId } })
    return response.data
  },

  /**
   * Calculate leave duration
   */
  async calculateDuration(params) {
    const response = await api.get('/leave-requests/calculate-days', { params })
    return response.data
  }
}

export default leaveRequestsService
