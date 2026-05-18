import React, { useState, useEffect } from "react";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Calendar,
  Loader2,
  Package,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  Home,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { updateCustomerRequest } from "../../services/CustomerService";
import { changePasswordRequest } from "../../services/AuthService";
import { getImageUrl } from "../../helper/helper";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user, fetchUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    address: "",
    avatar: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    password: "",
    password_confirmation: "",
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.customer_profile?.phone || "",
        gender: user.customer_profile?.gender || "",
        date_of_birth: user.customer_profile?.date_of_birth || "",
        address: user.customer_profile?.address || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("phone", formData.phone);
      data.append("gender", formData.gender);
      data.append("date_of_birth", formData.date_of_birth);
      data.append("address", formData.address);
      if (formData.image) {
        data.append("image", formData.image);
      }

      await updateCustomerRequest(user.id, data);

      toast.success("Cập nhật thông tin thành công!");
      await fetchUser();
      setPreviewImage(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    try {
      await changePasswordRequest(passwordForm);
      toast.success("Đổi mật khẩu thành công!");
      setPasswordForm({
        old_password: "",
        password: "",
        password_confirmation: "",
      });
      await fetchUser();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Đổi mật khẩu thất bại. Vui lòng thử lại.",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!user && !loading) {
    return (
      <CustomerLayout>
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
          <Loader2 className="animate-spin text-sky-600 w-12 h-12" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="bg-[#f8fafc] pt-32 pb-24 min-h-screen text-left">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-10 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm w-fit">
            <Link to="/" className="hover:text-sky-600 transition-colors flex items-center gap-1">
              <Home size={13} className="text-slate-400" />
              Trang chủ
            </Link>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-800">Hồ sơ cá nhân</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar / Left Column */}
            <div className="w-full lg:w-1/3 space-y-8">
              {/* Profile Card */}
              <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center relative overflow-hidden group shadow-sm">
                {/* Background Accent */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-sky-400 to-sky-600 opacity-[0.06] group-hover:opacity-[0.09] transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <div className="relative inline-block mb-6 pt-6">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <div className="w-32 h-32 rounded-3xl bg-slate-50 border-2 border-white shadow-md overflow-hidden ring-1 ring-slate-100 group-hover:scale-105 transition-transform duration-500 mx-auto">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : formData.avatar ? (
                        <img
                          src={getImageUrl(formData.avatar)}
                          alt={user?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-sky-600 text-white text-3xl font-black">
                          {user?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="absolute bottom-1 right-1 w-10 h-10 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl shadow-md shadow-sky-500/10 flex items-center justify-center transition-all active:scale-90"
                    >
                      <Camera size={16} />
                    </button>
                  </div>

                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-1">
                    {user?.name}
                  </h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-6">
                    Tham gia ngày {new Date(user?.created_at).toLocaleDateString("vi-VN")}
                  </p>

                  <div className="flex items-center justify-center">
                    <div className="text-center px-4 py-1.5 bg-sky-50 text-sky-600 rounded-full border border-sky-100/50 text-[10px] font-black uppercase tracking-widest">
                      Hạng: {user?.customer_profile?.loyalty_tier || "Thường"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors group">
                  <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-left">
                      Tổng đơn hàng
                    </p>
                    <p className="text-lg font-black text-slate-800 text-left">
                      {user?.customer_profile?.total_orders || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors group border-t border-slate-50 pt-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-left">
                      Tổng đã thanh toán
                    </p>
                    <p className="text-lg font-black text-slate-800 text-left">
                      {new Intl.NumberFormat("vi-VN").format(
                        user?.customer_profile?.total_spent || 0,
                      )}
                      ₫
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form / Right Column */}
            <div className="w-full lg:w-2/3 space-y-8">
              {/* Profile Details Form */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-sky-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-500/10">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                      Thông tin cá nhân
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Cập nhật đầy đủ để nhận nhiều ưu đãi mua sắm hơn
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                        Họ và tên
                      </label>
                      <div className="relative group">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors"
                          size={16}
                        />
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Email (Disabled) */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                        Địa chỉ Email
                      </label>
                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                        <input
                          type="email"
                          disabled
                          value={user?.email}
                          className="w-full h-12 bg-slate-100 border border-slate-150 rounded-2xl pl-11 pr-4 text-xs font-bold text-slate-400 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                        Số điện thoại
                      </label>
                      <div className="relative group">
                        <Phone
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors"
                          size={16}
                        />
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Gender Selector */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                        Giới tính
                      </label>
                      <div className="flex items-center gap-2">
                        {["male", "female", "other"].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, gender: g })
                            }
                            className={`flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                              formData.gender === g
                                ? "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/10"
                                : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                            }`}
                          >
                            {g === "male"
                              ? "Nam"
                              : g === "female"
                                ? "Nữ"
                                : "Khác"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                        Ngày sinh
                      </label>
                      <div className="relative group">
                        <Calendar
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors"
                          size={16}
                        />
                        <input
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              date_of_birth: e.target.value,
                            })
                          }
                          className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2 pt-4 border-t border-slate-50">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                      Địa chỉ nhận hàng mặc định
                    </label>
                    <div className="relative group">
                      <MapPin
                        className="absolute left-4 top-5 text-slate-400 group-focus-within:text-sky-600 transition-colors"
                        size={16}
                      />
                      <textarea
                        rows={3}
                        placeholder="Nhập địa chỉ nhận hàng chi tiết (số nhà, tên đường, phường/xã...)"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="group flex items-center justify-center gap-2 px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-sky-500/10 hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          LƯU THAY ĐỔI
                          <Save
                            size={14}
                            className="group-hover:scale-105 transition-transform"
                          />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password Section */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-sky-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-500/10">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                      {user?.has_password ? "Đổi mật khẩu" : "Thiết lập mật khẩu"}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {user?.has_password
                        ? "Thay đổi mật khẩu định kỳ giúp bảo vệ tài khoản tốt hơn"
                        : "Thiết lập mật khẩu để đăng nhập trực tiếp bằng email"}
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Old Password */}
                    {user?.has_password && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                          Mật khẩu hiện tại
                        </label>
                        <div className="relative group">
                          <Lock
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors"
                            size={16}
                          />
                          <input
                            type={showOldPassword ? "text" : "password"}
                            required
                            value={passwordForm.old_password}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                old_password: e.target.value,
                              })
                            }
                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-11 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    )}

                    {user?.has_password && <div className="hidden md:block" />}

                    {/* New Password */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                        Mật khẩu mới
                      </label>
                      <div className="relative group">
                        <Lock
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors"
                          size={16}
                        />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={passwordForm.password}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              password: e.target.value,
                            })
                          }
                          className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-11 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                        Xác nhận mật khẩu mới
                      </label>
                      <div className="relative group">
                        <Lock
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors"
                          size={16}
                        />
                        <input
                          type={showPasswordConfirmation ? "text" : "password"}
                          required
                          value={passwordForm.password_confirmation}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              password_confirmation: e.target.value,
                            })
                          }
                          className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-11 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswordConfirmation(!showPasswordConfirmation)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPasswordConfirmation ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="group flex items-center justify-center gap-2 px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-sky-500/10 hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto"
                    >
                      {passwordSaving ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          {user?.has_password ? "ĐỔI MẬT KHẨU" : "THIẾT LẬP MẬT KHẨU"}
                          <Save
                            size={14}
                            className="group-hover:scale-105 transition-transform"
                          />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default Profile;
