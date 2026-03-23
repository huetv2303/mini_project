import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Minus, Plus, RotateCcw, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import OrderReturnService from "../../../services/OrderReturnService";

const ReturnOrderModal = ({ isOpen, onClose, order, onRefresh }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState(
    (order.items || []).map((item) => ({
      ...item,
      returnQuantity: 0,
      maxReturnQuantity:
        Number(item.quantity || 0) - (Number(item.returned_quantity) || 0),
      price: Number(item.price || 0),
    })),
  );
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleQuantityChange = (id, delta) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(
            0,
            Math.min(item.maxReturnQuantity, item.returnQuantity + delta),
          );
          return { ...item, returnQuantity: newQty };
        }
        return item;
      }),
    );
  };

  const handleReturn = async () => {
    const itemsToReturn = items
      .filter((item) => item.returnQuantity > 0)
      .map((item) => ({
        order_item_id: item.id,
        quantity: item.returnQuantity,
      }));

    if (itemsToReturn.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để trả");
      return;
    }

    try {
      setLoading(true);
      const res = await OrderReturnService.create({
        order_id: order.id,
        reason,
        items: itemsToReturn,
      });
      toast.success("Tạo đơn trả hàng thành công");
      onRefresh();
      onClose();
      if (res?.data?.id) {
        navigate(`/admin/order-returns/${res.data.id}`);
      }
    } catch (error) {
      console.error("Return failed:", error);
      toast.error(error.response?.data?.message || "Xử lý trả hàng thất bại");
    } finally {
      setLoading(false);
    }
  };

  const totalRefund = items.reduce(
    (sum, item) =>
      sum + (Number(item.returnQuantity) || 0) * (Number(item.price) || 0),
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg flex gap-2 text-gray-900  ">
                Trả hàng đơn{" "}
                <p className="text-black font-medium">#{order.code}</p>
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase ">
                Chọn sản phẩm và số lượng muốn hoàn trả
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-none">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  item.returnQuantity > 0
                    ? "border-indigo-200 bg-indigo-50/30 shadow-indigo-100/50 shadow-lg"
                    : "border-gray-100 bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h4 className="text-sm text-blue-500 font-bold">
                      {item.product_name}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-medium">
                      Biến thể: {item.variant_name} | Đã mua: {item.quantity}
                    </p>
                    <p className="text-xs font-bold mt-1">
                      {(item.price || 0).toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      disabled={item.returnQuantity <= 0}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-lg text-gray-400 disabled:opacity-20"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-black text-sm">
                      {Math.floor(item.returnQuantity || 0)}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      disabled={item.returnQuantity >= item.maxReturnQuantity}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-lg text-gray-400 disabled:opacity-20"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <label className="text-[10px] font-bold text-gray-400 uppercase  mb-3 block">
              Lý do trả hàng
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Sản phẩm lỗi, sai màu sắc..."
              className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm min-h-[100px] outline-none focus:ring-4 focus:ring-black/5 transition-all"
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase ">
              Tổng hoàn tiền dự kiến
            </p>
            <p className="text-xl font-medium text-gray-900">
              {order.payment_status === "unpaid"
                ? 0
                : totalRefund.toLocaleString("vi-VN")}
              đ
            </p>
          </div>
          <button
            onClick={handleReturn}
            disabled={loading || totalRefund === 0}
            className="px-8 py-4 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2 disabled:opacity-50 shadow-xl shadow-black/10  "
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Tạo đơn trả hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnOrderModal;
