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
  CheckCircle2,
  MessageSquare,
  Package,
  CreditCard,
  Target,
} from "lucide-react";
import toast from "react-hot-toast";
import { updateCustomerRequest } from "../../services/CustomerService";

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

  const getImageUrl = (path) => {
    if (!path) return "/no-image.png";
    if (path.startsWith("http")) return path;
    const url = import.meta.env.VITE_URL_IMAGE.replace(/\/$/, "");
    return `${url}/${path.replace(/^\//, "")}`;
  };

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

    console.log(user);
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
      await fetchUser(); // Reload user data
      setPreviewImage(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <CustomerLayout>
      <div className="bg-slate-50 pt-32 pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar / Left Column */}
            <div className="w-full lg:w-1/3 space-y-8">
              {/* Profile Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10 text-center relative overflow-hidden group">
                {/* Background Accent */}
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-r from-purple-500 to-blue-500 opacity-5 group-hover:opacity-10 transition-opacity"></div>

                <div className="relative z-10">
                  <div className="relative inline-block mb-6 pt-10">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <div className="w-40 h-40 rounded-[40px] bg-slate-100 border-4 border-white shadow-xl overflow-hidden ring-1 ring-gray-100 transition-transform group-hover:scale-105 duration-500">
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
                        <div className="w-full h-full flex items-center justify-center bg-black text-white text-4xl font-black">
                          {user?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="absolute bottom-2 right-2 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-black hover:text-white transition-all ring-4 ring-white"
                    >
                      <Camera size={20} />
                    </button>
                  </div>

                  <h2 className="text-3xl font-bold text-slate-900  mb-2">
                    {user?.name}
                  </h2>
                  <p className="text-gray-800  mb-8">
                    Thành viên từ{" "}
                    {new Date(user?.created_at).toLocaleDateString()}
                  </p>

                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center px-6 py-2 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none mb-1">
                        Hạng
                      </p>
                      <p className="text-sm font-medium text-medium uppercase leading-none">
                        {user?.customer_profile?.loyalty_tier || "Bronze"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 grid grid-cols-1 gap-6">
                <div className="flex items-center gap-6 p-4 hover:bg-slate-50 rounded-3xl transition-colors group">
                  <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Package size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1 text-left">
                      Tổng đơn hàng
                    </p>
                    <p className="text-2xl font-medium text-slate-900 text-left">
                      {user?.customer_profile?.total_orders || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 p-4 hover:bg-slate-50 rounded-3xl transition-colors group border-t border-gray-50 pt-6">
                  <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1 text-left">
                      Đã thanh toán
                    </p>
                    <p className="text-2xl font-medium text-slate-900 text-left">
                      {new Intl.NumberFormat("vi-VN").format(
                        user?.customer_profile?.total_spent || 0,
                      )}
                      đ
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form / Right Column */}
            <div className="w-full lg:w-2/3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10 md:p-14">
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-slate-900 ">
                      THÔNG TIN CÁ NHÂN
                    </h3>
                    <p className="text-gray-400 font-medium">
                      Cập nhật hồ sơ để nhận nhiều ưu đãi hơn.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Full Name */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-700 uppercase ml-2">
                        Họ và tên
                      </label>
                      <div className="relative group">
                        <User
                          className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-black transition-colors"
                          size={20}
                        />
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full h-16 bg-gray-50 border border-gray-100 rounded-lg pl-14 pr-6 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-700 uppercase ml-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail
                          className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700"
                          size={20}
                        />
                        <input
                          type="email"
                          disabled
                          value={user?.email}
                          className="w-full h-16 bg-gray-100 border border-gray-200 rounded-lg pl-14 pr-6 text-sm font-medium text-gray-400 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-700 uppercase ml-2">
                        Số điện thoại
                      </label>
                      <div className="relative group">
                        <Phone
                          className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-black transition-colors"
                          size={20}
                        />
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full h-16 bg-gray-50 border border-gray-100 rounded-lg pl-14 pr-6 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                        />
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-700 uppercase ml-2">
                        Giới tính
                      </label>
                      <div className="flex items-center gap-4">
                        {["male", "female", "other"].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, gender: g })
                            }
                            className={`flex-1 h-16 rounded-lg font-medium text-sm tracking-tight transition-all border ${formData.gender === g ? "bg-black text-white border-black shadow-xl shadow-black/10" : "bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-300 hover:text-black"}`}
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

                    {/* DOB */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-700 uppercase ml-2">
                        Ngày sinh
                      </label>
                      <div className="relative group">
                        <Calendar
                          className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-black transition-colors"
                          size={20}
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
                          className="w-full h-16 bg-gray-50 border border-gray-100 rounded-lg pl-14 pr-6 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <label className="text-xs font-bold text-gray-700 uppercase ml-2">
                      Địa chỉ giao hàng mặc định
                    </label>
                    <div className="relative group">
                      <MapPin
                        className="absolute left-5 top-6 text-gray-700 group-focus-within:text-black transition-colors"
                        size={20}
                      />
                      <textarea
                        rows={3}
                        placeholder="Nhập địa chỉ chi tiết (số nhà, tên đường...)"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-14 pr-6 py-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="group flex items-center gap-3 px-12 py-5 bg-black text-white rounded-lg font-bold transition-all hover:bg-black/90 disabled:opacity-50 shadow-2xl shadow-black/20 hover:-translate-y-1 active:translate-y-0"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin" size={22} />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          LƯU THAY ĐỔI
                          <Save
                            size={20}
                            className="group-hover:scale-110 transition-transform"
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
