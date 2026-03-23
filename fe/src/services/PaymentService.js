import api from "../api/axios";

export const fetchPaymentMethodsRequest = async () => {
    try {
        const response = await api.get("/payment-methods");
        return response.data;
    } catch (error) {
        throw error;
    }
};
