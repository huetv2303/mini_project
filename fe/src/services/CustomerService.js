import api from "../api/axios";

export const fetchCustomersRequest = async (params = {}) => {
    try {
        const query = new URLSearchParams(params).toString();
        const response = await api.get(`/customers?${query}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const fetchCustomerRequest = async (id) => {
    try {
        const response = await api.get(`/customers/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createCustomerRequest = async (data) => {
    try {
        const response = await api.post("/customers", data);
        return response.data;
    } catch (error) {
        throw error;
    }
};
