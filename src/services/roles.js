import api, { crudService } from '@/services/api'

// Base CRUD for /roles
const baseRoles = crudService('roles')

export const roleService = {
  ...baseRoles,

  /**
   * Get all roles with pagination
   * Example params: { page: 1, per_page: 15 }
   */
  async list(params = {}) {
    const response = await api.get('/roles', { params })
    return response.data
  }
}

// Permissions service – read‑only for now
export const permissionService = {
  /**
   * Get permissions grouped by module
   * Endpoint: GET /permissions/grouped
   */
  async grouped(params = {}) {
    const response = await api.get('/permissions/grouped', { params })
    return response.data
  }
}

export default roleService


