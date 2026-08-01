import api from '@/services/api'

const managerDashboardService = {
  getDashboard(params) {
    return api.get('/manager-dashboard', { params })
  },
  getSummary(params) {
    return api.get('/manager-dashboard/summary', { params })
  },
  getBreakdown(params) {
    return api.get('/manager-dashboard/breakdown', { params })
  },
  getWeeklyTrend(params) {
    return api.get('/manager-dashboard/weekly-trend' , {params})
  },
  getLatestCheckins() {
    return api.get('/manager-dashboard/latest-checkins')
  },
  getPendingLeaveRequests() {
    return api.get('/manager-dashboard/pending-leave-requests')
  },
  getLeaveRequests() {
    return api.get('/manager-dashboard/leave-requests')
  },
  getAssignedDepartments() {
    return api.get('/manager-dashboard/assigned-departments')
  },
  approveLeaveRequest(id) {
    return api.patch(`/manager-dashboard/leave-requests/${id}/approve`)
  },
  rejectLeaveRequest(id) {
    return api.patch(`/manager-dashboard/leave-requests/${id}/reject`)
  }
}

export default managerDashboardService
