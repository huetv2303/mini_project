import api from "../api/axios";

const API_URL = "/tax-rates";

const TaxRateService = {
  getAll: () => api.get(API_URL),
  getActive: () => api.get(`${API_URL}/active`),
  getById: (id) => api.get(`${API_URL}/${id}`),
  getStatistics: (params) => api.get(`${API_URL}/statistics`, { params }),
  create: (data) => api.post(API_URL, data),
  update: (id, data) => api.put(`${API_URL}/${id}`, data),
  delete: (id) => api.delete(`${API_URL}/${id}`),
};

export default TaxRateService;
