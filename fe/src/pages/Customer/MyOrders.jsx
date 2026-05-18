import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import { useAuth } from "../../context/AuthContext";
import {
  Package,
  Search,
  Calendar,
  ChevronRight,
  Filter,
  X,
  Loader2,
  AlertCircle,
  Eye,
  Trash2,
  ChevronLeft,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ShoppingBag,
  CreditCard,
  RotateCcw,
  Home,
  ArrowRight,
} from "lucide-react";
import {
  fetchMyOrdersRequest,
  cancelMyOrderRequest,
} from "../../services/OrderService";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "../../components/common/OrderBadges";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { getImageUrl } from "../../helper/helper";

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "all",
    payment_status: "all",
    search: "",
    from_date: "",
    to_date: "",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const statusOptions = [
    { value: "all", label: "Tất cả", icon: <Package size={14} /> },
    { value: "pending", label: "Chờ xử lý", icon: <Clock size={14} /> },
    { value: "processing", label: "Đang xử lý", icon: <Loader2 size={14} /> },
    { value: "shipped", label: "Đang giao", icon: <Truck size={14} /> },
    { value: "delivered", label: "Đã giao", icon: <CheckCircle size={14} /> },
    { value: "cancelled", label: "Đã hủy", icon: <XCircle size={14} /> },
  ];

  const paymentOptions = [
    { value: "all", label: "Tất cả", icon: <CreditCard size={14} /> },
    { value: "paid", label: "Đã thanh toán", icon: <CheckCircle size={14} /> },
    {
      value: "unpaid",
      label: "Chưa thanh toán",
      icon: <AlertCircle size={14} />,
    },
    { value: "refunded", label: "Đã hoàn tiền", icon: <RotateCcw size={14} /> },
  ];

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        ...filters,
        per_page: 10,
      };
      if (params.status === "all") delete params.status;
      if (params.payment_status === "all") delete params.payment_status;

      const response = await fetchMyOrdersRequest(params);
      if (response.status === "success" || response.data) {
        setOrders(response.data);
        setTotal(response.meta?.total || response.data.length || 0);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [
    page,
    filters.status,
    filters.payment_status,
    filters.from_date,
    filters.to_date,
  ]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;

    try {
      const response = await cancelMyOrderRequest(orderId);
      if (response.status === "success") {
        toast.success("Hủy đơn hàng thành công");
        loadOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể hủy đơn hàng");
    }
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      payment_status: "all",
      search: "",
      from_date: "",
      to_date: "",
    });
    setPage(1);
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== "" && v !== "all",
  ).length;

  return (
    <CustomerLayout>
      <div className="bg-[#f8fafc] min-h-screen pt-32 pb-24 text-left">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-10 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm w-fit">
            <Link
              to="/"
              className="hover:text-sky-600 transition-colors flex items-center gap-1"
            >
              <Home size={13} className="text-slate-400" />
              Trang chủ
            </Link>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-800">Đơn hàng của tôi</span>
          </div>

          {/* Title Area and Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight mb-2">
                Đơn hàng của tôi
              </h1>
              <p className="text-sm text-slate-400 font-medium">
                Theo dõi tình trạng giao hàng và lịch sử đơn hàng của bạn
              </p>
            </div>
            <div className="flex items-center gap-3 self-start md:self-auto w-full md:w-auto">
              <div className="relative flex-grow md:w-72 group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors"
                  size={16}
                />
                <form onSubmit={handleSearch} className="w-full">
                  <input
                    type="text"
                    placeholder="TÌM MÃ ĐƠN HÀNG..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                    className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-300"
                  />
                </form>
              </div>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`h-12 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 ${
                  isFilterOpen
                    ? "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/10"
                    : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                }`}
              >
                <Filter size={14} />
                Lọc
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 bg-sky-100 text-sky-600 text-[10px] font-black flex items-center justify-center rounded-full ml-1">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Expanded Filter Panel */}
          {isFilterOpen && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-50">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                  Bộ lọc tìm kiếm nâng cao
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-wider flex items-center gap-1"
                >
                  <X size={12} /> Xóa bộ lọc
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Trạng thái đơn hàng */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Trạng thái đơn hàng
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {statusOptions.map((opt) => {
                      const isActive = filters.status === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() =>
                            setFilters({ ...filters, status: opt.value })
                          }
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                            isActive
                              ? "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/10"
                              : "bg-slate-50 text-slate-500 border-slate-50 hover:bg-slate-100 hover:text-slate-800"
                          }`}
                        >
                          {opt.icon}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Trạng thái thanh toán & Ngày */}
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      Trạng thái thanh toán
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentOptions.map((opt) => {
                        const isActive = filters.payment_status === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() =>
                              setFilters({
                                ...filters,
                                payment_status: opt.value,
                              })
                            }
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                              isActive
                                ? "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/10"
                                : "bg-slate-50 text-slate-500 border-slate-50 hover:bg-slate-100 hover:text-slate-800"
                            }`}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        Từ ngày
                      </label>
                      <input
                        type="date"
                        value={filters.from_date}
                        onChange={(e) =>
                          setFilters({ ...filters, from_date: e.target.value })
                        }
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:border-sky-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        Đến ngày
                      </label>
                      <input
                        type="date"
                        value={filters.to_date}
                        onChange={(e) =>
                          setFilters({ ...filters, to_date: e.target.value })
                        }
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:border-sky-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders List */}
          <div className="space-y-6">
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-white rounded-3xl border border-slate-100 animate-pulse"
                  />
                ))}
              </div>
            ) : orders.length > 0 ? (
              <>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-200/60 transition-all duration-300 group"
                  >
                    <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-5">
                        <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform duration-300 border border-sky-100/50 flex-shrink-0">
                          <Package size={22} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-3 mb-1.5">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                              #{order.code}
                            </h3>
                            <OrderStatusBadge status={order.status} />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                            <Calendar size={13} className="text-sky-500" />
                            {format(
                              new Date(order.created_at),
                              "dd/MM/yyyy HH:mm",
                            )}
                          </p>
                          {order.expected_delivery_date && (
                            <p className="text-[10px] text-sky-600 font-black uppercase tracking-wider flex items-center gap-1.5 mb-2">
                              <Truck size={13} />
                              Dự kiến giao:{" "}
                              {format(
                                new Date(order.expected_delivery_date),
                                "dd/MM/yyyy",
                              )}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <PaymentStatusBadge status={order.payment_status} />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2.5 border-l border-slate-100">
                              {order.payment_method?.name || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end gap-1 px-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left md:text-right">
                          Tổng thanh toán
                        </p>
                        <p className="text-lg font-black text-sky-700">
                          {new Intl.NumberFormat("vi-VN").format(
                            order.final_amount,
                          )}
                          <span className="text-xs ml-0.5">₫</span>
                        </p>
                      </div>

                      {/* Glassmorphic Action Panel */}
                      <div className="flex items-center gap-1.5 border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0 md:pl-6">
                        <Link
                          to={`/orders/${order.id}`}
                          className="w-10 h-10 hover:bg-sky-50 text-slate-400 hover:text-sky-600 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </Link>
                        {order.status === "pending" && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="w-10 h-10 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                            title="Hủy đơn hàng"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Preview Item Strip */}
                    <div className="bg-slate-50/50 px-5 py-3 border-t border-slate-50 flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex -space-x-2.5 overflow-hidden">
                        {order.items?.slice(0, 4).map((item, idx) => (
                          <div
                            key={idx}
                            className="inline-block h-8 w-8 rounded-xl ring-2 ring-white overflow-hidden bg-white shadow-sm"
                            title={item.product_name}
                          >
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.product_name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                        {order.items?.length > 4 && (
                          <div className="h-8 w-8 rounded-xl ring-2 ring-white bg-slate-800 flex items-center justify-center text-[9px] font-black text-white shadow-sm">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide italic max-w-sm line-clamp-1">
                        {order.items?.length} sản phẩm -{" "}
                        {order.items
                          ?.map((i) => i.product_name)
                          .join(", ")
                          .substring(0, 60)}
                        ...
                      </p>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {total > 10 && (
                  <div className="flex items-center justify-center gap-3 pt-6">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-sky-600 hover:bg-slate-50 transition-all shadow-sm active:scale-90"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="h-10 px-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm">
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                        Trang {page} / {Math.ceil(total / 10)}
                      </span>
                    </div>
                    <button
                      disabled={page >= Math.ceil(total / 10)}
                      onClick={() => setPage(page + 1)}
                      className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-sky-600 hover:bg-slate-50 transition-all shadow-sm active:scale-90"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center shadow-sm relative overflow-hidden group">
                <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag size={36} className="text-sky-400" />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide mb-3">
                  Chưa có đơn hàng nào
                </h3>
                <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto font-medium">
                  Bạn chưa thực hiện bất kỳ giao dịch nào. Hãy bắt đầu khám phá
                  các bộ sưu tập mới nhất ngay nhé!
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-sky-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-sky-700 transition-all shadow-md shadow-sky-500/10 hover:-translate-y-0.5 active:scale-95"
                >
                  Bắt đầu mua sắm
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default MyOrders;
