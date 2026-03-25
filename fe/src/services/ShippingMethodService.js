import api from "../api/axios";

const ShippingMethodService = {
  getAll: () => {
    return api.get("/shipping-methods");
  },

  getActive: () => {
    return api.get("/shipping-methods/active");
  },

  getById: (id) => {
    return api.get(`/shipping-methods/${id}`);
  },

  create: (data) => {
    return api.post("/shipping-methods", data);
  },

  update: (id, data) => {
    return api.put(`/shipping-methods/${id}`, data);
  },

  delete: (id) => {
    return api.delete(`/shipping-methods/${id}`);
  },
};

export default ShippingMethodService;
