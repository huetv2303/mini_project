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
 * Lấy danh sách đánh giá của tôi
 */
export const fetchMyCommentsRequest = async (page = 1) => {
  try {
    const response = await api.get("/comments/my-comments", {
      params: { page },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật đánh giá của tôi
 */
export const updateCommentRequest = async (id, data) => {
  try {
    const response = await api.put(`/comments/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Admin: Lấy toàn bộ đánh giá (kèm filter)
 */
export const fetchAdminCommentsRequest = async (params = {}) => {
  try {
    const response = await api.get("/comments/admin/all", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Admin: Phản hồi đánh giá
 */
export const replyCommentRequest = async (id, admin_reply) => {
  try {
    const response = await api.patch(`/comments/${id}/reply`, { admin_reply });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Admin: Ẩn/Hiện đánh giá
 */
export const toggleVisibilityRequest = async (id) => {
  try {
    const response = await api.patch(`/comments/${id}/toggle-visibility`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa đánh giá (Dùng chung cho cả Admin và Chủ sở hữu)
 */
export const deleteCommentRequest = async (commentId) => {
  try {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
