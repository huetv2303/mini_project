import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchOrderRequest,
  updateOrderRequest,
  cancelOrderRequest,
  fetchPaymentMethodsRequest,
  updatePaymentMethodRequest,
} from "../../../services/OrderService";
import {
  createVNPayPaymentRequest,
  getBankConfigRequest,
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
} from "lucide-react";
import ReturnOrderModal from "../../../components/Admin/Order/ReturnOrderModal";
import toast from "react-hot-toast";
import { formatPrice } from "./OrderListPage";
import SelectSearch from "../../../components/common/SelectSearch";

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
      if (
        data.payment_method?.code === "bank_transfer" &&
        data.payment_status === "unpaid"
      ) {
        getBankConfigRequest()
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

  const getImageUrl = (path) => {
    if (!path) return "/no-image.png";
    if (path.startsWith("http")) return path;
    const url = (
      import.meta.env.VITE_URL_IMAGE || "http://localhost:8000/storage"
    ).replace(/\/$/, "");
    return `${url}/${path.replace(/^\//, "")}`;
  };

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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-black animate-spin mb-4" />
          <p className="text-gray-400 font-bold text-xs uppercase ">
            Đang tải hóa đơn...
          </p>
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
                <h1 className="text-2xl font-black text-gray-900">
                  Chi tiết Đơn hàng
                </h1>
                <span className="px-3 py-1 bg-black text-white text-[12px] font-bold rounded-lg uppercase">
                  #{order.code}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Đặt ngày {new Date(order.created_at).toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="flex ">
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
                  className="w-full p-2 rounded-lg text-[0.9rem] flex gap-2 hover:bg-gray-200 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <p className="font-medium items-center">Hủy đơn</p>
                </button>
              )}
              {order.status === "delivered" && (
                <button
                  onClick={() => setIsReturnModalOpen(true)}
                  className="w-full p-2  rounded-lg text-[0.9rem]  flex gap-2 hover:bg-gray-200 transition-all cursor-pointer "
                >
                  <Package />
                  <p className="font-medium">Trả hàng</p>
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
                <h3 className="text-sm font-bold uppercase  flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Sản phẩm đã đặt
                </h3>
                <span className="text-[12px] bg-gray-100 px-3 py-1 rounded-full font-bold">
                  {order.items?.length || 0} mục
                </span>
              </div>
              <div className="overflow-x-auto ">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-8 py-4 text-[0.8rem]  text-gray-600 uppercase text-left">
                        Sản phẩm
                      </th>
                      <th className="px-8 py-4 text-[0.8rem]  text-gray-600 uppercase text-left">
                        Ảnh
                      </th>
                      <th className="px-6 py-4 text-[0.8rem]  text-gray-600 uppercase text-center">
                        Số lượng
                      </th>
                      <th className="px-6 py-4 text-[0.8rem]  text-gray-600 uppercase text-right">
                        Đơn giá
                      </th>
                      <th className="px-8 py-4 text-[0.8rem]  text-gray-600 uppercase text-right">
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
                              <span className="font-bold text-gray-900 flex items-center gap-2">
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
                      <span className="text-gray-500 font-bold uppercase text-[12px]">
                        Tạm tính (hàng giữ lại)
                      </span>
                      <span>{formatPrice(totalKeptAmount)}</span>
                    </div>
                    {order.shipping_fee > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-bold uppercase text-[12px]">
                          Phí vận chuyển
                        </span>
                        <span>{formatPrice(order.shipping_fee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-rose-500 font-bold uppercase text-[12px]">
                        Giảm giá
                      </span>
                      <span className="text-rose-500">
                        -{formatPrice(order.discount_amount)}
                      </span>
                    </div>
                    {order.tax_amount > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-bold uppercase text-[12px]">
                          Thuế ({order.tax_rate_snapshot}%)
                        </span>
                        <span>{formatPrice(order.tax_amount)}</span>
                      </div>
                    )}
                    {order.expected_delivery_date && (
                      <div className="flex justify-between items-center text-sm mt-2">
                        <span className="text-indigo-600 font-bold uppercase text-[12px] flex items-center gap-2">
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
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-black font-bold uppercase text-[0.8rem]">
                          Tổng thanh toán thực tế
                        </span>
                        <span className="text-2xl font-bold ">
                          {formatPrice(finalKeptAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[0.8rem] text-gray-600 font-bold uppercase">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3 h-3" />
                          Thanh toán
                        </div>
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
                      <div className="flex justify-between items-center text-[0.8rem] text-gray-600 font-bold uppercase mt-2">
                        <div className="flex items-center gap-2">
                          <Truck className="w-3 h-3" />
                          Vận chuyển
                        </div>
                        <span>
                          {order.shipping_method?.name || "Chưa xác định"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Note & History/Staff */}
            <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase  flex items-center gap-2 mb-6">
                <FileText className="w-4 h-4" />
                Ghi chú & Nội bộ
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-600 uppercase  mb-2 block">
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
              <h3 className="text-sm font-bold uppercase  flex items-center gap-2 mb-6">
                <User className="w-4 h-4" />
                Khách hàng
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {order.customer?.name}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                      <Phone className="w-3 h-3" />
                      {order.customer?.phone}
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-50">
                  <p className="text-[0.8rem] font-bold text-gray-600 uppercase  mb-3">
                    Địa chỉ nhận hàng
                  </p>
                  <div className="flex gap-3 text-[1rem] text-gray-600 font-medium leading-relaxed">
                    <MapPin className="w-5 h-5 text-gray-300 shrink-0" />
                    {order.customer?.address}
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
                    value={order.payment_method_id}
                    onChange={(val) => handleUpdatePaymentMethod(val)}
                    options={paymentMethods.map((pm) => ({
                      icon: getImageUrl(pm.image),
                      value: pm.id,
                      label: pm.name,
                    }))}
                    disabled={updating || order.payment_status === "paid"}
                  />
                </div>

                {order.payment_method?.code === "vnpay" && (
                  <button
                    onClick={handleVnpayPayment}
                    className="w-full py-3 bg-[#005BA9] hover:bg-[#004e92] text-white font-bold rounded-lg transition-all"
                  >
                    Thanh toán qua VNPay
                  </button>
                )}

                {order.payment_method?.code === "bank_transfer" &&
                  bankConfig && (
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-medium mb-4 text-center">
                        Quét mã QR để thanh toán (VietQR)
                      </p>
                      <img
                        src={`https://img.vietqr.io/image/${bankConfig.bank_id}-${bankConfig.account_no}-compact2.png?amount=${Math.floor(order.final_amount)}&addInfo=${encodeURIComponent("Thanh toan don hang " + order.code)}&accountName=${encodeURIComponent(bankConfig.account_name)}`}
                        alt="VietQR"
                        className="w-48 h-48 border rounded-lg shadow-sm"
                      />
                      <div className="mt-4 text-center text-xs text-gray-500 space-y-1">
                        <p>
                          Ngân hàng: <strong>{bankConfig.bank_id}</strong>
                        </p>
                        <p>
                          Số TK: <strong>{bankConfig.account_no}</strong>
                        </p>
                        <p>
                          Chủ TK: <strong>{bankConfig.account_name}</strong>
                        </p>
                        <p>
                          Nội dung:{" "}
                          <strong>Thanh toan don hang {order.code}</strong>
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Status & Payment Action */}
            <div className=" rounded-lg p-8 shadow-2xl shadow-black/20 ">
              <h3 className="text-sm font-bold uppercase flex items-center gap-2 mb-8 ">
                <Save className="w-4 h-4" />
                Xử lý đơn hàng
              </h3>

              <div className="space-y-6">
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
                    className="w-full py-4 bg-black hover:bg-black/80 text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    CẬP NHẬT ĐƠN HÀNG
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
    </AdminLayout>
  );
};

export default OrderDetailsPage;
