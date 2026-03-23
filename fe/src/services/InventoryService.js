import api from "../api/axios";

export const fetchInventoryHistory = async (variantId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/inventory/${variantId}/history?${query}`);
  return response.data;
};

export const adjustInventory = async (data) => {
  const response = await api.post("/inventory/adjust", data);
  return response.data;
};

export const importInventory = async (data) => {
  const response = await api.post("/inventory/import", data);
  return response.data;
};

export const fetchMonthlyReport = async (month, year, page = 1) => {
  const response = await api.get(`/inventory/report?month=${month}&year=${year}&page=${page}`);
  return response.data;
};
