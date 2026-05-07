import api from "../api/axios";

/**
 * Lấy danh sách đánh giá của sản phẩm
 */
export const fetchCommentsRequest = async (productId) => {
  try {
    const response = await api.get(`/products/${productId}/comments`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Gửi đánh giá mới
 */
export const storeCommentRequest = async (data) => {
  try {
    const response = await api.post("/comments", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Kiểm tra quyền đánh giá
 */
export const checkCanReviewRequest = async (productId) => {
  try {
    const response = await api.get(`/comments/can-review/${productId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa đánh giá
 */
export const deleteCommentRequest = async (commentId) => {
  try {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
