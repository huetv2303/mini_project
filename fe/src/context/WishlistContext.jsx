import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  getWishlistRequest,
  toggleWishlistRequest,
  clearWishlistRequest,
} from "../services/WishlistService";
import toast from "react-hot-toast";

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initial Load
  useEffect(() => {
    if (user) {
      loadWishlistFromServer();
    } else {
      const localWishlist = localStorage.getItem("wishlist");
      if (localWishlist) {
        setWishlistItems(JSON.parse(localWishlist));
      } else {
        setWishlistItems([]);
      }
    }
  }, [user]);

  const loadWishlistFromServer = async () => {
    setLoading(true);
    try {
      // Sync LocalStorage items if any
      const localWishlist = localStorage.getItem("wishlist");
      if (localWishlist) {
        const items = JSON.parse(localWishlist);
        if (items.length > 0) {
          for (const item of items) {
            await toggleWishlistRequest(item.id);
          }
          localStorage.removeItem("wishlist");
        }
      }

      const response = await getWishlistRequest();
      if (response.status === "success") {
        setWishlistItems(response.data);
      }
    } catch (error) {
      console.error("Failed to load wishlist", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (product) => {
    if (user) {
      try {
        const response = await toggleWishlistRequest(product.id || product);
        if (response.status === "success") {
          if (response.action === "added") {
            setWishlistItems([...wishlistItems, product]);
            toast.success("Đã thêm vào danh sách yêu thích");
          } else {
            setWishlistItems(
              wishlistItems.filter((p) => p.id !== (product.id || product)),
            );
            toast.success("Đã xóa khỏi danh sách yêu thích");
          }
        }
      } catch (error) {
        toast.error("Thao tác thất bại");
      }
    } else {
      const productId = product.id || product;
      const index = wishlistItems.findIndex((p) => p.id === productId);
      let newWishlist = [];
      if (index !== -1) {
        newWishlist = wishlistItems.filter((p) => p.id !== productId);
        toast.success("Đã xóa khỏi danh sách yêu thích!");
      } else {
        newWishlist = [...wishlistItems, product];
        toast.success("Đã thêm vào danh sách yêu thích!");
      }
      setWishlistItems(newWishlist);
      localStorage.setItem("wishlist", JSON.stringify(newWishlist));
    }
  };

  const clearWishlist = async () => {
    if (user) {
      await clearWishlistRequest();
    }
    setWishlistItems([]);
    localStorage.removeItem("wishlist");
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some((p) => p.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        toggleWishlist,
        clearWishlist,
        isInWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
