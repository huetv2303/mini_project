import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import toast from "react-hot-toast";

const ImportStockModal = ({ isOpen, onClose, product, variant, onConfirm }) => {
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuantity("1");
      setNote("");
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen || !product || !variant) return null;

  const currentStock = variant?.inventory?.quantity || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || parseInt(quantity) <= 0) {
      toast.error("Số lượng nhập phải lớn hơn 0");
      return;
    }
    setLoading(true);
    try {
      if (onConfirm) {
        await onConfirm({
          variant_id: variant.id,
          type: "import",
          quantity: parseInt(quantity),
          note,
        });
      }
      toast.success("Nhập kho thành công!");
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Lỗi khi nhập kho");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Nhập kho</h3>
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
            <div className="text-sm text-gray-500 mb-2">
              {variant?.color?.name || ""} {variant?.size?.name ? `/ ${variant?.size?.name}` : ""}
            </div>
            <div className="text-sm font-semibold text-emerald-600 border-t border-gray-100 pt-2 mt-2">
              Tồn hiện tại: {currentStock}
            </div>
          </div>

          {/* Form */}
          <form id="import-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Số lượng nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Ghi chú
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập từ NCC..."
                rows="3"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-y"
              ></textarea>
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
            form="import-form"
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Nhập kho
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportStockModal;
