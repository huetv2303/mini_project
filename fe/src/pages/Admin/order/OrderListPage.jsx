import React, { useEffect, useState, useCallback } from "react";
import {
  fetchOrdersRequest,
  cancelOrderRequest,
} from "../../../services/OrderService";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import {
  Search,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Calendar,
  User,
  CreditCard,
  XCircle,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/common/ConfirmModal";
import Pagination from "../../../components/common/Pagination";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);
};

const OrderListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    lastPage: 1,
    perPage: 10,
  });

  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    orderId: null,
    orderCode: "",
  });

  const getOrders = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const res = await fetchOrdersRequest({ page, search });
      // structure: { data: [], meta: {}, status: 'success' }
      const items = res?.data || [];
      const meta = res?.meta || {};

      setOrders(items);
      setPagination({
        currentPage: meta.current_page || 1,
        lastPage: meta.last_page || 1,
        total: meta.total || 0,
        perPage: meta.per_page || 15,
      });
      console.log(meta);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      getOrders(newPage, searchTerm);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const debouncedSearch = useCallback(
    debounce((val) => {
      setCurrentPage(1);
      getOrders(1, val);
    }, 500),
    [],
  );

  useEffect(() => {
    getOrders(currentPage, searchTerm);
  }, [currentPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return {
          bg: "bg-amber-50",
          text: "text-amber-600",
          border: "border-amber-100",
          icon: <Clock className="w-3 h-3 mr-1" />,
          label: "Chờ xử lý",
        };
      case "processing":
        return {
          bg: "bg-blue-50",
          text: "text-blue-600",
          border: "border-blue-100",
          icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
          label: "Đang đóng gói",
        };
      case "shipped":
        return {
          bg: "bg-indigo-50",
          text: "text-indigo-600",
          border: "border-indigo-100",
          icon: <Truck className="w-3 h-3 mr-1" />,
          label: "Đang giao",
        };
      case "delivered":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-600",
          border: "border-emerald-100",
          icon: <CheckCircle className="w-3 h-3 mr-1" />,
          label: "Đã giao",
        };
      case "cancelled":
        return {
          bg: "bg-rose-50",
          text: "text-rose-600",
          border: "border-rose-100",
          icon: <XCircle className="w-3 h-3 mr-1" />,
          label: "Đã hủy",
        };
      case "returned":
        return {
          bg: "bg-purple-50",
          text: "text-purple-600",
          border: "border-purple-100",
          icon: <RotateCcw className="w-3 h-3 mr-1" />,
          label: "Đã trả hàng",
        };
      case "partially_returned":
        return {
          bg: "bg-pink-50",
          text: "text-pink-600",
          border: "border-pink-100",
          icon: <RotateCcw className="w-3 h-3 mr-1" />,
          label: "Trả hàng một phần",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          border: "border-gray-100",
          icon: null,
          label: status,
        };
    }
  };

  const getPaymentStatusStyle = (status) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "unpaid":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      case "refunded":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "partially_refunded":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  return (
    <AdminLayout>
      <div className="pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-medium text-gray-900 flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-black " />
              Quản lý đơn hàng
            </h1>
            <p className="mt-1 text-xs text-gray-500 font-medium tracking-wide">
              THEO DÕI VÀ XỬ LÝ ĐƠN HÀNG TỪ KHÁCH HÀNG
            </p>
          </div>
          <Link
            to="/admin/orders/create"
            className="inline-flex items-center px-4 py-3 bg-black text-white text-sm font-bold rounded-lg hover:bg-black/90 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" /> Thêm đơn hàng
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-2xl shadow-black/5 overflow-hidden">
          <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm mã đơn, tên khách, số điện thoại..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-3xl text-sm outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
            <table className="w-full text-left border-collapse ">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-6 text-[0.8rem] text-gray-400 uppercase ">
                    Mã đơn hàng
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-400 uppercase ">
                    Khách hàng
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-400 uppercase ">
                    Ngày đặt
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-400 uppercase ">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-400 uppercase ">
                    Trạng thái
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-400 uppercase ">
                    Thanh toán
                  </th>
                  <th className="px-8 py-6 text-[0.8rem] font-black text-gray-400 uppercase  text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-24 text-center">
                      <Loader2 className="w-12 h-12 text-black animate-spin mx-auto mb-4" />
                      <span className="text-gray-400 font-bold text-[10px] uppercase ">
                        Khởi tạo dữ liệu...
                      </span>
                    </td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((order) => {
                    const statusStyle = getStatusStyle(order.status);
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-gray-50 transition-all group hover:bg-gray-50/50"
                      >
                        <td className="px-8 py-5">
                          <div className=" text-[0.9rem]  text-black bg-gray-100 px-3 py-1.5 rounded-lg inline-block transition-all">
                            {order.code}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className=" text-gray-900 group-hover:text-black transition-colors flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              {order.customer.name}
                            </span>
                            <span className="text-[13px] text-gray-400 font-medium mt-0.5 flex gap-2">
                              <p>SĐT: {order.customer.phone}</p>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center text-[11px] text-gray-500 font-bold">
                            <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400" />
                            {new Date(order.created_at).toLocaleDateString(
                              "vi-VN",
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm text-gray-900">
                            {formatPrice(order.final_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div
                            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                          >
                            {statusStyle.icon}
                            {statusStyle.label}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div
                            className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${getPaymentStatusStyle(order.payment_status)}`}
                          >
                            {(() => {
                              switch (order.payment_status) {
                                case "paid":
                                  return "Đã trả";
                                case "refunded":
                                  return "Đã hoàn tiền";
                                case "partially_refunded":
                                  return "Hoàn trả một phần";
                                default:
                                  return "Chưa trả";
                              }
                            })()}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/admin/orders/${order.id}`}
                              className="p-2.5 bg-gray-50 text-gray-500 hover:text-black hover:bg-gray-100 rounded-2xl transition-all shadow-sm"
                            >
                              <Eye className="w-5 h-5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-24 text-center">
                      <ShoppingBag className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold">
                        Chưa có đơn hàng nào được ghi nhận.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            label="Đơn hàng"
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderListPage;
