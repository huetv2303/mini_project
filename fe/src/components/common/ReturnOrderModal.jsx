import React, { useState, useMemo } from "react";
import {
  X,
  RotateCcw,
  Package,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { submitReturnRequest } from "../../services/OrderService";
import { getImageUrl } from "../../helper/helper";
import toast from "react-hot-toast";

const RETURN_REASONS = [
  "Sản phẩm bị lỗi / hư hỏng",
  "Sản phẩm không đúng mô tả",
  "Nhận sai sản phẩm / biến thể",
  "Sản phẩm không vừa / không phù hợp",
  "Không còn nhu cầu sử dụng",
  "Khác",
];

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n ?? 0);

const StatusBadge = ({ label, color }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.68rem] font-semibold border ${color}`}
  >
    {label}
  </span>
);

const receiveStatusMap = {
  pending: {
    label: "Chờ nhận hàng",
    color: "bg-amber-50 text-amber-600 border-amber-200",
  },
  received: {
    label: "Đã nhận hàng",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
};

const refundStatusMap = {
  pending: {
    label: "Chờ hoàn tiền",
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  refunded: {
    label: "Đã hoàn tiền",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  not_needed: {
    label: "Không cần hoàn tiền",
    color: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

const ReturnOrderModal = ({ order, onClose, onSuccess }) => {
  const [selections, setSelections] = useState(() =>
    Object.fromEntries(
      order.items
        .filter((i) => i.quantity - (i.returned_quantity ?? 0) > 0)
        .map((i) => [i.id, { checked: false, qty: 1 }]),
    ),
  );

  const [reasonOption, setReasonOption] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // success result from API

  const getReason = () =>
    reasonOption === "Khác" ? customReason.trim() : reasonOption;

  const returnableItems = order.items.filter(
    (i) => i.quantity - (i.returned_quantity ?? 0) > 0,
  );

  const selectedItems = useMemo(
    () => returnableItems.filter((i) => selections[i.id]?.checked),
    [selections, returnableItems],
  );

  const estimatedTotal = useMemo(
    () =>
      selectedItems.reduce(
        (sum, i) => sum + i.price * (selections[i.id]?.qty ?? 1),
        0,
      ),
    [selectedItems, selections],
  );

  const toggleItem = (id) =>
    setSelections((prev) => ({
      ...prev,
      [id]: { ...prev[id], checked: !prev[id].checked },
    }));

  const setQty = (id, val, max) => {
    const num = Math.min(Math.max(1, parseInt(val) || 1), max);
    setSelections((prev) => ({
      ...prev,
      [id]: { ...prev[id], qty: num },
    }));
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm muốn trả.");
      return;
    }
    if (!getReason()) {
      toast.error("Vui lòng chọn lý do trả hàng.");
      return;
    }

    const payload = {
      reason: getReason(),
      items: selectedItems.map((i) => ({
        order_item_id: i.id,
        quantity: selections[i.id].qty,
      })),
    };

    setSubmitting(true);
    try {
      const res = await submitReturnRequest(order.id, payload);
      if (res.status === "success") {
        setResult(res.data);
        onSuccess?.();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Gửi yêu cầu trả hàng thất bại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8 text-center space-y-5">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-emerald-50 rounded-full">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Yêu cầu trả hàng đã được gửi!
          </h2>
          <div className="bg-slate-50 rounded-2xl p-5 text-left space-y-3 text-sm">
            <Row label="Mã phiếu trả" value={result.return_code} mono />
            <Row
              label="Tổng hoàn dự kiến"
              value={`${fmt(result.total_return_amount)}₫`}
              highlight
            />
            <Row
              label="Trạng thái nhận hàng"
              value={
                receiveStatusMap[result.receive_status]?.label ??
                result.receive_status
              }
            />
            <Row
              label="Trạng thái hoàn tiền"
              value={
                refundStatusMap[result.refund_status]?.label ??
                result.refund_status
              }
            />
            {result.reason && <Row label="Lý do" value={result.reason} />}
          </div>
          <p className="text-xs text-gray-400">
            Nhân viên sẽ liên hệ để hướng dẫn gửi hàng về.
          </p>
          <button
            onClick={onClose}
            className="w-full h-11 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
              <RotateCcw size={18} className="text-rose-500" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base leading-tight">
                Yêu cầu trả hàng
              </h2>
              <p className="text-[0.72rem] text-gray-400">
                Đơn hàng {order.code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package size={15} className="text-purple-500" />
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Chọn sản phẩm muốn trả
              </p>
            </div>

            {returnableItems.length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <AlertCircle
                  size={18}
                  className="text-amber-500 flex-shrink-0"
                />
                <p className="text-sm text-amber-700">
                  Tất cả sản phẩm trong đơn hàng này đã được trả.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {returnableItems.map((item) => {
                  const max = item.quantity - (item.returned_quantity ?? 0);
                  const sel = selections[item.id];
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-4 p-3 rounded-2xl border cursor-pointer transition-all ${
                        sel?.checked
                          ? "border-purple-300 bg-purple-50"
                          : "border-gray-100 bg-slate-50 hover:border-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sel?.checked ?? false}
                        onChange={() => toggleItem(item.id)}
                        className="accent-purple-600 w-4 h-4 flex-shrink-0"
                      />
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {item.product_name}
                        </p>
                        <p className="text-[0.72rem] text-gray-400 truncate">
                          {item.variant_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {fmt(item.price)}₫ × đặt {item.quantity}
                          {item.returned_quantity > 0 && (
                            <span className="ml-1 text-rose-400">
                              (đã trả {item.returned_quantity})
                            </span>
                          )}
                        </p>
                      </div>
                      {sel?.checked && (
                        <div
                          className="flex items-center gap-1 flex-shrink-0"
                          onClick={(e) => e.preventDefault()}
                        >
                          <button
                            type="button"
                            onClick={() => setQty(item.id, sel.qty - 1, max)}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={max}
                            value={sel.qty}
                            onChange={(e) =>
                              setQty(item.id, e.target.value, max)
                            }
                            className="w-10 h-7 text-center text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                          />
                          <button
                            type="button"
                            onClick={() => setQty(item.id, sel.qty + 1, max)}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold"
                          >
                            +
                          </button>
                          <span className="text-[0.7rem] text-gray-400 ml-1">
                            / {max}
                          </span>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
              Lý do trả hàng <span className="text-rose-500">*</span>
            </p>
            <div className="relative mb-3">
              <select
                value={reasonOption}
                onChange={(e) => setReasonOption(e.target.value)}
                className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300 appearance-none"
              >
                <option value="">-- Chọn lý do --</option>
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            {reasonOption === "Khác" && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
                placeholder="Mô tả lý do trả hàng..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder-gray-300"
              />
            )}
          </div>

          {selectedItems.length > 0 && (
            <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-rose-400 font-medium">
                  Tổng tiền hoàn dự kiến
                </p>
                <p className="text-lg font-bold text-rose-600">
                  {fmt(estimatedTotal)}₫
                </p>
              </div>
              <p className="text-xs text-rose-300">
                {selectedItems.length} sản phẩm
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || returnableItems.length === 0}
            className="flex-1 h-11 rounded-xl bg-rose-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <RotateCcw size={16} />
                Gửi yêu cầu trả hàng
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, mono, highlight }) => (
  <div className="flex justify-between items-start gap-4">
    <span className="text-gray-500 flex-shrink-0">{label}</span>
    <span
      className={`text-right font-semibold ${
        mono ? " text-purple-700" : ""
      } ${highlight ? "text-rose-600" : "text-slate-900"}`}
    >
      {value}
    </span>
  </div>
);

export { receiveStatusMap, refundStatusMap };
export default ReturnOrderModal;
