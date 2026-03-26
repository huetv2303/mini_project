import api from "../api/axios";

export const fetchPaymentMethodsRequest = async () => {
    try {
        const response = await api.get("/payment-methods");
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createVNPayPaymentRequest = async (orderId) => {
    try {
        const response = await api.post("/payments/vnpay/create", { order_id: orderId });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getBankConfigRequest = async () => {
    try {
        const response = await api.get("/payments/bank-config");
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const verifyVNPayPaymentRequest = async (queryString) => {
    try {
        const response = await api.get(`/payments/vnpay/verify?${queryString}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};
