import api from "../api/axios";

const OrderReturnService = {
  getAll: async (params) => {
    const response = await api.get("/order-returns", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/order-returns/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/order-returns", data);
    return response.data;
  },

  receive: async (id) => {
    const response = await api.patch(`/order-returns/${id}/receive`);
    return response.data;
  },

  refund: async (id) => {
    const response = await api.patch(`/order-returns/${id}/refund`);
    return response.data;
  },
};

export default OrderReturnService;
