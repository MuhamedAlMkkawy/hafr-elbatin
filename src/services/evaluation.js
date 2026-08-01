import api from "@/services/api";

/**
 * evaluations service – list (from GRP sync), get by id, update system-specific fields only.
 * List params: page, per_page, search, branch_id, department_id, sort_by, sort_direction, export (e.g. 'excel').
 */
export const evaluationService = {
  /**
   * Get paginated evaluation list with optional filters
   * @param {Object} params - { page, per_page, search, branch_id, department_id, sort_by, sort_direction, export }
   * @returns {Promise<{ data: Array, meta: Object, links: Object }>}
   */
  async list(params = {}) {
    const response = await api.get("/evaluation-forms", { params });
    return response.data;
  },

  // GET THE STATISTICS OF THE evaluation
  async listStatistics() {
    const response = await api.get("/evaluation-forms/statistics");
    return response.data;
  },

  // HANDLE GET evaluationS OF THE EMPLOYEES
  async employeeList(params = {}) {
    const response = await api.get("/evaluation-forms/employee", {
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
    const response = await api.get(`/evaluation-forms/${id}`);
    return response.data;
  },

  // HANDLE PUBLISH THE evaluation Evaluation
  async handleSendEvaluation(id) {
    const response = await api.post(`/evaluation-forms/${id}/send`);
    return response.data;
  },

  // HANDLE ACCEPT THE Evaluation
  async handleAcceptEvaluation(id) {
    const response = await api.post(`/evaluation-forms/${id}/accept`);
    return response.data;
  },

  // HANDLE SEND ALL EvaluationS
  async bulkSendEvaluations(IDs) {
    const response = await api.post(`/evaluation-forms/send-all`, {
      form_ids : IDs,
    });
    return response.data;
  },

  // HANDLE REJECT THE Evaluation
  async handleRejectEvaluation(id, reason) {
    const response = await api.post(`/evaluation-forms/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  // HANDLE BULK ACCEPT EVALUATIONS
  async bulkAcceptEvaluations(IDs) {
    const response = await api.post(`/evaluation-forms/bulk-accept`, {
      form_ids: IDs,
    });
    return response.data;
  },

  // HANDLE BULK REJECT EVALUATIONS
  async bulkRejectEvaluations(IDs) {
    const response = await api.post(`/evaluation-forms/bulk-reject`, {
      form_ids: IDs,
    });
    return response.data;
  },

  // HANDLE POST NEW evaluation
  async create(data) {
    const response = await api.post("/evaluation-forms", data);
    return response.data;
  },

  /**
   * Evaluate evaluation form items (targets and competencies).
   * @param {string|number} id
   * @param {Object} data - { evaluations: Array<{ item_id, actual_result, expected_result, comment }> }
   */
  async evaluate(id, data) {
    const response = await api.post(`/evaluation-forms/${id}/evaluate`, data);
    return response.data;
  },
};

export default evaluationService;
