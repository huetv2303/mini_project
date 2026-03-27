import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import PromotionService from "../../../services/PromotionService";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";

const PromotionPage = () => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const res = await PromotionService.getAll();
      const promos = res.data?.data?.data || res.data?.data || [];
      setPromotions(Array.isArray(promos) ? promos : []);
    } catch (err) {
      toast.error("Không thể tải danh sách khuyến mại");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa khuyến mại này?")) return;
    try {
      await PromotionService.delete(id);
      toast.success("Xóa thành công");
      fetchPromotions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể xóa");
    }
  };

  const filtered = promotions.filter(
    (p) =>
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Cổng Khuyến Mại
          </h1>
          <p className="text-gray-500 mt-1">
            Quản lý mã giảm giá, voucher cho toàn hệ thống
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none shadow-sm"
          />
        </div>
        <button
          onClick={() => navigate("/admin/promotions/create")}
          className="inline-flex items-center px-5 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo Mã Mới
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mã / Tên
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Giảm Giá
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Phạm Vi / Kênh
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Hiệu Lực
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length > 0 ? (
                  filtered.map((promo) => (
                    <tr
                      key={promo.id}
                      className="hover:bg-gray-50/50 transition"
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900">
                          {promo.code}
                        </div>
                        <div className="text-sm text-gray-500">
                          {promo.name}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-indigo-600">
                        {promo.type === "percent"
                          ? `${promo.value}%`
                          : `${Number(promo.value).toLocaleString()}đ`}
                      </td>
                      <td className="py-4 px-6 text-center space-y-1">
                        <div>
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-600`}
                          >
                            {promo.scope === "all"
                              ? "Toàn bộ"
                              : promo.scope === "category"
                                ? "Danh mục"
                                : "Sản phẩm"}
                          </span>
                        </div>
                        <div>
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-50 text-purple-600`}
                          >
                            {promo.applies_to === "all"
                              ? "Tất cả kênh"
                              : promo.applies_to === "website"
                                ? "Chỉ Web"
                                : "Chỉ POS"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-sm">
                        <div className="flex flex-col items-center gap-1">
                          {promo.is_active ? (
                            <span className="text-green-600 font-semibold text-xs bg-green-50 px-2 py-0.5 rounded-full">
                              Đang bật
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold text-xs bg-red-50 px-2 py-0.5 rounded-full">
                              Đã tắt
                            </span>
                          )}
                          <span className="text-gray-500 text-xs mt-1 bg-gray-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
                            Đã dùng: {promo.used_count}{" "}
                            {promo.usage_limit ? `/ ${promo.usage_limit}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/promotions/edit/${promo.id}`)}
                            className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(promo.id)}
                            className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-400">
                      Không tìm thấy dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PromotionPage;
