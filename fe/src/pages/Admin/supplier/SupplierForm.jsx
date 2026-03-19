import React, { useState, useEffect } from "react";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Send,
  AlertCircle,
  Loader2,
  Building2,
  Contact,
  Phone,
  Mail,
  MapPin,
  FileText,
} from "lucide-react";
import {
  fetchSupplierRequest,
  createSupplierRequest,
  updateSupplierRequest,
} from "../../../services/SupplierService";
import ImageUpload from "../../../components/common/ImageUpload";
import toast from "react-hot-toast";

const SupplierForm = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(slug);

  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);

  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address_detail: "",
    tax_code: "",
    description: "",
    status: 1,
  });

  // Load dữ liệu ban đầu
  useEffect(() => {
    if (isEdit) {
      const loadData = async () => {
        try {
          const res = await fetchSupplierRequest(slug);
          const sup = res?.data;
          if (sup) {
            setFormData({
              name: sup.name || "",
              contact_name: sup.contact_name || "",
              email: sup.email || "",
              phone: sup.phone || "",
              address_detail: sup.address_detail || "",
              tax_code: sup.tax_code || "",
              description: sup.description || "",
              status: sup.status || 1,
            });
            // Hiển thị ảnh cũ
            if (sup.image) {
              setImage({
                preview: `${import.meta.env.VITE_URL_IMAGE}/${sup.image}`,
              });
            }
          }
        } catch (error) {
          console.error("Failed to load supplier:", error);
          toast.error("Không thể tải thông tin nhà cung cấp!");
          navigate("/admin/suppliers");
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [slug, isEdit, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim())
      return toast.error("Vui lòng nhập tên nhà cung cấp!");
    // if (!formData.email.trim())
    //   return toast.error("Vui lòng nhập email liên hệ!");

    setIsSubmitting(true);
    try {
      const sendData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        sendData.append(key, value);
      });

      // Chỉ gửi ảnh nếu có ảnh mới
      if (image && image.file) {
        sendData.append("image", image.file);
      }

      if (isEdit) {
        await updateSupplierRequest(slug, sendData);
        toast.success("Cập nhật thông tin thành công!");
      } else {
        await createSupplierRequest(sendData);
        toast.success("Thêm nhà cung cấp mới thành công!");
      }

      setTimeout(() => navigate("/admin/suppliers"), 500);
    } catch (error) {
      const msg = error.response?.data?.message || "Đã có lỗi xảy ra!";
      toast.error(msg, { icon: <AlertCircle className="text-red-500" /> });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-black animate-spin mb-4" />
          <p className="text-gray-500 font-medium italic">
            Đang tải thông tin...
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="animate-in fade-in duration-500 pb-12">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="lg:text-3xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {isEdit ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 font-medium">
              {isEdit
                ? `Đang chỉnh sửa: ${formData.name}`
                : "Đăng ký đối tác cung ứng mới vào hệ thống."}
            </p>
          </div>

          <Link
            to="/admin/suppliers"
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Danh sách
          </Link>
        </div>

        {/* Form Content */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-black/5 space-y-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">
                  Thông tin đối tác
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tên NCC */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Tên Nhà cung cấp *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Nhập tên NCC"
                      className="w-full pl-11 pr-4 py-4 border border-gray-100 bg-gray-50/50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all text-gray-900 font-medium"
                    />
                  </div>
                </div>

                {/* Mã số thuế */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Mã số thuế
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.tax_code}
                      onChange={(e) =>
                        setFormData({ ...formData, tax_code: e.target.value })
                      }
                      placeholder="Mã số doanh nghiệp..."
                      className="w-full pl-11 pr-4 py-4 border border-gray-100 bg-gray-50/50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all text-gray-900 font-medium"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Email liên hệ *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Nhập email..."
                      className="w-full pl-11 pr-4 py-4 border border-gray-100 bg-gray-50/50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all text-gray-900 font-medium font-mono"
                    />
                  </div>
                </div>

                {/* SĐT */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="Nhập số điện thoại..."
                      className="w-full pl-11 pr-4 py-4 border border-gray-100 bg-gray-50/50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all text-gray-900 font-medium"
                    />
                  </div>
                </div>

                {/* Người liên hệ */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Người đại diện liên hệ
                  </label>
                  <div className="relative">
                    <Contact className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact_name: e.target.value,
                        })
                      }
                      placeholder="Họ và tên..."
                      className="w-full pl-11 pr-4 py-4 border border-gray-100 bg-gray-50/50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all text-gray-900 font-medium"
                    />
                  </div>
                </div>

                {/* Địa chỉ x Chi tiết */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Địa chỉ trụ sở
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.address_detail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address_detail: e.target.value,
                        })
                      }
                      placeholder="Số nhà, Tên đường, Quận/Huyện..."
                      className="w-full pl-11 pr-4 py-4 border border-gray-100 bg-gray-50/50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all text-gray-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Mô tả */}
              <div className="flex flex-col space-y-2 pt-2">
                <label className="text-sm font-bold text-gray-700 ml-1">
                  Mô tả hoặc Ghi chú
                </label>
                <textarea
                  rows="4"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Ghi chú về thế mạnh sản phẩm, thời gian giao hàng..."
                  className="w-full px-5 py-4 border border-gray-100 bg-gray-50/50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all text-gray-900 font-medium resize-none"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ảnh Logo / NCC */}
            <ImageUpload
              label="Logo Nhà cung cấp"
              images={image}
              setImages={setImage}
              multiple={false}
            />

            {/* Trạng thái hợp tác */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-black/5 space-y-4">
              <label className="text-sm font-bold text-gray-700 ml-1">
                Trạng thái hợp tác
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 1 })}
                  className={`py-3 rounded-xl text-sm font-bold transition-all ${formData.status === 1 ? "bg-indigo-50 text-indigo-600 border-2 border-indigo-200" : "bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100"}`}
                >
                  Đang hoạt động
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 0 })}
                  className={`py-3 rounded-xl text-sm font-bold transition-all ${formData.status === 0 ? "bg-red-50 text-red-600 border-2 border-red-200" : "bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100"}`}
                >
                  Tạm ngưng
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-black/5">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center py-4 rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-95 ${
                  isSubmitting
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-black/90 shadow-indigo-200"
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                ) : isEdit ? (
                  <Save className="w-5 h-5 mr-2" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                {isSubmitting
                  ? "Đang xử lý..."
                  : isEdit
                    ? "Cập nhật NCC"
                    : "Thêm ngay"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default SupplierForm;
