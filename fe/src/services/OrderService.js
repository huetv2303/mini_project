import api from "../api/axios";

export const fetchOrdersRequest = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/orders?${query}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchOrderRequest = async (id) => {
  try {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createOrderRequest = async (orderData) => {
  try {
    const response = await api.post("/orders", orderData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateOrderRequest = async (id, orderData) => {
  try {
    const response = await api.put(`/orders/${id}`, orderData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Hủy đơn hàng
 */
export const cancelOrderRequest = async (id) => {
  try {
    const response = await api.patch(`/orders/${id}/cancel`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bulkUpdateOrdersRequest = async (data) => {
  try {
    const response = await api.post("/orders/bulk-update", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchPaymentMethodsRequest = async () => {
  try {
    const response = await api.get("/payment-methods");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updatePaymentMethodRequest = async (id, paymentMethodId) => {
  try {
    const response = await api.patch(`/orders/${id}/update-payment-method`, {
      payment_method_id: paymentMethodId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
