import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  // Allow env override, default to production API
  baseURL:
    import.meta.env.VITE_API_BASE_URL || "https://back-end.att-batin.roqay.dev/api",
  timeout: 10000,
  headers: {
    // Axios will automatically set Content-Type based on the request body
  },
});

export const setupInterceptors = (store) => {
  // Add auth token
  api.interceptors.request.use(
    (config) => {
      // Use the token from the store
      const token = store.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add branch_id header if available
      const branchId = store.branchId;
      if (branchId) {
        config.headers['branch_id'] = branchId;
      }

      // Add X-Branch-Id if in preview mode
      if (store.isPreviewMode && store.previewBranchId) {
        config.headers['X-Branch-Id'] = store.previewBranchId;
      }

      // Force branch_id in params/data for managers as requested
      if (store.isManager && branchId) {
        // Handle GET params
        if (config.params) {
          if ('branch_id' in config.params) config.params.branch_id = branchId;
        }
        
        // Handle POST/PUT data
        if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
          if ('branch_id' in config.data) config.data.branch_id = branchId;
        } else if (config.data instanceof FormData) {
          if (config.data.has('branch_id')) config.data.set('branch_id', branchId);
        }
      }

      // Add Accept-Language header
      const lang = localStorage.getItem('user-locale') || 'ar';
      config.headers['Accept-Language'] = lang;

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // flag to prevent multiple redirect calls in a single frame
  let isRedirecting = false;
  let redirectTimeout = null;

  // Error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle Network Errors (no response from server)
      if (!error.response) {
        console.error("Network Error or Timeout:", error.message);
        // We don't automatically logout for network errors, 
        // but we should ensure the error is properly rejected
        return Promise.reject(error);
      }

      const status = error.response?.status;
      const isLoginRequest = error.config?.url?.includes("/login");
      
      // 401: Unauthorized
      // 419: Laravel Session Expired (CSRF)
      // 403: Forbidden (could indicate session changed or permission lost)
      if ((status === 401 || status === 419 || status === 403) && !isLoginRequest) {
        if (!isRedirecting) {
          isRedirecting = true;
          
          // Safety: reset redirecting flag after 10 seconds to avoid permanent lock
          if (redirectTimeout) clearTimeout(redirectTimeout);
          redirectTimeout = setTimeout(() => {
            isRedirecting = false;
          }, 10000);
          
          // Determine the correct path based on current locale
          const currentPath = window.location.pathname;
          const isEn = currentPath.startsWith('/en');
          const unauthorizedPath = (isEn ? '/en/401' : '/401') + `?code=${status}`;
          
          // Only redirect if we're not already on the 401 page
          if (!currentPath.includes('/401')) {
            console.warn(`Unauthorized (${status}). Redirecting to ${unauthorizedPath}`);
            window.location.href = unauthorizedPath;
          } else {
            // Reset redirect flag if we're already on 401
            isRedirecting = false;
            if (redirectTimeout) clearTimeout(redirectTimeout);
          }
        }
      }

      if (status >= 500) {
        // Server error - could optionally redirect to error page
        // console.error("Server Error:", error.response.data);
      }
      
      return Promise.reject(error);
    },
  );
};

export const crudService = (resource) => {
  const basePath = `/${resource}`;

  return {
    getAll: async (params = {}) => {
      const defaultParams = {
        sort_by: 'created_at',
        sort_direction: 'desc',
        ...params
      };
      const response = await api.get(basePath, { params: defaultParams });
      return response.data;
    },

    getById: async (id) => {
      const response = await api.get(`${basePath}/${id}`);
      return response.data;
    },

    create: async (data) => {
      const response = await api.post(basePath, data);
      return response.data;
    },

    update: async (id, data) => {
      // If data is FormData, some backends prefer POST with _method=PUT
      if (data && typeof data === 'object' && data.constructor?.name === 'FormData') {
        if (!data.has('_method')) {
          data.append('_method', 'PUT');
        }
        const response = await api.post(`${basePath}/${id}`, data);
        return response.data;
      }
      const response = await api.put(`${basePath}/${id}`, data);
      return response.data;
    },

    patch: async (id, data) => {
      const response = await api.patch(`${basePath}/${id}`, data);
      return response.data;
    },

    delete: async (id) => {
      const response = await api.delete(`${basePath}/${id}`);
      return response.data;
    },
  };
};
export default api;
