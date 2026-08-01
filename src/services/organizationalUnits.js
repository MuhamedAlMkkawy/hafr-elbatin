import api from '@/services/api'

export const organizationalUnitService = {
  /**
   * Get the organizational structure
   * @param {Object} params - Search and filter parameters
   */
  async getStructure(params = {}) {
    const response = await api.get('/organizational-units', { params })
    return response.data
  }
}

export default organizationalUnitService
