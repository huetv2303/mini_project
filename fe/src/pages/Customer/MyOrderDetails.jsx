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
  Home,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  fetchMyOrderRequest,
  cancelMyOrderRequest,
} from "../../services/OrderService";
import {
  fetchBankConfigRequest,
  checkSepayStatusRequest,
} from "../../services/PaymentService";
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

  const [bankConfig, setBankConfig] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPaidLocally, setIsPaidLocally] = useState(false);

  useEffect(() => {
    if (
      order &&
      order.payment_method?.code === "bank_transfer" &&
      order.payment_status === "unpaid"
    ) {
      fetchBankConfigRequest()
        .then((res) => setBankConfig(res.data))
        .catch(console.error);
    }
  }, [order]);

  useEffect(() => {
    let pollingInterval;
    if (showPaymentModal && bankConfig && order && !isPaidLocally) {
      pollingInterval = setInterval(async () => {
        try {
          const resp = await checkSepayStatusRequest(
            order.code,
            order.final_amount - (order.wallet_amount_used || 0),
          );
          if (resp && resp.paid) {
            clearInterval(pollingInterval);
            setIsPaidLocally(true);
            toast.success(
              "Thanh toán thành công! Đơn hàng của bạn đã được xác nhận.",
            );
            setShowPaymentModal(false);
            loadOrder();
          }
        } catch (error) {
          console.error("Polling failed:", error);
        }
      }, 5000);
    }
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [showPaymentModal, bankConfig, order, isPaidLocally]);

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
        <div className="bg-[#f8fafc] min-h-screen pt-32 pb-24 flex items-center justify-center">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin rounded-full h-12 w-12 text-sky-600" />
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
      color: "bg-amber-400 border-amber-400 ring-amber-100",
      textColor: "text-amber-500",
    },
    {
      id: "processing",
      label: "Đang đóng gói",
      color: "bg-sky-500 border-sky-500 ring-sky-100",
      textColor: "text-sky-600",
    },
    {
      id: "shipping",
      label: "Đang giao hàng",
      color: "bg-indigo-500 border-indigo-500 ring-indigo-100",
      textColor: "text-indigo-600",
    },
    {
      id: "delivered",
      label: "Đã giao hàng",
      color: "bg-emerald-500 border-emerald-500 ring-emerald-100",
      textColor: "text-emerald-600",
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
      <div className="bg-[#f8fafc] min-h-screen pt-32 pb-24 text-left">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-600  mb-6 bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm w-fit">
            <Link
              to="/"
              className="hover:text-sky-600 transition-colors flex items-center gap-1"
            >
              <Home size={13} className="text-slate-400" />
              Trang chủ
            </Link>
            <ChevronRight size={12} className="text-slate-300" />
            <Link to="/orders" className="hover:text-sky-600 transition-colors">
              Đơn hàng
            </Link>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-800">Chi tiết #{order.code}</span>
          </div>

          {/* Header tracking flow */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-[1rem] font-medium text-slate-800 ">
                  {order.code}
                </h1>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-600  tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-sky-500" />
                  Đặt lúc:{" "}
                  {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                </span>
                {order.expected_delivery_date && (
                  <span className="flex items-center gap-1.5">
                    <Truck size={13} className="text-sky-500" />
                    Dự kiến giao:{" "}
                    {format(
                      new Date(order.expected_delivery_date),
                      "dd/MM/yyyy",
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Stepper block */}
            <div className="md:w-1/2 flex-shrink-0">
              {isSpecial ? (
                <div className="flex justify-end">
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-medium   ${specialStatus[displayStatus].bg} ${specialStatus[displayStatus].text} ${specialStatus[displayStatus].border}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${specialStatus[displayStatus].dot} animate-pulse`}
                    />
                    {specialStatus[displayStatus].label}
                  </div>
                </div>
              ) : (
                <div className="relative flex items-center justify-between w-full">
                  {/* Process connecting Line */}
                  <div className="absolute top-[7px] left-0 right-0 h-[3px] bg-slate-100 rounded-full z-0" />
                  <div
                    className="absolute top-[7px] left-0 h-[3px] bg-sky-500 rounded-full z-0 transition-all duration-700"
                    style={{
                      width: `${(currentStepIndex / (mainSteps.length - 1)) * 100}%`,
                    }}
                  />

                  {mainSteps.map((step, index) => {
                    const isPast = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    return (
                      <div
                        key={step.id}
                        className="relative z-10 flex flex-col items-center flex-1"
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${
                            isPast
                              ? "bg-sky-500 border-sky-500"
                              : isCurrent
                                ? "bg-white border-sky-500 ring-4 ring-sky-100"
                                : "bg-white border-slate-200"
                          }`}
                        />
                        <span
                          className={`mt-2 text-[11px] font-medium text-center leading-tight whitespace-nowrap ${
                            isCurrent ? "text-sky-600" : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick operations */}
          {(order.status === "pending" ||
            canReturn ||
            (order.status === "delivered" && order.items?.length > 0)) && (
            <div className="mb-8 flex justify-end gap-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex-wrap">
              {order.status === "pending" && (
                <button
                  onClick={handleCancelOrder}
                  className="h-11 px-5 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-rose-500/5 active:scale-95"
                >
                  <Trash2 size={14} />
                  HỦY ĐƠN HÀNG
                </button>
              )}
              {canReturn && (
                <button
                  onClick={() => setShowReturnModal(true)}
                  disabled={hasPendingReturn}
                  className="h-11 px-5 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-rose-500/5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <RotateCcw size={14} />
                  {hasPendingReturn
                    ? "ĐANG XỬ LÝ TRẢ HÀNG"
                    : "TRẢ HÀNG / HOÀN TIỀN"}
                </button>
              )}
              {order.status === "delivered" && order.items?.length > 0 && (
                <Link
                  to={`/products/${order.items[0].product_slug || order.items[0].product_id}?order_id=${order.id}#reviews`}
                  className="h-11 px-5 bg-amber-50 hover:bg-amber-400 text-amber-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-amber-500/5 active:scale-95"
                >
                  <Star size={14} />
                  ĐÁNH GIÁ ĐƠN HÀNG
                </Link>
              )}
            </div>
          )}

          {/* Details body grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Items & Returns */}
            <div className="lg:col-span-2 space-y-8">
              {/* Product items card */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Package size={15} className="text-sky-500" />
                    SẢN PHẨM ({order.items.length})
                  </h3>
                </div>

                <div className="divide-y divide-slate-50">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="p-5 flex gap-5 group">
                      <div className="w-16 h-20 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.product_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between gap-4">
                            <h4 className="text-[14px] font-medium text-slate-800  line-clamp-1 group-hover:text-sky-600 transition-colors">
                              {item.product_name}
                            </h4>
                            <p className="text-[14px] font-medium text-slate-800">
                              {fmt(item.subtotal)}₫
                            </p>
                          </div>
                          <p className="text-[10px] font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100/50 uppercase tracking-wider w-fit mt-1">
                            {item.variant_name}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[12px] font-medium text-slate-600">
                            Đơn giá: {fmt(item.price)}₫ × {item.quantity}
                          </span>
                          <div className="flex items-center gap-2">
                            {item.returned_quantity > 0 && (
                              <span className="text-[12px] font-medium text-rose-500 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100/50">
                                Đã trả: {item.returned_quantity}
                              </span>
                            )}
                            {order.status === "delivered" && (
                              <Link
                                to={`/products/${item.product_slug || item.product_id}?order_id=${order.id}#reviews`}
                                className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-400 text-amber-600 hover:text-white px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                              >
                                <Star size={11} fill="currentColor" />
                                Đánh giá
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Returns History */}
              {order.returns && order.returns.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-50 flex items-center gap-2">
                    <ClipboardList size={15} className="text-sky-500" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                      LỊCH SỬ TRẢ HÀNG ({order.returns.length})
                    </h3>
                  </div>

                  <div className="divide-y divide-slate-50">
                    {order.returns.map((ret) => (
                      <div key={ret.id} className="p-5 space-y-4">
                        <div className="flex justify-between items-start flex-wrap gap-3">
                          <div>
                            <p className="text-xs font-black text-sky-700 uppercase tracking-widest">
                              {ret.return_code}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                              {ret.created_at
                                ? format(
                                    new Date(ret.created_at),
                                    "dd/MM/yyyy HH:mm",
                                  )
                                : "—"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {receiveStatusMap[ret.receive_status] && (
                              <span
                                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${receiveStatusMap[ret.receive_status].color}`}
                              >
                                {receiveStatusMap[ret.receive_status].label}
                              </span>
                            )}
                            {refundStatusMap[ret.refund_status] && (
                              <span
                                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${refundStatusMap[ret.refund_status].color}`}
                              >
                                {refundStatusMap[ret.refund_status].label}
                              </span>
                            )}
                          </div>
                        </div>

                        {ret.reason && (
                          <div className="bg-slate-50 rounded-xl p-4 text-xs font-bold text-slate-500 italic border border-slate-100">
                            <span className="not-italic text-slate-400 uppercase tracking-wider block mb-1">
                              Lý do trả hàng:
                            </span>
                            "{ret.reason}"
                          </div>
                        )}

                        {ret.items && ret.items.length > 0 && (
                          <div className="space-y-1.5 pt-2">
                            {ret.items.map((ri) => {
                              const orderItem = order.items.find(
                                (oi) => oi.id === ri.order_item_id,
                              );
                              return (
                                <div
                                  key={ri.id}
                                  className="flex items-center justify-between text-[11px] font-bold text-slate-500 bg-slate-50/50 rounded-xl px-3 py-2 border border-slate-100"
                                >
                                  <span>
                                    {orderItem?.product_name ??
                                      `Sản phẩm #${ri.product_id}`}
                                    {orderItem?.variant_name
                                      ? ` — ${orderItem.variant_name}`
                                      : ""}
                                  </span>
                                  <span className="text-slate-400">
                                    ×{ri.quantity}
                                  </span>
                                  <span className="font-black text-slate-800">
                                    {fmt(ri.subtotal)}₫
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Tổng hoàn trả
                          </span>
                          <span className="text-xs font-black text-rose-600">
                            {fmt(ret.total_return_amount)}₫
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Card details */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <CreditCard size={15} className="text-sky-500" />
                  THANH TOÁN
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <div className="space-y-2">
                    <p className="text-[12px] font-medium text-slate-600 ">
                      Phương thức thanh toán
                    </p>
                    <p className="text-[12px] font-medium text-slate-700 ">
                      {order.payment_method?.name || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2 flex flex-col justify-between sm:items-end">
                    <p className="text-[12px] font-medium text-slate-600 ">
                      Trạng thái thanh toán
                    </p>
                    <PaymentStatusBadge status={order.payment_status} />
                  </div>
                </div>

                {order.payment_status === "unpaid" &&
                  order.payment_method?.code === "bank_transfer" && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full mt-4 py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-sky-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard size={14} />
                      MỞ QR THANH TOÁN TỰ ĐỘNG
                    </button>
                  )}
              </div>
            </div>

            {/* Right Column: Order Summary & Address */}
            <div className="space-y-8">
              {/* Order total bill card */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-4">
                  TỔNG QUAN HÓA ĐƠN
                </h3>
                <div className="space-y-3 pt-1">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Tạm tính</span>
                    <span className="text-slate-800">
                      {fmt(order.total_amount)}₫
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-rose-500">
                    <span>Giảm giá</span>
                    <span>-{fmt(order.discount_amount)}₫</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Phí vận chuyển</span>
                    <span className="text-slate-800">
                      {fmt(order.shipping_fee)}₫
                    </span>
                  </div>
                  {(Number(order.tax_amount) > 0 ||
                    Number(order.tax_rate_snapshot) > 0) && (
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>Thuế (VAT {order.tax_rate_snapshot ?? 0}%)</span>
                      <span className="text-slate-800">
                        {fmt(order.tax_amount)}₫
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-50 text-xs font-black text-slate-800 uppercase tracking-widest">
                    <span>Tổng đơn hàng</span>
                    <span className="text-sky-700 text-lg font-black">
                      {fmt(order.final_amount)}₫
                    </span>
                  </div>

                  {order.wallet_amount_used > 0 && (
                    <div className="pt-4 space-y-3">
                      <div className="flex justify-between items-center text-xs font-black text-sky-600 bg-sky-50 border border-sky-100/50 p-3 rounded-xl">
                        <span className="flex items-center gap-1">
                          <RotateCcw size={13} className="rotate-180" />
                          ĐÃ TRỪ TỪ VÍ
                        </span>
                        <span>-{fmt(order.wallet_amount_used)}₫</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 text-xs font-black uppercase tracking-widest">
                        <span className="text-slate-500">
                          Cần thanh toán thêm
                        </span>
                        <span className="text-rose-500 text-lg font-black">
                          {fmt(
                            Math.max(
                              0,
                              order.final_amount -
                                (order.wallet_amount_used || 0),
                            ),
                          )}
                          ₫
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Details */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Truck size={15} className="text-sky-500" />
                  VẬN CHUYỂN
                </h3>

                <div className="space-y-3 pt-1">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100/50 flex-shrink-0">
                      <MapPin size={15} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-slate-700 ">
                        Địa chỉ nhận hàng
                      </p>
                      <p className="text-xs font-black text-slate-700 uppercase tracking-tight">
                        {order.customer.name}
                      </p>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">
                        {order.customer.phone}
                      </p>
                      <p className="text-xs font-medium text-slate-400 mt-2 leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/40">
                        {order.customer.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 border-t border-slate-50">
                    <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100/50 flex-shrink-0">
                      <Truck size={20} />
                    </div>
                    <div>
                      <p className="text-[1rem] font-semibold text-slate-700 ">
                        Phương thức vận chuyển
                      </p>
                      <p className="text-[14px] font-medium text-slate-600 ">
                        {order.shipping_method?.name || "Giao hàng mặc định"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note Details */}
              {order.note && (
                <div className="bg-amber-50/40 border border-amber-100/60 rounded-3xl p-5 shadow-sm">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <FileText size={13} /> Ghi chú từ khách hàng
                  </h4>
                  <p className="text-xs font-bold text-amber-800 italic leading-relaxed">
                    "{order.note}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Return Modal */}
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

      {/* QR payment modal */}
      <BankPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bankInfo={
          bankConfig
            ? {
                ...bankConfig,
                amount: order?.final_amount - (order?.wallet_amount_used || 0),
                order_code: order?.code,
              }
            : null
        }
      />
    </CustomerLayout>
  );
};

const BankPaymentModal = ({ isOpen, onClose, bankInfo }) => {
  if (!isOpen || !bankInfo) return null;

  const qrUrl = `https://qr.sepay.vn/img?bank=${bankInfo.bank_id}&acc=${bankInfo.account_no}&template=compact&amount=${bankInfo.amount}&des=${bankInfo.order_code}`;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* soft overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-sky-600 p-6 text-white text-center">
          <h3 className="text-base font-black uppercase tracking-wider">
            Thanh toán chuyển khoản
          </h3>
          <p className="text-sky-100 text-[11px] font-bold mt-1">
            QUÉT MÃ QR BÊN DƯỚI ĐỂ HOÀN TẤT ĐƠN HÀNG
          </p>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="relative p-3 bg-white rounded-xl shadow-md border border-slate-100 mb-5">
            <img
              src={qrUrl}
              alt="SePay QR"
              className="w-56 h-56 object-contain"
            />
          </div>

          <div className="w-full space-y-2">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                Số tiền:
              </span>
              <span className="text-sky-600 text-sm font-black">
                {new Intl.NumberFormat("vi-VN").format(bankInfo.amount)}₫
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                Nội dung chuyển khoản:
              </span>
              <span className="text-slate-800 text-xs font-black uppercase tracking-widest">
                {bankInfo.order_code}
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sky-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-black uppercase tracking-wider animate-pulse">
              Chờ thanh toán...
            </span>
          </div>

          <button
            onClick={onClose}
            className="mt-6 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest transition-all underline underline-offset-4"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyOrderDetails;
