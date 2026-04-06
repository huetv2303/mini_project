import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import {
  ChevronLeft,
  Package,
  Calendar,
  CreditCard,
  Truck,
  MapPin,
  FileText,
  Loader2,
  Trash2,
  Star,
  RotateCcw,
  ClipboardList,
} from "lucide-react";
import {
  fetchMyOrderRequest,
  cancelMyOrderRequest,
} from "../../services/OrderService";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "../../components/common/OrderBadges";
import ReturnOrderModal, {
  receiveStatusMap,
  refundStatusMap,
} from "../../components/common/ReturnOrderModal";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { getImageUrl } from "../../helper/helper";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n ?? 0);

const MyOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const response = await fetchMyOrderRequest(id);
      if (response.status === "success" || response.data) {
        setOrder(response.data);
      }
    } catch (error) {
      console.error("Failed to load order:", error);
      toast.error("Không thể tải thông tin đơn hàng");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;
    try {
      const response = await cancelMyOrderRequest(id);
      if (response.status === "success") {
        toast.success("Hủy đơn hàng thành công");
        loadOrder();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể hủy đơn hàng");
    }
  };

  const canReturn =
    order &&
    (order.status === "delivered" || order.status === "partially_returned") &&
    order.items?.some((i) => i.quantity - (i.returned_quantity ?? 0) > 0);
  const hasPendingReturn = order?.returns?.some(
    (r) => r.status === "returning",
  );

  if (loading) {
    return (
      <CustomerLayout>
        <div className="bg-slate-50 min-h-screen pt-32 pb-24 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="text-gray-400 font-bold  uppercase text-xs">
              Đang tải chi tiết đơn hàng...
            </p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!order) return null;

  const mainSteps = [
    {
      id: "pending",
      label: "Chờ xử lý",
      color: "bg-amber-400",
      textColor: "text-amber-500",
    },
    {
      id: "processing",
      label: "Đang đóng gói",
      color: "bg-blue-500",
      textColor: "text-blue-500",
    },
    {
      id: "shipping",
      label: "Đang giao hàng",
      color: "bg-indigo-500",
      textColor: "text-indigo-500",
    },
    {
      id: "delivered",
      label: "Đã giao hàng",
      color: "bg-emerald-500",
      textColor: "text-emerald-500",
    },
  ];

  const specialStatus = {
    cancelled: {
      label: "Đã hủy",
      bg: "bg-rose-50",
      text: "text-rose-500",
      border: "border-rose-200",
      dot: "bg-rose-400",
    },
    returned: {
      label: "Đã trả hàng",
      bg: "bg-purple-50",
      text: "text-purple-500",
      border: "border-purple-200",
      dot: "bg-purple-400",
    },
    partially_returned: {
      label: "Trả hàng một phần",
      bg: "bg-orange-50",
      text: "text-orange-500",
      border: "border-orange-200",
      dot: "bg-orange-400",
    },
    returning: {
      label: "Đang xử lý trả hàng",
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-200",
      dot: "bg-amber-400",
    },
  };

  const isSpecial =
    order.status === "cancelled" ||
    order.status === "returned" ||
    order.status === "partially_returned" ||
    hasPendingReturn;

  const displayStatus = hasPendingReturn ? "returning" : order.status;
  const currentStepIndex = isSpecial
    ? -1
    : mainSteps.findIndex((s) => s.id === order.status);

  return (
    <CustomerLayout>
      <div className="bg-slate-50 min-h-screen pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4">
          {/* Breadcrumbs & Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-5">
            <div className="space-y-4">
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors group"
              >
                <ChevronLeft
                  size={18}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                QUAY LẠI DANH SÁCH
              </Link>

              {isSpecial ? (
                <div className="w-full ">
                  <div className="relative">
                    {/* Badge trạng thái đặc biệt */}
                    <div className="flex w-full  mt-3">
                      <div
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold
          ${specialStatus[displayStatus].bg}
          ${specialStatus[displayStatus].text}
          ${specialStatus[displayStatus].border}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${specialStatus[displayStatus].dot}`}
                        />
                        {specialStatus[displayStatus].label}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative flex items-start justify-between w-full gap-2">
                  {mainSteps.map((step, index) => {
                    const isPast = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                      <div
                        key={step.id}
                        className="flex flex-col items-center flex-1 min-w-0"
                      >
                        <div
                          className={`w-3 h-3 md:w-4 md:h-4 rounded-full border-2 transition-all duration-500 z-10 ${
                            isPast
                              ? "bg-gray-400 border-transparent shadow-sm"
                              : isCurrent
                                ? "bg-blue-500 border-transparent shadow-md ring-4 ring-blue-100"
                                : "bg-white border-gray-300"
                          }`}
                        />
                        <p
                          className={`mt-3 text-[10px] md:text-xs text-center leading-tight transition-colors ${
                            isCurrent
                              ? "text-blue-500 font-bold"
                              : "text-gray-400 font-medium"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                  {/* Connecting Line - Background */}
                  <div className="absolute top-[6px] md:top-[8px] left-[12%] right-[12%] h-[2px] bg-gray-100 -z-0" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <p className="text-gray-400 text-xs ">
                  Ngày đặt:{" "}
                  {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              {order.expected_delivery_date && (
                <div className="flex items-center gap-2">
                  <Truck size={16} />
                  <p className="text-gray-400 text-xs ">
                    Ngày dự kiến giao:{" "}
                    {format(
                      new Date(order.expected_delivery_date),
                      "dd/MM/yyyy",
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {order.status === "pending" && (
                <button
                  onClick={handleCancelOrder}
                  className="h-12 px-4 bg-rose-50 text-rose-500 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-rose-500/10"
                >
                  <Trash2 size={20} />
                  HỦY ĐƠN HÀNG
                </button>
              )}
              {canReturn && (
                <button
                  onClick={() => setShowReturnModal(true)}
                  disabled={hasPendingReturn}
                  title={
                    hasPendingReturn ? "Đã có yêu cầu trả hàng đang xử lý" : ""
                  }
                  className="h-12 px-4 bg-rose-50 text-rose-500 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-rose-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw size={20} />
                  {hasPendingReturn ? "ĐANG XỬ LÝ TRẢ HÀNG" : "TRẢ HÀNG"}
                </button>
              )}

              {order.status === "delivered" && (
                <button className="h-12 px-4 bg-yellow-50 text-yellow-700 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-yellow-500 hover:text-white transition-all shadow-xl shadow-yellow-500/10">
                  <Star size={20} />
                  ĐÁNH GIÁ ĐƠN HÀNG
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Items & Summary */}
            <div className="lg:col-span-2 space-y-8">
              {/* Items List */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-3 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="text-[1rem] font-medium flex items-center gap-3">
                    <Package className="text-purple-500" />
                    SẢN PHẨM ({order.items.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="p-4 flex gap-6 group">
                      <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between gap-4 mb-2">
                          <h4 className="font-medium  group-hover:text-purple-600 transition-colors ">
                            {item.product_name}
                          </h4>
                          <p className="text-slate-900">
                            {new Intl.NumberFormat("vi-VN").format(
                              item.subtotal,
                            )}
                            ₫
                          </p>
                        </div>
                        <p className=" text-[0.8rem] text-gray-400 mb-4">
                          BIẾN THỂ: {item.variant_name}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 italic text-xs font-bold text-gray-500">
                            {new Intl.NumberFormat("vi-VN").format(item.price)}₫
                            × {item.quantity}
                          </div>
                          {item.returned_quantity > 0 && (
                            <span className="text-xs text-rose-400 font-medium">
                              Đã trả: {item.returned_quantity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Return History ─────────────────────────────────── */}
              {order.returns && order.returns.length > 0 && (
                <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden">
                  <div className="p-3 border-b border-purple-50 flex items-center gap-3">
                    <ClipboardList size={18} className="text-purple-500" />
                    <h3 className="text-[1rem] font-medium">
                      LỊCH SỬ TRẢ HÀNG ({order.returns.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {order.returns.map((ret) => (
                      <div key={ret.id} className="p-4 space-y-3">
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <p className=" text-sm font-bold text-purple-700">
                              {ret.return_code}
                            </p>
                            <p className="text-[0.72rem] text-gray-400 mt-0.5">
                              {ret.created_at
                                ? format(
                                    new Date(ret.created_at),
                                    "dd/MM/yyyy HH:mm",
                                  )
                                : "—"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {receiveStatusMap[ret.receive_status] && (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.68rem] font-semibold border ${receiveStatusMap[ret.receive_status].color}`}
                              >
                                {receiveStatusMap[ret.receive_status].label}
                              </span>
                            )}
                            {refundStatusMap[ret.refund_status] && (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.68rem] font-semibold border ${refundStatusMap[ret.refund_status].color}`}
                              >
                                {refundStatusMap[ret.refund_status].label}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Reason */}
                        {ret.reason && (
                          <div className="bg-slate-50 rounded-xl px-4 py-2.5 text-xs text-gray-600 italic">
                            <span className="font-semibold not-italic text-gray-500">
                              Lý do:{" "}
                            </span>
                            {ret.reason}
                          </div>
                        )}

                        {/* Items */}
                        {ret.items && ret.items.length > 0 && (
                          <div className="space-y-1.5">
                            {ret.items.map((ri) => {
                              const orderItem = order.items.find(
                                (oi) => oi.id === ri.order_item_id,
                              );
                              return (
                                <div
                                  key={ri.id}
                                  className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2"
                                >
                                  <span className="truncate mr-4">
                                    {orderItem?.product_name ??
                                      `Sản phẩm #${ri.product_id}`}
                                    {orderItem?.variant_name
                                      ? ` — ${orderItem.variant_name}`
                                      : ""}
                                  </span>
                                  <span>×{ri.quantity}</span>
                                  <span className="flex-shrink-0 font-semibold text-slate-700">
                                    {fmt(ri.subtotal)}₫
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Total */}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                          <span className="text-xs text-gray-500">
                            Tổng hoàn dự kiến
                          </span>
                          <span className="text-sm font-bold text-rose-600">
                            {fmt(ret.total_return_amount)}₫
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Info */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-3">
                <h3 className="text-[1rem] font-medium flex items-center gap-3">
                  <CreditCard className="text-blue-500" />
                  THANH TOÁN
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-3 mt-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-4">
                    <p className="text-xs text-gray-700">Phương thức</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <CreditCard size={20} className="text-slate-400" />
                      </div>
                      <p className="text-slate-900">
                        {order.payment_method?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs text-gray-700">Trạng thái</p>
                    <PaymentStatusBadge
                      status={order.payment_status}
                      className="h-6 px-6 text-[0.7rem]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-lg p-5 shadow-2xl shadow-black/20 space-y-8 relative overflow-hidden">
                <h3 className="text-xl font-medium  border-b border-white/10 pb-6 relative z-10">
                  TỔNG ĐƠN HÀNG
                </h3>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">Tạm tính</span>
                    <span className="">
                      {new Intl.NumberFormat("vi-VN").format(
                        order.total_amount,
                      )}
                      ₫
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">Giảm giá</span>
                    <span className="font-bold text-emerald-400">
                      -
                      {new Intl.NumberFormat("vi-VN").format(
                        order.discount_amount,
                      )}
                      ₫
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">
                      Phí vận chuyển
                    </span>
                    <span className="">
                      {new Intl.NumberFormat("vi-VN").format(
                        order.shipping_fee,
                      )}
                      ₫
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-4 border-t border-white/10">
                    <span className="text-gray-700 font-medium ">
                      THÀNH TIỀN
                    </span>
                    <span className="text-xl">
                      {new Intl.NumberFormat("vi-VN").format(
                        order.final_amount,
                      )}
                      ₫
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Details */}
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 space-y-8">
                <h3 className="text-lg font-medium flex items-center gap-3">
                  <Truck className="text-indigo-500" />
                  VẬN CHUYỂN
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[0.8rem] text-gray-700 uppercase mb-1">
                        Địa chỉ nhận hàng
                      </p>
                      <p className="text-sm font-bold text-slate-900 mb-1">
                        {order.customer.name}
                      </p>
                      <p className="text-xs font-medium text-gray-500">
                        {order.customer.phone}
                      </p>
                      <p className="text-xs font-medium text-gray-500 mt-2 leading-relaxed">
                        {order.customer.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 border-t border-gray-50 pt-6">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Truck size={18} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[0.8rem] text-gray-700 uppercase mb-1">
                        Phương thức vận chuyển
                      </p>
                      <p className="text-sm ">
                        {order.shipping_method?.name || "Mặc định"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note Card */}
              {order.note && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-8">
                  <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FileText size={14} /> GHI CHÚ
                  </h4>
                  <p className="text-sm font-medium text-amber-800 italic">
                    {order.note}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Return Modal — rendered outside loading gate so it stays mounted */}
      {showReturnModal && order && (
        <ReturnOrderModal
          order={order}
          onClose={() => {
            setShowReturnModal(false);
            if (needsReload) {
              setNeedsReload(false);
            }
            loadOrder();
          }}
          onSuccess={() => setNeedsReload(true)}
        />
      )}
    </CustomerLayout>
  );
};

export default MyOrderDetails;
