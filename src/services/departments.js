import api, { crudService } from '@/services/api'

export const departmentService = {
  ...crudService('departments'),

  /**
   * Get all departments for dropdowns
   */
  async listAll(params = {}) {
    const response = await api.get('/departments', { params })
    return response.data
  }
}

export default departmentService
