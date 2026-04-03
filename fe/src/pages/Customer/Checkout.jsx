import React, { useState, useEffect } from "react";
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
import { fetchBankConfigRequest } from "../../services/PaymentService";
import toast from "react-hot-toast";
import { format } from "date-fns";
import PromotionModal from "../Admin/order/components/PromotionModal";

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shippingRes, paymentRes, bankRes] = await Promise.all([
          ShippingMethodService.getActive(),
          fetchPaymentMethodsRequest(),
          fetchBankConfigRequest(),
        ]);

        const shipping = shippingRes.data || [];
        const payments = (paymentRes.data || paymentRes).filter(
          (p) => p.is_active,
        );
        const bank = bankRes.data || bankRes;

        setShippingMethods(shipping);
        setPaymentMethods(payments);
        setBankConfig(bank);

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

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentBankInfo, setCurrentBankInfo] = useState(null);
  const [pendingCheckoutPayload, setPendingCheckoutPayload] = useState(null);
  const [tempRefCode, setTempRefCode] = useState("");
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);

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

      if (paymentMethod?.code === "bank_transfer") {
        const ref =
          "PAY-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        setTempRefCode(ref);
        setPendingCheckoutPayload(payload);
        setCurrentBankInfo({
          ...bankConfig,
          amount: total,
          order_code: ref,
        });
        setShowPaymentModal(true);
        setIsSubmitting(false); // Dừng loading vì chỉ đang hiện modal
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

  const handleConfirmBankOrder = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const resp = await storefrontCheckoutRequest(pendingCheckoutPayload);
      if (resp.status === "success") {
        toast.success("Đặt hàng thành công!");
        if (mode === "cart") clearCart();
        else clearBuyNowItem();
        setShowPaymentModal(false);
        navigate(`/orders/${resp.data.id}/success`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi đặt hàng");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedShipping = shippingMethods.find(
    (m) => m.id === parseInt(formData.shipping_method_id),
  );
  const shippingFee = selectedShipping?.cost || 0;
  const total = Math.max(
    0,
    Number(subtotal) - Number(discount) + Number(shippingFee),
  );

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
      <div className="pt-32 pb-24 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header + back link */}
          <div className="mb-8">
            <Link
              to={mode === "buynow" ? "/products" : "/cart"}
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-black transition-colors"
            >
              <ChevronLeft size={16} className="mr-1" />
              {mode === "buynow" ? "Quay lại sản phẩm" : "Quay lại giỏ hàng"}
            </Link>

            <div className="mt-4 flex items-center gap-3">
              <CheckCircle2 className="text-black" size={32} />
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                THANH TOÁN
              </h1>
              {/* Mode badge */}
              <span
                className={`ml-2 flex items-center gap-1 text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                  mode === "buynow"
                    ? "bg-orange-100 text-orange-600"
                    : "bg-gray-100 text-gray-700"
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
            className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start"
          >
            {/* ── Left Column ── */}
            <div className="lg:col-span-7 space-y-8">
              {/* Shipping Info */}
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-black rounded-xl">
                    <MapPin className="text-white" size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Thông tin giao hàng
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-[0.7rem] font-bold text-gray-400 uppercase tracking-wider">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3.5 bg-gray-50 border ${
                        errors.customer_name
                          ? "border-red-500"
                          : "border-transparent"
                      } rounded-xl focus:bg-white focus:border-black outline-none transition-all font-medium`}
                      placeholder="Nguyễn Văn A"
                    />
                    {errors.customer_name && (
                      <p className="text-red-500 text-[10px] font-bold uppercase">
                        {errors.customer_name}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-[0.7rem] font-bold text-gray-400 uppercase">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3.5 bg-gray-50 border ${
                        errors.customer_phone
                          ? "border-red-500"
                          : "border-transparent"
                      } rounded-xl focus:bg-white focus:border-black outline-none transition-all font-medium`}
                      placeholder="0912 345 678"
                    />
                    {errors.customer_phone && (
                      <p className="text-red-500 text-[10px] font-bold uppercase">
                        {errors.customer_phone}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[0.7rem] font-bold text-gray-400 uppercase">
                      Địa chỉ giao hàng *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3.5 bg-gray-50 border ${
                        errors.address ? "border-red-500" : "border-transparent"
                      } rounded-xl focus:bg-white focus:border-black outline-none transition-all font-medium`}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                    />
                    {errors.address && (
                      <p className="text-red-500 text-[10px] font-bold uppercase">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* Note */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[0.7rem] font-bold text-gray-400 uppercase">
                      Ghi chú đơn hàng (tuỳ chọn)
                    </label>
                    <textarea
                      name="note"
                      rows="3"
                      value={formData.note}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black outline-none transition-all font-medium resize-none"
                      placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn giao hàng..."
                    />
                  </div>
                </div>
              </section>

              {/* Shipping Method */}
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-black rounded-xl">
                    <Truck className="text-white" size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Phương thức vận chuyển
                  </h2>
                </div>

                <div className="space-y-3">
                  {shippingMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        parseInt(formData.shipping_method_id) === method.id
                          ? "border-black bg-gray-50"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="shipping_method_id"
                          value={method.id}
                          checked={
                            parseInt(formData.shipping_method_id) === method.id
                          }
                          onChange={handleInputChange}
                          className="w-5 h-5 accent-black"
                        />
                        <div>
                          <p className="font-bold text-gray-900">
                            {method.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {method.estimated_days
                              ? `Dự kiến ${method.estimated_days} ngày`
                              : method.estimated_delivery || ""}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-gray-900">
                        {formatPrice(method.cost)}
                      </span>
                    </label>
                  ))}
                  {errors.shipping_method_id && (
                    <p className="text-red-500 text-[10px] font-bold uppercase">
                      {errors.shipping_method_id}
                    </p>
                  )}
                </div>
              </section>

              {/* Payment Method */}
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-black rounded-xl">
                    <CreditCard className="text-white" size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Phương thức thanh toán
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex flex-col gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        parseInt(formData.payment_method_id) === method.id
                          ? "border-black bg-gray-50"
                          : "border-gray-100 hover:border-gray-200"
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
                          className="w-5 h-5 accent-black"
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
                        <p className="font-bold text-gray-900 uppercase text-xs tracking-wider">
                          {method.name}
                        </p>
                        {method.description && (
                          <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">
                            {method.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                  {errors.payment_method_id && (
                    <p className="text-red-500 text-[10px] font-bold uppercase md:col-span-2">
                      {errors.payment_method_id}
                    </p>
                  )}
                </div>
              </section>

              {/* Promo Code Section */}
            </div>

            {/* ── Right Column: Order Summary ── */}
            <div className="lg:col-span-5 sticky top-8">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Items list */}
                <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3 mb-6">
                    <ShoppingBag className="text-gray-400" size={20} />
                    <h2 className="text-xl font-medium text-gray-700">
                      Đơn hàng của bạn
                    </h2>
                    <span className="ml-auto bg-black text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {displayItems.length} sản phẩm
                    </span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2">
                    {displayItems.map((item, idx) => (
                      <div
                        key={item.variant_id ?? item.product_variant_id ?? idx}
                        className="flex gap-4 group"
                      >
                        <div className="relative w-16 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "/placeholder.png";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="text-sm font-bold text-gray-700 line-clamp-1">
                            {item.name}
                          </h4>
                          {item.variant_name && (
                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                              {item.variant_name}
                            </p>
                          )}
                          <div className="flex flex-nowrap gap-1 overflow-hidden">
                            {item.attributes?.map((attr, i) => (
                              <span
                                key={i}
                                className="text-[9px] text-gray-400 font-bold uppercase whitespace-nowrap"
                              >
                                {attr.attribute_value}
                                {i < item.attributes.length - 1 ? " • " : ""}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="mt-1 text-sm ">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                            <span className=" text-black text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-white">
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

                <section className="bg-white  p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center  mb-5">
                    <div className="p-2.5">
                      <Tag className="text-black" size={20} />
                    </div>
                    <h2 className="text-[0.9rem]  text-gray-900">
                      Mã giảm giá
                    </h2>
                  </div>

                  {activePromotion ? (
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-green-50 border border-green-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-green-500" size={20} />
                        <div>
                          <p className="font-black text-green-700 text-sm uppercase tracking-wider">
                            {activePromotion?.promotion?.code ||
                              activePromotion?.code ||
                              promotionCode}
                          </p>
                          <p className="text-xs text-green-600 font-medium">
                            Giảm {formatPrice(localDiscountAmount)} đã được áp
                            dụng
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearPromotion}
                        className="p-1.5 rounded-lg text-green-500 hover:bg-green-100 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
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
                        className="flex-1 px-2 py-2 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-black outline-none transition-all font-medium font-mono tracking-widest text-sm placeholder:tracking-normal placeholder:font-sans"
                        placeholder="Nhập mã giảm giá..."
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromotion}
                        disabled={isApplying || !promotionCode}
                        className="px-2 py-2 bg-black text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-gray-900 transition-all disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isApplying ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Áp dụng"
                        )}
                      </button>
                    </div>
                  )}
                </section>

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
                  className="w-full mt-3 py-3 border-2 border-dashed border-gray-200 rounded-xl text-[10px] text-gray-400 font-bold uppercase hover:border-blue-200 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                >
                  {isLoadingEligible ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Tag className="w-3 h-3" />
                  )}{" "}
                  DANH SÁCH MÃ GIẢM GIÁ
                </button>

                <div className="p-8 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">
                        Tạm tính
                      </span>
                      <span className="">{formatPrice(subtotal)}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-red-500  flex items-center gap-1">
                          <AlertCircle size={14} />
                          Giảm giá{" "}
                          {activePromotion?.promotion?.value == "percent" &&
                            `(${activePromotion.promotion.value}%)`}
                        </span>
                        <span className="text-red-500 ">
                          -{formatPrice(discount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">
                        Phí vận chuyển
                      </span>
                      <span className="">{formatPrice(shippingFee)}</span>
                    </div>

                    {selectedShipping && (
                      <div className="flex justify-between text-[10px] text-blue-600 font-medium italic pt-1">
                        <span className="flex items-center gap-1">
                          <Truck size={12} /> Dự kiến giao
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

                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-end mb-8">
                      <p className="text-[1rem] font-medium text-gray-400 ">
                        Tổng thanh toán
                      </p>
                      <p className="text-3xl  ">{formatPrice(total)}</p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-black text-white py-5 rounded-lg fonr-medium  text-sm uppercase hover:bg-gray-900 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-black/10"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          Xác nhận đặt hàng
                          <CheckCircle2 size={18} />
                        </>
                      )}
                    </button>

                    <p className="mt-4 text-[10px] text-gray-400 text-center  ">
                      Bằng việc nhấn vào nút trên, bạn đồng ý với{" "}
                      <span className="text-black underline cursor-pointer">
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
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleConfirmBankOrder}
        isSubmitting={isSubmitting}
        bankInfo={currentBankInfo}
      />
    </CustomerLayout>
  );
};

const BankPaymentModal = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  bankInfo,
}) => {
  if (!isOpen || !bankInfo) return null;

  const qrUrl = `https://img.vietqr.io/image/${bankInfo.bank_id}-${bankInfo.account_no}-compact2.png?amount=${bankInfo.amount}&addInfo=${bankInfo.order_code}&accountName=${encodeURIComponent(bankInfo.account_name)}`;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      <div className="relative bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-black p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <CreditCard className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight text-white">
                Thanh toán chuyển khoản
              </h3>
              <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">
                Xác nhận thanh toán đơn hàng
              </p>
            </div>
          </div>
          <button
            disabled={isSubmitting}
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 max-h-[600px] overflow-y-auto ">
          <div className="flex flex-col items-center">
            {/* QR Code Container */}
            <div className="relative w-full max-w-[240px] aspect-square bg-white rounded-3xl p-4 shadow-xl border border-gray-100 mb-8 group">
              <img
                src={qrUrl}
                className="w-full h-full object-contain"
                alt="Payment QR"
              />
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors cursor-pointer rounded-3xl"></div>
            </div>

            {/* Account Details */}
            <div className="w-full space-y-4 bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 text-left">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">Ngân hàng</span>
                <span className="font-bold text-gray-900 uppercase">
                  MB Bank
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">Số tài khoản</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900">{bankInfo.account_no}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bankInfo.account_no);
                      toast.success("Đã copy số tài khoản");
                    }}
                    className="p-1 hover:bg-gray-200 rounded text-gray-400 active:scale-90 transition-all"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">Chủ tài khoản</span>
                <span className="text-gray-800">{bankInfo.account_name}</span>
              </div>
              <div className="h-px bg-gray-100 w-full my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium text-sm">
                  Số tiền
                </span>
                <span className="text-xl text-gray-800">
                  {formatPrice(bankInfo.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">Nội dung</span>
                <div className="flex items-center gap-2">
                  <span className=" px-2 py-0.5 rounded-md  text-xs">
                    {bankInfo.order_code}
                  </span>
                </div>
              </div>
            </div>

            {/* Instruction */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-8">
              <div className="p-1 bg-blue-500 rounded-full">
                <CheckCircle2 className="text-white" size={12} />
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                Vui lòng quét mã QR hoặc nhập chính xác thông tin chuyển khoản.{" "}
                <br />
                Nhấn "Xác nhận đã chuyển" để hoàn tất việc đặt đơn hàng.
              </p>
            </div>

            {/* Footer Action */}
            <button
              disabled={isSubmitting}
              onClick={onConfirm}
              className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 hover:shadow-2xl hover:shadow-black/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Tôi đã chuyển khoản & Xác nhận đơn"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
