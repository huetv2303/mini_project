import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import toast from "react-hot-toast";

const AdjustStockModal = ({ isOpen, onClose, product, variant, onConfirm }) => {
  const [newStock, setNewStock] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && variant) {
      setNewStock(variant?.inventory?.quantity?.toString() || "0");
      setReason("");
      setLoading(false);
    }
  }, [isOpen, variant]);

  if (!isOpen || !product || !variant) return null;

  const currentStock = variant?.inventory?.quantity || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newStock === "" || parseInt(newStock) < 0) {
      toast.error("Tồn mới không hợp lệ");
      return;
    }
    if (reason.length < 10 || reason.length > 500) {
      toast.error("Lý do điều chỉnh phải từ 10 đến 500 ký tự");
      return;
    }

    setLoading(true);
    try {
      if (onConfirm) {
        await onConfirm({
          variant_id: variant.id,
          type: "adjust",
          new_quantity: parseInt(newStock),
          note: reason,
        });
      }
      toast.success("Điều chỉnh tồn kho thành công!");
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Lỗi khi điều chỉnh tồn kho");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Điều chỉnh tồn kho</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {/* Product Info Box */}
          <div className="bg-gray-50/80 rounded-lg p-4 mb-6">
            <h4 className="font-bold text-sm text-gray-900 mb-1 leading-tight">
              {product.name}
            </h4>
            <div className="text-sm text-gray-500">
              {variant?.color?.name || ""} {variant?.size?.name ? `/ ${variant?.size?.name}` : ""}
            </div>
          </div>

          {/* Form */}
          <form id="adjust-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Tồn hiện tại
                  </label>
                  <input
                    type="number"
                    value={currentStock}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 outline-none cursor-not-allowed"
                  />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Tồn mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    required
                  />
               </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Lý do điều chỉnh <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Kiểm kê tháng X, hư hỏng, thất thoát..."
                rows="3"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-y"
                required
              ></textarea>
              <div className="text-[11px] text-gray-500 mt-1.5 font-medium">Tối thiểu 10 ký tự, tối đa 500 ký tự</div>
            </div>
          </form>
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
            type="submit"
            form="adjust-form"
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Lưu điều chỉnh
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdjustStockModal;
