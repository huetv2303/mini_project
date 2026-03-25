import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/Admin/AdminLayout";
import {
  Wallet,
  ShoppingBag,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  PieChart as PieChartIcon,
  Trophy,
  Clock,
  Package,
  Eye,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboardStatisticsRequest } from "../../services/DashboardService";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(value) + " đ";
};

// Custom tooltip for Line Chart (Revenue)
const RevenueTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl">
        <p className="text-gray-500 text-xs mb-1">{`Ngày: ${label}`}</p>
        <p className="text-indigo-600 font-bold text-sm">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    cards: {
      revenue_month: 0,
      revenue_today: 0,
      total_orders: 0,
      pending_orders: 0,
      inventory_warnings: 0,
      reviews_today: 0,
    },
    charts: {
      revenue_30_days: [],
      order_status: [],
      top_products: [],
    },
    latest_orders: [],
    low_stock_products: [],
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }
      const response = await getDashboardStatisticsRequest(params);
      setData(response.data);

      console.log(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải dữ liệu thống kê!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  const { cards, charts, latest_orders, low_stock_products } = data;

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-6">
        {/* Header and Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Tổng quan hệ thống
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Thống kê dữ liệu cửa hàng theo thời gian
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-gray-400 font-medium">-</span>
            <input
              type="date"
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button
              onClick={fetchDashboardData}
              className="px-5 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition active:scale-95 shadow-lg"
            >
              Lọc
            </button>
          </div>
        </div>

        {/* Top Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center p-5 relative overflow-hidden h-28">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
            <div className="bg-green-100 p-4 rounded-xl mr-4 flex-shrink-0">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                {data.is_filtered ? "DOANH THU TRONG KỲ" : "DOANH THU THÁNG"}
              </p>
              <h3 className="text-2xl font-bold text-gray-800 my-1">
                {formatCurrency(cards.revenue_month)}
              </h3>
              {!data.is_filtered && (
                <p className="text-sm text-gray-400">
                  Hôm nay: {formatCurrency(cards.revenue_today)}
                </p>
              )}
            </div>
          </div>

          {/* Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center p-5 relative overflow-hidden h-28">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
            <div className="bg-blue-100 p-4 rounded-xl mr-4 flex-shrink-0">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                TỔNG ĐƠN HÀNG
              </p>
              <h3 className="text-2xl font-bold text-gray-800 my-1">
                {cards.total_orders}
              </h3>
              <p className="text-sm text-gray-400">
                Chờ xử lý: {cards.pending_orders}
              </p>
            </div>
          </div>

          {/* Inventory warning */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center p-5 relative overflow-hidden h-28">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
            <div className="bg-orange-100 p-4 rounded-xl mr-4 flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                CẢNH BÁO TỒN KHO
              </p>
              <h3 className="text-2xl font-bold text-gray-800 my-1">
                {cards.inventory_warnings}
              </h3>
              <p className="text-sm text-gray-400">Sản phẩm sắp hết</p>
            </div>
          </div>

          {/* Reviews today */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center p-5 relative overflow-hidden h-28">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
            <div className="bg-purple-100 p-4 rounded-xl mr-4 flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                ĐÁNH GIÁ HÔM NAY
              </p>
              <h3 className="text-2xl font-bold text-gray-800 my-1">
                {cards.reviews_today}
              </h3>
              <p className="text-sm text-gray-400">Lượt đánh giá mới</p>
            </div>
          </div>
        </div>

        {/* Middle Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <div className="col-span-2 bg-white rounded-xl  shadow-sm border-none p-5">
            <h4 className="text-sm font-bold text-gray-700 mb-6 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-green-600" />{" "}
              {data.is_filtered
                ? "Doanh thu trong kỳ"
                : "Doanh thu 30 ngày gần nhất"}
            </h4>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={charts.revenue_30_days}
                  margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(value) => {
                      if (value === 0) return "0";
                      return (value / 1000000).toFixed(1) + "M";
                    }}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                      fill: "#22c55e",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-bold text-gray-700 mb-6 flex items-center">
              <PieChartIcon className="w-4 h-4 mr-2 text-green-600" /> Trạng
              thái đơn hàng
            </h4>
            <div className="h-72 w-full flex flex-col items-center justify-center">
              {charts.order_status?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.order_status}
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {charts.order_status.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [value, "Đơn hàng"]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value) => (
                        <span className="text-xs text-gray-600 w-auto">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-400 text-sm">Chưa có dữ liệu</div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <h4 className="text-sm font-bold text-gray-700 mb-6 flex items-center">
            <Trophy className="w-4 h-4 mr-2 text-green-600" /> Top 5 sản phẩm
            bán chạy
          </h4>
          <div className="h-80 w-full h-[300px]">
            {charts.top_products?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={charts.top_products}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={true}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 15, fill: "#475569" }}
                    width={180}
                    tickFormatter={(value) =>
                      value.length > 25 ? value.substring(0, 25) + "..." : value
                    }
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    formatter={(value) => [value, "Đã bán"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Bar dataKey="sold" radius={[0, 4, 4, 0]} barSize={20}>
                    {charts.top_products.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Chưa có sản phẩm nào bán ra
              </div>
            )}
          </div>
        </div>

        {/* Latest Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white">
            <h4 className="text-sm font-bold text-gray-700 flex items-center">
              <div className="bg-emerald-100 p-1.5 rounded-full mr-2">
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              Đơn hàng mới nhất
            </h4>
            <Link
              to="/admin/orders"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center transition-colors"
            >
              Xem tất cả <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-50">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Mã ĐH
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Khách hàng
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Thanh toán
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody>
                {latest_orders && latest_orders.length > 0 ? (
                  latest_orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm  text-gray-800">
                        {order.code}
                      </td>
                      <td className="px-6 py-4 text-sm  text-gray-800">
                        {order.customer_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500">
                        {order.payment_method}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 text-[11px] font-bold rounded-xl ${
                            order.status === "pending"
                              ? "bg-amber-50 text-amber-600"
                              : order.status === "processing"
                                ? "bg-blue-50 text-blue-600"
                                : order.status === "shipped"
                                  ? "bg-cyan-50 text-cyan-600"
                                  : order.status === "delivered"
                                    ? "bg-green-50 text-green-600"
                                    : order.status === "cancelled"
                                      ? "bg-red-50 text-red-600"
                                      : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {order.status_label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl inline-flex transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-sm text-gray-400"
                    >
                      Chưa có đơn hàng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Items Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white">
            <h4 className="text-sm font-bold text-gray-700 flex items-center">
              <div className="bg-emerald-100 p-1.5 rounded-full mr-2">
                <Package className="w-4 h-4 text-emerald-600" />
              </div>
              Sản phẩm sắp hết hàng
            </h4>
            <Link
              to="/admin/inventory"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center transition-colors"
            >
              Quản lý kho <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-50">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-1/3">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    SKU
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Màu
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Size
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Tồn kho
                  </th>
                </tr>
              </thead>
              <tbody>
                {low_stock_products && low_stock_products.length > 0 ? (
                  low_stock_products.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-xs  text-gray-800">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-800 ">
                        {item.sku}
                      </td>
                      <td className="px-6 py-4 text-xs  text-gray-800 text-center">
                        {item.color}
                      </td>
                      <td className="px-6 py-4 text-xs  text-gray-800 text-center">
                        {item.size}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 text-[11px]  rounded-xl ${
                            item.quantity === 0
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {item.quantity}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-sm text-gray-400"
                    >
                      Kho hàng an toàn, không có sản phẩm nào sắp hết
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
