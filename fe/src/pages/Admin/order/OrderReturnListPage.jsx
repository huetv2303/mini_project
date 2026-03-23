import React, { useEffect, useState, useCallback } from "react";
import OrderReturnService from "../../../services/OrderReturnService";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import {
  Search,
  Eye,
  Loader2,
  RotateCcw,
  Calendar,
  User,
  ShoppingBag,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Pagination from "../../../components/common/Pagination";
import { formatPrice } from "./OrderListPage";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const getStatusTag = (status) => {
  switch (status) {
    case "returning":
      return {
        label: "Đang trả hàng",
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
      };
    case "completed":
      return {
        label: "Lưu trữ",
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-100",
      };
    case "cancelled":
      return {
        label: "Đã hủy",
        bg: "bg-rose-50",
        text: "text-rose-600",
        border: "border-rose-100",
      };
    default:
      return {
        label: status,
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-100",
      };
  }
};

const getReceiveStatusTag = (status) => {
  switch (status) {
    case "pending":
      return {
        label: "Chưa nhận hàng",
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
      };
    case "received":
      return {
        label: "Đã nhận hàng",
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
      };
    default:
      return {
        label: status,
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-100",
      };
  }
};

const getRefundStatusTag = (status) => {
  switch (status) {
    case "pending":
      return {
        label: "Chưa hoàn tiền",
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
      };
    case "refunded":
      return {
        label: "Đã hoàn tiền",
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
      };
    case "not_needed":
      return {
        label: "Không cần hoàn tiền",
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-100",
      };
    default:
      return {
        label: status,
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-100",
      };
  }
};

const OrderReturnListPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    lastPage: 1,
    perPage: 15,
  });

  const getReturns = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const res = await OrderReturnService.getAll({ page, search });
      // res is { status, data: [], meta: {}, links: {} }
      const items = res?.data || [];
      const meta = res?.meta || {};

      setReturns(items);
      setPagination({
        currentPage: meta.current_page || 1,
        lastPage: meta.last_page || 1,
        total: meta.total || 0,
        perPage: meta.per_page || 5,
      });
    } catch (error) {
      console.error("Failed to fetch returns:", error);
      toast.error("Không thể tải danh sách phiếu trả hàng");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    getReturns(newPage, searchTerm);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const debouncedSearch = useCallback(
    debounce((val) => {
      setCurrentPage(1);
      getReturns(1, val);
    }, 500),
    [],
  );

  useEffect(() => {
    getReturns(currentPage, searchTerm);
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <AdminLayout>
      <div className="pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 uppercase ">
              <RotateCcw className="w-8 h-8 text-black" />
              Quản lý trả hàng
            </h1>
            <p className="mt-1 text-xs text-gray-400 font-bold uppercase ">
              Theo dõi và quản lý các phiếu trả hàng từ khách hàng
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-black/5 overflow-hidden">
          <div className="p-8 border-b border-gray-50 bg-gray-50/20">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm mã phiếu, mã đơn hàng..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-black/5 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-6 text-[10px] text-gray-400 font-bold uppercase ">
                    Mã đơn trả / Ngày tạo
                  </th>
                  <th className="px-6 py-6 text-[10px] text-gray-400 font-bold uppercase ">
                    Đơn hàng gốc / Khách hàng
                  </th>
                  <th className="px-6 py-6 text-[10px] text-gray-400 font-bold uppercase  text-center">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-6 text-[10px] text-gray-400 font-bold uppercase  text-center">
                    Hoàn trả
                  </th>
                  <th className="px-6 py-6 text-[10px] text-gray-400 font-bold uppercase  text-center">
                    Nhận hàng
                  </th>
                  <th className="px-6 py-6 text-[10px] text-gray-400 font-bold uppercase  text-center">
                    Trạng thái
                  </th>
                  <th className="px-8 py-6 text-[10px] text-gray-400 font-bold uppercase  text-right">
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
                        Đang tải dữ liệu...
                      </span>
                    </td>
                  </tr>
                ) : returns.length > 0 ? (
                  returns.map((item) => {
                    const statusTag = getStatusTag(item.status);
                    const receiveTag = getReceiveStatusTag(item.receive_status);
                    const refundTag = getRefundStatusTag(item.refund_status);
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-indigo-600">
                              #{item.return_code}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {new Date(item.created_at).toLocaleString(
                                "vi-VN",
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                },
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-gray-900">
                              #{item.order?.code}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              {item.order?.customer_name || "Khách lẻ"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-sm font-medium text-gray-600">
                            {item.items?.length || 0} sản phẩm
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div
                            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${refundTag.bg} ${refundTag.text} ${refundTag.border}`}
                          >
                            {refundTag.label}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div
                            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${receiveTag.bg} ${receiveTag.text} ${receiveTag.border}`}
                          >
                            {receiveTag.label}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div
                            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${statusTag.bg} ${statusTag.text} ${statusTag.border}`}
                          >
                            {statusTag.label}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <Link
                            to={`/admin/order-returns/${item.id}`}
                            className="inline-flex p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-black hover:border-black transition-all shadow-sm"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-24 text-center">
                      <RotateCcw className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold text-sm">
                        Chưa có phiếu trả hàng nào được ghi nhận.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderReturnListPage;
