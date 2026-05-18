import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchOrderRequest } from "../../services/OrderService";
import {
  fetchBankConfigRequest,
  checkSepayStatusRequest,
} from "../../services/PaymentService";
import { formatPrice } from "../../helper/helper";
import toast from "react-hot-toast";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import {
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  Package,
  Truck,
  Mail,
  Loader2,
  CreditCard,
  CheckCircle,
} from "lucide-react";

const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetchOrderRequest(id);
        const orderData = response.data; // axios returns the JSON, which is {status: 'success', data: {...}}
        setOrder(orderData.data || orderData); // Lấy thuộc tính data bên trong
        const actualOrder = orderData.data || orderData;
        if (actualOrder.payment_status === "paid") {
          setIsPaid(true);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const [bankConfig, setBankConfig] = useState(null);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (
      order &&
      order.payment_method?.code === "bank_transfer" &&
      order.payment_status === "unpaid" &&
      !isPaid
    ) {
      fetchBankConfigRequest()
        .then((res) => setBankConfig(res.data))
        .catch(console.error);
    }
  }, [order, isPaid]);

  useEffect(() => {
    let pollingInterval;
    if (order && order.payment_method?.code === "bank_transfer" && !isPaid) {
      pollingInterval = setInterval(async () => {
        try {
          const resp = await checkSepayStatusRequest(
            order.code,
            order.final_amount,
          );
          if (resp && resp.paid) {
            clearInterval(pollingInterval);
            setIsPaid(true);
            toast.success("Thanh toán thành công! Đơn hàng đã được xác nhận.");
          }
        } catch (error) {
          console.error("Polling failed:", error);
        }
      }, 5000);
    }
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [order, isPaid]);

  if (loading) {
    return (
      <CustomerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-black" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="bg-[#f8fafc] min-h-screen pt-36 pb-24 text-left">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-xl border border-slate-100 p-8 md:p-12 shadow-sm text-center">
            {/* Animated Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full mb-6 border border-emerald-100 animate-pulse">
              <CheckCircle2 size={40} />
            </div>

            <h1 className="text-2xl md:text-3xl font-medium text-slate-800 mb-3 tracking-tight">
              Đặt hàng thành công!
            </h1>
            <p className="text-sm text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
              Cảm ơn bạn đã tin tưởng mua sắm tại Trendora. Mã đơn hàng của bạn
              là{" "}
              <span className="font-semibold text-slate-800">
                #{order?.order_number || id}
              </span>
              .
            </p>

            {/* Order Quick Info Grid */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100/80 mb-10">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-50 text-sky-600 rounded-lg flex items-center justify-center mb-2.5 border border-slate-100">
                  <Package size={18} />
                </div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                  Trạng thái
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  Chờ xử lý
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-50 text-sky-600 rounded-lg flex items-center justify-center mb-2.5 border border-slate-100">
                  <Truck size={18} />
                </div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                  Giao hàng
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  {order?.shipping_method?.name || "Tiêu chuẩn"}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-50 text-sky-600 rounded-lg flex items-center justify-center mb-2.5 border border-slate-100">
                  <Mail size={18} />
                </div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                  Thông báo
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  Gửi qua Email
                </p>
              </div>
            </div>

            {/* QR Payment Section */}
            {order?.payment_method?.code === "bank_transfer" && (
              <div className="mb-10 bg-slate-50/50 rounded-xl p-6 md:p-8 border border-slate-100 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
                {isPaid ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                      <CheckCircle size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-1.5">
                      Thanh toán thành công
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Chúng tôi đã nhận được tiền. Đơn hàng đang được chuẩn bị
                      để giao đến bạn.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-8 text-left">
                    <div className="flex-1 w-full">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded-md text-[10px] font-medium uppercase tracking-wider mb-4">
                        <CreditCard size={12} />
                        Thanh toán chuyển khoản
                      </div>
                      <h3 className="text-lg font-medium text-slate-800 mb-2 leading-tight uppercase">
                        Quét mã QR thanh toán
                      </h3>
                      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                        Vui lòng quét mã QR bên dưới để thực hiện chuyển khoản.
                        Hệ thống tự động xác nhận đơn hàng sau khi nhận được
                        giao dịch.
                      </p>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                          <span className="text-[10px] font-medium text-slate-400 uppercase">
                            Số tiền
                          </span>
                          <span className="text-base font-semibold text-sky-700">
                            {formatPrice(order.final_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                          <span className="text-[10px] font-medium text-slate-400 uppercase">
                            Nội dung
                          </span>
                          <span className="text-sm font-semibold text-slate-800 uppercase tracking-wide font-mono">
                            {order.code}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative flex-shrink-0">
                      <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-md">
                        {bankConfig ? (
                          <img
                            src={`https://qr.sepay.vn/img?bank=${bankConfig.bank_id}&acc=${bankConfig.account_no}&template=compact&amount=${order.final_amount}&des=${order.code}`}
                            alt="SePay QR"
                            className="w-48 h-48 md:w-56 md:h-56 object-contain"
                          />
                        ) : (
                          <div className="w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-center gap-2 py-2 px-3 bg-sky-50/80 rounded-lg">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                          <span className="text-[10px] font-medium text-sky-600 uppercase tracking-wider animate-pulse">
                            Đang chờ giao dịch...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/"
                className="w-full sm:w-auto px-8 py-3 bg-sky-600 text-white rounded-lg font-medium text-xs uppercase tracking-wider hover:bg-sky-700 hover:shadow-lg hover:shadow-sky-500/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-sky-500/10"
              >
                <ShoppingBag size={14} />
                Tiếp tục mua sắm
              </Link>
              <Link
                to="/orders"
                className="w-full sm:w-auto px-8 py-3 bg-white text-slate-600 border border-slate-200 rounded-lg font-medium text-xs uppercase tracking-wider hover:border-sky-600 hover:text-sky-600 hover:bg-sky-50/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                Xem đơn hàng
                <ArrowRight size={14} />
              </Link>
            </div>

            <p className="mt-8 text-xs text-slate-400">
              Bạn cần giúp đỡ?{" "}
              <span className="text-sky-600 hover:text-sky-700 font-medium cursor-pointer underline underline-offset-4 transition-colors">
                Liên hệ hỗ trợ ngay
              </span>
            </p>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default OrderSuccess;
