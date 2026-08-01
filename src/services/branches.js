import api, { crudService } from '@/services/api'

// Base CRUD for /branches
const baseBranches = crudService('branches')

export const branchService = {
  ...baseBranches,

  /**
   * Get all branches with pagination and filters
   * Example params: { page: 1, per_page: 15, search: '', status: '', sort_by: 'name', sort_direction: 'asc' }
   */
  async list(params = {}) {
    const response = await api.get('/branches', { params })
    return response.data
  },

  /**
   * Toggle branch status
   */
  async toggleStatus(id) {
    const response = await api.patch(`/branches/${id}/toggle`)
    return response.data
  }
}

export default branchService
