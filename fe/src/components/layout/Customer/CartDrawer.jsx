import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Tag,
  Loader2,
  Coins,
} from "lucide-react";
import { useCart } from "../../../context/CartContext";
import { useBuyNow } from "../../../context/BuyNowContext";
import { getImageUrl, formatPrice } from "../../../helper/helper";
import PromotionModal from "../../../pages/Admin/order/components/PromotionModal";

const CartDrawer = ({ isOpen, onClose }) => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    totalAmount,
    finalAmount,
    discountAmount,
    appliedPromotion,
    promotionCode,
    setPromotionCode,
    applyPromotion,
    fetchEligiblePromotions,
    clearPromotion,
    isApplying,
    isLoadingEligible,
    eligiblePromotions,
  } = useCart();
  const { clearBuyNowItem } = useBuyNow();
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      const rId = requestAnimationFrame(() => setAnimating(true));
      return () => cancelAnimationFrame(rId);
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Soft overlay */}
      <div
        className={`absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${
          animating ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <PromotionModal
        isOpen={isPromotionModalOpen}
        onClose={() => setIsPromotionModalOpen(false)}
        onSelect={(promo) => {
          setPromotionCode(promo.code);
          applyPromotion(
            promo.code,
            cartItems.map((item) => ({
              product_id: item.product_id,
              category_id: item.category_id,
              subtotal: item.price * item.quantity,
            })),
          );
          setIsPromotionModalOpen(false);
        }}
        promotions={eligiblePromotions}
      />

      {/* Slide-over panel */}
      <div
        className={`relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transition-transform duration-300 z-50 ${
          animating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-[1rem] font-medium text-slate-800 ">
                Giỏ hàng của bạn
              </h2>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Có{" "}
                <span className="text-sky-600 font-extrabold">
                  {cartItems.length}
                </span>{" "}
                sản phẩm
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag
                  size={36}
                  className="text-sky-400 animate-bounce"
                />
              </div>
              <h3 className="text-base font-medium text-slate-800 uppercase tracking-wide mb-2">
                Giỏ hàng đang trống
              </h3>
              <p className="text-xs text-slate-400 max-w-[240px] mx-auto font-medium mb-8">
                Có hàng ngàn sản phẩm tuyệt vời đang chờ bạn khám phá đấy nhé.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-sky-600 text-white rounded-lg text-xs font-black  hover:bg-sky-700 transition-all shadow-md shadow-sky-500/10 active:scale-95 hover:-translate-y-0.5"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.variant_id}
                className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className="w-20 aspect-[3/4] bg-slate-50 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={getImageUrl(item.image)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={item.name}
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-[13px] font-medium text-slate-800 line-clamp-1 group-hover:text-sky-600 transition-colors ">
                        <Link to={`/products/${item.slug}`} onClick={onClose}>
                          {item.name}
                        </Link>
                      </h3>
                      <button
                        onClick={() => removeFromCart(item.variant_id)}
                        className="text-slate-400 hover:text-rose-500 p-1 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.attributes?.map((attr, idx) => (
                        <span
                          key={idx}
                          className="text-[12px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-lg font-medium  border border-sky-100/50"
                        >
                          {attr.attribute_value}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {/* Quantity selectors */}
                    <div className="flex items-center gap-2.5 border border-slate-100 bg-slate-50 rounded-xl p-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.variant_id, item.quantity - 1)
                        }
                        className="w-6 h-6 hover:bg-white text-slate-500 hover:text-sky-600 rounded-lg flex items-center justify-center transition-colors active:scale-90"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-black text-slate-800 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.variant_id, item.quantity + 1)
                        }
                        className="w-6 h-6 hover:bg-white text-slate-500 hover:text-sky-600 rounded-lg flex items-center justify-center transition-colors active:scale-90"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <span className="text-[13px] font-black text-sky-700">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-slate-100 bg-[#f8fafc] rounded-bl-[32px] space-y-4 shadow-inner">
            {/* Promotion Section */}
            <div className="space-y-2">
              <div className="flex gap-2 h-11">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={promotionCode}
                    onChange={(e) =>
                      setPromotionCode(e.target.value.toUpperCase())
                    }
                    placeholder="MÃ GIẢM GIÁ..."
                    className="w-full h-full pl-4 pr-10 bg-white border border-slate-100 rounded-xl text-[13px] font-medium  outline-none focus:border-sky-500 transition-all placeholder:text-slate-300"
                  />
                  {(promotionCode || appliedPromotion) && (
                    <button
                      onClick={() => clearPromotion()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Gỡ bỏ"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() =>
                    applyPromotion(
                      promotionCode,
                      cartItems.map((item) => ({
                        product_id: item.product_id,
                        category_id: item.category_id,
                        subtotal: item.price * item.quantity,
                      })),
                    )
                  }
                  disabled={isApplying || !promotionCode}
                  className="px-5 h-full bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-[13px] font-medium  disabled:bg-slate-100 disabled:text-slate-400 transition-all flex items-center justify-center min-w-[90px] shadow-md shadow-sky-500/10 active:scale-95"
                >
                  {isApplying ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Áp dụng"
                  )}
                </button>
              </div>

              <button
                onClick={async () => {
                  const data = await fetchEligiblePromotions(
                    cartItems.map((item) => ({
                      product_id: item.product_id,
                      category_id: item.category_id,
                      subtotal: item.price * item.quantity,
                    })),
                  );
                  if (data) setIsPromotionModalOpen(true);
                }}
                className="w-full py-2.5 border border-dashed border-slate-200 bg-white rounded-xl text-[1rem] text-slate-500 font-medium  hover:border-sky-500 hover:text-sky-600 hover:bg-sky-50/50 transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
              >
                {isLoadingEligible ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Tag className="w-3 h-3 text-sky-500" />
                )}
                Xem mã giảm giá khả dụng
              </button>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Tạm tính:</span>
                <span className="text-slate-800">
                  {formatPrice(totalAmount)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs font-bold text-rose-500">
                  <span>Giảm giá:</span>
                  <span>
                    -{formatPrice(discountAmount)}{" "}
                    {appliedPromotion?.promotion?.type === "percent"
                      ? `(${appliedPromotion?.promotion?.value}%)`
                      : ""}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <span className="text-[1rem] font-medium text-slate-800 ">
                  Tổng cộng:
                </span>
                <span className="text-[1rem] font-bold text-sky-700">
                  {formatPrice(finalAmount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <p className="text-[13px] text-slate-400 text-center font-medium  flex items-center justify-center gap-1">
                <Coins size={11} className="text-sky-500" /> Phí ship tính lúc
                thanh toán
              </p>
              <Link
                to="/checkout"
                onClick={() => {
                  onClose();
                  clearBuyNowItem();
                }}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white text-center py-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-sky-500/20 hover:-translate-y-0.5 transition-all active:scale-95"
              >
                THANH TOÁN NGAY
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
