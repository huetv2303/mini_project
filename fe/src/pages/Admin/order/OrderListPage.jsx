import React, { useEffect, useState, useCallback } from "react";

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
  Phone,
  Settings,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { formatPrice } from "../../../helper/helper";

import ConfirmModal from "../../../components/common/ConfirmModal";
import Pagination from "../../../components/common/Pagination";
import ConfirmBulkActionModal from "../../../components/common/ConfirmBulkActionModal";
import BulkPaymentModal from "../../../components/common/BulkPaymentModal";
import BulkRefundOrderModal from "../../../components/common/BulkRefundOrderModal";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "../../../components/common/OrderBadges";
import {
  fetchOrdersRequest,
  bulkUpdateOrdersRequest,
  fetchPaymentMethodsRequest,
} from "../../../services/OrderService";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const OrderListPage = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchType, setSearchType] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    lastPage: 1,
    perPage: 15,
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    orderId: null,
    orderCode: "",
  });

  const [bulkModal, setBulkModal] = useState({
    isOpen: false,
    action: "",
    targetStatus: "",
  });

  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
  });

  const [refundModal, setRefundModal] = useState({
    isOpen: false,
  });

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetchPaymentMethodsRequest();
      setPaymentMethods(res.data);
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
    }
  };

  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "pending", label: "Đặt hàng" },
    { id: "processing", label: "Đang đóng gói" },
    { id: "shipped", label: "Đang giao" },
    { id: "delivered", label: "Đã hoàn thành" },
    { id: "cancelled", label: "Đã hủy" },
  ];

  const getOrders = async (
    page = 1,
    currentSearch = "",
    currentStatus = "all",
    type = "all",
    from = "",
    to = "",
    perPageCount = 15,
  ) => {
    try {
      setLoading(true);
      const res = await fetchOrdersRequest({
        page,
        search: currentSearch,
        status: currentStatus,
        search_type: type,
        from_date: from,
        to_date: to,
        per_page: perPageCount,
      });

      const items = res?.data || [];
      const meta = res?.meta || {};

      setOrders(items);
      setPagination({
        currentPage: meta.current_page || 1,
        lastPage: meta.last_page || 1,
        total: meta.total || 0,
        perPage: meta.per_page || perPageCount,
      });
      // Clear selection when page data changes
      setSelectedIds([]);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      getOrders(
        newPage,
        searchTerm,
        filterStatus,
        searchType,
        fromDate,
        toDate,
        itemsPerPage,
      );
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const debouncedSearch = useCallback(
    debounce((val, status, type, from, to, perPage) => {
      setCurrentPage(1);
      getOrders(1, val, status, type, from, to, perPage);
    }, 500),
    [],
  );

  useEffect(() => {
    getOrders(
      currentPage,
      searchTerm,
      filterStatus,
      searchType,
      fromDate,
      toDate,
      itemsPerPage,
    );
    fetchPaymentMethods();
  }, [filterStatus, searchType, fromDate, toDate, itemsPerPage]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    debouncedSearch(
      val,
      filterStatus,
      searchType,
      fromDate,
      toDate,
      itemsPerPage,
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setSearchType("all");
    setFromDate("");
    setToDate("");
    setItemsPerPage(15);
    setCurrentPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBulkActionClick = (action, status = null) => {
    if (selectedIds.length === 0) return;

    if (action === "pay") {
      setPaymentModal({ isOpen: true });
      return;
    }

    if (action === "refund") {
      setRefundModal({ isOpen: true });
      return;
    }

    setBulkModal({
      isOpen: true,
      action,
      targetStatus: status,
    });
  };

  const executeBulkAction = async (validIds) => {
    if (validIds.length === 0) {
      setBulkModal({ isOpen: false, action: "", targetStatus: "" });
      return;
    }

    try {
      setIsBulkUpdating(true);
      await bulkUpdateOrdersRequest({
        ids: validIds,
        action: bulkModal.action,
        status: bulkModal.targetStatus,
      });
      toast.success("Thao tác hàng loạt thành công");
      setSelectedIds([]);
      setBulkModal({ isOpen: false, action: "", targetStatus: "" });
      getOrders(
        currentPage,
        searchTerm,
        filterStatus,
        searchType,
        fromDate,
        toDate,
        itemsPerPage,
      );
    } catch (error) {
      console.error("Bulk update failed:", error);
      toast.error(
        error.response?.data?.message || "Thao tác hàng loạt thất bại",
      );
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const executeBulkPayment = async (validIds, paymentMethodId) => {
    if (validIds.length === 0) {
      setPaymentModal({ isOpen: false });
      return;
    }

    try {
      setIsBulkUpdating(true);
      const res = await bulkUpdateOrdersRequest({
        ids: validIds,
        action: "pay",
        payment_method_id: paymentMethodId,
      });
      toast.success(
        res.message || `Đã thanh toán cho ${res.updated_count || 0} đơn hàng`,
      );
      setSelectedIds([]);
      setPaymentModal({ isOpen: false });
      getOrders(
        currentPage,
        searchTerm,
        filterStatus,
        searchType,
        fromDate,
        toDate,
        itemsPerPage,
      );
    } catch (error) {
      console.error("Bulk pay failed:", error);
      toast.error(
        error.response?.data?.message || "Thanh toán hàng loạt thất bại",
      );
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const executeBulkRefund = async (validIds) => {
    if (validIds.length === 0) {
      setRefundModal({ isOpen: false });
      return;
    }

    try {
      setIsBulkUpdating(true);
      const res = await bulkUpdateOrdersRequest({
        ids: validIds,
        action: "refund",
      });
      toast.success(
        res.message || `Đã cập nhật ${res.updated_count || 0} đơn hàng`,
      );
      setSelectedIds([]);
      setRefundModal({ isOpen: false });
      getOrders(
        currentPage,
        searchTerm,
        filterStatus,
        searchType,
        fromDate,
        toDate,
        itemsPerPage,
      );
    } catch (error) {
      console.error("Bulk refund failed:", error);
      toast.error(
        error.response?.data?.message || "Hoàn tiền hàng loạt thất bại",
      );
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Quản lý đơn hàng
            </h1>
          </div>
          <Link
            to="/admin/orders/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" /> Tạo đơn hàng
          </Link>
        </div>

        {/* Status Tabs */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterStatus(tab.id);
                setCurrentPage(1);
              }}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                filterStatus === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-blue-50/50 px-4 py-3 border-b border-blue-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-blue-700">
                  Đã chọn {selectedIds.length} đơn hàng
                </span>
                <div className="h-4 w-px bg-blue-200"></div>
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-[0.8rem] font-medium  text-blue-700 hover:bg-blue-50 transition-all">
                    Cập nhật trạng thái <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-1">
                    {tabs
                      .filter((t) => t.id !== "all")
                      .map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() =>
                            handleBulkActionClick("update_status", tab.id)
                          }
                          className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                        >
                          Chuyển sang {tab.label}
                        </button>
                      ))}
                  </div>
                </div>
                <button
                  onClick={() => handleBulkActionClick("pay")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-all font-bold"
                >
                  Thanh toán
                </button>
                <button
                  onClick={() => handleBulkActionClick("refund")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-all font-bold"
                >
                  Hoàn tiền
                </button>
                <button
                  onClick={() => handleBulkActionClick("cancel")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-all"
                >
                  Hủy đơn hàng
                </button>
              </div>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider"
              >
                Hủy chọn
              </button>
            </div>
          )}

          {/* Filters Row */}
          <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap items-center gap-3">
            <div className="flex">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Tìm kiếm theo mã đơn hàng, khách hàng, SĐT..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="px-3 py-[3px] border border-gray-300  text-sm outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Tìm theo Tất cả</option>
                <option value="code">Mã đơn hàng</option>
                <option value="phone">Số điện thoại</option>
                <option value="name">Tên khách hàng</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={clearFilters}
              className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
              title="Xóa bộ lọc"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="w-12 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      className="rounded hover:cursor-pointer w-4 h-4"
                      onChange={toggleSelectAll}
                      checked={
                        orders.length > 0 &&
                        selectedIds.length === orders.length
                      }
                    />
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Mã đơn hàng
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Thành tiền
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Trạng thái thanh toán
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider ">
                    Trạng thái xử lý
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <span className="text-gray-500 text-sm">
                          Đang tải dữ liệu...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((order) => {
                    const isSelected = selectedIds.includes(order.id);
                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-gray-50 transition-colors group ${isSelected ? "bg-blue-50/20" : ""}`}
                      >
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            className="rounded text-blue-600 hover:cursor-pointer w-4 h-4"
                            checked={isSelected}
                            onChange={() => toggleSelect(order.id)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <Link to={`/admin/orders/${order.id}`}>
                            <div className="text-blue-600 font-medium hover:underline text-sm ">
                              #{order.code}
                            </div>
                            <div className="text-xs ">
                              {new Date(order.created_at).toLocaleString(
                                "vi-VN",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </div>
                          </Link>
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer?.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono tracking-tight">
                            {order.customer?.phone}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 ">
                          {formatPrice(order.final_amount)}
                        </td>
                        <td className="px-4 py-4">
                          <PaymentStatusBadge status={order.payment_status} />
                        </td>
                        <td className="px-4 py-4 ">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ShoppingBag className="w-12 h-12 text-gray-200" />
                        <p className="text-gray-500 text-sm">
                          Không tìm thấy đơn hàng nào.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            label="Đơn hàng"
          />
        </div>
      </div>

      <ConfirmBulkActionModal
        isOpen={bulkModal.isOpen}
        onClose={() =>
          setBulkModal({ isOpen: false, action: "", targetStatus: "" })
        }
        onConfirm={executeBulkAction}
        selectedOrders={orders.filter((o) => selectedIds.includes(o.id))}
        action={bulkModal.action}
        targetStatus={bulkModal.targetStatus}
      />

      <BulkPaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false })}
        onConfirm={executeBulkPayment}
        selectedOrders={orders.filter((o) => selectedIds.includes(o.id))}
        paymentMethods={paymentMethods}
      />

      <BulkRefundOrderModal
        isOpen={refundModal.isOpen}
        onClose={() => setRefundModal({ isOpen: false })}
        onConfirm={executeBulkRefund}
        selectedOrders={orders.filter((o) => selectedIds.includes(o.id))}
      />
    </AdminLayout>
  );
};

export default OrderListPage;
