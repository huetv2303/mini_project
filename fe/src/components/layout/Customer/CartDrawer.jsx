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
  Info,
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
      requestAnimationFrame(() => setAnimating(true));
    } else {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  if (!visible) return null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity duration-300 ${
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

      <div
        className={`relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transition-transform duration-300 ${
          animating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-gray-900" />
            <h2 className="text-lg font-bold text-gray-900">
              Giỏ hàng của bạn
            </h2>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-bold">
              {cartItems.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                <ShoppingBag size={32} className="text-gray-300" />
              </div>
              <div>
                <p className="text-gray-900 font-bold">Giỏ hàng trống</p>
                <p className="text-gray-400 text-sm mt-1">
                  Hàng ngàn sản phẩm đang chờ bạn.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.variant_id} className="flex gap-4 group">
                <div className="w-20 aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                  <img
                    src={getImageUrl(item.image)}
                    className="w-full h-full object-cover"
                    alt={item.name}
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                      <Link to={`/products/${item.slug}`} onClick={onClose}>
                        {item.name}
                      </Link>
                    </h3>
                    <button
                      onClick={() => removeFromCart(item.variant_id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-1 flex flex-wrap gap-2">
                    {item.attributes?.map((attr, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded font-medium border border-gray-100"
                      >
                        {attr.attribute_value}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.variant_id, item.quantity - 1)
                        }
                        className="p-1 hover:text-black text-gray-400 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.variant_id, item.quantity + 1)
                        }
                        className="p-1 hover:text-black text-gray-400 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
            {/* Promotion Section */}
            <div className="space-y-3 pb-2">
              <div className="flex gap-2 h-12">
                <div className="relative flex-1 group">
                  <input
                    type="text"
                    value={promotionCode}
                    onChange={(e) =>
                      setPromotionCode(e.target.value.toUpperCase())
                    }
                    placeholder="Mã giảm giá..."
                    className="w-full h-full pl-4 pr-10 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-black transition-all"
                  />
                  {(promotionCode || appliedPromotion) && (
                    <button
                      onClick={() => clearPromotion()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Gỡ bỏ"
                    >
                      <X size={14} />
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
                  className="px-6 h-full bg-black text-white rounded-xl text-[0.7rem] font-bold  uppercase  hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 transition-all flex items-center justify-center min-w-[100px] shadow-sm shadow-black/5"
                >
                  {isApplying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Áp dụng"
                  )}
                </button>
              </div>
              {/* {appliedPromotion ? (
                <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex justify-between items-center animate-in slide-in-from-top-2">
                  <div>
                    <p className="text-[10px] text-green-600 font-black uppercase mb-0.5">
                      Mã đã áp dụng:
                    </p>
                    <h4 className="text-xs font-bold text-green-700 uppercase">
                      {appliedPromotion.promotion?.name}
                    </h4>
                  </div>
                  <button
                    onClick={() => clearPromotion()}
                    className="p-1.5 text-green-400 hover:text-green-600 hover:bg-green-100 rounded-lg transition-all"
                  >
                    <Plus className="rotate-45" size={16} />
                  </button>
                </div>
              ) : ( */}
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
                className="w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-[10px] text-gray-500 font-bold uppercase hover:border-black hover:text-black transition-all flex items-center justify-center gap-2"
              >
                {isLoadingEligible ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Tag className="w-3 h-3" />
                )}
                Xem mã giảm giá khả dụng
              </button>
              {/* )} */}
            </div>

            <hr className="border-gray-200" />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium text-[1rem]">
                  Tạm tính:
                </span>
                <span className="text-gray-900 text-[1rem]">
                  {formatPrice(totalAmount)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600 font-medium   text-[1rem] font-black">
                    Giảm giá:
                  </span>
                  <span className=" text-red-600 text-[1rem]">
                    -{formatPrice(discountAmount)}{" "}
                    {appliedPromotion?.promotion?.type === "percent"
                      ? `(${appliedPromotion?.promotion?.value}%)`
                      : ""}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <span className="text-gray-700  uppercase text-[1rem] font-bold ">
                  Tổng cộng:
                </span>
                <span className="text-2xl font-bold text-gray-700">
                  {formatPrice(finalAmount)}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
              Phí vận chuyển sẽ được tính khi thanh toán
            </p>
            <div className="flex gap-3">
              <Link
                to="/checkout"
                onClick={() => {
                  onClose();
                  clearBuyNowItem();
                }}
                className="flex-1 bg-black text-white text-center py-4 rounded-xl font-bold hover:shadow-lg transition-all active:scale-[0.98]"
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
