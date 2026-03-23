import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import OrderReturnService from "../../../services/OrderReturnService";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import {
  ArrowLeft,
  Calendar,
  User,
  ShoppingBag,
  RotateCcw,
  Package,
  Loader2,
  FileText,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice } from "./OrderListPage";

const OrderReturnDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orderReturn, setOrderReturn] = useState(null);
  const [loading, setLoading] = useState(true);

  const getReturnDetails = async () => {
    try {
      setLoading(true);
      const res = await OrderReturnService.getById(id);
      setOrderReturn(res?.data);
    } catch (error) {
      console.error("Failed to fetch return details:", error);
      toast.error("Không thể tải thông tin phiếu trả hàng");
      navigate("/admin/order-returns");
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveStock = async () => {
    try {
      const res = await OrderReturnService.receive(id);
      if (res.status === "success") {
        toast.success(res.message);
        getReturnDetails();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi nhận hàng");
    }
  };

  const handleRefund = async () => {
    try {
      const res = await OrderReturnService.refund(id);
      if (res.status === "success") {
        toast.success(res.message);
        getReturnDetails();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi hoàn tiền");
    }
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
          bg: "bg-emerald-50",
          text: "text-emerald-600",
          border: "border-emerald-100",
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
          bg: "bg-indigo-50",
          text: "text-indigo-600",
          border: "border-indigo-100",
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

  useEffect(() => {
    getReturnDetails();
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-black animate-spin mb-4" />
          <p className="text-gray-400 font-bold text-xs uppercase ">
            Đang tải phiếu trả hàng...
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (!orderReturn) return null;

  return (
    <AdminLayout>
      <div className="pb-20">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/admin/order-returns")}
            className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all shadow-sm group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                Phiếu trả hàng
              </h1>
              <span className="px-3 py-1 bg-black text-white text-[12px] font-black rounded-lg uppercase tracking-tighter">
                #{orderReturn.return_code}
              </span>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase  ${getReceiveStatusTag(orderReturn.receive_status).bg} ${getReceiveStatusTag(orderReturn.receive_status).text} ${getReceiveStatusTag(orderReturn.receive_status).border}`}
              >
                {getReceiveStatusTag(orderReturn.receive_status).label}
              </div>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase  ${getRefundStatusTag(orderReturn.refund_status).bg} ${getRefundStatusTag(orderReturn.refund_status).text} ${getRefundStatusTag(orderReturn.refund_status).border}`}
              >
                {getRefundStatusTag(orderReturn.refund_status).label}
              </div>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase  mt-1">
              Xử lý ngày{" "}
              {new Date(orderReturn.created_at).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-black/5 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-sm font-bold uppercase  flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Sản phẩm hoàn trả
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/30">
                      <th className="px-8 py-4 text-[10px] text-gray-400 font-bold uppercase">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-4 text-[10px] text-gray-400 font-bold uppercase text-center">
                        Số lượng trả
                      </th>
                      <th className="px-6 py-4 text-[10px] text-gray-400 font-bold uppercase text-right">
                        Đơn giá
                      </th>
                      <th className="px-8 py-4 text-[10px] text-gray-400 font-bold uppercase text-right">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderReturn.items?.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">
                              {item.order_item?.product_name || "N/A"}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium">
                              {item.order_item?.variant_name || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center font-black text-gray-600">
                          x{item.quantity}
                        </td>
                        <td className="px-6 py-5 text-right font-medium">
                          {formatPrice(item.price)}
                        </td>
                        <td className="px-8 py-5 text-right font-black text-gray-900">
                          {formatPrice(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-8 bg-gray-50/50 flex justify-between items-center border-t border-gray-100">
                <span className="text-xs font-bold uppercase  text-gray-900">
                  Tổng hoàn tiền
                </span>
                <span className="text-2xl font-bold text-rose-500">
                  {orderReturn.order.payment_status === "unpaid"
                    ? "0đ"
                    : formatPrice(orderReturn.total_return_amount)}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm relative overflow-hidden">
              <h3 className="text-sm font-bold uppercase  flex items-center gap-2 mb-6">
                <FileText className="w-4 h-4" />
                Lý do trả hàng
              </h3>
              <p className="text-sm font-medium text-gray-600 bg-gray-50 p-6 rounded-2xl border border-gray-100 leading-relaxed italic">
                "{orderReturn.reason || "Không có lý do cụ thể"}"
              </p>

              {/* Action Buttons based on flow */}
              <div className="mt-8 flex justify-end gap-4">
                {orderReturn.receive_status === "pending" && (
                  <button
                    onClick={handleReceiveStock}
                    className="flex items-center gap-2 px-8 py-4 bg-blue-500 text-white rounded-lg font-bold text-sm uppercase  hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                  >
                    <Package className="w-4 h-4" />
                    Nhận hàng & hoàn kho
                  </button>
                )}

                {orderReturn.receive_status === "received" &&
                  orderReturn.refund_status === "pending" && (
                    <button
                      onClick={handleRefund}
                      className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-lg font-bold text-sm uppercase  hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Xác nhận hoàn tiền
                    </button>
                  )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase  flex items-center gap-2 mb-6">
                <ShoppingBag className="w-4 h-4" />
                Thông tin đơn hàng
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase  mb-1.5">
                    Mã đơn hàng gốc
                  </p>
                  <p
                    className="text-sm font-bold text-indigo-600 cursor-pointer hover:underline inline-block"
                    onClick={() =>
                      navigate(`/admin/orders/${orderReturn.order?.id}`)
                    }
                  >
                    #{orderReturn.order?.code}
                  </p>
                </div>
                <div className="pt-6 border-t border-gray-50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase  mb-1.5">
                    Khách hàng
                  </p>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-300" />
                    <span className="text-sm font-black text-gray-900">
                      {orderReturn.order?.customer_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase  flex items-center gap-2 mb-6">
                <RotateCcw className="w-4 h-4" />
                Người thực hiện
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center font-black shadow-lg">
                  {orderReturn.staff?.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {orderReturn.staff?.name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase ">
                    Nhân viên hệ thống
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderReturnDetailsPage;
