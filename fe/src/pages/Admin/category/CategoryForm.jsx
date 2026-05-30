import React, { useState, useEffect } from "react";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  fetchCategoriesRequest,
  fetchCategoryRequest,
  createCategoryRequest,
  updateCategoryRequest,
} from "../../../services/CategoryService";
import ImageUpload from "../../../components/common/ImageUpload";
import SelectSearch from "../../../components/common/SelectSearch";
import toast from "react-hot-toast";

const CategoryForm = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(slug);

  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [formData, setFormData] = useState({
    name: "",
    parent_id: searchParams.get("parent_id") || "",
    description: "",
  });

  // Load dữ liệu ban đầu
  useEffect(() => {
    const loadData = async () => {
      try {
        const categoriesRes = await fetchCategoriesRequest({ all: true });
        const allCategories = Array.isArray(categoriesRes?.data)
          ? categoriesRes.data
          : [];

        if (isEdit) {
          const categoryRes = await fetchCategoryRequest(slug);
          const cat = categoryRes?.data;

          if (cat) {
            setFormData({
              name: cat.name || "",
              parent_id: cat.parent_id || "",
              description: cat.description || "",
            });
            // Hiển thị ảnh cũ
            if (cat.image) {
              setImage({
                preview: `${import.meta.env.VITE_URL_IMAGE}/${cat.image}`,
              });
            }
            setCategories(allCategories.filter((c) => c.slug !== slug));
          }
        } else {
          setCategories(allCategories);
        }
      } catch (error) {
        console.error("Failed to load category data:", error);
        toast.error("Đã xảy ra lỗi khi tải dữ liệu!");
        if (isEdit) navigate("/admin/categories");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [slug, isEdit, navigate]);

  const parentOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim())
      return toast.error("Vui lòng nhập tên danh mục!");

    setIsSubmitting(true);
    try {
      const sendData = new FormData();
      sendData.append("name", formData.name);
      sendData.append("parent_id", formData.parent_id || "");
      sendData.append("description", formData.description || "");

      // Chỉ gửi ảnh nếu có ảnh mới được chọn từ máy
      if (image && image.file) {
        sendData.append("image", image.file);
      }

      if (isEdit) {
        await updateCategoryRequest(slug, sendData);
        toast.success("Cập nhật danh mục thành công!");
      } else {
        await createCategoryRequest(sendData);
        toast.success("Tạo danh mục mới thành công!");
      }

      setTimeout(() => navigate("/admin/categories"), 500);
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
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium italic animate-pulse">
            Đang chuẩn bị dữ liệu...
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
            <h1 className="md:text-3xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              {isEdit ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              {isEdit
                ? `Đang thay đổi thông tin: ${formData.name}`
                : "Phân bổ cấu trúc và tối ưu hóa tìm kiếm sản phẩm."}
            </p>
          </div>

          <Link
            to="/admin/categories"
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="md:w-5 md:h-5 sm:w-4 sm:h-4 mr-2" />
            <span className="md:block sm:hidden md:text-sm sm:text-xs">
              Quay lại
            </span>
          </Link>
        </div>

        {/* Form Content */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-2.5 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-800">
                  Thông tin cơ bản
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-bold text-slate-600 ml-1">
                    Tên danh mục *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ví dụ: Điện tử, Thời trang..."
                    className="w-full px-5 py-4 border border-slate-200 bg-slate-50/50 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-semibold"
                  />
                </div>

                <SelectSearch
                  label="Danh mục cha (Tùy chọn)"
                  placeholder="Chọn danh mục cha (Để trống nếu là danh mục gốc)"
                  options={parentOptions}
                  value={formData.parent_id}
                  onChange={(val) =>
                    setFormData({ ...formData, parent_id: val })
                  }
                />

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-bold text-slate-600 ml-1">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    rows="5"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Mô tả giúp hệ thống nhận diện danh mục tốt hơn..."
                    className="w-full px-5 py-4 border border-slate-200 bg-slate-50/50 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-semibold resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ImageUpload
              label="Ảnh danh mục"
              images={image}
              setImages={setImage}
              multiple={false}
            />

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center py-4 rounded-[5px] font-extrabold text-sm uppercase tracking-wide transition-all shadow-md active:scale-95 ${
                  isSubmitting
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20"
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : isEdit ? (
                  <Save className="w-5 h-5 mr-2" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                {isSubmitting
                  ? "Đang xử lý..."
                  : isEdit
                    ? "Cập nhật ngay"
                    : "Tạo danh mục"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default CategoryForm;
