import React from "react";
import { AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { formatPrice } from "../../helper/helper";

const PaymentIntegration = ({
  selectedMethod,
  bankConfig,
  validOrders = [],
  totalAmount = 0,
  isVnpayLoading = false,
  onVnpayPayment,
}) => {
  if (!selectedMethod) return null;

  if (selectedMethod.code === "bank_transfer") {
    if (!bankConfig) return null;

    const message =
      validOrders.length === 1
        ? `Thanh toan don hang ${validOrders[0].code}`
        : `Thanh toan ${validOrders.length} don hang`;

    return (
      <div className="flex flex-col items-center bg-gray-50 p-6 rounded-xl border border-dashed border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300 w-full mb-6">
        <p className="text-sm font-medium mb-4 text-center">
          Quét mã QR để thanh toán (VietQR)
        </p>
        <div className="relative p-2 bg-white rounded-xl shadow-sm border border-gray-100 mb-4 group cursor-pointer overflow-hidden">
          <img
            src={`https://img.vietqr.io/image/${bankConfig.bank_id}-${bankConfig.account_no}-compact2.png?amount=${Math.floor(totalAmount)}&addInfo=${encodeURIComponent(message)}&accountName=${encodeURIComponent(bankConfig.account_name)}`}
            alt="VietQR"
            className="w-48 h-48 transition-transform group-hover:scale-105 duration-300"
          />
        </div>
        <div className="w-full text-left text-xs text-gray-600 space-y-2 px-4 bg-white/50 p-4 rounded-lg">
          <div className="flex gap-4">
            <span className="text-gray-400 w-24">Ngân hàng:</span>
            <strong className="text-gray-900">{bankConfig.bank_id}</strong>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-400 w-24">Số tài khoản:</span>
            <strong className="text-gray-900">{bankConfig.account_no}</strong>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-400 w-24">Chủ tài khoản:</span>
            <strong className="text-gray-900">{bankConfig.account_name}</strong>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-400 w-24">Nội dung:</span>
            <strong className="text-gray-900 font-bold text-blue-600">
              {message}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  if (selectedMethod.code === "vnpay") {
    return (
      <div className="flex flex-col items-center bg-[#005BA9]/5 p-6 rounded-xl border border-[#005BA9]/20 animate-in fade-in slide-in-from-top-2 duration-300 w-full mb-6">
        <div className="w-12 h-12 bg-[#005BA9] rounded-xl flex items-center justify-center mb-4 text-white shadow-lg">
          <ExternalLink className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#005BA9] mb-2 uppercase">
          Thanh toán qua VNPay
        </h3>

        {validOrders.length === 1 ? (
          <div className="space-y-4 w-full">
            <p className="text-sm text-center text-gray-600">
              Hệ thống sẽ chuyển tiếp bạn đến cổng thanh toán VNPay để hoàn tất
              giao dịch cho đơn hàng{" "}
              <span className="font-bold text-gray-900">
                #{validOrders[0].code}
              </span>
              .
            </p>
            <button
              onClick={onVnpayPayment}
              disabled={isVnpayLoading}
              className="w-full py-3 bg-[#005BA9] hover:bg-[#004e92] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {isVnpayLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>ĐẾN CỔNG THANH TOÁN VNPAY</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs leading-relaxed font-medium">
              VNPay hiện chỉ hỗ trợ thanh toán cho từng đơn hàng riêng lẻ. Vui
              lòng chọn từng đơn hàng để thanh toán qua VNPay hoặc sử dụng{" "}
              <span className="font-bold underline">Chuyển khoản</span> để thanh
              toán gộp cho {validOrders.length} đơn hàng.
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default PaymentIntegration;
