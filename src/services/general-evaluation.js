import api from "@/services/api";

/**
 * evaluations service – list (from GRP sync), get by id, update system-specific fields only.
 * List params: page, per_page, search, branch_id, department_id, sort_by, sort_direction, export (e.g. 'excel').
 */
export const generalEvaluationService = {
  /**
   * Get paginated evaluation list with optional filters
   * @param {Object} params - { page, per_page, search, branch_id, department_id, sort_by, sort_direction, export }
   * @returns {Promise<{ data: Array, meta: Object, links: Object }>}
   */
  async list(params = {}) {
    const response = await api.get("/general-estimate-forms", { params });
    return response.data;
  },

  // GET THE STATISTICS OF THE evaluation
  async listStatistics() {
    const response = await api.get("/general-estimate-forms/statistics");
    return response.data;
  },

  // HANDLE GET evaluationS OF THE EMPLOYEES
  async employeeList(params = {}) {
    const response = await api.get("/general-estimate-forms/employee", {
      params,
    });
    return response.data;
  },

  /**
   * Get single evaluation by id
   * @param {string|number} id
   * @returns {Promise<{ success: boolean, data: { evaluation: Object }, active_branch_id, current_user_branches }>}
   */
  async getById(id) {
    const response = await api.get(`/general-estimate-forms/${id}`);
    return response.data;
  },

  // HANDLE PUBLISH THE evaluation Evaluation
  async handleEvaluateEmployee(id, data) {
    const response = await api.post(
      `/general-estimate-forms/${id}/evaluate`,
      data, // directly
    );
    return response.data;
  },

  // HANDLE PUBLISH THE evaluation Evaluation
  async handleSendEvaluation(id) {
    const response = await api.post(`/general-estimate-forms/${id}/send`);
    return response.data;
  },

  // HANDLE ACCEPT THE Evaluation
  async handleAcceptEvaluation(id) {
    const response = await api.post(`/general-estimate-forms/${id}/accept`);
    return response.data;
  },

  // HANDLE REJECT THE Evaluation
  async handleRejectEvaluation(id, reason) {
    const response = await api.post(`/general-estimate-forms/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  // HANDLE SEND ALL EvaluationS
  async bulkSendEvaluations(IDs) {
    const response = await api.post(`/general-estimate-forms/bulk-send`, {
      form_ids: IDs,
    });
    return response.data;
  },

  // HANDLE BULK ACCEPT EVALUATIONS
  async bulkAcceptEvaluations(IDs) {
    const response = await api.post(`/general-estimate-forms/bulk-accept`, {
      form_ids: IDs,
    });
    return response.data;
  },

  // HANDLE BULK REJECT EVALUATIONS
  async bulkRejectEvaluations(IDs) {
    const response = await api.post(`/general-estimate-forms/bulk-reject`, {
      form_ids: IDs,
    });
    return response.data;
  },

  // HANDLE POST NEW evaluation
  async create(data) {
    const response = await api.post("/general-estimate-forms", data);
    return response.data;
  },

  /**
   * Update evaluation system-specific fields (role, work_system_type, mobile_attendance_enabled).
   * GRP-sourced data is read-only and must not be sent.
   * @param {string|number} id
   * @param {Object} data - { role: string, work_system_type: 'fixed'|'shift', mobile_attendance_enabled: boolean }
   */
  async update(id, data) {
    const response = await api.put(`/general-estimate-forms/${id}`, data);
    return response.data;
  },
};

export default generalEvaluationService;
