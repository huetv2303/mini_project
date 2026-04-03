import api from "../api/axios";

/**
 * Gọi tới POST /api/v1/checkout
 * Hỗ trợ 2 mode:
 *   - mode: "cart"    → truyền items[]
 *   - mode: "buynow"  → truyền product_variant_id + quantity
 */
export const storefrontCheckoutRequest = async (payload) => {
  const response = await api.post("/checkout", payload);
  return response.data;
};
