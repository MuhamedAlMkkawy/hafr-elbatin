import api from '@/services/api'

/**
 * Employees service – list (from GRP sync), get by id, update system-specific fields only.
 * List params: page, per_page, search, branch_id, department_id, sort_by, sort_direction, export (e.g. 'excel').
 */
export const employeeService = {
  /**
   * Get paginated employee list with optional filters
   * @param {Object} params - { page, per_page, search, branch_id, department_id, sort_by, sort_direction, export }
   * @returns {Promise<{ data: Array, meta: Object, links: Object }>}
   */
  async list(params = {}) {
    const response = await api.get('/employees', { params })
    return response.data
  },

  /**
   * Get single employee by id
   * @param {string|number} id
   * @returns {Promise<{ success: boolean, data: { employee: Object }, active_branch_id, current_user_branches }>}
   */
  async getById(id) {
    const response = await api.get(`/employees/${id}`)
    return response.data
  },

  /**
   * Update employee system-specific fields (role, work_system_type, mobile_attendance_enabled).
   * GRP-sourced data is read-only and must not be sent.
   * @param {string|number} id
   * @param {Object} data - { role: string, work_system_type: 'fixed'|'shift', mobile_attendance_enabled: boolean }
   */
  async update(id, data) {
    const response = await api.put(`/employees/${id}`, data)
    return response.data
  }
}

export default employeeService
