import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  MapPin,
  Truck,
  CreditCard,
  ShoppingBag,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShoppingCart,
  Zap,
  Tag,
  X,
  Copy,
  Wallet,
} from "lucide-react";

import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useBuyNow } from "../../context/BuyNowContext";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import { formatPrice, getImageUrl } from "../../helper/helper";
import ShippingMethodService from "../../services/ShippingMethodService";
import { fetchPaymentMethodsRequest } from "../../services/PaymentMethodService";
import { storefrontCheckoutRequest } from "../../services/CheckoutService";
import { usePromotion } from "../../hooks/usePromotion";
import {
  fetchBankConfigRequest,
  checkSepayStatusRequest,
} from "../../services/PaymentService";

import toast from "react-hot-toast";
import { format } from "date-fns";
import PromotionModal from "../Admin/order/components/PromotionModal";
import api from "../../api/axios";

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    totalAmount: cartTotal,
    discountAmount,
    appliedPromotion,
    clearCart,
  } = useCart();
  const { getBuyNowItem, clearBuyNowItem } = useBuyNow();

  const {
    promotionCode,
    setPromotionCode,
    appliedPromotion: localAppliedPromotion,
    setAppliedPromotion: setLocalAppliedPromotion,
    discountAmount: localDiscountAmount,
    setDiscountAmount: setLocalDiscountAmount,
    isApplying,
    applyPromotion,
    clearPromotion,
    eligiblePromotions,
    isLoadingEligible,
    fetchEligiblePromotions,
  } = usePromotion();

  const [mode, setMode] = useState("cart");
  const [buyNowItem, setBuyNowItem] = useState(null);

  useEffect(() => {
    const item = getBuyNowItem();
    if (item) {
      setMode("buynow");
      setBuyNowItem(item);
    } else if (cartItems.length === 0) {
      navigate("/");
    }
  }, []);

  useEffect(() => {
    const storedItem = getBuyNowItem();
    if (storedItem?.appliedPromotion) {
      setLocalAppliedPromotion(storedItem.appliedPromotion);
      setLocalDiscountAmount(storedItem.discountAmount || 0);
      setPromotionCode(storedItem.appliedPromotion?.promotion?.code || "");
      return;
    }

    if (appliedPromotion && appliedPromotion.promotion?.id) {
      setLocalAppliedPromotion(appliedPromotion);
      setLocalDiscountAmount(discountAmount);
      setPromotionCode(appliedPromotion.promotion?.code || "");
    }
  }, [appliedPromotion]);

  const displayItems =
    mode === "buynow"
      ? buyNowItem
        ? [{ ...buyNowItem, variant_id: buyNowItem.product_variant_id }]
        : []
      : cartItems;

  const subtotal =
    mode === "buynow"
      ? (buyNowItem?.price || 0) * (buyNowItem?.quantity || 1)
      : cartTotal;

  const discount = localDiscountAmount;
  const activePromotion = localAppliedPromotion;

  const buildPromoCartItems = () => {
    if (mode === "buynow" && buyNowItem) {
      const items = [
        {
          product_id: Number(buyNowItem.product_id || 0),
          category_id: Number(buyNowItem.category_id || 0),
          product_variant_id: Number(buyNowItem.product_variant_id || 0),
          quantity: Number(buyNowItem.quantity || 1),
          subtotal: Number(buyNowItem.price) * Number(buyNowItem.quantity || 1),
        },
      ];
      return items;
    }

    const items = cartItems.map((item) => ({
      product_id: Number(item.product_id || 0),
      category_id: Number(item.category_id || 0),
      product_variant_id: Number(item.variant_id || 0),
      quantity: Number(item.quantity || 1),
      subtotal: Number(item.price) * Number(item.quantity || 1),
    }));
    console.log("POS-like built promo cart items:", items);
    return items;
  };

  const handleApplyPromotion = () => {
    applyPromotion(
      promotionCode,
      buildPromoCartItems(),
      user?.id || null,
      "storefront",
    );
  };

  const [shippingMethods, setShippingMethods] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [bankConfig, setBankConfig] = useState(null);
  const [activeTaxRate, setActiveTaxRate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shippingRes, paymentRes, bankRes, taxRes] = await Promise.all([
          ShippingMethodService.getActive(),
          fetchPaymentMethodsRequest(),
          fetchBankConfigRequest(),
          api.get("/tax-rates"),
        ]);

        const shipping = shippingRes.data || [];
        const payments = (paymentRes.data || paymentRes).filter(
          (p) => p.is_active,
        );
        const bank = bankRes.data || bankRes;
        const rates = taxRes.data.data || taxRes.data || [];
        const activeTax = rates.find(
          (r) => r.is_active === 1 || r.is_active === true,
        );

        setShippingMethods(shipping);
        setPaymentMethods(payments);
        setBankConfig(bank);
        setActiveTaxRate(activeTax);

        setFormData((prev) => ({
          ...prev,
          shipping_method_id: shipping[0]?.id || "",
          payment_method_id: payments[0]?.id || "",
        }));
      } catch (error) {
        console.error("Error fetching checkout data:", error);
        toast.error("Không thể tải thông tin thanh toán");
      } finally {
        setIsLoading(false);
      }
    };
    console.log("user", user);
    fetchData();
  }, []);

  const [formData, setFormData] = useState({
    customer_name: user?.name || "",
    customer_phone: user?.customer_profile?.phone || "",
    address: user?.customer_profile?.address || "",
    note: "",
    shipping_method_id: "",
    payment_method_id: "",
  });

  const [useWallet, setUseWallet] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentBankInfo, setCurrentBankInfo] = useState(null);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);

  const hasSentNotif = useRef(false);

  const triggerPendingPaymentNotif = useCallback(async () => {
    if (!createdOrderId || hasSentNotif.current) return;
    hasSentNotif.current = true;
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const apiBase = import.meta.env.VITE_API_BASE_URL;
        const url = `${apiBase}/my-orders/${createdOrderId}/notify-pending-payment`;
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
        fetch(url, {
          method: "POST",
          headers,
          keepalive: true,
        }).catch(console.error);
      }
    } catch (e) {
      console.error("Failed to send pending payment notification:", e);
    }
  }, [createdOrderId]);

  useEffect(() => {
    if (showPaymentModal && createdOrderId) {
      hasSentNotif.current = false;

      const handleBeforeUnload = (e) => {
        triggerPendingPaymentNotif();
        e.preventDefault();
        e.returnValue = "";
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [showPaymentModal, createdOrderId, triggerPendingPaymentNotif]);

  const handleCloseModal = () => {
    triggerPendingPaymentNotif();
    setShowPaymentModal(false);
    navigate(`/orders/${createdOrderId}/success`);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    navigate(`/orders/${createdOrderId}/success`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const e = {};
    if (!formData.customer_name) e.customer_name = "Vui lòng nhập họ tên";
    if (!formData.customer_phone)
      e.customer_phone = "Vui lòng nhập số điện thoại";
    if (!formData.address) e.address = "Vui lòng nhập địa chỉ";
    if (!formData.shipping_method_id)
      e.shipping_method_id = "Vui lòng chọn phương thức vận chuyển";
    if (!formData.payment_method_id)
      e.payment_method_id = "Vui lòng chọn phương thức thanh toán";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    console.log(
      ">>> Checkout Submit - Payment Method:",
      formData.payment_method_id,
    );
    if (!validate()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    try {
      const base = {
        mode,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        address: formData.address,
        note: formData.note,
        shipping_method_id: parseInt(formData.shipping_method_id),
        payment_method_id: parseInt(formData.payment_method_id),
        discount_amount: discount,
        promotion_id:
          activePromotion?.promotion?.id || activePromotion?.id || null,
        promotion_code_snapshot:
          activePromotion?.promotion?.code || activePromotion?.code || null,
        use_wallet: useWallet,
      };

      const payload =
        mode === "buynow"
          ? {
              ...base,
              product_variant_id: buyNowItem.product_variant_id,
              quantity: buyNowItem.quantity,
            }
          : {
              ...base,
              items: cartItems.map((item) => ({
                product_variant_id: item.variant_id,
                quantity: item.quantity,
              })),
            };

      const paymentMethod = paymentMethods.find(
        (m) => m.id === parseInt(formData.payment_method_id),
      );

      // Nếu là chuyển khoản ngân hàng, tạo đơn hàng trước để lấy mã ORD thật
      if (paymentMethod?.code === "bank_transfer") {
        const response = await storefrontCheckoutRequest(payload);

        if (response.status === "success") {
          const orderData = response.data;
          toast.success("Đặt hàng thành công!");

          // Xóa giỏ hàng sau khi đã tạo đơn thành công
          if (mode === "cart") clearCart();
          else clearBuyNowItem();

          // Mở modal thanh toán chuyển khoản và lưu thông tin
          setCurrentBankInfo({
            ...response.bank_info,
            order_id: orderData.id,
          });
          setCreatedOrderId(orderData.id);
          setShowPaymentModal(true);
        }
        setIsSubmitting(false);
        return;
      }

      // Xử lý ví điện tử VNPay (Vẫn giữ logic cũ vì backend đã xử lý session)
      const response = await storefrontCheckoutRequest(payload);

      if (response.status === "success") {
        const orderData = response.data;
        const paymentUrl = response.payment_url;

        if (paymentUrl) {
          toast.loading("Đang chuyển hướng đến cổng thanh toán...");
          window.location.href = paymentUrl;
          return;
        }

        // Mặc định (COD)
        toast.success("Đặt hàng thành công!");
        if (mode === "cart") clearCart();
        else clearBuyNowItem();
        navigate(`/orders/${orderData.id}/success`);
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error(
        error.response?.data?.message || "Đặt hàng thất bại, vui lòng thử lại",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedShipping = shippingMethods.find(
    (m) => m.id === parseInt(formData.shipping_method_id),
  );
  const shippingFee = selectedShipping?.cost || 0;

  // Tính tiền chịu thuế
  const taxableAmount = displayItems.reduce((acc, item) => {
    if (item.is_taxable) {
      return acc + Number(item.price) * (Number(item.quantity) || 1);
    }
    return acc;
  }, 0);

  let taxAmount = 0;
  if (activeTaxRate) {
    const rate = Number(activeTaxRate.rate) || 0;
    const taxableRatio =
      Number(subtotal) > 0 ? taxableAmount / Number(subtotal) : 0;
    const discountForTaxable = Number(discount) * taxableRatio;
    taxAmount = Math.max(0, taxableAmount - discountForTaxable) * (rate / 100);
  }

  const total = Math.max(
    0,
    Number(subtotal) - Number(discount) + Number(shippingFee) + taxAmount,
  );

  useEffect(() => {
    let pollingInterval;

    if (showPaymentModal && currentBankInfo && createdOrderId) {
      pollingInterval = setInterval(async () => {
        try {
          const resp = await checkSepayStatusRequest(
            currentBankInfo.order_code,
            currentBankInfo.amount,
          );

          if (resp && resp.paid) {
            clearInterval(pollingInterval);
            toast.success("Thanh toán thành công! Đơn hàng đã được xác nhận.");
            setShowPaymentModal(false);
            navigate(`/orders/${createdOrderId}/success`);
          }
        } catch (error) {
          console.error("Polling error:", error);
          // Không hiện toast error để tránh spam, chỉ log ra console
        }
      }, 5000); // Poll mỗi 5 giây
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [showPaymentModal, currentBankInfo, createdOrderId, navigate]);

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-black" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="pt-32 pb-24 bg-[#f8fafc] min-h-screen text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header + back link */}
          <div className="mb-8">
            <Link
              to={mode === "buynow" ? "/products" : "/cart"}
              className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-sky-600 uppercase tracking-widest transition-colors"
            >
              <ChevronLeft size={14} className="mr-1" />
              {mode === "buynow" ? "Quay lại sản phẩm" : "Quay lại giỏ hàng"}
            </Link>

            <div className="mt-4 flex items-center gap-3">
              <CheckCircle2 className="text-sky-600" size={28} />
              <h1 className="text-2xl font-medium text-slate-800 tracking-tight uppercase">
                Thanh toán
              </h1>
              {/* Mode badge */}
              <span
                className={`ml-2 flex items-center gap-1 text-[10px] font-medium uppercase px-3 py-1 rounded-full ${
                  mode === "buynow"
                    ? "bg-orange-50 text-orange-600 border border-orange-100"
                    : "bg-sky-50 text-sky-700 border border-sky-100"
                }`}
              >
                {mode === "buynow" ? (
                  <>
                    <Zap size={10} /> Mua ngay
                  </>
                ) : (
                  <>
                    <ShoppingCart size={10} /> Giỏ hàng ({cartItems.length})
                  </>
                )}
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* ── Left Column ── */}
            <div className="lg:col-span-7 space-y-6">
              {/* Shipping Info */}
              <section className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                    <MapPin size={18} />
                  </div>
                  <h2 className="text-[1rem] font-medium text-slate-800">
                    Thông tin giao hàng
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${
                        errors.customer_name
                          ? "border-red-500"
                          : "border-slate-200/80"
                      } rounded-lg focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-[13px] font-medium text-slate-800`}
                      placeholder="Nguyễn Văn A"
                    />
                    {errors.customer_name && (
                      <p className="text-red-500 text-[10px] font-medium uppercase">
                        {errors.customer_name}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${
                        errors.customer_phone
                          ? "border-red-500"
                          : "border-slate-200/80"
                      } rounded-lg focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-[13px] font-medium text-slate-800`}
                      placeholder="0912 345 678"
                    />
                    {errors.customer_phone && (
                      <p className="text-red-500 text-[10px] font-medium uppercase">
                        {errors.customer_phone}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-medium text-slate-500">
                      Địa chỉ giao hàng *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${
                        errors.address
                          ? "border-red-500"
                          : "border-slate-200/80"
                      } rounded-lg focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-[13px] font-medium text-slate-800`}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                    />
                    {errors.address && (
                      <p className="text-red-500 text-[10px] font-medium uppercase">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* Note */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-medium text-slate-500">
                      Ghi chú đơn hàng (tuỳ chọn)
                    </label>
                    <textarea
                      name="note"
                      rows="2.5"
                      value={formData.note}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-lg focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-[13px] font-medium text-slate-800 resize-none"
                      placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn giao hàng..."
                    />
                  </div>
                </div>
              </section>

              {/* Shipping Method */}
              <section className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                    <Truck size={18} />
                  </div>
                  <h2 className="text-[1rem] font-medium text-slate-800">
                    Phương thức vận chuyển
                  </h2>
                </div>

                <div className="space-y-3">
                  {shippingMethods
                    .filter((method) => method.id !== 3)
                    .map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center justify-between px-5 py-3.5 rounded-xl border cursor-pointer transition-all ${
                          parseInt(formData.shipping_method_id) === method.id
                            ? "border-sky-600 bg-sky-50/20"
                            : "border-slate-100 hover:border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="radio"
                            name="shipping_method_id"
                            value={method.id}
                            checked={
                              parseInt(formData.shipping_method_id) ===
                              method.id
                            }
                            onChange={handleInputChange}
                            className="w-4 h-4 accent-sky-600"
                          />
                          <div>
                            <p className="font-semibold text-slate-800 text-[13px]">
                              {method.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {method.estimated_days
                                ? `Dự kiến ${method.estimated_days} ngày`
                                : method.estimated_delivery || ""}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-sky-700 text-sm">
                          {formatPrice(method.cost)}
                        </span>
                      </label>
                    ))}
                  {errors.shipping_method_id && (
                    <p className="text-red-500 text-[10px] font-medium uppercase">
                      {errors.shipping_method_id}
                    </p>
                  )}
                </div>
              </section>

              {/* Wallet Payment Option */}
              {user && user.wallet_balance > 0 && (
                <section className="bg-gradient-to-r from-sky-950 to-slate-900 rounded-xl p-6 shadow-md border border-slate-800 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                        <Wallet className="text-white" size={18} />
                      </div>
                      <div>
                        <h2 className="text-base font-medium text-white">
                          Ví Trendora
                        </h2>
                        <p className="text-xs text-white/60 font-medium">
                          Sử dụng số dư ví để thanh toán
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/50 uppercase font-medium tracking-wider">
                        Số dư khả dụng
                      </p>
                      <p className="text-xl font-semibold text-sky-400">
                        {formatPrice(user.wallet_balance)}
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={useWallet}
                        onChange={(e) => setUseWallet(e.target.checked)}
                        className="w-5 h-5 rounded accent-sky-600 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[13px]">
                        Dùng số dư ví cho đơn hàng này
                      </p>
                      <p className="text-[10px] text-white/40">
                        {user.wallet_balance >= total
                          ? "Số dư đủ để thanh toán toàn bộ đơn hàng"
                          : `Sẽ trừ ${formatPrice(Math.min(user.wallet_balance, total))} từ ví của bạn`}
                      </p>
                    </div>
                  </label>
                </section>
              )}

              {/* Payment Method */}
              <section className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                    <CreditCard size={18} />
                  </div>
                  <h2 className="text-[1rem] font-medium text-slate-800">
                    Phương thức thanh toán
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex flex-col gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        parseInt(formData.payment_method_id) === method.id
                          ? "border-sky-600 bg-sky-50/20"
                          : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <input
                          type="radio"
                          name="payment_method_id"
                          value={method.id}
                          checked={
                            parseInt(formData.payment_method_id) === method.id
                          }
                          onChange={handleInputChange}
                          className="w-4 h-4 accent-sky-600"
                        />
                        {method.logo && (
                          <img
                            src={getImageUrl(method.logo)}
                            alt={method.name}
                            className="h-6 object-contain"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 uppercase text-[12px] tracking-wider">
                          {method.name}
                        </p>
                        {method.description && (
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                            {method.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                  {errors.payment_method_id && (
                    <p className="text-red-500 text-[10px] font-medium uppercase md:col-span-2">
                      {errors.payment_method_id}
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* ── Right Column: Order Summary ── */}
            <div className="lg:col-span-5 sticky top-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Items list */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3 mb-6">
                    <ShoppingBag className="text-sky-600" size={18} />
                    <h2 className="text-base font-medium text-slate-800">
                      Đơn hàng của bạn
                    </h2>
                    <span className="ml-auto bg-sky-50 text-sky-700 text-[10px] px-2.5 py-0.5 rounded-full font-medium border border-sky-100">
                      {displayItems.length} sản phẩm
                    </span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2">
                    {displayItems.map((item, idx) => (
                      <div
                        key={item.variant_id ?? item.product_variant_id ?? idx}
                        className="flex gap-4 group"
                      >
                        <div className="relative w-16 h-20 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform border border-slate-100">
                          <img
                            src={
                              item.image
                                ? getImageUrl(item.image)
                                : "https://placehold.co/600x600/e2e8f0/475569?text=No+Image"
                            }
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src =
                                "https://placehold.co/600x600/e2e8f0/475569?text=No+Image";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                          <h4 className="text-[13px] font-medium text-slate-800 line-clamp-1">
                            {item.name}
                          </h4>
                          {item.variant_name && (
                            <p className="text-[10px] text-slate-400 font-medium uppercase">
                              {item.variant_name}
                            </p>
                          )}
                          <div className="flex flex-nowrap gap-1 overflow-hidden">
                            {item.attributes?.map((attr, i) => (
                              <span
                                key={i}
                                className="text-[10px] text-slate-400 font-medium uppercase whitespace-nowrap"
                              >
                                {attr.attribute_value}
                                {i < item.attributes.length - 1 ? " • " : ""}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <p className="text-xs font-medium text-sky-700">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                            <span className="text-slate-500 text-[11px] font-medium">
                              Số lượng: {item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <PromotionModal
                  isOpen={isPromotionModalOpen}
                  onClose={() => setIsPromotionModalOpen(false)}
                  onSelect={(promo) => {
                    setPromotionCode(promo.code);
                    applyPromotion(
                      promo.code,
                      buildPromoCartItems(),
                      user?.id || null,
                      "storefront",
                    );
                    setIsPromotionModalOpen(false);
                  }}
                  promotions={eligiblePromotions}
                />

                <section className="bg-white p-6 border-b border-slate-100">
                  <div className="flex items-center mb-4 gap-2">
                    <Tag className="text-sky-600" size={18} />
                    <h2 className="text-sm font-medium text-slate-800">
                      Mã giảm giá
                    </h2>
                  </div>

                  {activePromotion ? (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-green-50 border border-green-100">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-green-500" size={18} />
                        <div>
                          <p className="font-semibold text-green-700 text-xs uppercase tracking-wider">
                            {activePromotion?.promotion?.code ||
                              activePromotion?.code ||
                              promotionCode}
                          </p>
                          <p className="text-[11px] text-green-600 font-medium">
                            Giảm {formatPrice(localDiscountAmount)} đã được áp
                            dụng
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearPromotion}
                        className="p-1 rounded-lg text-green-500 hover:bg-green-100 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promotionCode}
                        onChange={(e) =>
                          setPromotionCode(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), handleApplyPromotion())
                        }
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-xs font-medium font-mono uppercase tracking-wider placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400"
                        placeholder="Nhập mã giảm giá..."
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromotion}
                        disabled={isApplying || !promotionCode}
                        className="px-4 py-2 bg-sky-600 text-white rounded-lg font-medium text-xs uppercase tracking-wider hover:bg-sky-700 hover:shadow-md hover:shadow-sky-500/15 active:scale-[0.98] transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isApplying ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Áp dụng"
                        )}
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      const data = await fetchEligiblePromotions(
                        buildPromoCartItems(),
                        user?.id || null,
                        "storefront",
                      );
                      if (data) setIsPromotionModalOpen(true);
                    }}
                    className="w-full mt-3 py-2.5 border border-dashed border-slate-200 rounded-lg text-[10px] text-slate-500 font-semibold uppercase hover:border-sky-300 hover:text-sky-600 transition-all flex items-center justify-center gap-2 bg-slate-50/50"
                  >
                    {isLoadingEligible ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Tag className="w-3 h-3" />
                    )}{" "}
                    DANH SÁCH MÃ GIẢM GIÁ
                  </button>
                </section>

                <div className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">Tạm tính</span>
                      <span className="text-slate-800">
                        {formatPrice(subtotal)}
                      </span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-red-500 flex items-center gap-1">
                          <AlertCircle size={14} />
                          Giảm giá{" "}
                          {activePromotion?.promotion?.value == "percent" &&
                            `(${activePromotion.promotion.value}%)`}
                        </span>
                        <span className="text-red-500">
                          -{formatPrice(discount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">Phí vận chuyển</span>
                      <span className="text-slate-800">
                        {formatPrice(shippingFee)}
                      </span>
                    </div>

                    {activeTaxRate && (
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-400 flex items-center gap-1">
                          Thuế ({activeTaxRate.name} - {activeTaxRate.rate}%)
                        </span>
                        <span className="text-slate-800">
                          {formatPrice(taxAmount)}
                        </span>
                      </div>
                    )}

                    {useWallet && user && user.wallet_balance > 0 && (
                      <div className="flex justify-between text-xs text-sky-700 font-medium bg-sky-50 p-2.5 rounded-lg border border-sky-100">
                        <span className="flex items-center gap-1">
                          <Wallet size={13} /> Trừ từ ví
                        </span>
                        <span>
                          -{formatPrice(Math.min(user.wallet_balance, total))}
                        </span>
                      </div>
                    )}

                    {selectedShipping && (
                      <div className="flex justify-between text-[10px] text-sky-600 font-medium italic pt-1 border-t border-slate-50">
                        <span className="flex items-center gap-1">
                          <Truck size={12} /> Dự kiến giao hàng
                        </span>
                        <span>
                          {(() => {
                            const date = new Date();
                            const days =
                              parseInt(selectedShipping.estimated_days) || 3;
                            date.setDate(date.getDate() + days);
                            return format(date, "dd/MM/yyyy");
                          })()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-xs font-medium text-slate-400">
                        Tổng thanh toán
                      </p>
                      <p className="text-2xl font-semibold text-slate-800">
                        {formatPrice(
                          Math.max(
                            0,
                            total -
                              (useWallet
                                ? Math.min(user.wallet_balance, total)
                                : 0),
                          ),
                        )}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3.5 rounded-lg font-medium text-sm uppercase hover:shadow-lg hover:shadow-sky-500/15 active:scale-[0.98] transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-sky-500/10"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          Xác nhận đặt hàng
                          <CheckCircle2 size={16} />
                        </>
                      )}
                    </button>

                    <p className="mt-3 text-[10px] text-slate-400 text-center">
                      Bằng việc nhấn vào nút trên, bạn đồng ý với{" "}
                      <span className="text-sky-600 hover:text-sky-700 underline cursor-pointer transition-colors">
                        Điều khoản dịch vụ
                      </span>{" "}
                      của chúng tôi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-6 flex justify-center gap-8 grayscale opacity-40">
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle2 size={16} />
                  <span className="text-[8px] font-bold uppercase">
                    Bảo mật
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Truck size={16} />
                  <span className="text-[8px] font-bold uppercase">
                    Nhanh chóng
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <CreditCard size={16} />
                  <span className="text-[8px] font-bold uppercase">
                    Linh hoạt
                  </span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      {/* Bank Payment Modal */}
      <BankPaymentModal
        isOpen={showPaymentModal}
        onClose={handleCloseModal}
        isSubmitting={isSubmitting}
        bankInfo={currentBankInfo}
        onSuccess={handlePaymentSuccess}
      />
    </CustomerLayout>
  );
};

const BankPaymentModal = ({
  isOpen,
  onClose,
  isSubmitting,
  bankInfo,
  onSuccess,
}) => {
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    let pollingInterval;
    if (isOpen && bankInfo && !isPaid) {
      pollingInterval = setInterval(async () => {
        try {
          const resp = await checkSepayStatusRequest(
            bankInfo.order_code,
            bankInfo.amount,
          );
          if (resp && resp.paid) {
            clearInterval(pollingInterval);
            setIsPaid(true);
            toast.success("Thanh toán thành công! Đơn hàng đã được xác nhận.");
            if (onSuccess) {
              onSuccess();
            }
          }
        } catch (error) {
          console.error("Polling failed:", error);
        }
      }, 5000);
    }
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [isOpen, bankInfo, isPaid, onSuccess]);

  if (!isOpen || !bankInfo) return null;

  const qrUrl = `https://qr.sepay.vn/img?bank=${bankInfo.bank_id}&acc=${bankInfo.account_no}&template=compact&amount=${bankInfo.amount}&des=${bankInfo.order_code}`;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      <div className="relative bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 text-slate-800 rounded-xl border border-slate-100">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="font-medium text-slate-800 text-lg leading-tight tracking-tight">
                Thanh toán chuyển khoản
              </h3>
              <p className="text-slate-400 text-[10px] uppercase font-medium tracking-widest mt-0.5">
                Tự động xác nhận giao dịch qua cổng SePay
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-600 active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {isPaid ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center w-full animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 border border-emerald-100 animate-bounce">
              <CheckCircle2 size={44} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
              THANH TOÁN THÀNH CÔNG!
            </h3>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              Hệ thống đã ghi nhận số tiền chuyển khoản của bạn. Đơn hàng #
              <span className="font-bold text-slate-700">
                {bankInfo.order_code}
              </span>{" "}
              đang được tiến hành xử lý để giao tới bạn nhanh nhất!
            </p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row">
            {/* Left side: QR and Scanning status */}
            <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/40">
              {/* Status Indicator */}
              <div className="mb-6 flex items-center gap-2.5 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100/70 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Đang quét tự động...
                </span>
              </div>

              {/* QR Code Container */}
              <div className="relative bg-white rounded-xl p-4 shadow-md border border-slate-100 max-w-[210px] aspect-square w-full mb-6 hover:scale-[1.02] transition-transform duration-300">
                <img
                  src={qrUrl}
                  className="w-full h-full object-contain"
                  alt="Payment QR"
                />
              </div>

              <div className="text-center max-w-[220px]">
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Mở ứng dụng ngân hàng bất kỳ để quét mã QR thanh toán nhanh
                  24/7.
                </p>
              </div>
            </div>

            {/* Right side: Bank Details */}
            <div className="flex-[1.2] p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="px-2.5 py-1 bg-sky-50 text-sky-600 text-[10px] font-black rounded-md tracking-wider uppercase">
                    Thông tin chuyển khoản
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-400 font-medium">
                      Ngân hàng
                    </span>
                    <span className="text-sm font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      MB Bank
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-400 font-medium">
                      Số tài khoản
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-800 font-mono font-bold tracking-wider">
                        {bankInfo.account_no}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(bankInfo.account_no);
                          toast.success("Đã copy số tài khoản");
                        }}
                        className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-400 font-medium">
                      Chủ tài khoản
                    </span>
                    <span className="text-sm text-slate-800 font-medium uppercase">
                      {bankInfo.account_name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-400 font-medium">
                      Nội dung bắt buộc
                    </span>
                    <div className="flex items-center gap-2 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      <span className="text-amber-800 font-mono font-bold uppercase text-xs tracking-wider">
                        {bankInfo.order_code}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(bankInfo.order_code);
                          toast.success("Đã copy nội dung");
                        }}
                        className="p-1 text-amber-500 hover:text-amber-700 transition-colors"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 mt-4 flex items-center justify-between border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold">
                      Số tiền cần chuyển
                    </span>
                    <span className="text-xl font-medium text-slate-800 font-sans tracking-tight">
                      {formatPrice(bankInfo.amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all hover:shadow-lg hover:shadow-slate-900/10 active:scale-98"
                >
                  Tôi muốn thanh toán sau
                </button>
                <p className="text-[9px] text-center text-slate-400">
                  * Vui lòng giữ nguyên màn hình quét mã này, hệ thống sẽ tự
                  động đóng khi nhận được thanh toán.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
