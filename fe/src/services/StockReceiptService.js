import api from "../api/axios";

export const fetchStockReceipts = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/stock-receipts?${query}`);
  return response.data;
};

export const createStockReceipt = async (data) => {
  const response = await api.post("/stock-receipts", data);
  return response.data;
};

export const fetchStockReceiptDetails = async (id) => {
  const response = await api.get(`/stock-receipts/${id}`);
  return response.data;
};

export const confirmStockReceipt = async (id) => {
  const response = await api.post(`/stock-receipts/${id}/confirm`);
  return response.data;
};

export const cancelStockReceipt = async (id) => {
  const response = await api.post(`/stock-receipts/${id}/cancel`);
  return response.data;
};
