import api from "../api/axios";

/**
 * Get Wishlist items
 */
export const getWishlistRequest = async () => {
  try {
    const response = await api.get("/wishlist");
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Toggle Wishlist (Add or Remove)
 */
export const toggleWishlistRequest = async (product_id) => {
  try {
    const response = await api.post("/wishlist/toggle", { product_id });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Clear full wishlist
 */
export const clearWishlistRequest = async () => {
  try {
    const response = await api.post("/wishlist/clear");
    return response.data;
  } catch (error) {
    throw error;
  }
};
