import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  CheckCircle2, 
  ShoppingBag, 
  ArrowRight, 
  Package, 
  Truck, 
  Mail,
  Loader2
} from "lucide-react";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import { fetchOrderRequest } from "../../services/OrderService";
import { formatPrice } from "../../helper/helper";

const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetchOrderRequest(id);
        setOrder(response.data);
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

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
      <div className="bg-white min-h-screen pt-20 pb-32">
        <div className="max-w-3xl mx-auto px-4 text-center">
          {/* Animated Success Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-50 rounded-full mb-8 animate-bounce">
            <CheckCircle2 className="text-green-500" size={48} />
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            ĐẶT HÀNG THÀNH CÔNG!
          </h1>
          <p className="text-lg text-gray-500 mb-12 max-w-xl mx-auto">
            Cảm ơn bạn đã tin tưởng mua sắm tại cửa hàng của chúng tôi. 
            Mã đơn hàng của bạn là <span className="font-black text-black">#{order?.order_number || id}</span>.
          </p>

          {/* Order Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                <Package className="text-gray-400" size={20} />
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Trạng thái</p>
              <p className="font-bold text-gray-900">Đang chờ xử lý</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                <Truck className="text-gray-400" size={20} />
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Giao hàng</p>
              <p className="font-bold text-gray-900">{order?.shipping_method?.name || "Tiêu chuẩn"}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                <Mail className="text-gray-400" size={20} />
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Thông báo</p>
              <p className="font-bold text-gray-900">Gửi qua Email</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/"
              className="w-full sm:w-auto px-10 py-5 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-900 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-black/10"
            >
              <ShoppingBag size={18} />
              TIẾP TỤC MUA SẮM
            </Link>
            <Link 
              to="/profile" 
              className="w-full sm:w-auto px-10 py-5 bg-white text-black border-2 border-gray-100 rounded-2xl font-black text-sm uppercase tracking-widest hover:border-black hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              XEM ĐƠN HÀNG
              <ArrowRight size={18} />
            </Link>
          </div>

          <p className="mt-12 text-sm text-gray-400">
            Bạn có thắc mắc? <span className="text-black font-bold cursor-pointer underline underline-offset-4">Liên hệ hỗ trợ ngay</span>
          </p>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default OrderSuccess;
