import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { verifyVNPayPaymentRequest } from "../../services/PaymentService";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import toast from "react-hot-toast";

const VNPayCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing"); // processing, success, error
  const [message, setMessage] = useState("Đang xác thực giao dịch...");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const queryString = searchParams.toString();
        const response = await verifyVNPayPaymentRequest(queryString);

        if (response.status === "success") {
          setStatus("success");
          toast.success("Thanh toán thành công!");
          const txnRef = searchParams.get("vnp_TxnRef");
          const orderCode = txnRef.split("-").slice(0, 3).join("-");
          const orderId =
            response.data?.id ||
            searchParams.get("vnp_OrderInfo")?.match(/\d+/)?.[0];

          setTimeout(() => {
            navigate(orderId ? `/orders/${orderId}/success` : "/");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(
            response.message || "Giao dịch không thành công hoặc đã bị hủy.",
          );
        }
      } catch (error) {
        console.error("Payment verification failed:", error);
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Lỗi hệ thống khi xác thực thanh toán.",
        );
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <CustomerLayout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[32px] p-10 shadow-2xl text-center border border-gray-100">
          {status === "processing" && (
            <div className="space-y-6">
              <div className="relative inline-flex">
                <div className="w-20 h-20 rounded-full border-4 border-gray-100 border-t-black animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-black animate-spin" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                  Đang xử lý
                </h1>
                <p className="text-gray-500 font-medium">{message}</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertCircle size={40} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight text-red-500">
                  Thanh toán thất bại
                </h1>
                <p className="text-gray-500 font-medium">{message}</p>
              </div>
              <button
                onClick={() => navigate("/checkout")}
                className="w-full bg-black text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all"
              >
                Trở lại thanh toán
              </button>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500">
                <Loader2 size={40} className="animate-spin" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                  Thanh toán thành công
                </h1>
                <p className="text-gray-500 font-medium">
                  Đang chuyển bạn về trang đơn hàng...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default VNPayCallback;
