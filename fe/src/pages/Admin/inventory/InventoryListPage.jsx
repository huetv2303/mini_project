import React, { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import { fetchProductsRequest } from "../../../services/ProductService";
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Package,
  Plus,
  Edit2,
  History,
  Archive,
  BarChart,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import toast from "react-hot-toast";

import ImportStockModal from "./components/ImportStockModal";
import AdjustStockModal from "./components/AdjustStockModal";
import TransactionHistoryModal from "./components/TransactionHistoryModal";
import InventoryReportTab from "./components/InventoryReportTab";
import {
  adjustInventory,
  importInventory,
} from "../../../services/InventoryService";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const InventoryListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState([]);
  const [activeTab, setActiveTab] = useState("inventory"); // "inventory" | "report"
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null,
    product: null,
    variant: null,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });

  const getProducts = async (search = "", page = 1) => {
    try {
      setLoading(true);
      const res = await fetchProductsRequest({
        page,
        search,
        limit: pagination.perPage,
      });
      console.log("Inventory API Res:", res);
      const items = res?.data?.data || [];
      setProducts(items);

      const meta = res?.data?.meta;
      if (meta) {
        setPagination({
          currentPage: meta.current_page,
          lastPage: meta.last_page,
          total: meta.total,
          perPage: meta.per_page,
        });
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      toast.error("Không thể tải dữ liệu kho hàng");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((val) => {
      getProducts(val, 1);
    }, 500),
    [],
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      getProducts(searchTerm, newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  const toggleRowExpand = (productId) => {
    setExpandedRows((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  // Helper hiển thị ảnh an toàn
  const getImageUrl = (path) => {
    if (!path) return "/no-image.png";
    if (path.startsWith("http")) return path;
    return `${import.meta.env.VITE_URL_IMAGE}/${path}`;
  };

  const openImportModal = (product, variant) => {
    setModalConfig({ isOpen: true, type: "import", product, variant });
  };

  const openAdjustModal = (product, variant) => {
    setModalConfig({ isOpen: true, type: "adjust", product, variant });
  };

  const openHistoryModal = (product, variant) => {
    setModalConfig({ isOpen: true, type: "history", product, variant });
  };

  const calculateTotalStock = (variants) => {
    if (!variants || variants.length === 0) return 0;
    return variants.reduce(
      (acc, curr) => acc + (parseInt(curr.inventory?.quantity) || 0),
      0,
    );
  };

  const calculateTotalAvailable = (variants) => {
    if (!variants || variants.length === 0) return 0;
    return variants.reduce((acc, curr) => {
      const inv = curr.inventory || {};
      const available =
        (parseInt(inv.quantity) || 0) -
        (parseInt(inv.reserved) || 0) -
        (parseInt(inv.unavailable) || 0) -
        (parseInt(inv.packing) || 0);
      return acc + Math.max(0, available);
    }, 0);
  };

  const calculateTotalReserved = (variants) => {
    if (!variants || variants.length === 0) return 0;
    return variants.reduce(
      (acc, curr) => acc + (parseInt(curr.inventory?.reserved) || 0),
      0,
    );
  };

  const calculateTotalUnavailable = (variants) => {
    if (!variants || variants.length === 0) return 0;
    return variants.reduce(
      (acc, curr) => acc + (parseInt(curr.inventory?.unavailable) || 0),
      0,
    );
  };

  const calculateTotalReturning = (variants) => {
    if (!variants || variants.length === 0) return 0;
    return variants.reduce(
      (acc, curr) => acc + (parseInt(curr.inventory?.returning) || 0),
      0,
    );
  };

  const calculateTotalPacking = (variants) => {
    if (!variants || variants.length === 0) return 0;
    return variants.reduce(
      (acc, curr) => acc + (parseInt(curr.inventory?.packing) || 0),
      0,
    );
  };

  const calculateTotalMinQuantity = (variants) => {
    if (!variants || variants.length === 0) return 0;
    return variants.reduce(
      (acc, curr) => acc + (parseInt(curr.inventory?.min_quantity) || 0),
      0,
    );
  };

  const renderStockStatus = (quantity, minQuantity) => {
    if (quantity <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 border border-red-100">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5 animate-pulse"></div>
          Hết hàng
        </span>
      );
    }
    if (quantity < minQuantity) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-600 border border-yellow-100">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5 "></div>
          Sắp hết
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 "></div>
        Còn hàng
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="pb-10 space-y-6">
        {/* Header section */}
        <div>
          <h1 className="text-2xl font-meidum text-gray-900">Quản lý kho</h1>
        </div>

        {/* Tabs section */}
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
              activeTab === "inventory"
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-white text-gray-600 border text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Archive className="w-4 h-4 mr-2" /> Tồn kho
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
              activeTab === "report"
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-white text-gray-600 border text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <BarChart className="w-4 h-4 mr-2" /> Báo cáo tháng
          </button>
        </div>

        {activeTab === "inventory" ? (
          <>
            {/* Filters and search */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Tìm theo tên sản phẩm, SKU..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                />
              </div>

              <div className="flex items-center w-full md:w-auto gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none min-w-[150px]"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="in_stock">Còn hàng</option>
                  <option value="low_stock">Sắp hết</option>
                  <option value="out_of_stock">Hết hàng</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none min-w-[150px]"
                >
                  <option value="all">Tất cả danh mục</option>
                  {/* Could map real categories here */}
                </select>

                <button
                  onClick={() => getProducts(searchTerm)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  Tìm kiếm
                </button>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    getProducts("", 1);
                  }}
                  className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                  title="Làm mới"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200">
                      <th className="px-4 py-4 w-12 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider"></th>
                      <th className="px-6 py-6 text-[0.8rem] text-gray-600 uppercase">
                        Ảnh
                      </th>
                      <th className="px-6 py-6 text-[0.8rem] text-gray-600 uppercase">
                        Tên sản phẩm
                      </th>
                      <th className="px-6 py-6 text-[0.8rem] text-gray-600 uppercase text-center">
                        Tổng tồn
                      </th>
                      <th className="px-6 py-6 text-[0.8rem] text-gray-600 uppercase text-center bg-emerald-50/50">
                        Có thể bán
                      </th>
                      <th className="px-6 py-6 text-[0.8rem] text-gray-600 uppercase text-center">
                        Đang giao dịch
                      </th>
                      <th className="px-6 py-6 text-[0.8rem] text-gray-600 uppercase text-center">
                        Không thể bán
                      </th>
                      <th className="px-6 py-6 text-[0.8rem] text-gray-600 uppercase text-center">
                        Đang về kho
                      </th>
                      <th className="px-6 py-6 text-[0.8rem] text-gray-600 uppercase text-center">
                        Đang đóng gói
                      </th>
                      <th className="px-6 py-6 text-[10px] text-gray-400 uppercase text-center w-28">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-6 py-16 text-center text-emerald-500"
                        >
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                          <span className="text-sm font-medium">
                            Đang tải biểu mẫu...
                          </span>
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-6 py-16 text-center text-gray-400"
                        >
                          <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                          <span className="text-sm font-medium">
                            Trống - Chưa có sản phẩm nào
                          </span>
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => {
                        const variantsCount = product.variants?.length || 0;
                        const totalStock = calculateTotalStock(
                          product.variants,
                        );
                        const totalMinQuantity = calculateTotalMinQuantity(
                          product.variants,
                        );
                        const isExpanded = expandedRows.includes(product.id);

                        return (
                          <React.Fragment key={product.id}>
                            <tr
                              className={`group hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? "bg-gray-50/50" : ""}`}
                              onClick={() =>
                                variantsCount > 0 && toggleRowExpand(product.id)
                              }
                            >
                              <td className="px-4 py-3 text-center">
                                {variantsCount > 0 && (
                                  <button className="text-gray-400 hover:text-gray-700 transition-colors">
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 mx-auto" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 mx-auto" />
                                    )}
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                  {product.images?.length > 0 ? (
                                    <img
                                      src={getImageUrl(product.images[0].url)}
                                      className="w-full h-full object-cover"
                                      alt={product.name}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                      <Package className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 w-96">
                                <div className="font-semibold text-gray-800 text-sm">
                                  {product.name}
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-bold">
                                    {variantsCount} BIẾN THỂ
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {product.category?.name || "N/A"} |{" "}
                                  {product.supplier?.name || "No Brand"}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-sm font-bold text-gray-800">
                                  {totalStock}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center bg-emerald-50/20">
                                <span className="text-sm font-black text-blue-600">
                                  {calculateTotalAvailable(product.variants)}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-sm font-medium text-amber-600">
                                  {calculateTotalReserved(product.variants)}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-sm font-medium text-amber-600">
                                  {calculateTotalUnavailable(product.variants)}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-sm font-medium text-amber-600">
                                  {calculateTotalReturning(product.variants)}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-sm font-medium text-amber-600">
                                  {calculateTotalPacking(product.variants)}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                {renderStockStatus(
                                  totalStock,
                                  totalMinQuantity,
                                )}
                              </td>
                            </tr>

                            {/* Expanded Variant Rows */}
                            {isExpanded &&
                              variantsCount > 0 &&
                              product.variants.map((variant, index) => (
                                <tr
                                  key={variant.id}
                                  className="bg-gray-50/30 border-b-0 border-t border-gray-100 hover:bg-gray-100/50 transition-colors"
                                >
                                  <td colSpan="2"></td>
                                  <td className="px-4 py-3 pb-4">
                                    <div className="flex items-start">
                                      <div className="w-4 h-4 border-l-2 border-b-2 border-gray-200 rounded-bl-lg mr-3 mt-1.5 opacity-60"></div>
                                      <div>
                                        <div className="text-sm font-semibold text-gray-700">
                                          {variant.name || "Default"}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                          SKU: {variant.sku}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-sm font-bold text-gray-600">
                                      {variant.inventory?.quantity || 0}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center bg-emerald-50/10">
                                    <span className="text-sm font-black text-emerald-500">
                                      {Math.max(
                                        0,
                                        (parseInt(
                                          variant.inventory?.quantity,
                                        ) || 0) -
                                          (parseInt(
                                            variant.inventory?.reserved,
                                          ) || 0) -
                                          (parseInt(
                                            variant.inventory?.unavailable,
                                          ) || 0) -
                                          (parseInt(
                                            variant.inventory?.packing,
                                          ) || 0),
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex flex-col gap-1 items-center">
                                      <span
                                        className="text-xs "
                                        title="Đang giao dịch"
                                      >
                                        {variant.inventory?.reserved || 0}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex flex-col gap-1 items-center">
                                      <span
                                        className="text-xs "
                                        title="Không thể bán"
                                      >
                                        {variant.inventory?.unavailable || 0}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex flex-col gap-1 items-center">
                                      <span
                                        className="text-xs "
                                        title="Đang về kho"
                                      >
                                        {variant.inventory?.returning || 0}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex flex-col gap-1 items-center">
                                      <span
                                        className="text-xs "
                                        title="Đang đóng gói"
                                      >
                                        {variant.inventory?.packing || 0}
                                      </span>
                                    </div>
                                  </td>

                                  {/* <td className="px-4 py-3 text-center">
                                    <div className="flex flex-col gap-1 items-center">
                                      <div className="flex gap-2">
                                        <span
                                          className="text-[10px] text-red-400"
                                          title="Không thể bán"
                                        >
                                          H:{" "}
                                          {variant.inventory?.unavailable || 0}
                                        </span>
                                        <span
                                          className="text-[10px] text-blue-400"
                                          title="Đang về kho"
                                        >
                                          V: {variant.inventory?.returning || 0}
                                        </span>
                                        <span
                                          className="text-[10px] text-indigo-400"
                                          title="Đang đóng gói"
                                        >
                                          P: {variant.inventory?.packing || 0}
                                        </span>
                                      </div>
                                    </div>
                                  </td> */}
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5 opacity-90">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openImportModal(product, variant);
                                        }}
                                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors"
                                        title="Nhập kho"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openAdjustModal(product, variant);
                                        }}
                                        className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                                        title="Điều chỉnh tồn kho"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openHistoryModal(product, variant);
                                        }}
                                        className="p-1.5 bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-md transition-colors"
                                        title="Lịch sử giao dịch"
                                      >
                                        <History className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination UI */}
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
                label="sản phẩm"
              />
            </div>
          </>
        ) : (
          <InventoryReportTab />
        )}
      </div>

      {/* Modals */}
      <ImportStockModal
        isOpen={modalConfig.isOpen && modalConfig.type === "import"}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        product={modalConfig.product}
        variant={modalConfig.variant}
        onConfirm={async (data) => {
          await importInventory(data);
          getProducts(searchTerm, pagination.currentPage); // Refresh list
        }}
      />

      <AdjustStockModal
        isOpen={modalConfig.isOpen && modalConfig.type === "adjust"}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        product={modalConfig.product}
        variant={modalConfig.variant}
        onConfirm={async (data) => {
          await adjustInventory(data);
          getProducts(searchTerm, pagination.currentPage); // Refresh list
        }}
      />

      <TransactionHistoryModal
        isOpen={modalConfig.isOpen && modalConfig.type === "history"}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        product={modalConfig.product}
        variant={modalConfig.variant}
      />
    </AdminLayout>
  );
};

export default InventoryListPage;
