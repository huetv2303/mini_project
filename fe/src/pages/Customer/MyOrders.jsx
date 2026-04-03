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
    { value: "all", label: "Tất cả", icon: <Package size={16} /> },
    { value: "pending", label: "Chờ xử lý", icon: <Clock size={16} /> },
    { value: "processing", label: "Đang xử lý", icon: <Loader2 size={16} /> },
    { value: "shipped", label: "Đang giao", icon: <Truck size={16} /> },
    { value: "delivered", label: "Đã giao", icon: <CheckCircle size={16} /> },
    { value: "cancelled", label: "Đã hủy", icon: <XCircle size={16} /> },
  ];

  const paymentOptions = [
    { value: "all", label: "Tất cả", icon: <CreditCard size={16} /> },
    { value: "paid", label: "Đã thanh toán", icon: <CheckCircle size={16} /> },
    {
      value: "unpaid",
      label: "Chưa thanh toán",
      icon: <AlertCircle size={16} />,
    },
    { value: "refunded", label: "Đã hoàn tiền", icon: <RotateCcw size={16} /> },
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
      <div className="bg-slate-50 min-h-screen pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-2xl font-medium text-gray-700 mb-2">
                ĐƠN HÀNG CỦA TÔI
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-grow md:w-80 group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors"
                  size={20}
                />
                <form onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Tìm theo mã đơn hàng..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                    className="w-full h-14 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all shadow-sm"
                  />
                </form>
              </div>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`h-14 px-3 rounded-lg border flex items-center gap-2  text-sm transition-all shadow-sm ${isFilterOpen ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50"}`}
              >
                <Filter size={18} />
                Bộ lọc
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 bg-purple-500 text-white text-[10px] flex items-center justify-center rounded-full ml-1">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          {isFilterOpen && (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold">Bộ lọc tìm kiếm</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <X size={16} /> Xóa bộ lọc
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-3">
                  <label className="text-xs  text-gray-400 uppercase font-medium pl-1">
                    Trạng thái đơn hàng
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() =>
                          setFilters({ ...filters, status: opt.value })
                        }
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg text-[10px] font-bold transition-all border ${filters.status === opt.value ? "bg-black/90 text-white border-black shadow-lg shadow-black/10" : "bg-gray-50 text-gray-500 border-gray-50 hover:border-gray-200 hover:text-black"}`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
                    Thanh toán
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {paymentOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() =>
                          setFilters({ ...filters, payment_status: opt.value })
                        }
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg text-[10px] font-bold transition-all border ${filters.payment_status === opt.value ? "bg-black/90 text-white border-black shadow-lg shadow-black/10" : "bg-gray-50 text-gray-500 border-gray-50 hover:border-gray-200 hover:text-black"}`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs  text-gray-400 uppercase font-medium pl-1">
                    Từ ngày
                  </label>
                  <div className="relative group">
                    <Calendar
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="date"
                      value={filters.from_date}
                      onChange={(e) =>
                        setFilters({ ...filters, from_date: e.target.value })
                      }
                      className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-50 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs  text-gray-400 uppercase font-medium pl-1">
                    Đến ngày
                  </label>
                  <div className="relative group">
                    <Calendar
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="date"
                      value={filters.to_date}
                      onChange={(e) =>
                        setFilters({ ...filters, to_date: e.target.value })
                      }
                      className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-50 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders List */}
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white rounded-3xl p-20 flex flex-col items-center justify-center border border-gray-100 shadow-sm">
                <Loader2 className="w-12 h-12 text-black animate-spin mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                  Đang tải dữ liệu...
                </p>
              </div>
            ) : orders.length > 0 ? (
              <>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group"
                  >
                    <div className="p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform duration-500 border border-slate-100">
                          <Package size={32} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xs font-medium">
                              #{order.code}
                            </h3>
                            <div className="text-xs">
                              <OrderStatusBadge status={order.status} />
                            </div>
                          </div>
                          <p className="text-xs  text-gray-400 flex items-center gap-2">
                            <Calendar size={14} />
                            {format(
                              new Date(order.created_at),
                              "dd/MM/yyyy HH:mm",
                            )}
                          </p>
                          {order.expected_delivery_date && (
                            <p className="text-[10px] text-blue-600 font-medium flex items-center gap-2 mt-1">
                              <Truck size={12} />
                              Dự kiến giao:{" "}
                              {format(
                                new Date(order.expected_delivery_date),
                                "dd/MM/yyyy",
                              )}
                            </p>
                          )}
                          <div className="mt-4 flex items-center gap-2">
                            <PaymentStatusBadge status={order.payment_status} />
                            <span className="text-[13px]  text-gray-700  px-2 border-l border-gray-100">
                              {order.payment_method?.name || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end gap-2 pr-4">
                        <p className="text-xs  text-gray-400 text-left md:text-right">
                          Tổng thanh toán
                        </p>
                        <p className="text-xl text-gray-700">
                          {new Intl.NumberFormat("vi-VN").format(
                            order.final_amount,
                          )}
                          <span className="text-sm ml-1">₫</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-gray-50 pt-6 md:pt-0 md:pl-8">
                        <Link to={`/orders/${order.id}`} className="p-4 ">
                          <Eye className="hover:text-gray-500" size={18} />
                        </Link>
                        {order.status === "pending" && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="p-4 "
                            title="Hủy đơn hàng"
                          >
                            <Trash2
                              size={20}
                              className="group-hover/cancel:scale-110 transition-transform"
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick preview of items */}
                    <div className="bg-slate-50/50 px-3 md:px-4 py-2 border-t border-gray-50 flex flex-wrap gap-4 items-center">
                      <div className="flex -space-x-3 overflow-hidden">
                        {order.items?.slice(0, 4).map((item, idx) => (
                          <div
                            key={idx}
                            className="inline-block h-10 w-10 rounded-xl ring-2 ring-white overflow-hidden bg-white shadow-sm"
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
                          <div className="h-10 w-10 rounded-xl ring-2 ring-white bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-500 italic">
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
                  <div className="flex items-center justify-center gap-4 pt-10">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-lg text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <div className="h-10 px-4 bg-white border border-gray-100 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-sm uppercase">
                        Trang {page} / {Math.ceil(total / 10)}
                      </span>
                    </div>
                    <button
                      disabled={page >= Math.ceil(total / 10)}
                      onClick={() => setPage(page + 1)}
                      className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-lg text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-[40px] p-24 text-center border border-gray-50 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-slate-50 rounded-full -translate-y-32 group-hover:scale-110 transition-transform duration-700"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-24 h-24 bg-slate-100 rounded-[32px] flex items-center justify-center text-slate-300 mb-8 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                    <ShoppingBag size={48} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                    CHƯA CÓ ĐƠN HÀNG NÀO
                  </h3>
                  <p className="text-gray-400 font-medium mb-10 max-w-md mx-auto">
                    Bạn chưa thực hiện bất kỳ giao dịch nào. Hãy khám phá những
                    bộ sưu tập mới nhất của chúng tôi ngay!
                  </p>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white rounded-2xl font-black text-sm tracking-widest hover:bg-black/90 hover:-translate-y-1 transition-all shadow-2xl shadow-black/20"
                  >
                    BẮT ĐẦU MUA SẮM
                    <ChevronRight size={20} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default MyOrders;
