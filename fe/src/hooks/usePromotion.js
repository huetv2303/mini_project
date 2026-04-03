import { useState, useCallback } from "react";
import PromotionService from "../services/PromotionService";
import { toast } from "react-hot-toast";

export const usePromotion = () => {
  const [promotionCode, setPromotionCode] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [eligiblePromotions, setEligiblePromotions] = useState([]);
  const [isApplying, setIsApplying] = useState(false);
  const [isLoadingEligible, setIsLoadingEligible] = useState(false);
  const [promotions, setPromotions] = useState([]);

  const fetchPromotions = useCallback(async (params = { is_active: true }) => {
    try {
      const res = await PromotionService.getAll(params);
      // Paginator structure is res.data.data.data
      const data = res.data?.data?.data || res.data?.data || res.data || [];
      setPromotions(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
      return [];
    }
  }, []);

  const applyPromotion = useCallback(
    async (code, cartItems, customerId = null, channel = "storefront") => {
      const targetCode = code || promotionCode;
      if (!targetCode) {
        toast.error("Vui lòng nhập mã giảm giá");
        return;
      }

      setIsApplying(true);
      try {
        const res = await PromotionService.apply({
          code: targetCode,
          cart_items: cartItems,
          customer_id: customerId,
          channel: channel,
        });

        const data = res.data.data || res.data;
        setAppliedPromotion(data);
        setDiscountAmount(data.discount_amount);
        setPromotionCode(targetCode);
        toast.success("Áp dụng mã thành công!");
        return data;
      } catch (error) {
        const message = error.response?.data?.message || "Mã không hợp lệ";
        toast.error(message);
        setAppliedPromotion(null);
        setDiscountAmount(0);
        throw error;
      } finally {
        setIsApplying(false);
      }
    },
    [promotionCode],
  );

  const fetchEligiblePromotions = useCallback(
    async (cartItems, customerId = null, channel = "storefront") => {
      if (!cartItems || cartItems.length === 0) return;

      setIsLoadingEligible(true);
      try {
        const res = await PromotionService.getEligible({
          cart_items: cartItems,
          customer_id: customerId,
          channel: channel,
        });
        const data = res.data.data || res.data;
        setEligiblePromotions(data);
        if (data.length === 0) {
          toast.error("Hiện không có mã giảm giá nào phù hợp cho sản phẩm này");
        }
        return data;
      } catch (error) {
        toast.error("Lỗi tải danh sách khuyến mãi");
        console.error(error);
      } finally {
        setIsLoadingEligible(false);
      }
    },
    [],
  );

  const clearPromotion = useCallback(() => {
    setAppliedPromotion(null);
    setDiscountAmount(0);
    setPromotionCode("");
  }, []);

  return {
    promotionCode,
    setPromotionCode,
    appliedPromotion,
    setAppliedPromotion,
    discountAmount,
    setDiscountAmount,
    eligiblePromotions,
    isApplying,
    isLoadingEligible,
    promotions,
    fetchPromotions,
    applyPromotion,
    fetchEligiblePromotions,
    clearPromotion,
  };
};
