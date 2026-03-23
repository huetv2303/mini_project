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
  ChevronLeft,
  ChevronRight,
  Package,
  Layers,
  Building2,
  Tag,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/common/ConfirmModal";
import Pagination from "../../../components/common/Pagination";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);
};

const ProductListPage = () => {
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
    type: "single", // "single" or "bulk"
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

  // Helper hiển thị ảnh an toàn
  const getImageUrl = (path) => {
    if (!path) return "/no-image.png";
    if (path.startsWith("http")) return path;
    return `${import.meta.env.VITE_URL_IMAGE}/${path}`;
  };
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      getProducts(newPage, searchTerm);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  return (
    <AdminLayout>
      <div className="pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">
              Quản lý sản phẩm
            </h1>
            <p className="mt-1 text-xs text-gray-500 font-medium">
              Quản lý định danh & tồn kho
            </p>
          </div>
          <Link
            to="/admin/products/create"
            className="inline-flex items-center px-4 py-3 bg-black text-white text-sm font-bold rounded-lg hover:bg-black/90 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" /> Thêm sản phẩm
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-2xl shadow-black/5 overflow-hidden">
          <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm tên sản phẩm, SKU hoặc mô tả..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-3xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
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

          <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                    <input
                      type="checkbox"
                      checked={
                        products.length > 0 &&
                        products.every((p) => selectedIds.includes(p.id))
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                  </th>
                  <th className="px-6 py-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Thông tin
                  </th>
                  <th className="px-6 py-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Giá bán (Đại diện)
                  </th>
                  <th className="px-6 py-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-24 text-center">
                      <Loader2 className="w-12 h-12 text-black animate-spin mx-auto mb-4" />
                      <span className="text-gray-400 font-bold text-[10px] uppercase ">
                        Đang tải kho hàng...
                      </span>
                    </td>
                  </tr>
                ) : products.length > 0 ? (
                  products.map((product) => {
                    const firstVariant = product.variants?.[0] || {};
                    const variantsCount = product.variants?.length || 0;

                    return (
                      <tr
                        key={product.id}
                        className={` border-b border-gray-50 transition-all group hover:bg-gray-50/50 hover:cursor-pointer ${selectedIds.includes(product.id) ? "bg-indigo-50/30" : ""}`}
                      >
                        <td className="px-8 py-5">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(product.id)}
                            onChange={() => handleSelectOne(product.id)}
                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black hover:cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-5">
                            <div className="relative group/img">
                              {product.images?.length > 0 ? (
                                <img
                                  src={getImageUrl(product.images[0].url)}
                                  className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shadow-sm transition-transform group-hover:scale-105"
                                  alt={product.name}
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                                  <span className="text-gray-400 text-xs font-bold">
                                    No Image
                                  </span>
                                </div>
                              )}

                              {/* {variantsCount > 1 && (
                                <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg shadow-lg border-2 border-white">
                                  {variantsCount}
                                </span>
                              )} */}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {product.name}
                              </div>
                              <div className="text-[0.7rem] text-gray-400   mt-1 uppercase">
                                Slug: {product.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 space-y-2">
                          <div className="flex items-center text-[11px] text-gray-500 font-bold">
                            <Tag className="w-3.5 h-3.5 mr-2 text-indigo-400" />{" "}
                            {product.category?.name || "N/A"}
                          </div>
                          <div className="flex items-center text-[11px] text-gray-500 font-bold">
                            <Building2 className="w-3.5 h-3.5 mr-2 text-emerald-400" />{" "}
                            {product.supplier?.name || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className=" text-sm font-bold text-gray-900">
                            {formatPrice(firstVariant.price)}
                          </div>
                          <div className="text-[0.7rem] text-gray-400 uppercase mt-1">
                            SKU: {firstVariant.sku || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div
                            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold ${product.status === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}
                          >
                            {product.status === "active"
                              ? "Đang bán"
                              : "Ngừng bán"}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            {/* <button className="p-2.5 text-gray-400 hover:text-black hover:bg-white rounded-2xl transition-all">
                              <Eye className="w-5 h-5" />
                            </button> */}
                            <Link
                              to={`/admin/products/edit/${product.slug}`}
                              className="p-2.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                            >
                              <Edit2 className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() =>
                                openDeleteModal(product.slug, product.name)
                              }
                              className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-24 text-center">
                      <AlertCircle className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold">
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
