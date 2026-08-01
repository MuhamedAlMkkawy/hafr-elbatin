import api, { crudService } from "@/services/api";

export const profileService = {
  ...crudService("profile"),

  /**
   * Update the current user's device token for FCM notifications
   */
  updateDeviceToken(data) {
    return api.post("/profile/device-token", data);
  },

  /**
   * Get all profile for dropdowns
   */
  async getProfile() {
    const response = await api.get("/profile");
    return response.data;
  },
  
  
  async getProfileTimeLine(params){
    const response = await api.get("/audit-logs/timeline", { params });
    return response.data;
  },
  
  
  async updateProfile(data) {
    const response = await api.put("/profile" , data);
    return response.data;
  }
};

export default profileService;

