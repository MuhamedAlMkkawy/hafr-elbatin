import api, { crudService } from "./api";

const resource = "audit-logs";

export const auditLogService = {
    ...crudService(resource),

    /**
     * Get all audit logs with pagination and filters
     */
    list: async (params = {}) => {
        const response = await api.get(`/${resource}`, { params });
        return response.data;
    },

    /**
     * Get audit log statistics
     * @param {Object} params - { period, date_from, date_to }
     */
    getStatistics: async (params = {}) => {
        const response = await api.get(`/${resource}/statistics`, { params });
        return response.data;
    },
    
    /**
     * Get available filters for audit logs
     */
    getFilters: async () => {
        const response = await api.get(`/${resource}/filters`);
        return response.data;
    }
};
