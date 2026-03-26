import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, ArrowRight, Home, Loader2 } from "lucide-react";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import { verifyVNPayPaymentRequest } from "../../../services/PaymentService";
import toast from "react-hot-toast";

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const verifiedRef = React.useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (verifiedRef.current) return;
      verifiedRef.current = true;
      try {
        if (!searchParams.get("vnp_ResponseCode")) {
          setStatus("error");
          return;
        }

        // Call backend with raw query string to preserve encoding
        const res = await verifyVNPayPaymentRequest(searchParams.toString());

        if (res.status === "success") {
          setStatus("success");
          toast.success("Đơn hàng đã được thanh toán thành công!");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Lỗi xác thực thanh toán:", error);
        setStatus("error");
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        {status === "loading" && (
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center max-w-md p-8 bg-white  shadow-xl border border-gray-100">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thành công!
            </h2>
            <p className="text-gray-500 mb-8">
              Giao dịch của bạn đã được xác nhận. Cảm ơn bạn đã sử dụng dịch vụ.
            </p>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => navigate("/admin/orders")}
                className="w-full flex items-center justify-center gap-2 py-3 bg-black text-white font-bold rounded-xl transition-all hover:bg-black/80"
              >
                <ArrowRight className="w-4 h-4" />
                Về danh sách đơn hàng
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center max-w-md p-8 bg-white shadow-xl border border-gray-100">
            <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thất bại
            </h2>
            <p className="text-gray-500 mb-8">
              Giao dịch đã bị hủy hoặc xảy ra lỗi trong quá trình xử lý. Vui
              lòng thử lại.
            </p>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => navigate("/admin/orders")}
                className="w-full flex items-center justify-center gap-2 py-3 bg-black text-white font-bold rounded-xl transition-all hover:bg-black/80"
              >
                <ArrowRight className="w-4 h-4" />
                Quay lại danh sách đơn hàng
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PaymentResultPage;
