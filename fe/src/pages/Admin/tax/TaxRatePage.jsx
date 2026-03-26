import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  BarChart2,
  ListFilter,
  CalendarDays,
  TrendingUp,
  Receipt,
} from "lucide-react";
import toast from "react-hot-toast";
import TaxRateService from "../../../services/TaxRateService";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatPrice } from "../order/OrderListPage";

// ──────────── Management Tab ────────────
const ManagementTab = () => {
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    rate: "",
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTaxRates();
  }, []);

  const fetchTaxRates = async () => {
    try {
      const res = await TaxRateService.getAll();
      setTaxRates(res.data);
    } catch {
      toast.error("Không thể tải danh sách mức thuế");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tax = null) => {
    if (tax) {
      setEditingTaxRate(tax);
      setFormData({ name: tax.name, rate: tax.rate, is_active: tax.is_active });
    } else {
      setEditingTaxRate(null);
      setFormData({ name: "", rate: "", is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData, rate: Number(formData.rate) };
      if (editingTaxRate) {
        await TaxRateService.update(editingTaxRate.id, payload);
        toast.success("Cập nhật thành công");
      } else {
        await TaxRateService.create(payload);
        toast.success("Thêm mới thành công");
      }
      fetchTaxRates();
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa mức thuế này?")) return;
    try {
      await TaxRateService.delete(id);
      toast.success("Xóa thành công");
      fetchTaxRates();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể xóa");
    }
  };

  const filtered = taxRates.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div>
      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm mức thuế..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-5 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Mới
        </button>
      </div>

      {/* Table */}
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
                    Tên Thuế
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Mức (%)
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
                {filtered.length > 0 ? (
                  filtered.map((tax) => (
                    <tr key={tax.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 px-6 font-semibold text-gray-900 text-sm">
                        {tax.name}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-indigo-600 text-sm">
                        {tax.rate}%
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${tax.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {tax.is_active ? "Hoạt động" : "Tạm ngưng"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(tax)}
                            className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tax.id)}
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
                    <td colSpan="4" className="py-12 text-center text-gray-400">
                      Không tìm thấy dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTaxRate ? "Cập Nhật" : "Thêm Mới"} Mức Thuế
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tên Thuế <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  placeholder="Vd: VAT 10%"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Mức Thuế (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({ ...formData, rate: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  placeholder="Vd: 10"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 cursor-pointer"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-semibold text-gray-700 cursor-pointer"
                >
                  Kích hoạt
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
  );
};

// ──────────── Statistics Tab ────────────
const CHART_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
];

const StatCard = ({ icon: Icon, label, value, sub, color = "indigo" }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[1rem] font-bold text-gray-800  mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name === "total_tax" ? formatPrice(p.value) : p.value + " đơn"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatisticsTab = () => {
  const today = new Date().toISOString().split("T")[0];
  const firstDay = today.slice(0, 8) + "01";

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await TaxRateService.getStatistics({
        start_date: startDate,
        end_date: endDate,
      });
      setStats(res.data);
    } catch {
      toast.error("Không thể tải thống kê thuế");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Date Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={fetchStats}
            className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm"
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Lọc
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Tổng tiền thuế thu"
          value={formatPrice(stats?.summary?.total_tax || 0)}
          sub="Chỉ đơn đã giao"
          color="indigo"
        />
        <StatCard
          icon={Receipt}
          label="Đơn có áp thuế"
          value={(stats?.by_tax_rate || []).reduce(
            (s, r) => s + r.order_count,
            0,
          )}
          sub="Trong kỳ được chọn"
          color="emerald"
        />
        <StatCard
          icon={ListFilter}
          label="Đơn không áp thuế"
          value={stats?.summary?.orders_without_tax || 0}
          sub="Không có mức thuế"
          color="amber"
        />
      </div>

      {/* By Tax Rate Table */}
      {stats?.by_tax_rate?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase">
              <BarChart2 className="w-4 h-4 text-indigo-500" />
              Tổng hợp theo mức thuế
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">
                    Tên thuế
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-center">
                    Thuế suất
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-center">
                    Số đơn
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-right">
                    Tiền thuế
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-right">
                    Doanh thu
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.by_tax_rate.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition">
                    <td className="py-4 px-6 font-semibold text-gray-900 text-sm flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          background: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                      {row.tax_name}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">
                        {row.rate}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-gray-700">
                      {row.order_count}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-indigo-600">
                      {formatPrice(row.total_tax)}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-gray-900">
                      {formatPrice(row.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Chart */}
      {stats?.daily_chart?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 text-sm uppercase mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Tiền thuế theo ngày
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={stats.daily_chart}
              margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  v >= 1000000
                    ? `${(v / 1000000).toFixed(1)}M`
                    : v >= 1000
                      ? `${(v / 1000).toFixed(0)}K`
                      : v
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_tax" name="total_tax" radius={[6, 6, 0, 0]}>
                {stats.daily_chart.map((_, i) => (
                  <Cell key={i} fill="#6366f1" fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!stats?.by_tax_rate?.length && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-gray-400 font-medium text-sm">
            Chưa có dữ liệu thuế trong khoảng thời gian này.
          </p>
        </div>
      )}
    </div>
  );
};

// ──────────── Main Page ────────────
const TaxRatePage = () => {
  const [activeTab, setActiveTab] = useState("management");

  const tabs = [
    { key: "management", label: "Mức Thuế", icon: ListFilter },
    { key: "statistics", label: "Thống Kê", icon: BarChart2 },
  ];

  return (
    <AdminLayout>
      <div className=" ">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Quản lý Thuế
          </h1>
          <p className="text-gray-500 mt-1">
            Cấu hình mức thuế và xem thống kê
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "management" && <ManagementTab />}
        {activeTab === "statistics" && <StatisticsTab />}
      </div>
    </AdminLayout>
  );
};

export default TaxRatePage;
