import api from "../api/axios";

export const fetchPaymentMethodsRequest = async () => {
  try {
    const response = await api.get("/payment-methods");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchPaymentMethodRequest = async (id) => {
  try {
    const response = await api.get(`/payment-methods/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createPaymentMethodRequest = async (data) => {
  try {
    const response = await api.post("/payment-methods", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updatePaymentMethodRequest = async (id, data) => {
  try {
    const response = await api.post(`/payment-methods/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      params: {
        _method: "PUT",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deletePaymentMethodRequest = async (id) => {
  try {
    const response = await api.delete(`/payment-methods/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
