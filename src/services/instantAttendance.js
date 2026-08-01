import api from './api';

export const instantAttendanceService = {
  /**
   * Get instant attendance history
   * @param {Object} params { date_from, date_to, employee_id, status, per_page, page }
   */
  getInstantAttendances: async (params = {}) => {
    const response = await api.get('/instant-attendances', { params });
    return response.data;
  },

  async sendInstantAttendance() {
    const response = await api.post('/instant-attendances/send');
    return response.data;
  }
};
