import api from "../api/axios";

const API_URL = "/promotions";

const PromotionService = {
  getAll: (params) => api.get(API_URL, { params }),
  getById: (id) => api.get(`${API_URL}/${id}`),
  create: (data) => api.post(API_URL, data),
  update: (id, data) => api.put(`${API_URL}/${id}`, data),
  delete: (id) => api.delete(`${API_URL}/${id}`),
  apply: (data) => api.post(`${API_URL}/apply`, data),
  getEligible: (data) => api.post(`${API_URL}/eligible`, data),
};

export default PromotionService;
