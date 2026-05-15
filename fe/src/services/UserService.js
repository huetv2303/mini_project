import api from "../api/axios";

export const fetchUsersRequest = async (params = {}) => {
    try {
        const query = new URLSearchParams(params).toString();
        const response = await api.get(`/users?${query}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const fetchUserRequest = async (id) => {
    try {
        const response = await api.get(`/users/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createUserRequest = async (data) => {
    try {
        const response = await api.post("/users", data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateUserRequest = async (id, data) => {
    try {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteUserRequest = async (id) => {
    try {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const fetchRolesRequest = async () => {
    try {
        const response = await api.get("/roles");
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateUserRoleRequest = async (id, roleId) => {
    try {
        const response = await api.put(`/users/${id}/role`, { role_id: roleId });
        return response.data;
    } catch (error) {
        throw error;
    }
};
