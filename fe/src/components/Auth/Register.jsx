import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Mail,
  Lock,
  User,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import IconGoogle from "../../assets/IconGoogle.png";
import toast from "react-hot-toast";

const registerSchema = z
  .object({
    // ... (omitted for brevity in thinking, but will match precisely in tool call)
    name: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    password_confirmation: z.string().min(6, "Vui lòng xác nhận lại mật khẩu"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["password_confirmation"],
  });

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [apiError, setApiError] = useState("");
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setApiError("");
    try {
      await registerUser(
        data.name,
        data.email,
        data.password,
        data.password_confirmation,
      );
      toast.success(
        "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
      );
      navigate("/login");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Đăng ký thất bại. Vui lòng thử lại sau.";
      setApiError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-8 ">
      <div className="w-full max-w-md ">
        <div className="w-full max-w-md flex flex-col items-center gap-2 mb-8">
          <span className="text-3xl font-medium">T R E N D O R A</span>
          <p className="text-gray-500 text-xs">F A S H I O N</p>
        </div>
        <div className="bg-white/10 backdrop-blur-2xl border border border-gray-300">
          <div className="px-8 py-4">
            <div className="text-center mb-10 space-y-2">
              <h1 className="text-2xl ">Đ Ă N G K Ý</h1>
            </div>

            {apiError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-1.5 group">
                <label className="text-sm text-gray-600 ">
                  HỌ VÀ TÊN <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500    ">
                    <User size={18} />
                  </div>
                  <input
                    {...register("name")}
                    className={`block w-full pl-11 pr-4 py-3  border border-gray-300 outline-none ${errors.name ? "border-red-500" : ""}`}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-400 text-[0.8rem]  ml-1 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle size={12} /> {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 group">
                <label className="text-sm text-gray-600 ">
                  EMAIL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500    ">
                    <Mail size={18} />
                  </div>
                  <input
                    {...register("email")}
                    className={`block w-full pl-11 pr-4 py-3  border border-gray-300 outline-none ${errors.email ? "border-red-500" : ""}`}
                    placeholder="Email"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-[0.8rem]  ml-1 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle size={12} /> {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 group">
                <label className="text-sm text-gray-600 ">
                  MẬT KHẨU <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500    ">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className={`block w-full pl-11 pr-12 py-3  border border-gray-300 outline-none ${errors.password ? "border-red-500" : ""}`}
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-[0.8rem]  ml-1 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle size={12} /> {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 group">
                <label className="text-sm text-gray-600 ">
                  XÁC NHẬN MẬT KHẨU <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500    ">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPasswordConfirm ? "text" : "password"}
                    {...register("password_confirmation")}
                    className={`block w-full pl-11 pr-12 py-3  border border-gray-300 outline-none ${errors.password_confirmation ? "border-red-500" : ""}`}
                    placeholder="Nhập lại mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                  >
                    {showPasswordConfirm ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {errors.password_confirmation && (
                  <p className="text-red-400 text-[0.8rem]  ml-1 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle size={12} />{" "}
                    {errors.password_confirmation.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-black hover:bg-black/80"
              >
                {isSubmitting ? (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-white" size={20} />
                      <span className="text-white">Đang xử lý...</span>
                    </div>
                  </>
                ) : (
                  <span className="text-white">Đăng ký ngay</span>
                )}
              </button>
            </form>
          </div>

          <div className="flex items-center justify-center px-8">
            <div className="w-full h-[0.5px] bg-gray-300 mr-2"></div>
            <div className="text-gray-300 text-[15px]">HOẶC</div>
            <div className="w-full h-[0.5px] bg-gray-300 ml-2"></div>
          </div>

          <div className="px-8 py-4 bg-white/5 border-t border-white/10 text-center flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google/redirect`;
              }}
              className="w-full py-3 px-4 bg-white border border-gray-300 bg-white hover:border-black"
            >
              <span className="flex items-center justify-center">
                <img src={IconGoogle} alt="Google" width={20} height={20} />
              </span>
            </button>
          </div>

          <div className="px-8 py-4 bg-white/5 border-t border-white/10 text-center">
            <p className="text-gray-500">
              Đã có tài khoản?{" "}
              <Link to="/login" className="hover:underline text-black">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
