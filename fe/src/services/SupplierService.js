import api from "../api/axios";

/**
 * Lấy danh sách nhà cung cấp (có tìm kiếm & phân trang)
 */
export const fetchSuppliersRequest = async ({ all = false, search = "", page = 1 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (all) params.append("all", "true");
    if (search) params.append("search", search);
    if (!all && page) params.append("page", page);

    const url = `/suppliers?${params.toString()}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy chi tiết một nhà cung cấp theo slug
 */
export const fetchSupplierRequest = async (slug) => {
  try {
    const response = await api.get(`/suppliers/${slug}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo nhà cung cấp mới
 */
export const createSupplierRequest = async (formData) => {
  try {
    const response = await api.post("/suppliers", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật nhà cung cấp
 */
export const updateSupplierRequest = async (slug, formData) => {
  try {
    // Laravel Multipart Form Data via POST with _method: PUT
    if (formData instanceof FormData) {
      formData.append("_method", "PUT");
    }

    const response = await api.post(`/suppliers/${slug}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa một nhà cung cấp
 */
export const deleteSupplierRequest = async (slug) => {
  try {
    const response = await api.delete(`/suppliers/${slug}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa hàng loạt nhà cung cấp
 */
export const bulkDeleteSupplierRequest = async (ids) => {
  try {
    const response = await api.post("/suppliers/bulk-delete", { ids });
    return response.data;
  } catch (error) {
    throw error;
  }
};
