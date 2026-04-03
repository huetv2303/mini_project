import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/layout/Admin/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Mail,
  Camera,
  Save,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { updateCustomerRequest } from "../../services/CustomerService";
import { changePasswordRequest } from "../../services/AuthService";
import { getImageUrl } from "../../helper/helper";

const AdminProfile = () => {
  const { user, fetchUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
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
      if (formData.image) {
        data.append("image", formData.image);
      }

      // Re-using customer update service as it handles user data update
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

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="relative group">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-xl">
                  <div className="w-full h-full rounded-xl bg-gray-100 overflow-hidden relative">
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
                      <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-3xl font-black">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="text-white" size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Thông tin cá nhân Admin
                </h3>
                <p className="text-sm text-gray-500">
                  Cập nhật thông tin hiển thị của bạn
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase ml-1">
                    Họ và tên
                  </label>
                  <div className="relative group">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
                      size={18}
                    />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase ml-1">
                    Email (Không thể thay đổi)
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                      size={18}
                    />
                    <input
                      type="email"
                      disabled
                      value={user?.email}
                      className="w-full h-12 bg-gray-100 border border-gray-200 rounded-xl pl-11 pr-4 text-sm text-gray-400 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-200"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Password Card */}
        <div
          id="password-section"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {user?.has_password ? "Đổi mật khẩu" : "Thiết lập mật khẩu"}
              </h3>
              <p className="text-sm text-gray-500">
                {user?.has_password
                  ? "Bảo mật tài khoản bằng cách sử dụng mật khẩu mạnh"
                  : "Thiết lập mật khẩu để có thể đăng nhập bằng email"}
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user?.has_password && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase ml-1">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative group">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
                      size={18}
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
                      className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                    >
                      {showOldPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div
                className={
                  user?.has_password ? "md:col-span-2 invisible h-0" : "hidden"
                }
              ></div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase ml-1">
                  Mật khẩu mới
                </label>
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
                    size={18}
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
                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase ml-1">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
                    size={18}
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
                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswordConfirmation(!showPasswordConfirmation)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                  >
                    {showPasswordConfirmation ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg"
              >
                {passwordSaving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                Cập nhật mật khẩu
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
