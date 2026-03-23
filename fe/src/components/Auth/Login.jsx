import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Mail, Lock, Loader2, Eye, EyeOff, Image } from "lucide-react";
import IconGoogle from "../../assets/IconGoogle.png";
import IconFacebook from "../../assets/IconFacebook.png";
import { setToken } from "../../services/AuthService";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const { login, resendVerification, fetchUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const errorParam = params.get("error");

    if (token) {
      setLoading(true);
      setToken({ access_token: token });
      fetchUser()
        .then((userData) => {
          if (userData?.role_id === 1) {
            navigate("/admin/dashboard");
          } else {
            navigate("/");
          }
        })
        .catch((err) => {
          const msg =
            "Không thể lấy thông tin người dùng sau khi đăng nhập Google.";
          setError(msg);
          toast.error(msg);
          setLoading(false);
        });
    }

    const expiredParam = params.get("expired");
    if (expiredParam) {
      toast.error("Hết phiên đăng nhập");
      setError("Hết phiên đăng nhập");
      navigate("/login", { replace: true });
    }

    if (errorParam) {
      setError(errorParam);
    }

    if (location.state?.message) {
      toast.success(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, fetchUser]);

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google/redirect`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");
    setNeedsVerification(false);
    try {
      const data = await login(email, password);
      toast.success("Đăng nhập thành công!");
      const user = data.user.data || data.user;
      if (user.role_id === 1) {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      console.log(err.response?.data?.message);
      setError(msg);
      toast.error(msg);
      if (err.response?.status === 403 && msg.includes("xác nhận email")) {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await resendVerification(email);
      setSuccessMessage(
        "Đã gửi lại email xác nhận. Vui lòng kiểm tra hộp thư.",
      );
      setNeedsVerification(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Không thể gửi lại email xác nhận.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center  p-4">
      <div className="w-full max-w-md">
        <div className="  border border-gray-200 overflow-hidden">
          <div className="px-8 pb-4 pt-8">
            <div className="text-center mb-10">
              <h1 className="text-2xl mb-2">Đ Ă N G N H Ậ P</h1>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-500 text-sm flex flex-col items-start gap-2">
                <span>{error}</span>
                {needsVerification && (
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-white bg-red-600/50 hover:bg-red-600/80 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {loading ? "Đang gửi..." : "Gửi lại email xác nhận"}
                  </button>
                )}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 text-sm">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-500 ">
                  EMAIL <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-500 outline-none  "
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-500 ">
                    MẬT KHẨU <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-11 pr-12 py-3 bg-white border border-gray-500 outline-none  "
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <a href="#" className=" text-sm hover:underline">
                  Quên mật khẩu?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-black border border-gray-500 outline-none  hover:bg-black/80"
              >
                {loading ? (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-white" size={20} />
                      <span className="text-white">Đang xử lý...</span>
                    </div>
                  </>
                ) : (
                  <span className="text-white">Đăng nhập</span>
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
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-white border border-gray-300 bg-white hover:border-black"
            >
              <span className="flex items-center justify-center">
                <img src={IconGoogle} alt="Google" width={20} height={20} />
              </span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-white border border-gray-300 bg-white hover:border-black"
            >
              <span className="flex items-center justify-center">
                <img src={IconFacebook} alt="Facebook" width={20} height={20} />
              </span>
            </button>
          </div>

          <div className="px-8 py-4 bg-white/5 border-t border-white/10 text-center">
            <p className="text-slate-400">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-black hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
