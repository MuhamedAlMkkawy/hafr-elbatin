import api from './api';

const attendanceReportsService = {
  listReports(params) {
    return api.get('/attendance-reports', { params });
  },

  generateReport(year, month) {
    return api.post('/attendance-reports/generate', { year, month });
  },

  getReportDetails(id, params) {
    return api.get(`/attendance-reports/${id}`, { params });
  },

  sendNotification(detailId) {
    return api.patch(`/attendance-reports/details/${detailId}/send-notification`);
  },

  getWorkingHoursReport(params) {
    return api.get('/attendance-reports/working-hours', { params });
  },

  getLeaveBalancesSummary(params) {
    return api.get('/attendance-reports/leave-balances/summary', { params });
  },

  getLeaveBalancesDepartmentEmployees(departmentId, params) {
    return api.get(`/attendance-reports/leave-balances/departments/${departmentId}/employees`, { params });
  },

  getEmployeeLeaveBalances(employeeId) {
    return api.get(`/attendance-reports/leave-balances/employees/${employeeId}`);
  },

  getPermissionBalancesSummary(params) {
    return api.get('/attendance-reports/permission-balances/summary', { params });
  },

  getPermissionBalancesDepartmentEmployees(departmentId, params) {
    return api.get(`/attendance-reports/permission-balances/departments/${departmentId}/employees`, { params });
  },

  getAttendanceSummary(params) {
    return api.get('/attendance-reports/summary', { params });
  },

  getAttendanceDetails(employeeId, params) {
    return api.get(`/attendance-reports/summary/${employeeId}/details`, { params });
  },

  getAttendanceLogs(params) {
    return api.get('/attendance-reports/logs', { params });
  }
};

export default attendanceReportsService;

