import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchOrderRequest } from "../../services/OrderService";
import { fetchBankConfigRequest, checkSepayStatusRequest } from "../../services/PaymentService";
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
    if (
      order &&
      order.payment_method?.code === "bank_transfer" &&
      !isPaid
    ) {
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
      <div className="bg-white min-h-screen pt-40 pb-32">
        <div className="max-w-3xl mx-auto px-4 text-center">
          {/* Animated Success Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-50 rounded-full mb-8 animate-bounce">
            <CheckCircle2 className="text-green-500" size={48} />
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            ĐẶT HÀNG THÀNH CÔNG!
          </h1>
          <p className="text-lg text-gray-500 mb-12 max-w-xl mx-auto">
            Cảm ơn bạn đã tin tưởng mua sắm tại cửa hàng của chúng tôi. Mã đơn
            hàng của bạn là{" "}
            <span className="font-black text-black">
              #{order?.order_number || id}
            </span>
            .
          </p>

          {/* Order Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                <Package className="text-gray-400" size={20} />
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                Trạng thái
              </p>
              <p className="font-bold text-gray-900">Đang chờ xử lý</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                <Truck className="text-gray-400" size={20} />
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                Giao hàng
              </p>
              <p className="font-bold text-gray-900">
                {order?.shipping_method?.name || "Tiêu chuẩn"}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                <Mail className="text-gray-400" size={20} />
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                Thông báo
              </p>
              <p className="font-bold text-gray-900">Gửi qua Email</p>
            </div>
          </div>

          {/* QR Payment Section */}
          {order?.payment_method?.code === "bank_transfer" && (
            <div className="mb-16 bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {isPaid ? (
                <div className="flex flex-col items-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                    <CheckCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">
                    THANH TOÁN THÀNH CÔNG
                  </h3>
                  <p className="text-gray-500">
                    Chúng tôi đã nhận được tiền. Đơn hàng đang được chuẩn bị để
                    giao đến bạn.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-12 text-left">
                  <div className="flex-1 w-full">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6">
                      <CreditCard size={14} />
                      Thanh toán chuyển khoản
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
                      QUÉT MÃ ĐỂ <br />
                      HOÀN TẤT ĐẶT HÀNG
                    </h3>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                      Vui lòng sử dụng ứng dụng Ngân hàng hoặc Ví điện tử để
                      quét mã QR. Đơn hàng sẽ được tự động xác nhận sau khi
                      chuyển khoản thành công.
                    </p>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase">
                          Số tiền
                        </span>
                        <span className="text-xl font-black text-blue-600">
                          {formatPrice(order.final_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase">
                          Nội dung
                        </span>
                        <span className="text-lg font-black text-gray-900 uppercase tracking-widest">
                          {order.code}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] opacity-5 blur-2xl group-hover:opacity-10 transition duration-700"></div>
                    <div className="relative p-6 bg-white rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-blue-50/50">
                      {bankConfig ? (
                        <img
                          src={`https://qr.sepay.vn/img?bank=${bankConfig.bank_id}&acc=${bankConfig.account_no}&template=compact&amount=${order.final_amount}&des=${order.code}`}
                          alt="SePay QR"
                          className="w-64 h-64 md:w-72 md:h-72 object-contain"
                        />
                      ) : (
                        <div className="w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                      )}
                      
                      <div className="mt-6 flex items-center justify-center gap-3 py-3 px-4 bg-blue-50 rounded-xl">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="  w-full sm:w-auto px-10 py-5 bg-black text-white rounded-lg
              font-black text-sm hover:bg-gray-900 hover:shadow-2xl
              hover:shadow-black/20 hover:-translate-y-1 active:scale-[0.98]
              transition-all flex items-center justify-center gap-3 shadow-lg
              shadow-black/10"
            >
              <ShoppingBag size={18} />
              TIẾP TỤC MUA SẮM
            </Link>
            <Link
              to="/orders"
              className="w-full sm:w-auto px-10 py-5 bg-white text-black border-2 border-gray-100 rounded-lg font-black text-sm hover:border-black hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              XEM ĐƠN HÀNG
              <ArrowRight size={18} />
            </Link>
          </div>

          <p className="mt-12 text-sm text-gray-400">
            Bạn có thắc mắc?{" "}
            <span className="text-black font-bold cursor-pointer underline underline-offset-4">
              Liên hệ hỗ trợ ngay
            </span>
          </p>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default OrderSuccess;
