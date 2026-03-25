import React, { useEffect, useState, useCallback } from "react";
import OrderReturnService from "../../../services/OrderReturnService";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import { Search, Eye, Loader2, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Pagination from "../../../components/common/Pagination";
import BulkRefundModal from "../../../components/common/BulkRefundModal";
import {
  ReturnStatusBadge,
  ReceiveStatusBadge,
  RefundStatusBadge,
} from "../../../components/common/OrderBadges";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

// Status tags formatting logic moved to generic OrderBadges component

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

  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [refundModal, setRefundModal] = useState({ isOpen: false });

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

  const toggleSelectAll = () => {
    if (selectedIds.length === returns.length && returns.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(returns.map((r) => r.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const executeBulkRefund = async (validIds) => {
    if (validIds.length === 0) {
      setRefundModal({ isOpen: false });
      return;
    }

    try {
      setIsBulkUpdating(true);
      const res = await OrderReturnService.bulkRefund(validIds);
      toast.success(res.message || `Đã hoàn tiền thành công!`);
      setSelectedIds([]);
      setRefundModal({ isOpen: false });
      getReturns(currentPage, searchTerm);
    } catch (error) {
      console.error("Bulk refund failed:", error);
      toast.error(
        error.response?.data?.message || "Hoàn tiền hàng loạt thất bại",
      );
    } finally {
      setIsBulkUpdating(false);
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

        <div className="bg-white rounded-lg border border-gray-100 shadow-2xl shadow-black/5 overflow-hidden">
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

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-indigo-50/50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-indigo-700">
                  Đã chọn {selectedIds.length} phiếu trả hàng
                </span>
                <div className="h-4 w-px bg-indigo-200"></div>
                <button
                  onClick={() => setRefundModal({ isOpen: true })}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-all font-bold"
                >
                  Hoàn tiền
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

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="w-12 px-6 py-6 text-center">
                    <input
                      type="checkbox"
                      className="rounded hover:cursor-pointer w-4 h-4 text-indigo-600"
                      onChange={toggleSelectAll}
                      checked={
                        returns.length > 0 &&
                        selectedIds.length === returns.length
                      }
                    />
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-600 uppercase  ">
                    Mã đơn trả / Ngày tạo
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-600  uppercase ">
                    Đơn hàng gốc / Khách hàng
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-600  uppercase  text-center">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-600  uppercase  text-center">
                    Hoàn trả
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-600  uppercase  text-center">
                    Nhận hàng
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-600  uppercase  text-center">
                    Trạng thái
                  </th>
                  <th className="px-6 py-6 text-[0.8rem] text-gray-600 uppercase   text-center">
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
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-50 transition-colors group ${selectedIds.includes(item.id) ? "bg-indigo-50/20" : "hover:bg-gray-50/50"}`}
                      >
                        <td className="px-6 py-5 text-center">
                          <input
                            type="checkbox"
                            className="rounded text-indigo-600 hover:cursor-pointer w-4 h-4"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                          />
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-blue-500 font-medium">
                              #{item.return_code}
                            </span>
                            <span className="text-[13px] text-gray-600 ">
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
                            <span className="text-sm  text-gray-900">
                              #{item.order?.code}
                            </span>
                            <span className="text-[13px] text-gray-600 ">
                              {item.order?.customer_name || "Khách lẻ"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-[1rem] text-gray-600 ">
                            {item.items?.length || 0} sản phẩm
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <RefundStatusBadge status={item.refund_status} />
                        </td>
                        <td className="px-6 py-5 text-center">
                          <ReceiveStatusBadge status={item.receive_status} />
                        </td>
                        <td className="px-6 py-5 text-center">
                          <ReturnStatusBadge status={item.status} />
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
                    <td colSpan="8" className="px-6 py-24 text-center">
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

      <BulkRefundModal
        isOpen={refundModal.isOpen}
        onClose={() => setRefundModal({ isOpen: false })}
        onConfirm={executeBulkRefund}
        selectedReturns={returns.filter((r) => selectedIds.includes(r.id))}
      />
    </AdminLayout>
  );
};

export default OrderReturnListPage;
