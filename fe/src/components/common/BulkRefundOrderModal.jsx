import React, { useMemo } from "react";
import { X, CheckCircle, XCircle, AlertCircle, RotateCcw } from "lucide-react";

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);
};

const BulkRefundOrderModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedOrders = [],
}) => {
  const { validOrders, invalidOrders, totalAmount } = useMemo(() => {
    const valid = [];
    const invalid = [];
    let total = 0;

    selectedOrders.forEach((order) => {
      const status = (order.status || "").toLowerCase();
      const pStatus = (order.payment_status || "unpaid").toLowerCase();

      // Rule 1: Only cancelled or fully returned orders can be refunded in order list
      if (status !== "cancelled" && status !== "returned") {
        invalid.push({
          order,
          reason: `Trạng thái: ${order.status} (Yêu cầu Hủy/Trả hàng)`,
        });
        return;
      }

      // Rule 2: Already refunded is invalid
      if (pStatus === "refunded") {
        invalid.push({ order, reason: "Đã hoàn tiền cho đơn này" });
        return;
      }

      // Rule 3: Only paid/partially paid orders can be refunded
      if (!["paid", "partially_paid", "partially_refunded"].includes(pStatus)) {
        invalid.push({
          order,
          reason: `Thanh toán: ${order.payment_status || "Chưa trả"} (Yêu cầu: Đã trả)`,
        });
        return;
      }

      valid.push(order);
      total += parseFloat(order.final_amount || 0);
    });

    return { validOrders: valid, invalidOrders: invalid, totalAmount: total };
  }, [selectedOrders]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-indigo-500" />
            Hoàn tiền hàng loạt
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-bold mb-1">Cảnh báo !</p>
              <p>
                Thao tác này sẽ chuyển trạng thái thanh toán của các đơn hợp lệ
                thành <b>HOÀN TIỀN</b>. Bạn cần tự liên hệ trả tiền cho khách
                ngoài hệ thống.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Đã chọn <span className="font-bold">{selectedOrders.length}</span>{" "}
              đơn hàng, phân loại như sau:
            </p>
            <div className="space-y-3 pl-2">
              <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Phù hợp để hoàn tiền</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    : {validOrders.length}
                  </span>
                  <span className="text-sm text-emerald-700 font-medium">
                    ({formatPrice(totalAmount)})
                  </span>
                </div>
              </div>

              {invalidOrders.length > 0 && (
                <div className="mt-4 p-4 border border-rose-100 rounded-xl bg-rose-50/20">
                  <p className="text-xs font-bold text-rose-500 mb-2 uppercase tracking-tight">
                    Không phù hợp ({invalidOrders.length})
                  </p>
                  <div className="space-y-2">
                    {Array.from(
                      new Set(invalidOrders.map((i) => i.reason)),
                    ).map((reason) => (
                      <div
                        key={reason}
                        className="flex justify-between items-center text-xs"
                      >
                        <div className="flex items-center gap-2 text-gray-500">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          <span>{reason}</span>
                        </div>
                        <span className="font-bold text-gray-700">
                          :{" "}
                          {
                            invalidOrders.filter((i) => i.reason === reason)
                              .length
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-50 flex justify-end gap-3 bg-gray-50/30 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all"
          >
            Đóng
          </button>
          <button
            onClick={() => onConfirm(validOrders.map((o) => o.id))}
            disabled={validOrders.length === 0}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
          >
            Xác nhận hoàn tiền{" "}
            {validOrders.length > 0 && `(${validOrders.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkRefundOrderModal;
