import api from './api';

export const attendanceHistoryService = {
  /**
   * Get attendance history records
   * @param {Object} params { search, date_from, date_to, page, per_page }
   */
  getAttendanceHistory: async (params = {}) => {
    const response = await api.get('/attendance-history', { params });
    return response.data;
  },

  /**
   * Get attendance history statistics
   * @param {Object} params { search, date_from, date_to }
   */
  getStatistics: async (params = {}) => {
    const response = await api.get('/attendance-history/statistics', { params });
    return response.data;
  }
};
