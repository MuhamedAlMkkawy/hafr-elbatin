import api from './api'

export default {
    /**
     * Get initial dashboard data (summary, charts, branches, departments)
     * @param {Object} params - { branch_id, department_id, from_date, to_date }
     */
    getDashboard(params = {}) {
        return api.get('/admin-dashboard', { params })
    },

    /**
     * Get summary data
     * @param {Object} params - { branch_id, department_id, date }
     */
    getSummary(params = {}) {
        return api.get('/admin-dashboard/summary', { params })
    },

    /**
     * Get department attendance chart data
     * @param {Object} params - { branch_id, from_date, to_date }
     */
    getDepartmentAttendanceChart(params = {}) {
        return api.get('/admin-dashboard/department-attendance-chart', { params })
    },

    /**
     * Get yearly requests trend chart data
     * @param {Object} params - { branch_id, department_id, year }
     */
    getYearlyRequestsTrend(params = {}) {
        return api.get('/admin-dashboard/yearly-requests-trend', { params })
    },

    /**
     * Get accessible branches
     */
    getAccessibleBranches() {
        return api.get('/admin-dashboard/accessible-branches')
    },

    /**
     * Get accessible departments for common use
     * @param {Object} params - { branch_id }
     */
    async getAccessibleDepartments(params = {}) {
        const response = await api.get('/departments', { params })
        const data = response.data?.data?.departments || response.data?.data || response.data?.departments || response.data || []
        return { ...response, data }
    },

    /**
     * Get accessible departments specific to dashboard
     * @param {Object} params - { branch_id }
     */
    async getDashboardDepartments(params = {}) {
        const response = await api.get('/admin-dashboard/accessible-departments', { params })
        const data = response.data?.data?.departments || response.data?.data || response.data?.departments || response.data || []
        return { ...response, data }
    }
}
