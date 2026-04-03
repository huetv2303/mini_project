import React, { createContext, useContext } from "react";

/**
 * BuyNowContext – lưu trữ sản phẩm "Mua ngay" qua sessionStorage
 * để truyền từ ProductDetail → Checkout mà không cần add vào giỏ hàng.
 *
 * Cấu trúc dữ liệu được lưu trong sessionStorage['buynow']:
 * {
 *   product_variant_id: number,
 *   quantity: number,
 *   name: string,          // tên sản phẩm (để hiện trên trang checkout)
 *   variant_name: string,  // tên biến thể (màu, size...)
 *   price: number,
 *   image: string | null,
 *   sku: string,
 * }
 */
const BuyNowContext = createContext();

export const useBuyNow = () => useContext(BuyNowContext);

export const BuyNowProvider = ({ children }) => {
  /** Lưu sản phẩm mua ngay vào sessionStorage rồi navigate đến /checkout */
  const setBuyNowItem = (item) => {
    sessionStorage.setItem("buynow", JSON.stringify(item));
  };

  /** Đọc sản phẩm mua ngay từ sessionStorage */
  const getBuyNowItem = () => {
    const raw = sessionStorage.getItem("buynow");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  /** Xoá sau khi đặt hàng thành công */
  const clearBuyNowItem = () => {
    sessionStorage.removeItem("buynow");
  };

  return (
    <BuyNowContext.Provider
      value={{ setBuyNowItem, getBuyNowItem, clearBuyNowItem }}
    >
      {children}
    </BuyNowContext.Provider>
  );
};
