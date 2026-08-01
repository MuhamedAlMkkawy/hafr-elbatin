import api from "@/services/api";

const employeeDashboardService = {
  getDashboard(params) {
    return api.get("/employee-dashboard", { params });
  },
  getSummary(params) {
    return api.get("/employee-dashboard/summary", { params });
  },
  getBreakdown(params) {
    return api.get("/employee-dashboard/breakdown", { params });
  },
  getWeeklyTrend(params) {
    return api.get("/employee-dashboard/weekly-trend", { params });
  },
  getWeeklyHours(params) {
    return api.get("/employee-dashboard/weekly-hours", { params });
  },
};

export default employeeDashboardService;
