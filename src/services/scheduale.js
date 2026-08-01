import api, { crudService } from '@/services/api'

export const schedualeService = {
  ...crudService('scheduale'),

  /**
   * Get all scheduale for dropdowns
   */
  async listAll(params = {}) {
    const response = await api.get("/mobile/work-schedule", { params });
    return response.data
  }
}

export default schedualeService
