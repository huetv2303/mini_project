import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchPaymentMethodsRequest,
  updatePaymentMethodRequest,
  createPaymentMethodRequest,
} from "../../../services/PaymentMethodService";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";

const PaymentMethodPage = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    is_active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const response = await fetchPaymentMethodsRequest();
      setMethods(response.data);
    } catch (error) {
      toast.error("Không thể tải danh sách phương thức thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        code: method.code,
        description: method.description || "",
        is_active: !!method.is_active,
      });
      setImagePreview(getImageUrl(method.image));
    } else {
      setEditingMethod(null);
      setFormData({
        name: "",
        code: "",
        description: "",
        is_active: true,
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMethod(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("code", formData.code);
      data.append("description", formData.description);
      data.append("is_active", formData.is_active ? 1 : 0);
      if (imageFile) {
        data.append("image", imageFile);
      }

      if (editingMethod) {
        await updatePaymentMethodRequest(editingMethod.id, data);
        toast.success("Cập nhật thành công");
      } else {
        await createPaymentMethodRequest(data);
        toast.success("Thêm mới thành công");
      }

      fetchMethods();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    const url = (
      import.meta.env.VITE_URL_IMAGE || "http://localhost:8000/storage"
    ).replace(/\/$/, "");
    return `${url}/${path.replace(/^\//, "")}`;
  };

  const filteredMethods = methods.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 text-left">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Phương Thức Thanh Toán
            </h1>
            <p className="text-gray-500 mt-1 uppercase text-[10px] font-bold">
              Cấu hình các cổng thanh toán và hình thức chi trả
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-6 py-3 bg-black text-white text-sm font-semibold rounded-xl hover:bg-black/80 transition duration-200 shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Thêm Mới
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 text-left">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm phương thức..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-black" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Ảnh
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Tên Phương Thức
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Mã Code
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                      Trạng Thái
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      Thao Tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMethods.length > 0 ? (
                    filteredMethods.map((method) => (
                      <tr
                        key={method.id}
                        className="hover:bg-gray-50/50 transition duration-150"
                      >
                        <td className="py-4 px-6">
                          {method.image ? (
                            <img
                              src={getImageUrl(method.image)}
                              alt={method.name}
                              className="w-12 h-12 object-contain rounded-lg border bg-white p-1"
                            />
                          ) : (
                            <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className=" text-gray-900">
                              {method.name}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase truncate max-w-[200px]">
                              {method.description || "Không có mô tả"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <code className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">
                            {method.code}
                          </code>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex px-3 py-1 text-[10px] font-bold rounded-lg uppercase ${
                              method.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {method.is_active ? "Hoạt động" : "Tạm ngưng"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleOpenModal(method)}
                              className="p-2 text-black bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-12 text-center text-gray-500"
                      >
                        Không tìm thấy dữ liệu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900">
                  {editingMethod ? "CẬP NHẬT" : "THÊM MỚI"} PHƯƠNG THỨC
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form
                onSubmit={handleSubmit}
                className="p-8 overflow-y-auto space-y-6"
              >
                <div className="flex flex-col items-center mb-4">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 w-full">
                    Biểu tượng / Logo
                  </label>
                  <div className="relative group cursor-pointer w-32 h-32">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain rounded-2xl border-2 border-dashed border-gray-200 p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 group-hover:bg-gray-100 transition">
                        <ImageIcon className="w-8 h-8 mb-2" />
                        <span className="text-[10px] font-bold">TẢI ẢNH</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Tên hiển thị <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black outline-none transition text-sm font-medium"
                      placeholder="Vd: Chuyển khoản"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Mã Code (Slug) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black outline-none transition text-sm font-medium disabled:opacity-50"
                      placeholder="Vd: bank_transfer"
                      disabled={!!editingMethod}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Mô tả phương thức
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black outline-none transition text-sm font-medium resize-none"
                    placeholder="Nhập mô tả ngắn về cách thanh toán..."
                  />
                </div>

                <div className="flex items-center p-4 bg-gray-50 rounded-2xl">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="rounded border-gray-300 text-black focus:ring-black w-5 h-5 cursor-pointer"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-3 text-[11px] font-bold text-gray-700 cursor-pointer uppercase"
                  >
                    Kích hoạt phương thức này
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition uppercase tracking-wider"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 text-xs font-bold text-white bg-black hover:bg-black/80 rounded-xl transition disabled:opacity-50 inline-flex items-center uppercase tracking-wider shadow-lg shadow-black/10"
                  >
                    {submitting && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    LƯU THAY ĐỔI
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PaymentMethodPage;
