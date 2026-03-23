import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  deleteCategoryRequest,
  fetchCategoriesRequest,
  bulkDeleteCategoryRequest,
} from "../../../services/CategoryService";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import {
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  CheckSquare,
  Square,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/common/ConfirmModal";

// Tự viết hàm debounce để không cần cài thư viện lodash
const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const CategoryListPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // States for Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    lastPage: 1,
    perPage: 3,
  });

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal Xóa
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    slug: null,
    ids: [], // Dùng cho xóa hàng loạt
    name: "",
    mode: "single", // 'single' hoặc 'bulk'
  });

  const toggleRow = (id) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  // Lấy danh sách ID hiện tại có thể xóa (không có con)
  const deletableIdsOnPage = useMemo(() => {
    const ids = [];
    const flatten = (items) => {
      items.forEach((item) => {
        if (!item.children_count || item.children_count === 0) {
          ids.push(item.id);
        }
        if (item.children && item.children.length > 0) {
          flatten(item.children); // Xóa hàng loạt có tìm sâu không?
          // Thường chỉ nên xóa những gì đang hiện trên UI hoặc cấp 1
        }
      });
    };
    flatten(categories);
    return ids;
  }, [categories]);

  const selectAllOnPage = () => {
    if (
      selectedIds.size === deletableIdsOnPage.length &&
      deletableIdsOnPage.length > 0
    ) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletableIdsOnPage));
    }
  };

  const toggleSelect = (id, hasChildren) => {
    if (hasChildren) {
      toast.error("Không thể chọn danh mục này vì có danh mục con!");
      return;
    }
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const getCategories = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const res = await fetchCategoriesRequest({ page, search });
      const rawData = res?.data;
      const items = rawData?.data || [];
      const meta = rawData?.meta || {};

      setCategories(items);
      setPagination({
        total: meta.total || 0,
        lastPage: meta.last_page || 1,
        perPage: meta.per_page || 10,
      });
      // Clear selection when navigating or searching
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((val) => {
      setCurrentPage(1);
      getCategories(1, val);
    }, 500),
    [],
  );

  useEffect(() => {
    getCategories(currentPage, searchTerm);
  }, [currentPage]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    debouncedSearch(val);
  };

  // Mở modal xóa đơn
  const openDeleteModal = (slug, name, hasChildren) => {
    if (hasChildren) {
      toast.error(`Không thể xóa "${name}" vì vẫn còn danh mục con!`);
      return;
    }
    setModalConfig({
      isOpen: true,
      slug,
      name,
      mode: "single",
    });
  };

  // Mở modal xóa hàng loạt
  const openBulkDeleteModal = () => {
    if (selectedIds.size === 0) return;
    setModalConfig({
      isOpen: true,
      ids: Array.from(selectedIds),
      name: `${selectedIds.size} danh mục đã chọn`,
      mode: "bulk",
    });
  };

  const confirmAction = async () => {
    try {
      if (modalConfig.mode === "single") {
        const res = await deleteCategoryRequest(modalConfig.slug);
        toast.success(res.message || "Đã xóa thành công");
      } else {
        const res = await bulkDeleteCategoryRequest(modalConfig.ids);
        if (res.status === "warning") {
          toast(res.message, { icon: "⚠️", duration: 5000 });
        } else {
          toast.success(res.message || "Đã xóa hàng loạt thành công");
        }
      }
      getCategories(currentPage, searchTerm);
    } catch (error) {
      const msg = error.response?.data?.message || "Thao tác thất bại";
      toast.error(msg);
    }
  };

  const renderCategoryRow = (category, depth = 0) => {
    const hasChildren = category.children_count > 0;
    const isExpanded = expandedRows.has(category.id);
    const isSelected = selectedIds.has(category.id);

    return (
      <React.Fragment key={category.id}>
        <tr
          className={`border-b border-gray-50 transition-all group ${isSelected ? "bg-indigo-50/30" : "hover:bg-gray-50/50"}`}
        >
          <td className="w-12 px-6 py-4">
            <button
              onClick={() => toggleSelect(category.id, hasChildren)}
              className={`transition-colors ${hasChildren ? "opacity-20 cursor-not-allowed" : "text-indigo-500 hover:text-indigo-600"}`}
              title={
                hasChildren ? "Không thể xóa danh mục có con" : "Chọn để xóa"
              }
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5 text-gray-300" />
              )}
            </button>
          </td>
          <td className="px-6 py-4">
            <div
              className="flex items-center"
              style={{ paddingLeft: `${depth * 1.5}rem` }}
            >
              <div className="flex items-center gap-2">
                {category.children && category.children.length > 0 ? (
                  <button
                    onClick={() => toggleRow(category.id)}
                    className="p-1 hover:bg-indigo-100 rounded-lg text-indigo-400"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <div className="w-6" />
                )}
                <span
                  className={`font-semibold ${depth === 0 ? "text-gray-900" : "text-gray-600"} ${isSelected ? "text-indigo-700" : ""}`}
                >
                  {category.name}
                </span>
                {depth === 0 && (
                  <span className="px-2 py-0.5 bg-black/5 text-black text-[10px] font-bold uppercase rounded-md">
                    Gốc
                  </span>
                )}
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="text-sm text-gray-400 font-medium font-mono">
              /{category.slug}
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex justify-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${hasChildren ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"}`}
              >
                {category.children_count || 0} mục con
              </span>
            </div>
          </td>
          <td className="px-3 py-4 text-center">
            {category.image ? (
              <img
                src={
                  category.image
                    ? `${import.meta.env.VITE_URL_IMAGE}/${category.image}`
                    : "/no-image.png"
                }
                alt={category.name}
                className="w-10 h-10 rounded-xl object-cover shadow-sm mx-auto border border-gray-100 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div></div>
            )}
          </td>
          <td className="px-6 py-4">
            <div className="flex justify-end items-center gap-2">
              <Link
                to={`/admin/categories/create?parent_id=${category.id}`}
                className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Thêm con"
              >
                <Plus className="w-5 h-5" />
              </Link>
              <Link
                to={`/admin/categories/edit/${category.slug}`}
                className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                title="Sửa"
              >
                <Edit2 className="w-5 h-5" />
              </Link>
              <button
                onClick={() =>
                  openDeleteModal(category.slug, category.name, hasChildren)
                }
                className={`p-2 rounded-xl transition-all ${hasChildren ? "text-gray-200 cursor-not-allowed" : "text-red-400 hover:text-red-600 hover:bg-red-50"}`}
                title="Xóa"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </td>
        </tr>
        {isExpanded &&
          category.children &&
          category.children.map((child) => renderCategoryRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <AdminLayout>
      <div className="animate-in fade-in duration-500 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">
              Danh mục sản phẩm
            </h1>
            <p className="mt-1 text-sm text-gray-500 font-medium italic">
              Quản lý hệ thống phân tầng và thuộc tính cửa hàng.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button
                onClick={openBulkDeleteModal}
                className="inline-flex items-center justify-center px-6 py-3 bg-red-500 text-white text-sm font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg active:scale-95 animate-in slide-in-from-right-4"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Xóa {selectedIds.size} mục đã chọn
              </button>
            )}
            <Link
              to="/admin/categories/create"
              className="inline-flex items-center justify-center px-4 py-3 bg-black text-white text-sm font-bold rounded-lg hover:bg-black/90 transition-all shadow-lg active:scale-95"
            >
              <Plus className="w-5 h-5 mr-2" /> Thêm danh mục
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-black/5 overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm theo tên hoặc đường dẫn..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all shadow-sm"
              />
            </div>
            {selectedIds.size > 0 && (
              <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                Đang chọn {selectedIds.size} danh mục
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="w-12 px-6 py-5">
                    <button
                      onClick={selectAllOnPage}
                      className="text-gray-400 hover:text-indigo-500 transition-colors"
                    >
                      {selectedIds.size === deletableIdsOnPage.length &&
                      deletableIdsOnPage.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-indigo-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider leading-loose">
                    Tên danh mục
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider leading-loose">
                    Đường dẫn
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center leading-loose">
                    Cấu trúc
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center leading-loose">
                    Ảnh
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right leading-loose">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <Loader2 className="w-10 h-10 text-black animate-spin mx-auto mb-2" />
                      <span className="text-gray-400 font-bold text-xs uppercase ">
                        Đang tải dữ liệu...
                      </span>
                    </td>
                  </tr>
                ) : categories.length > 0 ? (
                  categories.map((category) => renderCategoryRow(category))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 font-bold">
                        Không có dữ liệu danh mục.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {!loading && categories.length > 0 && pagination.lastPage > 1 && (
            <div className="p-6 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
              <span className="text-sm text-gray-500 font-medium">
                {/* Tổng số:{" "}
                <span className="text-black font-bold">{pagination.total}</span>{" "}
                danh mục cha */}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className={`p-2 rounded-xl border border-gray-200 transition-all ${currentPage === 1 ? "opacity-50 cursor-not-allowed bg-gray-50" : "bg-white hover:bg-gray-50 active:scale-95"}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(pagination.lastPage)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === i + 1 ? "bg-black text-white shadow-lg" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={currentPage === pagination.lastPage}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className={`p-2 rounded-xl border border-gray-200 transition-all ${currentPage === pagination.lastPage ? "opacity-50 cursor-not-allowed bg-gray-50" : "bg-white hover:bg-gray-50 active:scale-95"}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popup xác nhận xóa (Dùng chung cho cả đơn và hàng loạt) */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={
          modalConfig.mode === "single" ? "Xóa danh mục?" : "Xóa hàng loạt?"
        }
        message={
          modalConfig.mode === "single"
            ? `Bạn có chắc muốn xóa "${modalConfig.name}"? Hành động này không thể hoàn tác.`
            : `Bạn đã chọn ${selectedIds.size} danh mục. Hệ thống sẽ chỉ xóa những mục không có danh mục con. Bạn có chắc chắn?`
        }
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={confirmAction}
        type="danger"
      />
    </AdminLayout>
  );
};

export default CategoryListPage;
