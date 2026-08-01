import api from '@/services/api'

/**
 * memos service – list (from GRP sync), get by id, update system-specific fields only.
 * List params: page, per_page, search, branch_id, department_id, sort_by, sort_direction, export (e.g. 'excel').
 */
export const memoService = {
  /**
   * Get paginated memo list with optional filters
   * @param {Object} params - { page, per_page, search, branch_id, department_id, sort_by, sort_direction, export }
   * @returns {Promise<{ data: Array, meta: Object, links: Object }>}
   */
  async list(params = {}) {
    const response = await api.get('/internal-memos', { params })
    return response.data
  },


  // HANDLE GET MEMOS OF THE EMPLOYEES
  async employeeList(params = {}) {
    const response = await api.get('/internal-memos/employee', { params })
    return response.data
  },

  /**
   * Get single memo by id
   * @param {string|number} id
   * @returns {Promise<{ success: boolean, data: { memo: Object }, active_branch_id, current_user_branches }>}
   */
  async getById(id) {
    const response = await api.get(`/internal-memos/${id}`)
    return response.data
  },


    /**
   * Toggle status
   */
  async toggleStatus(id) {
    const response = await api.patch(`/internal-memos/${id}/toggle-status`)
    return response.data
  },
  

  // HANDLE LIST ALL THE CLASSIFICATIONS
  async getClassifications () {
    const response = await api.get('internal-memos/classifications')
    return response.data
  },
  
  
  // HANDLE PUBLISH THE MEMO
  async handlePublish(id){
    const response = await api.patch(`/internal-memos/${id}/publish`)
    return response.data  
  },
  
  
  // HANDLE DELETE THE MEMO
  async handleDelete(id){
    const response = await api.delete(`/internal-memos/${id}`)
    return response.data  
  },



  // HANDLE POST NEW MEMO
  async create(data) {
    const response = await api.post('/internal-memos', data)
    return response.data
  },


  // HANDLE UPLOAD  MEMO FILES IN RESPONCE
  async upload_memo_files(id , data) {
    const response = await api.post(`/internal-memos/${id}/upload-response`, data);
    return response.data
  },



  // HANDLE CONFIRM MEMO
  async handleConfirmMemo(id){
    const response = await api.post(`/internal-memos/${id}/confirm`);
    return response?.data
  },

  /**
   * Update memo system-specific fields (role, work_system_type, mobile_attendance_enabled).
   * GRP-sourced data is read-only and must not be sent.
   * @param {string|number} id
   * @param {Object} data - { role: string, work_system_type: 'fixed'|'shift', mobile_attendance_enabled: boolean }
   */
  async update(id, data) {
    const response = await api.put(`/internal-memos/${id}`, data)
    return response.data
  }
}

export default memoService
