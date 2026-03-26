import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import ShippingMethodService from "../../../services/ShippingMethodService";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";

const ShippingMethodPage = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    cost: "",
    estimated_days: "",
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const response = await ShippingMethodService.getAll();
      setMethods(response.data);
    } catch (error) {
      toast.error("Không thể tải danh sách phương thức vận chuyển");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        cost: method.cost,
        estimated_days: method.estimated_days,
        is_active: method.is_active,
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: "",
        cost: "",
        estimated_days: "",
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMethod(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        cost: Number(formData.cost),
        estimated_days: Number(formData.estimated_days),
        is_active: formData.is_active,
      };

      if (editingMethod) {
        await ShippingMethodService.update(editingMethod.id, payload);
        toast.success("Cập nhật thành công");
      } else {
        await ShippingMethodService.create(payload);
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

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phương thức này?")) return;
    try {
      await ShippingMethodService.delete(id);
      toast.success("Xóa thành công");
      fetchMethods();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể xóa");
    }
  };

  const filteredMethods = methods.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Phương Thức Vận Chuyển
            </h1>
            <p className="text-gray-500 mt-1">
              Quản lý các loại hình giao hàng và phí ship
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition duration-200 shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Thêm Mới
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm phương thức..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tên Phương Thức
                    </th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Phí Vận Chuyển (VNĐ)
                    </th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                      T/G Dự Kiến
                    </th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                      Trạng Thái
                    </th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
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
                          <span className="font-semibold text-gray-900">
                            {method.name}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-gray-700">
                          {new Intl.NumberFormat("vi-VN").format(method.cost)}
                        </td>
                        <td className="py-4 px-6 text-center text-gray-600">
                          {method.estimated_days} ngày
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
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
                              className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(method.id)}
                              className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingMethod ? "Cập Nhật" : "Thêm Mới"} Phương Thức
                </h2>
              </div>
              <form
                onSubmit={handleSubmit}
                className="p-6 overflow-y-auto space-y-5"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tên Phương Thức <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    placeholder="Vd: Giao nhanh"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phí Vận Chuyển (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    placeholder="Vd: 30000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Thời Gian Dự Kiến (Ngày){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.estimated_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimated_days: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    placeholder="Vd: 3"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-3 text-sm font-bold text-gray-700 cursor-pointer"
                  >
                    Cho phép sử dụng
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50 inline-flex items-center"
                  >
                    {submitting && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Lưu Thông Tin
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

export default ShippingMethodPage;
