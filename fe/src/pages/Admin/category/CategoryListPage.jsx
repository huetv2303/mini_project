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
import Pagination from "../../../components/common/Pagination";

// Tự viết hàm debounce để không cần cài thư viện lodash
const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

import { useAuth } from "../../../context/AuthContext";

const CategoryListPage = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("categories.manage");

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // States for Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [pagination, setPagination] = useState({
    total: 0,
    lastPage: 1,
    perPage: 15,
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

  const getCategories = async (page = 1, search = "", perPageCount = 15) => {
    try {
      setLoading(true);
      const res = await fetchCategoriesRequest({
        page,
        search,
        per_page: perPageCount,
      });
      const rawData = res?.data;
      const items = rawData?.data || [];
      const meta = rawData?.meta || {};

      setCategories(items);
      setPagination({
        total: meta.total || 0,
        lastPage: meta.last_page || 1,
        perPage: meta.per_page || perPageCount,
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

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const debouncedSearch = useCallback(
    debounce((val, perPage) => {
      setCurrentPage(1);
      getCategories(1, val, perPage);
    }, 500),
    [],
  );

  useEffect(() => {
    getCategories(currentPage, searchTerm, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    debouncedSearch(val, itemsPerPage);
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
          className={`border-b border-slate-100 transition-all group ${isSelected ? "bg-blue-50/20" : "hover:bg-slate-50/50"}`}
        >
          {canManage && (
            <td className="w-12 px-6 py-4">
              <button
                onClick={() => toggleSelect(category.id, hasChildren)}
                className={`transition-colors ${hasChildren ? "opacity-20 cursor-not-allowed" : "text-blue-500 hover:text-blue-600"}`}
                title={
                  hasChildren ? "Không thể xóa danh mục có con" : "Chọn để xóa"
                }
              >
                {isSelected ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5 text-slate-300" />
                )}
              </button>
            </td>
          )}
          <td className="px-6 py-4">
            <div
              className="flex items-center"
              style={{ paddingLeft: `${depth * 1.5}rem` }}
            >
              <div className="flex items-center gap-2">
                {category.children && category.children.length > 0 ? (
                  <button
                    onClick={() => toggleRow(category.id)}
                    className="p-1 hover:bg-blue-100 rounded-lg text-blue-400"
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
                  className={`font-semibold ${depth === 0 ? "text-slate-800" : "text-slate-600"} ${isSelected ? "text-blue-700" : ""}`}
                >
                  {category.name}
                </span>
                {depth === 0 && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-md border border-blue-100/50">
                    Gốc
                  </span>
                )}
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="text-sm text-slate-400 font-semibold font-mono">
              /{category.slug}
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex justify-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${hasChildren ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-slate-100 text-slate-400"}`}
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
                className="w-10 h-10 rounded-xl object-cover shadow-sm mx-auto border border-slate-100 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div></div>
            )}
          </td>
          {canManage && (
            <td className="px-6 py-4">
              <div className="flex justify-end items-center gap-2">
                <Link
                  to={`/admin/categories/create?parent_id=${category.id}`}
                  className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  title="Thêm con"
                >
                  <Plus className="w-5 h-5" />
                </Link>
                <Link
                  to={`/admin/categories/edit/${category.slug}`}
                  className="p-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                  title="Sửa"
                >
                  <Edit2 className="w-5 h-5" />
                </Link>
                <button
                  onClick={() =>
                    openDeleteModal(category.slug, category.name, hasChildren)
                  }
                  className={`p-2 rounded-xl transition-all ${hasChildren ? "text-slate-200 cursor-not-allowed" : "text-rose-500 hover:text-rose-600 hover:bg-rose-50"}`}
                  title="Xóa"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </td>
          )}
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
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Danh mục sản phẩm
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium italic">
              Quản lý hệ thống phân tầng và thuộc tính cửa hàng.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canManage && selectedIds.size > 0 && (
              <button
                onClick={openBulkDeleteModal}
                className="inline-flex items-center justify-center px-6 py-3 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95 animate-in slide-in-from-right-4"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Xóa {selectedIds.size} mục đã chọn
              </button>
            )}
            {canManage && (
              <Link
                to="/admin/categories/create"
                className="inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-extrabold uppercase rounded-[5px] hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" /> Thêm danh mục
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm theo tên hoặc đường dẫn..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
            {selectedIds.size > 0 && (
              <div className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                Đang chọn {selectedIds.size} danh mục
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/30">
                  {canManage && (
                    <th className="w-12 px-6 py-5">
                      <button
                        onClick={selectAllOnPage}
                        className="text-slate-400 hover:text-blue-500 transition-colors"
                      >
                        {selectedIds.size === deletableIdsOnPage.length &&
                        deletableIdsOnPage.length > 0 ? (
                          <CheckSquare className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="px-6 py-6 text-[0.8rem] font-bold text-slate-500 uppercase">
                    Tên danh mục
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] font-bold text-slate-500 uppercase">
                    Đường dẫn
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] font-bold text-slate-500 uppercase text-center">
                    Cấu trúc
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] font-bold text-slate-500 uppercase text-center">
                    Ảnh
                  </th>
                  {canManage && (
                    <th className="px-6 py-6 text-[0.8rem] font-bold text-slate-500 uppercase text-center">
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr
                      key={i}
                      className="animate-pulse border-b border-slate-100"
                    >
                      <td className="px-6 py-6" colSpan="6">
                        <div className="h-12 bg-slate-50 rounded-xl"></div>
                      </td>
                    </tr>
                  ))
                ) : categories.length > 0 ? (
                  categories.map((category) => renderCategoryRow(category))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 font-bold">
                        Không có dữ liệu danh mục.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            label="danh mục"
          />
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
