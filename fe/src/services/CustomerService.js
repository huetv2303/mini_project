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

export const updateCustomerRequest = async (id, data) => {
    try {
        let payload = data;
        let config = {};

        if (data instanceof FormData) {
            data.append("_method", "PUT");
            payload = data;
            config = {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            };
            const response = await api.post(`/customers/${id}`, payload, config);
            return response.data;
        }

        const response = await api.put(`/customers/${id}`, payload);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteCustomerRequest = async (id) => {
    try {
        const response = await api.delete(`/customers/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};
