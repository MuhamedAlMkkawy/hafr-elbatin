import api from "@/services/api";

export const messageService = {
  // HANDLE POST NEW message
  async sendMessage(data) {
    const response = await api.post("/employee-messages", data);
    return response;
  },
};

export default messageService;
