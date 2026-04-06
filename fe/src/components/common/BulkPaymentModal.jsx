import React, { useEffect, useMemo, useState } from "react";
import {
  fetchBankConfigRequest,
  createVNPayPaymentRequest,
} from "../../services/PaymentService";
import { X } from "lucide-react";
import { formatPrice, getImageUrl } from "../../helper/helper";
import toast from "react-hot-toast";
import PaymentIntegration from "./PaymentIntegration";

const BulkPaymentModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedOrders = [],
  paymentMethods = [],
}) => {
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [bankConfig, setBankConfig] = useState(null);
  const [isVnpayLoading, setIsVnpayLoading] = useState(false);

  const selectedMethod = useMemo(() => {
    return paymentMethods.find((m) => String(m.id) === String(paymentMethodId));
  }, [paymentMethodId, paymentMethods]);

  useEffect(() => {
    if (selectedMethod?.code === "bank_transfer") {
      fetchBankConfigRequest()
        .then((res) => setBankConfig(res?.data))
        .catch(console.error);
    }
  }, [selectedMethod]);
  const { validOrders, invalidOrders, totalAmount } = useMemo(() => {
    const valid = [];
    const invalid = [];
    let total = 0;

    selectedOrders.forEach((order) => {
      if (order.payment_status === "paid") {
        invalid.push({ order, reason: "Đơn hàng đã thanh toán toàn bộ" });
        return;
      }

      if (order.payment_status === "refunded") {
        invalid.push({ order, reason: "Đơn hàng đã được hoàn tiền" });
        return;
      }

      if (order.status === "cancelled" || order.status === "returned") {
        invalid.push({ order, reason: "Đơn hàng đã chốt (Hủy/Trả hàng)" });
        return;
      }

      valid.push(order);
      total += parseFloat(order.final_amount || 0);
    });

    return { validOrders: valid, invalidOrders: invalid, totalAmount: total };
  }, [selectedOrders]);

  if (!isOpen) return null;

  const handleVnpayPayment = async () => {
    if (validOrders.length !== 1) return;

    try {
      setIsVnpayLoading(true);
      const res = await createVNPayPaymentRequest(validOrders[0].id);
      if (res?.data?.payment_url) {
        window.location.href = res.data.payment_url;
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Lỗi tạo link thanh toán VNPay",
      );
    } finally {
      setIsVnpayLoading(false);
    }
  };

  const renderPaymentIntegration = () => {
    return (
      <PaymentIntegration
        selectedMethod={selectedMethod}
        bankConfig={bankConfig}
        validOrders={validOrders}
        totalAmount={totalAmount}
      />
    );
  };

  const handleSubmit = () => {
    if (!paymentMethodId) return;
    onConfirm(
      validOrders.map((o) => o.id),
      paymentMethodId,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl max-h-[800px] overflow-y-auto shadow-2xl w-full max-w-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            Thanh toán đơn hàng
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Bạn đã chọn{" "}
              <span className="font-bold">{selectedOrders.length}</span> đơn
              hàng, trong đó:
            </p>
            <div className="space-y-3 pl-2">
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                  <span className="text-sm">Đơn hàng phù hợp</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    : {validOrders.length}
                  </span>
                  <span className="text-sm">
                    (Tổng tiền:{" "}
                    <span className="font-bold">
                      {formatPrice(totalAmount)}
                    </span>
                    )
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-baseline p-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span className="text-sm text-rose-600">
                    Đơn hàng không phù hợp
                  </span>
                </div>
                <span className="text-sm font-bold text-rose-500">
                  : {invalidOrders.length}
                </span>
              </div>

              {invalidOrders.length > 0 && (
                <div className="space-y-2 pl-6">
                  {Array.from(new Set(invalidOrders.map((i) => i.reason))).map(
                    (reason) => (
                      <div
                        key={reason}
                        className="flex justify-between items-center text-xs"
                      >
                        <div className="flex items-center gap-2 text-gray-500">
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span>{reason}</span>
                        </div>
                        <span className="font-bold text-rose-400">
                          :{" "}
                          {
                            invalidOrders.filter((i) => i.reason === reason)
                              .length
                          }
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Phương thức thanh toán<span className="text-rose-500">*</span>
            </label>
            <select
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Chọn phương thức thanh toán</option>
              {paymentMethods
                .filter((pm) => pm.code !== "vnpay")
                .map((method) => (
                  <option key={method.id} value={method.id}>
                    <img
                      src={getImageUrl(method.image)}
                      alt={method.name}
                      className="w-5 h-5"
                    />
                    {method.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
            <span className="font-bold text-gray-700 ">
              Tổng tiền thanh toán
            </span>
            <span className="text-2xl font-bold text-gray-900 ">
              {formatPrice(totalAmount)}
            </span>
          </div>

          {renderPaymentIntegration()}

          <p className="text-[11px] text-gray-500 italic leading-relaxed">
            Lưu ý: Hệ thống sẽ thanh toán lần lượt các đơn và tạo ra nhiều phiếu
            thu tương ứng với số lượng đơn hàng hợp lệ.
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-50 flex justify-end gap-3 bg-gray-50/30 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={validOrders.length === 0 || !paymentMethodId}
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-500 border border-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Xác nhận thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkPaymentModal;
