import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchOrderRequest,
  updateOrderRequest,
  cancelOrderRequest,
  fetchPaymentMethodsRequest,
  updatePaymentMethodRequest,
  refundOrderRequest,
} from "../../../services/OrderService";
import {
  createVNPayPaymentRequest,
  fetchBankConfigRequest,
  checkSepayStatusRequest,
} from "../../../services/PaymentService";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Save,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Printer,
} from "lucide-react";
import { OrderSourceBadge } from "../../../components/common/OrderBadges";
import POSReceipt from "./components/POSReceipt";
import ReturnOrderModal from "../../../components/Admin/Order/ReturnOrderModal";
import toast from "react-hot-toast";
import { formatPrice, getImageUrl } from "../../../helper/helper";
import SelectSearch from "../../../components/common/SelectSearch";
import PaymentIntegration from "../../../components/common/PaymentIntegration";

const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [note, setNote] = useState("");
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [bankConfig, setBankConfig] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    let pollingInterval;

    if (showPaymentModal && bankConfig && order) {
      pollingInterval = setInterval(async () => {
        try {
          const resp = await checkSepayStatusRequest(
            order.code,
            order.final_amount - (order.wallet_amount_used || 0),
          );

          if (resp && resp.paid) {
            clearInterval(pollingInterval);
            toast.success("Thanh toán thành công! Đơn hàng đã được xác nhận.");
            setShowPaymentModal(false);
            getOrderDetails(); // Reload order data
          }
        } catch (error) {
          console.error("Polling failed:", error);
        }
      }, 5000);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [showPaymentModal, bankConfig, order]);

  const statusOptions = [
    { value: "pending", label: "Chờ xử lý" },
    { value: "processing", label: "Đang đóng gói" },
    { value: "shipped", label: "Đang giao" },
    { value: "delivered", label: "Đã giao" },
    { value: "cancelled", label: "Hủy đơn" },
    { value: "returned", label: "Đã trả hàng" },
    { value: "partially_returned", label: "Trả hàng một phần" },
  ];

  const paymentStatusOptions = [
    { value: "unpaid", label: "Chưa thanh toán" },
    { value: "partially_paid", label: "Thanh toán một phần" },
    { value: "paid", label: "Đã thanh toán" },
    { value: "refunded", label: "Đã hoàn tiền" },
    { value: "partially_refunded", label: "Hoàn tiền một phần" },
  ];

  const getOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await fetchOrderRequest(id);
      const data = res?.data;
      setOrder(data);
      setStatus(data.status);
      setPaymentStatus(data.payment_status);
      setNote(data.note || "");
      console.log(data);
      if (
        data.payment_method?.code === "bank_transfer" &&
        data.payment_status === "unpaid"
      ) {
        fetchBankConfigRequest()
          .then((res) => setBankConfig(res?.data))
          .catch(console.error);
      }
      console.log(data);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      toast.error("Không thể tải thông tin đơn hàng");
      navigate("/admin/orders");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethods = async () => {
    try {
      const res = await fetchPaymentMethodsRequest();
      setPaymentMethods(res?.data || []);
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
    }
  };

  useEffect(() => {
    getOrderDetails();
    getPaymentMethods();
  }, [id]);

  useEffect(() => {
    if (order?.payment_method?.id) {
      setSelectedPaymentMethod(order.payment_method.id);
      console.log("alo", selectedPaymentMethod);
    }
  }, [order]);

  const handleUpdateOrder = async () => {
    try {
      setUpdating(true);
      await updateOrderRequest(id, {
        status,
        payment_status: paymentStatus,
        note,
      });
      toast.success("Cập nhật đơn hàng thành công");
      getOrderDetails();
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setUpdating(false);
    }
  };

  const handleVnpayPayment = async () => {
    try {
      const res = await createVNPayPaymentRequest(id);
      if (res?.data?.payment_url) {
        window.location.href = res.data.payment_url;
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Lỗi tạo link thanh toán VNPay",
      );
    }
  };

  const handleCancelOrder = async () => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn hủy đơn hàng này? Thao tác này sẽ hoàn lại tiền và tồn kho (nếu có).",
      )
    )
      return;

    try {
      setUpdating(true);
      await cancelOrderRequest(id);
      toast.success("Đã hủy đơn hàng");
      getOrderDetails();
    } catch (error) {
      console.error("Cancel failed:", error);
      toast.error(error.response?.data?.message || "Hủy đơn hàng thất bại");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePaymentMethod = async (paymentMethodId) => {
    try {
      setUpdating(true);
      await updatePaymentMethodRequest(id, paymentMethodId);
      toast.success("Cập nhật phương thức thanh toán thành công");
      getOrderDetails();
    } catch (error) {
      console.error("Update payment method failed:", error);
      toast.error(
        error.response?.data?.message ||
          "Cập nhật phương thức thanh toán thất bại",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleRefundOrder = async () => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn hoàn tiền cho đơn hàng này? Thao tác này sẽ cập nhật trạng thái thanh toán thành 'Đã hoàn tiền'.",
      )
    )
      return;

    try {
      setUpdating(true);
      await refundOrderRequest(id);
      toast.success("Đã hoàn tiền đơn hàng");
      getOrderDetails();
    } catch (error) {
      console.error("Refund failed:", error);
      toast.error(error.response?.data?.message || "Hoàn tiền thất bại");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "processing":
        return <Package className="w-5 h-5 text-blue-500" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-indigo-500" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-rose-500" />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="pb-20">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/admin/orders")}
            className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all shadow-sm group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex justify-between w-full">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-700 text-slate-900 font-semibold">
                  Chi tiết Đơn hàng
                </h1>
                <span className="px-3 py-1 bg-blue-500 text-white text-[12px] font-bold rounded-[5px] uppercase">
                  #{order.code}
                </span>
                <OrderSourceBadge source={order.source} />
              </div>
              <p className="text-xs text-gray-600">
                Đặt ngày {new Date(order.created_at).toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="w-full bg-sky-500 flex items-center justify-center gap-2 px-4 py-2 rounded-lg shadow-md shadow-sky-500/10 active:scale-95 transition-all duration-200 text-white text-xs font-medium"
              >
                <Printer className="w-4 h-4" />
                <span>Xuất Hóa Đơn</span>
              </button>

              {![
                "cancelled",
                "delivered",
                "returned",
                "partially_returned",
                "shipped",
              ].includes(order.status) && (
                <button
                  onClick={handleCancelOrder}
                  disabled={updating}
                  className="p-2 rounded-lg text-[0.9rem] flex gap-2 hover:bg-gray-200 transition-all cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <p className="font-medium items-center">Hủy đơn</p>
                </button>
              )}
              {order.status === "cancelled" &&
                ["paid", "partially_paid", "partially_refunded"].includes(
                  order.payment_status,
                ) && (
                  <button
                    onClick={handleRefundOrder}
                    disabled={updating}
                    className="w-full p-2 rounded-lg text-[0.9rem] bg-blue-500 text-white items-center flex gap-1 hover:bg-blue-600 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4 text-white" />
                    <p className="font-medium items-center">Hoàn tiền</p>
                  </button>
                )}
              {order.status === "delivered" && (
                <button
                  onClick={() => setIsReturnModalOpen(true)}
                  className="w-full p-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 border border-slate-200"
                >
                  <Package size={14} />
                  Trả hàng
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Items List */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-2xl shadow-black/5 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                    <Package size={18} className="text-slate-700" />
                  </div>
                  <span className="font-semibold text-slate-900">
                    Sản phẩm đã đặt
                  </span>
                </div>
                <span className="text-[12px] px-3 py-1 rounded-full  font-semibold">
                  {order.items?.length || 0} mục
                </span>
              </div>
              <div className="overflow-x-auto ">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-8 py-4 text-[0.8rem]  text-gray-500 uppercase text-left">
                        Sản phẩm
                      </th>
                      <th className="px-8 py-4 text-[0.8rem]  text-gray-500 uppercase text-left">
                        Ảnh
                      </th>
                      <th className="px-6 py-4 text-[0.8rem]  text-gray-500 uppercase text-center">
                        Số lượng
                      </th>
                      <th className="px-6 py-4 text-[0.8rem]  text-gray-500 uppercase text-right">
                        Đơn giá
                      </th>
                      <th className="px-8 py-4 text-[0.8rem]  text-gray-500 uppercase text-right">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item) => {
                      const effectiveQuantity =
                        item.quantity - (item.returned_quantity || 0);
                      const isFullyReturned = effectiveQuantity <= 0;
                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-gray-50 ${isFullyReturned ? "bg-gray-50/50 opacity-60" : ""}`}
                        >
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 text-sm">
                                {item.product_name}
                                {item.returned_quantity > 0 && (
                                  <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg border border-rose-100">
                                    {isFullyReturned
                                      ? "ĐÃ TRẢ HÀNG"
                                      : `ĐÃ TRẢ ${item.returned_quantity}`}
                                  </span>
                                )}
                              </span>
                              <span className="text-[12px] text-gray-600 mt-0.5">
                                Mã: {item.sku} | Loại: {item.variant_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.product_name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          </td>
                          <td className="px-6 py-5 text-center font-bold text-gray-600">
                            <div className="flex flex-col">
                              <span>x{item.quantity}</span>
                              {item.returned_quantity > 0 &&
                                !isFullyReturned && (
                                  <span className="text-[10px] text-indigo-500">
                                    Còn x{effectiveQuantity}
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right text-sm">
                            {formatPrice(item.price)}
                          </td>
                          <td className="px-8 py-5 text-right font-medium text-gray-900">
                            {formatPrice(item.price * effectiveQuantity)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary with Return Adjustment */}
              {(() => {
                const totalKeptAmount =
                  order.items?.reduce((sum, item) => {
                    return (
                      sum +
                      item.price *
                        (item.quantity - (item.returned_quantity || 0))
                    );
                  }, 0) || 0;
                const taxOnKept = Math.max(
                  0,
                  (totalKeptAmount - Number(order.discount_amount)) *
                    (Number(order.tax_rate_snapshot) / 100),
                );
                const finalKeptAmount = Math.max(
                  0,
                  totalKeptAmount +
                    Number(order.shipping_fee) +
                    taxOnKept -
                    Number(order.discount_amount),
                );

                return (
                  <div className="p-8 bg-gray-50/50 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Tạm tính</span>
                      <span>{formatPrice(totalKeptAmount)}</span>
                    </div>
                    {order.shipping_fee > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Phí vận chuyển</span>
                        <span>{formatPrice(order.shipping_fee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-rose-500 text-[15px]">
                        Giảm giá
                      </span>
                      <span className="text-rose-500">
                        -{formatPrice(order.discount_amount)}
                      </span>
                    </div>
                    {(Number(order.tax_amount) > 0 ||
                      Number(order.tax_rate_snapshot) > 0) && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-bold uppercase text-[12px]">
                          Thuế ({order.tax_rate_snapshot}%)
                        </span>
                        <span>{formatPrice(taxOnKept)}</span>
                      </div>
                    )}
                    {order.expected_delivery_date && (
                      <div className="flex justify-between items-center text-sm mt-2">
                        <span className="text-slate-600 flex gap-1 items-center">
                          <Truck className="w-4 h-4" />
                          Dự kiến giao hàng
                        </span>
                        <span className="font-semibold text-gray-700">
                          {(() => {
                            const start = new Date(order.created_at);
                            start.setDate(start.getDate() + 1);
                            const end = new Date(order.expected_delivery_date);
                            const options = {
                              day: "2-digit",
                              month: "2-digit",
                            };
                            return `${start.toLocaleDateString("vi-VN", options)} - ${end.toLocaleDateString("vi-VN", { ...options, year: "numeric" })}`;
                          })()}
                        </span>
                      </div>
                    )}
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-900">
                          Tổng cộng
                        </span>
                        <span className="font-bold text-gray-900">
                          {formatPrice(finalKeptAmount)}
                        </span>
                      </div>

                      {order.wallet_amount_used > 0 && (
                        <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                          <span className="text-indigo-600 font-bold uppercase text-[12px] flex items-center gap-2">
                            Đã trừ từ ví
                          </span>
                          <span className="font-bold text-indigo-700">
                            -{formatPrice(order.wallet_amount_used)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-2">
                        <span className="font-semibold text-slate-900">
                          {order.wallet_amount_used > 0
                            ? "Còn lại cần thu"
                            : "Tổng thanh toán"}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {formatPrice(
                            Math.max(
                              0,
                              finalKeptAmount - (order.wallet_amount_used || 0),
                            ),
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                        <div>
                          <p className="text-xs flex gap-1 items-center text-slate-600 font-semibold mb-1">
                            <CreditCard className="w-3 h-3" />
                            Phương thức
                          </p>
                          <span>
                            <div className="flex items-center gap-2">
                              {order.payment_method?.image && (
                                <img
                                  src={getImageUrl(order.payment_method.image)}
                                  alt=""
                                  className="w-5 h-5 object-contain"
                                />
                              )}
                              {order.payment_method?.name || "Chưa xác định"}
                            </div>
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 flex gap-1 items-center  font-semibold mb-1">
                            <Truck className="w-3 h-3" />
                            Vận chuyển
                          </p>
                          <p className="text-sm font-medium text-slate-500">
                            <span>
                              {order.fulfillment_type || "Chưa xác định"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Note & History/Staff */}
            <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                  <FileText size={18} className="text-slate-700" />
                </div>
                <span className="font-semibold text-slate-900">Ghi chú</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="font-semibold text-slate-600">
                    Ghi chú từ khách hàng / nhân viên
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-lg border-none outline-none text-sm min-h-[100px]  "
                    placeholder="Nhập ghi chú..."
                  />
                </div>
                {order.created_by && (
                  <div className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                    <div className="w-10 h-10 text-white flex items-center justify-center ">
                      {order.created_by.avatar ? (
                        <img
                          src={order.created_by.avatar}
                          alt=""
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black rounded-full text-white">
                          {order.created_by.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[12px] text-gray-600 font-medium uppercase ">
                        Nhân viên lên đơn
                      </p>
                      <p className="text-xs font-bold text-indigo-900">
                        {order.created_by.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            {/* Customer Card */}
            <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                  <User size={18} className="text-slate-700" />
                </div>
                <span className="font-semibold text-slate-900">Khách hàng</span>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-semibold text-sm">
                    {order.customer?.avatar ? (
                      <img
                        src={getImageUrl(order.customer.avatar)}
                        alt=""
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {order.customer.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.customer.phone}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    Địa chỉ nhận hàng
                  </p>
                  <div className="flex gap-2">
                    <MapPin
                      size={14}
                      className="text-slate-400 shrink-0 mt-0.5"
                    />
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {order.customer.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Details */}
            {order.payment_status === "unpaid" && (
              <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm">
                <h3 className="text-sm font-bold uppercase flex items-center gap-2 mb-6">
                  <CreditCard className="w-4 h-4" />
                  Thanh toán đơn hàng
                </h3>

                <div className="mb-6">
                  <SelectSearch
                    label="Thay đổi phương thức"
                    value={selectedPaymentMethod}
                    onChange={(val) => handleUpdatePaymentMethod(val)}
                    options={paymentMethods
                      .filter((pm) => pm.code !== "vnpay")
                      .map((pm) => ({
                        icon: getImageUrl(pm.image),
                        value: pm.id,
                        label: pm.name,
                      }))}
                    disabled={updating || order.payment_status === "paid"}
                  />
                </div>

                <PaymentIntegration
                  selectedMethod={order.payment_method}
                  bankConfig={bankConfig}
                  validOrders={[order]}
                  totalAmount={order.final_amount}
                />

                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm mt-4"
                >
                  <CreditCard className="w-4 h-4" />
                  MỞ QR THANH TOÁN TỰ ĐỘNG
                </button>
              </div>
            )}

            {/* Status & Payment Action */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                <Save size={18} className="text-slate-700" />
                <span className="font-semibold text-slate-900">
                  Xử lý đơn hàng
                </span>
              </div>

              <div className="space-y-6 p-6">
                <div>
                  <SelectSearch
                    label="Trạng thái đơn hàng"
                    value={status}
                    onChange={(val) => setStatus(val)}
                    options={statusOptions}
                    disabled={
                      order.status === "cancelled" ||
                      order.status === "delivered" ||
                      order.status === "returned" ||
                      order.status === "partially_returned"
                    }
                  />
                </div>

                <div>
                  <SelectSearch
                    label="Tình trạng thanh toán"
                    value={paymentStatus}
                    onChange={(val) => setPaymentStatus(val)}
                    options={paymentStatusOptions}
                  />
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={handleUpdateOrder}
                    disabled={updating || order.status === "cancelled"}
                    className={`w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      order.status === "cancelled"
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-slate-900 hover:bg-slate-800 text-white active:scale-95"
                    }`}
                  >
                    {updating ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Cập nhật đơn hàng
                  </button>
                </div>
              </div>

              {order.status === "cancelled" && (
                <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3 text-rose-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-[10px] font-bold leading-relaxed">
                    Đơn hàng này đã bị hủy. Bạn không thể thực hiện thêm thay
                    đổi nào về trạng thái.
                  </p>
                </div>
              )}
            </div>
            {/* History Card */}
            <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Clock size={18} className="text-slate-700" />
                <span className="font-semibold text-slate-900">Lịch sử</span>
              </div>
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                {order.status_logs?.map((log, index) => (
                  <div key={log.id} className="relative pl-8">
                    <div
                      className={`absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full border-4 border-white shadow-sm flex items-center justify-center
                      ${
                        index === 0
                          ? log.status === "cancelled"
                            ? "bg-rose-500"
                            : log.status === "delivered"
                              ? "bg-emerald-500"
                              : "bg-indigo-500"
                          : "bg-gray-300"
                      }`}
                    >
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p
                        className={`text-sm font-bold ${index === 0 ? "text-gray-900" : "text-gray-500"}`}
                      >
                        {log.note || log.status}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(log.created_at).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        — {new Date(log.created_at).toLocaleDateString("vi-VN")}
                      </p>
                      {log.user && (
                        <p className="text-[10px] text-indigo-400 font-medium mt-1">
                          Bởi: {log.user.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {(!order.status_logs || order.status_logs.length === 0) && (
                  <div className="relative pl-8">
                    <div className="absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full border-4 border-white shadow-sm bg-green-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Đơn hàng được đặt
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}{" "}
                        —{" "}
                        {new Date(order.created_at).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {order && (
        <ReturnOrderModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          order={order}
          onRefresh={getOrderDetails}
        />
      )}

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

      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        order={order}
      />
    </AdminLayout>
  );
};

const InvoiceModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const printFrameRef = React.useRef(null);

  const handlePrint = () => {
    const iframe = printFrameRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const receiptHtml = document.getElementById(
      "order-detail-receipt-print-area",
    ).innerHTML;

    iframeDoc.open();
    iframeDoc.write(`
      <html>
        <head>
          <title>In Hóa Đơn - ${order.code || order.id}</title>
        </head>
        <body style="margin: 0; padding: 0; background: #fff; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh;">
          ${receiptHtml}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    iframeDoc.close();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-100 max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <Printer className="w-5 h-5 text-white" />
              XUẤT HÓA ĐƠN BÁN LẺ
            </h3>
            <p className="text-[10px] text-blue-100 font-medium mt-0.5">
              Mã hóa đơn: #{order.code || order.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 border-b border-slate-100">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 max-w-[340px] mx-auto">
            <div id="order-detail-receipt-print-area">
              <POSReceipt order={order} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all duration-150 active:scale-95"
          >
            ĐÓNG
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/10 transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            IN HÓA ĐƠN (K80)
          </button>
        </div>

        <iframe
          ref={printFrameRef}
          style={{ display: "none" }}
          title="Print Frame"
        />
      </div>
    </div>
  );
};

const BankPaymentModal = ({ isOpen, onClose, bankInfo }) => {
  if (!isOpen || !bankInfo) return null;

  const qrUrl = `https://qr.sepay.vn/img?bank=${bankInfo.bank_id}&acc=${bankInfo.account_no}&template=compact&amount=${bankInfo.amount}&des=${bankInfo.order_code}`;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        // Chặn việc bấm ra ngoài để đóng modal
      />
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h3 className="text-xl font-bold">Thanh toán chuyển khoản</h3>
          <p className="text-blue-100 text-sm mt-1">
            Quét mã để hoàn tất đơn hàng
          </p>
        </div>

        <div className="p-8 flex flex-col items-center">
          <div className="relative p-4 bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 group">
            <img
              src={qrUrl}
              alt="SePay QR"
              className="w-64 h-64 object-contain transition-transform group-hover:scale-105 duration-300"
            />
            <div className="absolute inset-0 border-2 border-blue-500/20 rounded-2xl pointer-events-none" />
          </div>

          <div className="w-full space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-500 text-xs font-medium">
                Số tiền:
              </span>
              <span className="text-blue-600 font-bold">
                {formatPrice(bankInfo.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-500 text-xs font-medium">
                Nội dung:
              </span>
              <span className="text-gray-900 font-bold uppercase tracking-wider">
                {bankInfo.order_code}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium animate-pulse">
                Đang chờ thanh toán...
              </span>
            </div>
            <p className="text-[10px] text-gray-400 text-center max-w-[250px]">
              Vui lòng không đóng cửa sổ này cho đến khi hệ thống xác nhận thành
              công.
            </p>
          </div>

          <button
            onClick={onClose}
            className="mt-6 text-gray-400 hover:text-gray-600 text-[10px] font-bold uppercase tracking-widest transition-colors underline underline-offset-4"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
