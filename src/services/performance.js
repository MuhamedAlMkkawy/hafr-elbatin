import api from '@/services/api'

/**
 * performances service – list (from GRP sync), get by id, update system-specific fields only.
 * List params: page, per_page, search, branch_id, department_id, sort_by, sort_direction, export (e.g. 'excel').
 */
export const performanceService = {
  /**
   * Get paginated performance list with optional filters
   * @param {Object} params - { page, per_page, search, branch_id, department_id, sort_by, sort_direction, export }
   * @returns {Promise<{ data: Array, meta: Object, links: Object }>}
   */
  async list(params = {}) {
    const response = await api.get("/performance-charters", { params });
    return response.data;
  },

  // GET THE STATISTICS OF THE PERFORMANCE
  async listStatistics() {
    const response = await api.get("/performance-charters/statistics");
    return response.data;
  },

  // HANDLE GET performanceS OF THE EMPLOYEES
  async employeeList(params = {}) {
    const response = await api.get("/performance-charters/employee", {
      params,
    });
    return response.data;
  },

  /**
   * Get single performance by id
   * @param {string|number} id
   * @returns {Promise<{ success: boolean, data: { performance: Object }, active_branch_id, current_user_branches }>}
   */
  async getById(id) {
    const response = await api.get(`/performance-charters/${id}`);
    return response.data;
  },

  // HANDLE SEND THE PERFORMANCE CHARTER
  async handleSendCharter(id) {
    const response = await api.patch(`/performance-charters/${id}/send`);
    return response.data;
  },

  // HANDLE ACCEPT THE CHARTER
  async handleAcceptCharter(id) {
    const response = await api.patch(`/performance-charters/${id}/accept`);
    return response.data;
  },

  // HANDLE SEND ALL CHARTERS
  async bulkSendCharters(IDs) {
    const response = await api.patch(`/performance-charters/send-all`, {
      IDs,
    });
    return response.data;
  },

  // HANDLE REJECT THE CHARTER
  async handleRejectCharter(id, reason) {
    const response = await api.patch(`/performance-charters/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  // HANDLE POST NEW performance
  async create(data) {
    const response = await api.post("/performance-charters", data);
    return response.data;
  },

  /**
   * Update performance system-specific fields (role, work_system_type, mobile_attendance_enabled).
   * GRP-sourced data is read-only and must not be sent.
   * @param {string|number} id
   * @param {Object} data - { role: string, work_system_type: 'fixed'|'shift', mobile_attendance_enabled: boolean }
   */
  async update(id, data) {
    const response = await api.put(`/performance-charters/${id}`, data);
    return response.data;
  },

  // HANDLE UPDATE  ITEMS (TARGETS & COMPETENCIES) FOR A CHARTER
  async updateItems(id, data) {
    const response = await api.post(`/performance-charters/${id}/items`, data);
    return response.data;
  },

  // // HANDLE POST ITEMS (TARGETS & COMPETENCIES) FOR A CHARTER
  // async sendItems(id, data) {
  //   const response = await api.post(`/performance-charters/${id}/items`, data);
  //   return response.data;
  // },

  // HANDLE ASSIGN CHARTER TO MULTIPLE EMPLOYEES
  async assign(data) {
    const response = await api.post("/performance-charters/assign", data);
    return response.data;
  },
};

export default performanceService
