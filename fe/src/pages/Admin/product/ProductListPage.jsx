import React, { useEffect, useState, useCallback } from "react";
import {
  fetchProductsRequest,
  deleteProductRequest,
  bulkDeleteProductsRequest,
} from "../../../services/ProductService";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Building2,
  Tag,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/common/ConfirmModal";
import Pagination from "../../../components/common/Pagination";
import { getImageUrl, formatPrice } from "../../../helper/helper";
const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

import { useAuth } from "../../../context/AuthContext";

const ProductListPage = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("products.create");
  const canEdit = hasPermission("products.edit");
  const canDelete = hasPermission("products.delete");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    lastPage: 1,
    perPage: 10,
  });
  const [selectedIds, setSelectedIds] = useState([]);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    slug: null,
    name: "",
    type: "single",
  });

  const getProducts = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const res = await fetchProductsRequest({ page, search });
      const rawData = res?.data;
      const items = rawData?.data || [];
      const meta = rawData?.meta || {};

      setProducts(items);
      setPagination({
        currentPage: meta.current_page,
        lastPage: meta.last_page,
        total: meta.total,
        perPage: meta.per_page,
      });
      console.log(items);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((val) => {
      setCurrentPage(1);
      getProducts(1, val);
    }, 500),
    [],
  );

  useEffect(() => {
    getProducts(currentPage, searchTerm);
  }, [currentPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  const openDeleteModal = (slug, name) => {
    setModalConfig({ isOpen: true, slug, name, type: "single" });
  };

  const openBulkDeleteModal = () => {
    setModalConfig({
      isOpen: true,
      slug: null,
      name: `${selectedIds.length} sản phẩm`,
      type: "bulk",
    });
  };

  const confirmDelete = async () => {
    try {
      if (modalConfig.type === "bulk") {
        await bulkDeleteProductsRequest(selectedIds);
        toast.success(`Đã xóa ${selectedIds.length} sản phẩm`);
        setSelectedIds([]);
      } else {
        await deleteProductRequest(modalConfig.slug);
        toast.success(`Đã xóa sản phẩm ${modalConfig.name}`);
      }
      getProducts(currentPage, searchTerm);
    } catch (error) {
      toast.error(error.response?.data?.message || "Xóa sản phẩm thất bại");
    } finally {
      setModalConfig({ ...modalConfig, isOpen: false });
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pageIds = products.map((p) => p.id);
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    } else {
      const pageIds = products.map((p) => p.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      getProducts(newPage, searchTerm);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  return (
    <AdminLayout>
      <div className="pb-10 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Quản lý sản phẩm
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium italic">
              Quản lý định danh & tồn kho cửa hàng.
            </p>
          </div>
          {canManage && (
            <Link
              to="/admin/products/create"
              className="inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-extrabold uppercase rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" /> Thêm sản phẩm
            </Link>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm tên sản phẩm, SKU hoặc mô tả..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
            {selectedIds.length > 0 && (
              <button
                onClick={openBulkDeleteModal}
                className="inline-flex items-center px-6 py-4 bg-red-50 text-red-600 text-sm font-bold rounded-3xl hover:bg-red-100 transition-all shadow-sm border border-red-100 active:scale-95"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Xóa {selectedIds.length} đã
                chọn
              </button>
            )}
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[700px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/30">
                  {canDelete && (
                    <th className="px-8 py-6 text-xs font-semibold text-slate-500 uppercase tracking-wider w-10">
                      <input
                        type="checkbox"
                        checked={
                          products.length > 0 &&
                          products.every((p) => selectedIds.includes(p.id))
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 hover:cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-6 py-6 text-[0.8rem] font-bold text-slate-500 uppercase text-left">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] font-bold text-slate-500 uppercase">
                    Thông tin
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] font-bold text-slate-500 uppercase">
                    Giá bán (Đại diện)
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] font-bold text-slate-500 uppercase text-center">
                    Số lượng bán
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] font-bold text-slate-500 uppercase">
                    Trạng thái
                  </th>
                  {(canEdit || canDelete) && (
                    <th className="px-6 py-6 text-[0.8rem] font-bold text-slate-500 uppercase text-right">
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-24 text-center">
                      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                      <span className="text-slate-400 font-bold text-[10px] uppercase animate-pulse">
                        Đang tải sản phẩm...
                      </span>
                    </td>
                  </tr>
                ) : products.length > 0 ? (
                  products.map((product) => {
                    const firstVariant = product.variants?.[0] || {};

                    return (
                      <tr
                        key={product.id}
                        className={`border-b border-slate-100 transition-all group hover:bg-slate-50/50 hover:cursor-pointer ${selectedIds.includes(product.id) ? "bg-blue-50/20" : ""}`}
                      >
                        {canDelete && (
                          <td className="px-8 py-5">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(product.id)}
                              onChange={() => handleSelectOne(product.id)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 hover:cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-5">
                            <div className="relative group/img">
                              {product.images?.length > 0 ? (
                                <img
                                  src={getImageUrl(product.images[0].url)}
                                  className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm transition-transform group-hover:scale-105"
                                  alt={product.name}
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
                                  <span className="text-slate-400 text-xs font-bold">
                                    No Image
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                {product.name}
                              </div>
                              <div className="text-[0.7rem] text-slate-400 mt-1 uppercase font-semibold">
                                Slug: {product.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 space-y-2">
                          <div className="flex items-center text-[11px] font-semibold text-slate-600">
                            <Tag className="w-3.5 h-3.5 mr-2 text-blue-500" />{" "}
                            {product.category?.name || "N/A"}
                          </div>
                          <div className="flex items-center text-[11px] font-semibold text-slate-600">
                            <Building2 className="w-3.5 h-3.5 mr-2 text-emerald-500" />{" "}
                            {product.supplier?.name || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm font-semibold text-slate-800">
                            {formatPrice(firstVariant.price)}
                          </div>
                          <div className="text-[0.7rem] text-slate-400 font-semibold uppercase mt-1">
                            SKU: {firstVariant.sku || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="text-sm font-semibold text-slate-800">
                            {product.sold_count}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div
                            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${product.status === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}
                          >
                            {product.status === "active"
                              ? "Đang bán"
                              : "Ngừng bán"}
                          </div>
                        </td>
                        {(canEdit || canDelete) && (
                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              {canEdit && (
                                <Link
                                  to={`/admin/products/edit/${product.slug}`}
                                  className="p-2.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </Link>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() =>
                                    openDeleteModal(product.slug, product.name)
                                  }
                                  className="p-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-24 text-center">
                      <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold">
                        Bạn chưa có sản phẩm nào trong kho.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      </div>
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={
          modalConfig.type === "bulk" ? "Xóa nhiều sản phẩm?" : "Xóa sản phẩm?"
        }
        message={
          modalConfig.type === "bulk"
            ? `Bạn có chắc chắn muốn xóa ${selectedIds.length} sản phẩm đã chọn? Dữ liệu này sẽ không thể phục hồi.`
            : `Dữ liệu sản phẩm "${modalConfig.name}" sẽ biến mất khỏi kho vĩnh viễn.`
        }
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={confirmDelete}
      />
    </AdminLayout>
  );
};

export default ProductListPage;
