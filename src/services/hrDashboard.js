import api from "@/services/api";

class HrDashboardService {
  getDashboard(params) {
    return api.get("/hr-dashboard", { params });
  }

  getSummary(params) {
    return api.get("/hr-dashboard/summary", { params });
  }

  getAttendanceBreakdown(params) {
    return api.get("/hr-dashboard/attendance-breakdown", { params });
  }

  getPermissionsBreakdown(params) {
    return api.get("/hr-dashboard/permissions-breakdown", { params });
  }

  getMonthlyTrend(params) {
    return api.get("/hr-dashboard/monthly-trend", { params });
  }

  getLatestRequests() {
    return api.get("/hr-dashboard/latest-requests");
  }

  getAllRequests() {
    return api.get("/hr-dashboard/all-requests");
  }

  async getAccessibleDepartments(params = {}) {
    const response = await api.get("/departments", { params });
    const data = response.data?.data?.departments || response.data?.data || response.data?.departments || response.data || []
    return { ...response, data }
  }

  async getDashboardDepartments() {
    const response = await api.get("/hr-dashboard/accessible-departments");
    const data = response.data?.data?.departments || response.data?.data || response.data?.departments || response.data || []
    return { ...response, data }
  }
}

export default new HrDashboardService();
