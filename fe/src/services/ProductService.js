import api from "../api/axios";

/**
 * Lấy danh sách sản phẩm (có phân trang & tìm kiếm)
 */
export const fetchProductsRequest = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/products?${query}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy chi tiết 1 sản phẩm theo slug
 */
export const fetchProductRequest = async (slug) => {
  try {
    const response = await api.get(`/products/${slug}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo mới sản phẩm
 */
export const createProductRequest = async (formData) => {
  try {
    const response = await api.post("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật sản phẩm
 */
export const updateProductRequest = async (slug, formData) => {
  try {
    if (formData instanceof FormData) {
      formData.append("_method", "PUT");
    }
    const response = await api.post(`/products/${slug}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa sản phẩm
 */
export const deleteProductRequest = async (slug) => {
  try {
    const response = await api.delete(`/products/${slug}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa nhiều sản phẩm
 */
export const bulkDeleteProductsRequest = async (ids) => {
  try {
    const response = await api.post("/products/bulk-delete", { ids });
    return response.data;
  } catch (error) {
    throw error;
  }
};
