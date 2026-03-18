import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // 'loading', 'success', 'error'
  const [message, setMessage] = useState("Đang xác nhận email của bạn...");

  useEffect(() => {
    const url = searchParams.get("url");

    if (!url) {
      setStatus("error");
      setMessage("Đường dẫn xác nhận không hợp lệ.");
      return;
    }

    const verifyAccount = async () => {
      try {
        // Tách lấy chính xác phần sau /api/v1 (ví dụ: /email/verify/1/hash?...)
        const relativeUrl = url.includes("/api/v1")
          ? url.split("/api/v1")[1]
          : url;

        // Gọi API với đúng phần link tương đối
        const response = await api.get(relativeUrl);
        setStatus("success");
        const successMsg = response.data.message || "Xác nhận email thành công!";
        setMessage(successMsg);
        toast.success(successMsg);

        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error) {
        setStatus("error");
        const errorMsg =
          error.response?.data?.message ||
          "Xác nhận email thất bại. Vui lòng thử lại.";
        setMessage(errorMsg);
        toast.error(errorMsg);
      }
    };

    verifyAccount();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-2 mb-8">
        <span className="text-3xl font-medium">T R E N D O R A</span>
        <p className="text-gray-500 text-xs">F A S H I O N</p>
      </div>
      <div className="flex items-center justify-center w-full">
        <div className="w-full max-w-md border border-gray-400  overflow-hidden p-8 text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center">
              <Loader2 className="animate-spin text-blue-400 mb-4" size={48} />
              <h2 className="text-2xl  text-gray-500 mb-2">Đang xác nhận...</h2>
              <p className="text-gray-500">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center">
              <CheckCircle className="text-green-400 mb-4" size={48} />
              <h2 className="text-2xl  text-gray-500 mb-2">Thành công!</h2>
              <p className="text-gray-500 mb-6">{message}</p>
              <p className="text-sm text-gray-500">
                Đang chuyển hướng đến trang đăng nhập...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center">
              <XCircle className="text-red-500 mb-4" size={48} />
              <h2 className="text-2xl  text-gray-500 mb-2">
                Lỗi xác thực email
              </h2>
              <p className="text-gray-500 mb-6">{message}</p>
              <button
                onClick={() => navigate("/login")}
                className="py-2 px-6 bg-black hover:bg-black/80 text-white flex items-center gap-2"
              >
                <ArrowLeft size={18} /> Quay lại đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
