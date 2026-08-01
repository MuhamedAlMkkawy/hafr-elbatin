import api, { crudService } from '@/services/api'

export const shiftService = {
  ...crudService('shifts'),

  /**
   * Get all shifts with pagination and filters
   */
  async list(params = {}) {
    const response = await api.get('/shifts', { params })
    return response.data
  },

  /**
   * Schedules
   */
  async getSchedules(shiftId, params = {}) {
    const response = await api.get(`/shifts/${shiftId}/schedules`, { params })
    return response.data
  },

  async getSchedule(shiftId, scheduleId) {
    const response = await api.get(`/shifts/${shiftId}/schedules/${scheduleId}`)
    return response.data
  },

  async createSchedule(shiftId, data) {
    const response = await api.post(`/shifts/${shiftId}/schedules`, data)
    return response.data
  },

  async updateSchedule(shiftId, scheduleId, data) {
    const response = await api.put(`/shifts/${shiftId}/schedules/${scheduleId}`, data)
    return response.data
  },

  async deleteSchedule(shiftId, scheduleId) {
    const response = await api.delete(`/shifts/${shiftId}/schedules/${scheduleId}`)
    return response.data
  }
}

export default shiftService
