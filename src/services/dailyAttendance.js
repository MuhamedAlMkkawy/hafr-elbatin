import api from './api';

export const dailyAttendanceService = {
  /**
   * Get daily attendance records
   * @param {Object} params { date, branch_id, department_id, employee_id, shift_id }
   */
  getDailyAttendance: async (params = {}) => {
    const response = await api.get('/daily-attendance', { params });
    return response.data;
  },

  /**
   * Get attendance by category
   * @param {string} type 'present' | 'absent' | 'overtime'
   * @param {Object} params
   */
  getCategoryAttendance: async (type, params = {}) => {
    const response = await api.get(`/daily-attendance/category/${type}`, { params });
    return response.data;
  },

  /**
   * Update attendance record (check-in/check-out)
   * @param {number|string} id 
   * @param {Object} data { check_in_time, check_out_time }
   */
  updateAttendance: async (id, data) => {
    const response = await api.patch(`/daily-attendance/${id}`, data);
    return response.data;
  }
};
