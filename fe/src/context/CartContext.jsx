import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  getCartRequest,
  addToCartRequest,
  updateCartQuantityRequest,
  removeFromCartRequest,
  clearCartRequest,
  syncCartRequest,
} from "../services/CartService";
import toast from "react-hot-toast";
import { usePromotion } from "../hooks/usePromotion";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Promotion local hook to provide global state
  const promotion = usePromotion();

  // Initial Load
  useEffect(() => {
    if (user) {
      loadCartFromServer();
    } else {
      const localCart = localStorage.getItem("cart");
      if (localCart) {
        setCartItems(JSON.parse(localCart));
      } else {
        setCartItems([]);
      }
    }
  }, [user]);

  const loadCartFromServer = async () => {
    setLoading(true);
    try {
      // Sync LocalStorage items if any
      const localCart = localStorage.getItem("cart");
      if (localCart) {
        const items = JSON.parse(localCart);
        if (items.length > 0) {
          await syncCartRequest(
            items.map((item) => ({
              variant_id: item.variant_id,
              quantity: item.quantity,
            })),
          );
          localStorage.removeItem("cart");
        }
      }

      const response = await getCartRequest();
      if (response.status === "success") {
        setCartItems(response.data);
      }
    } catch (error) {
      console.error("Failed to load cart", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product, variant, quantity) => {
    if (user) {
      try {
        const response = await addToCartRequest(variant.id, quantity);
        if (response.status === "success") {
          toast.success("Đã thêm vào giỏ hàng");
          await loadCartFromServer();
        }
      } catch (error) {
        toast.error("Không thể thêm vào giỏ hàng");
      }
    } else {
      // Handle Guest with LocalStorage
      const newItems = [...cartItems];
      const existing = newItems.find((p) => p.variant_id === variant.id);

      if (existing) {
        existing.quantity += quantity;
      } else {
        newItems.push({
          variant_id: variant.id,
          product_id: product.id,
          category_id: product.category_id,
          name: product.name,
          price: variant.price,
          quantity: quantity,
          image: variant.image || product.image,
          sku: variant.sku,
          attributes: variant.attributes,
          slug: product.slug,
        });
      }
      setCartItems(newItems);
      localStorage.setItem("cart", JSON.stringify(newItems));
      toast.success("Đã thêm vào giỏ hàng!");
    }
  };

  const removeFromCart = async (variantId) => {
    if (user) {
      try {
        await removeFromCartRequest(variantId);
        setCartItems(cartItems.filter((item) => item.variant_id !== variantId));
        toast.success("Đã xóa khỏi giỏ hàng");
      } catch (error) {
        toast.error("Không thể xóa sản phẩm");
      }
    } else {
      const newItems = cartItems.filter(
        (item) => item.variant_id !== variantId,
      );
      setCartItems(newItems);
      localStorage.setItem("cart", JSON.stringify(newItems));
      toast.success("Đã xóa khỏi giỏ hàng");
    }
  };

  const updateQuantity = async (variantId, newQuantity) => {
    if (newQuantity < 1) return;

    if (user) {
      try {
        await updateCartQuantityRequest(variantId, newQuantity);
        setCartItems(
          cartItems.map((item) =>
            item.variant_id === variantId
              ? { ...item, quantity: newQuantity }
              : item,
          ),
        );
      } catch (error) {
        toast.error("Không thể cập nhật số lượng");
      }
    } else {
      const newItems = cartItems.map((item) =>
        item.variant_id === variantId
          ? { ...item, quantity: newQuantity }
          : item,
      );
      setCartItems(newItems);
      localStorage.setItem("cart", JSON.stringify(newItems));
    }
  };

  const clearCart = async () => {
    if (user) {
      await clearCartRequest();
    }
    setCartItems([]);
    localStorage.removeItem("cart");
  };

  const totalAmount = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount,
        finalAmount: Math.max(0, totalAmount - promotion.discountAmount),
        loading,
        isCartOpen,
        setIsCartOpen,
        // Spread all promotion hook values
        ...promotion
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
