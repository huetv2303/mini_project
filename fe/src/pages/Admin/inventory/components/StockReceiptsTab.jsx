import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchStockReceipts,
  createStockReceipt,
  confirmStockReceipt,
  cancelStockReceipt
} from "../../../../services/StockReceiptService";
import { fetchSuppliersRequest } from "../../../../services/SupplierService";
import { fetchProductsRequest } from "../../../../services/ProductService";
import {
  Plus,
  Search,
  Eye,
  Check,
  X,
  FileText,
  Loader2,
  Calendar,
  AlertCircle,
  Trash
} from "lucide-react";
import toast from "react-hot-toast";
import SelectSearch from "../../../../components/common/SelectSearch";

const StockReceiptsTab = () => {
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission("admin.manage");

  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modals Config
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const getReceipts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const res = await fetchStockReceipts(params);
      setReceipts(res?.data || []);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast.error("Không thể tải danh sách phiếu nhập kho");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getReceipts();
  }, [statusFilter]);

  const handleConfirm = async (id) => {
    try {
      await confirmStockReceipt(id);
      toast.success("Xác nhận nhập kho thành công! Tồn kho đã được cập nhật.");
      getReceipts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi xác nhận nhập kho");
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy phiếu nhập kho này?")) {
      try {
        await cancelStockReceipt(id);
        toast.success("Đã hủy phiếu nhập kho thành công.");
        getReceipts();
      } catch (err) {
        toast.error(err.response?.data?.message || "Lỗi khi hủy phiếu");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Danh sách phiếu nhập kho</h2>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Lập phiếu nhập
        </button>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ duyệt</option>
            <option value="completed">Đã nhập kho</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã phiếu</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nhà cung cấp</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nhân viên lập</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày nhận</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="7" className="px-6 py-5">
                      <div className="h-8 bg-gray-100 rounded-lg w-full"></div>
                    </td>
                  </tr>
                ))
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span className="text-sm font-medium">Chưa có phiếu nhập kho nào</span>
                  </td>
                </tr>
              ) : (
                receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-blue-600">
                      {receipt.code}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {receipt.supplier?.name || <span className="text-gray-400 italic">Không có</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {receipt.staff?.name || "Hệ thống"}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {Number(receipt.total_amount || 0).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {receipt.received_at ? new Date(receipt.received_at).toLocaleDateString("vi-VN") : "Chưa có"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {receipt.status === "pending" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Chờ duyệt
                        </span>
                      )}
                      {receipt.status === "completed" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đã nhập kho
                        </span>
                      )}
                      {receipt.status === "cancelled" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          Đã hủy
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedReceipt(receipt)}
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {receipt.status === "pending" && (
                        <>
                          {isAdmin ? (
                            <>
                              <button
                                onClick={() => handleConfirm(receipt.id)}
                                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors"
                                title="Xác nhận duyệt nhập kho"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(receipt.id)}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md transition-colors"
                                title="Hủy phiếu"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Đang chờ duyệt</span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateReceiptModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          getReceipts();
        }}
      />

      {selectedReceipt && (
        <ReceiptDetailsModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

/* ========================================================
   MODAL LẬP PHIẾU NHẬP KHO (CreateReceiptModal)
   ======================================================== */
const CreateReceiptModal = ({ isOpen, onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [receivedAt, setReceivedAt] = useState("");
  const [loading, setLoading] = useState(false);

  // List of added products
  const [items, setItems] = useState([]);

  // Search variants states
  const [allProducts, setAllProducts] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [variantQty, setVariantQty] = useState("1");

  useEffect(() => {
    if (isOpen) {
      // Fetch Suppliers
      fetchSuppliersRequest({ all: true })
        .then((res) => setSuppliers(res?.data || []))
        .catch(console.error);

      // Fetch Products with variants
      fetchProductsRequest({ limit: 100 })
        .then((res) => setAllProducts(res?.data?.data || []))
        .catch(console.error);

      // Reset Form
      setSupplierId("");
      setNote("");
      setReceivedAt("");
      setItems([]);
      setSelectedVariantId("");
      setVariantPrice("");
      setVariantQty("1");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Add item to request
  const handleAddItem = () => {
    if (!selectedVariantId) {
      toast.error("Vui lòng chọn sản phẩm biến thể");
      return;
    }
    if (!variantQty || parseInt(variantQty) <= 0) {
      toast.error("Số lượng phải lớn hơn 0");
      return;
    }
    if (!variantPrice || parseFloat(variantPrice) < 0) {
      toast.error("Đơn giá nhập không được âm");
      return;
    }

    // Find details
    let selectedVar = null;
    let parentProdName = "";
    for (const p of allProducts) {
      const match = p.variants?.find((v) => v.id == selectedVariantId);
      if (match) {
        selectedVar = match;
        parentProdName = p.name;
        break;
      }
    }

    if (!selectedVar) return;

    // Check duplicate
    if (items.some((it) => it.variant_id == selectedVariantId)) {
      toast.error("Sản phẩm này đã có trong danh sách");
      return;
    }

    const newItem = {
      variant_id: parseInt(selectedVariantId),
      name: `${parentProdName} (${selectedVar.name || "Mặc định"})`,
      sku: selectedVar.sku,
      quantity: parseInt(variantQty),
      unit_price: parseFloat(variantPrice),
    };

    setItems([...items, newItem]);
    // Reset Add Inputs
    setSelectedVariantId("");
    setVariantPrice("");
    setVariantQty("1");
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const grandTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Danh sách sản phẩm nhập không được trống");
      return;
    }

    setLoading(true);
    try {
      await createStockReceipt({
        supplier_id: supplierId ? parseInt(supplierId) : null,
        note,
        received_at: receivedAt || null,
        items: items.map((it) => ({
          variant_id: it.variant_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      });

      toast.success("Lập phiếu nhập kho thành công! Trạng thái: Chờ duyệt.");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi lập phiếu nhập");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-emerald-500" />
            Lập phiếu yêu cầu nhập kho
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative z-20">
              <SelectSearch
                label="Nhà cung cấp"
                placeholder="-- Chọn nhà cung cấp --"
                options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
                value={supplierId}
                onChange={(val) => setSupplierId(val)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Ngày nhận hàng dự kiến
              </label>
              <input
                type="date"
                value={receivedAt}
                onChange={(e) => setReceivedAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Ghi chú
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú hoặc lý do nhập hàng..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Add Product Section */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
            <h4 className="font-bold text-sm text-gray-800">Thêm sản phẩm nhập kho</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2 relative z-10">
                <SelectSearch
                  label="Chọn biến thể sản phẩm"
                  placeholder="-- Tìm kiếm & Chọn sản phẩm --"
                  options={allProducts.flatMap((p) =>
                    (p.variants || []).map((v) => ({
                      value: v.id,
                      label: `${p.name} (${v.name || "Mặc định"}) - ${v.sku}`,
                    }))
                  )}
                  value={selectedVariantId}
                  onChange={(val) => setSelectedVariantId(val)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1">
                  Số lượng
                </label>
                <input
                  type="number"
                  min="1"
                  value={variantQty}
                  onChange={(e) => setVariantQty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1">
                  Đơn giá nhập (đ)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={variantPrice}
                    onChange={(e) => setVariantPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* List of Added Items */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-gray-800">Sản phẩm yêu cầu nhập kho</h4>
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100/80 border-b border-gray-200 font-semibold text-gray-600">
                    <th className="p-3">Sản phẩm</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3 text-center">Số lượng</th>
                    <th className="p-3 text-right">Đơn giá nhập</th>
                    <th className="p-3 text-right">Thành tiền</th>
                    <th className="p-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-400 italic">
                        Chưa chọn sản phẩm nào để yêu cầu nhập kho.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="p-3 font-semibold text-gray-800">{item.name}</td>
                        <td className="p-3 font-mono text-gray-500 text-xs">{item.sku}</td>
                        <td className="p-3 text-center font-bold text-gray-700">{item.quantity}</td>
                        <td className="p-3 text-right font-medium">
                          {item.unit_price.toLocaleString("vi-VN")} đ
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-600">
                          {(item.quantity * item.unit_price).toLocaleString("vi-VN")} đ
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Total display */}
          {items.length > 0 && (
            <div className="flex justify-end pr-4 text-right">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tổng cộng phiếu tạm tính:</span>
                <div className="text-2xl font-black text-emerald-600">
                  {grandTotal.toLocaleString("vi-VN")} đ
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/30">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center px-6 py-2.5 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors shadow-sm disabled:opacity-75"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Lập phiếu
          </button>
        </div>
      </div>
    </div>
  );
};

/* ========================================================
   MODAL XEM CHI TIẾT PHIẾU NHẬP KHO (ReceiptDetailsModal)
   ======================================================== */
const ReceiptDetailsModal = ({ receipt, onClose }) => {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-8 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-emerald-500" />
              Chi tiết phiếu nhập: {receipt.code}
            </h3>
            <span className="text-xs text-gray-500 mt-1 block">
              Tạo lúc: {new Date(receipt.created_at).toLocaleString("vi-VN")}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/40">
              <span className="text-[10px] font-bold text-gray-400 uppercase block tracking-wider">Trạng thái</span>
              <div className="mt-1">
                {receipt.status === "pending" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Chờ duyệt
                  </span>
                )}
                {receipt.status === "completed" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Đã nhập kho
                  </span>
                )}
                {receipt.status === "cancelled" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    Đã hủy
                  </span>
                )}
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/40">
              <span className="text-[10px] font-bold text-gray-400 uppercase block tracking-wider">Nhà cung cấp</span>
              <div className="text-sm font-semibold text-gray-800 mt-1 truncate">
                {receipt.supplier?.name || "Không có"}
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/40">
              <span className="text-[10px] font-bold text-gray-400 uppercase block tracking-wider">Nhân viên lập</span>
              <div className="text-sm font-semibold text-gray-800 mt-1 truncate">
                {receipt.staff?.name || "Hệ thống"}
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/40">
              <span className="text-[10px] font-bold text-gray-400 uppercase block tracking-wider">Tổng tiền phiếu</span>
              <div className="text-sm font-bold text-emerald-600 mt-1">
                {Number(receipt.total_amount || 0).toLocaleString("vi-VN")} đ
              </div>
            </div>
          </div>

          {/* Note Info */}
          {receipt.note && (
            <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-4 text-sm text-gray-700">
              <span className="font-semibold block mb-1">Ghi chú phiếu nhập:</span>
              {receipt.note}
            </div>
          )}

          {/* Items Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-gray-800">Danh sách sản phẩm trong phiếu</h4>
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100/80 border-b border-gray-200 font-semibold text-gray-600">
                    <th className="p-3">Tên sản phẩm</th>
                    <th className="p-3 text-center">Số lượng yêu cầu</th>
                    <th className="p-3 text-right">Đơn giá nhập</th>
                    <th className="p-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {receipt.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/30">
                      <td className="p-3 font-semibold text-gray-800">
                        {item.variant?.product?.name || "Sản phẩm"} ({item.variant?.name || "Mặc định"})
                        <div className="text-[10px] font-bold font-mono text-gray-400 mt-0.5">SKU: {item.variant?.sku}</div>
                      </td>
                      <td className="p-3 text-center font-bold text-gray-700">{item.quantity}</td>
                      <td className="p-3 text-right">
                        {Number(item.unit_price || 0).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        {Number(item.total_price || (item.quantity * item.unit_price)).toLocaleString("vi-VN")} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex items-center justify-end bg-gray-50/30">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockReceiptsTab;
