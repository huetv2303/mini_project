import api from "../api/axios";

/**
 * Get current cart items from Redis
 */
export const getCartRequest = async () => {
    try {
        const response = await api.get("/cart");
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Add item to cart
 */
export const addToCartRequest = async (variant_id, quantity) => {
    try {
        const response = await api.post("/cart", { variant_id, quantity });
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Update item quantity
 */
export const updateCartQuantityRequest = async (variant_id, quantity) => {
    try {
        const response = await api.put(`/cart/${variant_id}`, { quantity });
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Remove item from cart
 */
export const removeFromCartRequest = async (variant_id) => {
    try {
        const response = await api.delete(`/cart/${variant_id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Clear full cart
 */
export const clearCartRequest = async () => {
    try {
        const response = await api.post("/cart/clear");
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Sync LocalStorage cart with Redis
 */
export const syncCartRequest = async (items) => {
    try {
        const response = await api.post("/cart/sync", { items });
        return response.data;
    } catch (error) {
        throw error;
    }
};
