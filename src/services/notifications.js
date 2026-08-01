import api from './api';

export default {
  /**
   * Get all notifications with pagination and search
   * @param {Object} params - Query parameters (page, per_page, search, type, is_read)
   */
  getAll(params = {}) {
    return api.get('/notifications', { params });
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount() {
    return api.get('/notifications/unread-count');
  },

  /**
   * Get a single notification by ID
   * @param {string|number} id
   */
  getById(id) {
    return api.get(`/notifications/${id}`);
  },

  /**
   * Mark a specific notification as read
   * @param {string|number} id
   */
  markAsRead(id) {
    return api.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllRead() {
    return api.post('/notifications/mark-all-read');
  }
};
