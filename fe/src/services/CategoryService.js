import api from "../api/axios";

export const fetchCategoriesRequest = async ({ all = false, search = "", page = 1 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (all) params.append("all", "true");
    if (search) params.append("search", search);
    if (!all && page) params.append("page", page);

    const url = `/categories?${params.toString()}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchCategoryRequest = async (slug) => {
  try {
    const response = await api.get(`/categories/${slug}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createCategoryRequest = async (categoryData) => {
  try {
    const response = await api.post("/categories", categoryData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCategoryRequest = async (slug, categoryData) => {
  try {
    // Với FormData + Image trong Laravel, dùng POST kèm _method: PUT
    categoryData.append("_method", "PUT");
    const response = await api.post(`/categories/${slug}`, categoryData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteCategoryRequest = async (slug) => {
  try {
    const response = await api.delete(`/categories/${slug}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bulkDeleteCategoryRequest = async (ids) => {
  try {
    const response = await api.post("/categories/bulk-delete", { ids });
    return response.data;
  } catch (error) {
    throw error;
  }
};
