import React, { useState, useMemo } from "react";
import { X, CheckCircle, XCircle, AlertCircle, RotateCcw } from "lucide-react";

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);
};

const BulkRefundModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedReturns = [],
}) => {
  const [allowUnreceived, setAllowUnreceived] = useState(true);

  const { validReturns, invalidReturns, totalAmount } = useMemo(() => {
    const valid = [];
    const invalid = [];
    let total = 0;

    selectedReturns.forEach((ret) => {
      // Rule 1: Not needed for refund (e.g., unpaid orders)
      if (ret.refund_status === "not_needed") {
        invalid.push({
          ret,
          reason: `Không yêu cầu hoàn tiền cho phiếu trả này`,
        });
        return;
      }

      // Rule 2: Already refunded is invalid
      if (ret.refund_status === "refunded") {
        invalid.push({ ret, reason: "Đã hoàn tiền cho phiếu trả này" });
        return;
      }

      // If needed, check if cancelled
      if (ret.status === "cancelled") {
        invalid.push({ ret, reason: "Phiếu trả hàng đã bị hủy" });
        return;
      }

      if (!allowUnreceived && ret.receive_status !== "received") {
        invalid.push({ ret, reason: "Chưa nhận hàng về kho" });
        return;
      }

      valid.push(ret);
      total += parseFloat(ret.total_return_amount || 0);
    });

    return { validReturns: valid, invalidReturns: invalid, totalAmount: total };
  }, [selectedReturns, allowUnreceived]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
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
              Đã chọn{" "}
              <span className="font-bold">{selectedReturns.length}</span> phiếu
              trả hàng, phân loại như sau:
            </p>
            <div className="space-y-3 pl-2">
              <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Phù hợp để hoàn tiền</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    : {validReturns.length}
                  </span>
                  <span className="text-sm text-emerald-700 font-medium">
                    ({formatPrice(totalAmount)})
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowUnreceivedCb"
                  checked={allowUnreceived}
                  onChange={(e) => setAllowUnreceived(e.target.checked)}
                  className="w-4 h-4 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="allowUnreceivedCb" className="ml-2 italic text-[0.9rem] cursor-pointer select-none">
                  Hoàn tiền cho những đơn chưa hoàn hàng về kho.
                </label>
              </div>

              {invalidReturns.length > 0 && (
                <div className="mt-4 p-4 border border-rose-100 rounded-xl bg-rose-50/20">
                  <p className="text-xs font-bold text-rose-500 mb-2 uppercase tracking-tight">
                    Không phù hợp ({invalidReturns.length})
                  </p>
                  <div className="space-y-2">
                    {Array.from(
                      new Set(invalidReturns.map((i) => i.reason)),
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
                            invalidReturns.filter((i) => i.reason === reason)
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

        {/* Footer */}
        <div className="p-6 border-t border-gray-50 flex justify-end gap-3 bg-gray-50/30 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all"
          >
            Đóng
          </button>
          <button
            onClick={() => onConfirm(validReturns.map((r) => r.id))}
            disabled={validReturns.length === 0}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
          >
            Xác nhận hoàn tiền{" "}
            {validReturns.length > 0 && `(${validReturns.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkRefundModal;
