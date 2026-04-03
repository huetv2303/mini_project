import React, { useState, useEffect } from "react";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  fetchProductRequest,
  fetchProductsRequest,
} from "../../services/ProductService";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useBuyNow } from "../../context/BuyNowContext";

import { getImageUrl, formatPrice } from "../../helper/helper";
import {
  ShoppingBag,
  Heart,
  Share2,
  Star,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  CheckCircle2,
  Info,
  ChevronUp,
  Tag,
  Loader2,
  ShoppingCartIcon,
  ShoppingCart,
} from "lucide-react";
import { usePromotion } from "../../hooks/usePromotion";
import PromotionModal from "../Admin/order/components/PromotionModal";

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { setBuyNowItem } = useBuyNow();

  const {
    applyPromotion,
    fetchEligiblePromotions,
    clearPromotion,
    promotionCode,
    setPromotionCode,
    appliedPromotion,
    discountAmount,
    eligiblePromotions,
    isApplying,
    isLoadingEligible,
  } = usePromotion();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [openSections, setOpenSections] = useState({
    details: false,
    sizeGuide: false,
  });

  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productRes = await fetchProductRequest(slug);
        if (productRes.status === "success") {
          setProduct(productRes.data);
          if (productRes.data.images && productRes.data.images.length > 0) {
            // Found images in resource
          }

          // Extract unique Colors and Sizes from variants
          const variants = productRes.data.variants || [];
          const colorsSet = new Set();
          const sizesSet = new Set();

          variants.forEach((v) => {
            console.log(`Variant ${v.sku} attributes:`, v.attributes);
            v.attributes?.forEach((attr) => {
              const name = attr.attribute_name?.toLowerCase() || "";
              if (
                name.includes("color") ||
                name.includes("màu") ||
                name.includes("mầu")
              ) {
                colorsSet.add(attr.attribute_value);
              }
              if (
                name.includes("size") ||
                name.includes("kích") ||
                name.includes("cỡ")
              ) {
                sizesSet.add(attr.attribute_value);
              }
            });
          });

          const colorsList = Array.from(colorsSet);
          const sizesList = Array.from(sizesSet);

          setAvailableColors(colorsList);
          setAvailableSizes(sizesList);

          // Default selections based on FIRST variant to ensure a valid combination
          if (variants.length > 0) {
            const firstVariant = variants[0];
            const vColor = firstVariant.attributes?.find((a) => {
              const n = a.attribute_name?.toLowerCase() || "";
              return (
                n.includes("color") || n.includes("màu") || n.includes("mầu")
              );
            })?.attribute_value;
            const vSize = firstVariant.attributes?.find((a) => {
              const n = a.attribute_name?.toLowerCase() || "";
              return (
                n.includes("size") || n.includes("kích") || n.includes("cỡ")
              );
            })?.attribute_value;

            if (vColor) setSelectedColor(vColor);
            else if (colorsList.length > 0) setSelectedColor(colorsList[0]);

            if (vSize) setSelectedSize(vSize);
            else if (sizesList.length > 0) setSelectedSize(sizesList[0]);
          }

          const relatedRes = await fetchProductsRequest({
            category: productRes.data.category?.slug,
            limit: 4,
          });
          if (relatedRes.status === "success") {
            setRelatedProducts(
              (relatedRes.data?.data || relatedRes.data || []).filter(
                (p) => p.id !== productRes.data.id,
              ),
            );
          }
        }
        console.log(productRes.data);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [slug]);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="pt-32 pb-24 flex items-center justify-center min-h-screen">
          <div className="animate-spin w-12 h-12 border-4 border-black border-t-transparent rounded-full"></div>
        </div>
      </CustomerLayout>
    );
  }

  if (!product) {
    return (
      <CustomerLayout>
        <div className="pt-32 pb-24 text-center min-h-screen">
          <h1 className="text-4xl font-black">Sản phẩm không tồn tại</h1>
          <Link
            to="/products"
            className="text-purple-600 font-bold hover:underline"
          >
            Về cửa hàng
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  // Get gallery images
  const images =
    product.images?.length > 0
      ? product.images.map((img) => img.url)
      : [
          getImageUrl(product.image),
          getImageUrl(product.image),
          getImageUrl(product.image),
        ];

  // Helper to check if a color+size combination exists in variants
  const isColorAvailable = (color, size) => {
    if (!product || !product.variants) return false;
    return product.variants.some((v) => {
      const cMatch = v.attributes?.some((a) => {
        const n = a.attribute_name?.toLowerCase() || "";
        return (
          (n.includes("color") || n.includes("màu") || n.includes("mầu")) &&
          a.attribute_value === color
        );
      });
      const sMatch = v.attributes?.some((a) => {
        const n = a.attribute_name?.toLowerCase() || "";
        return (
          (n.includes("size") || n.includes("kích") || n.includes("cỡ")) &&
          a.attribute_value === size
        );
      });
      return cMatch && sMatch;
    });
  };

  const activeVariant =
    product?.variants?.find((v) => {
      const colorMatch = v.attributes?.some((a) => {
        const attrName = a.attribute_name?.toLowerCase() || "";
        return (
          (attrName.includes("color") ||
            attrName.includes("màu") ||
            attrName.includes("mầu")) &&
          a.attribute_value === selectedColor
        );
      });
      const sizeMatch = v.attributes?.some((a) => {
        const attrName = a.attribute_name?.toLowerCase() || "";
        return (
          (attrName.includes("size") ||
            attrName.includes("kích") ||
            attrName.includes("cỡ")) &&
          a.attribute_value === selectedSize
        );
      });
      return colorMatch && sizeMatch;
    }) || product?.variants?.[0];

  // Smart Selection Handlers
  const handleColorChange = (color) => {
    setSelectedColor(color);
    // If current size is not available for this new color, find first available size
    if (!isColorAvailable(color, selectedSize)) {
      const firstValidSize = availableSizes.find((s) =>
        isColorAvailable(color, s),
      );
      if (firstValidSize) setSelectedSize(firstValidSize);
    }
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    // If current color is not available for this new size, find first available color
    if (!isColorAvailable(selectedColor, size)) {
      const firstValidColor = availableColors.find((c) =>
        isColorAvailable(c, size),
      );
      if (firstValidColor) setSelectedColor(firstValidColor);
    }
  };

  const calculateSubtotal = () => {
    if (!product) return null;

    const unitPrice = Number(activeVariant?.price || 0);
    // const comparePrice = Number(activeVariant?.compare_price || 0);
    const subtotal = unitPrice * quantity;
    const finalTotal = Math.max(0, subtotal - (discountAmount || 0));

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-2xl  text-red-500 tracking-tighter">
            {formatPrice(finalTotal)}
          </span>
          {discountAmount > 0 && unitPrice > 0 && (
            <span className="text-[1rem] text-gray-400 line-through decoration-gray-300">
              {formatPrice(unitPrice * quantity)}
            </span>
          )}
          {discountAmount > 0 && (
            <span className="px-3 py-1 bg-green-500 text-white text-[13px] rounded-lg  shadow-green-200">
              Tiết kiệm {formatPrice(discountAmount)}
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleAddToCart = () => {
    if (!activeVariant) return;
    addToCart(product, activeVariant, quantity);
    setIsCartOpen(true);
  };

  const handleBuyNow = () => {
    if (!activeVariant) {
      toast.error("Vui lòng chọn biến thể sản phẩm");
      return;
    }
    setBuyNowItem({
      product_id: product.id,
      category_id: product.category_id,
      product_variant_id: activeVariant.id,
      quantity,
      name: product.name,
      variant_name: activeVariant.name,
      price: activeVariant.price,
      image: activeVariant.image ?? product.feature_image,
      sku: activeVariant.sku,
      // Lưu lại mã đang áp dụng (nếu có)
      appliedPromotion: appliedPromotion,
      discountAmount: discountAmount,
    });
    navigate("/checkout");
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product);
  };

  return (
    <CustomerLayout>
      <div className="pt-24 pb-24 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Promotion Modal - To be implemented or used if shared */}

          <PromotionModal
            isOpen={isPromotionModalOpen}
            onClose={() => setIsPromotionModalOpen(false)}
            onSelect={(promo) => {
              setPromotionCode(promo.code);
              applyPromotion(
                promo.code,
                [
                  {
                    product_id: product.id,
                    category_id: product.category_id,
                    subtotal: Number(activeVariant?.price) * quantity,
                  },
                ],
                null,
                "storefront",
              );
              setIsPromotionModalOpen(false);
            }}
            promotions={eligiblePromotions}
          />

          {/* Breadcrumbs */}
          <div className="pt-4 md:pt-8 flex items-center gap-2 text-[0.8rem] md:text-[1rem] font-medium text-gray-400 uppercase mb-8 md:mb-12">
            <Link to="/" className="hover:text-black transition-colors">
              Trang chủ
            </Link>
            <ChevronRight size={12} />
            <Link to="/products" className="hover:text-black transition-colors">
              Sản phẩm
            </Link>
            <ChevronRight size={12} />
            <span className="text-black">{product.name}</span>
          </div>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
            {/* Left: Image Gallery */}
            <div className="flex flex-row gap-6 lg:w-3/5">
              {/* Vertical Thumbnails */}
              <div className="flex flex-col gap-4 w-20 hidden md:flex">
                {images.slice(0, 5).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`aspect-[3/4] border-2 overflow-hidden transition-all ${
                      activeImage === i
                        ? "border-black shadow-lg"
                        : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover"
                      alt="thumb"
                    />
                  </button>
                ))}
              </div>

              {/* Main Image */}
              <div className="flex-1 aspect-[3/4]  overflow-hidden bg-gray-50 border border-gray-100">
                <img
                  src={images[activeImage] || images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-500"
                />
              </div>
            </div>

            {/* Right: Product Details */}
            <div className="lg:w-2/5 space-y-8 lg:sticky lg:top-32 h-fit">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-snug">
                  {product.name}
                </h1>

                {/* Dynamic Variant Tracking */}
                {(() => {
                  return (
                    <>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="font-bold">
                          SKU:{" "}
                          <span className="text-gray-500 text-[1rem] uppercase">
                            {activeVariant?.sku || "N/A"}
                          </span>
                        </span>
                        <div className="flex items-center gap-1.5 border-l border-gray-200 pl-6">
                          <div className="flex gap-0.5 text-[1rem] text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                fill={i < 4 ? "currentColor" : "none"}
                                stroke="currentColor"
                              />
                            ))}
                          </div>
                          <span className="text-xs font-medium">(0)</span>
                          <span className="text-[1rem] text-gray-300 ml-2">
                            0 Đánh giá
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">{calculateSubtotal()}</div>
                    </>
                  );
                })()}
              </div>

              <div className="h-px bg-dashed border-t border-dashed border-gray-200 w-full my-8"></div>

              <div className="space-y-3">
                <div className="flex gap-2 relative">
                  <input
                    type="text"
                    value={promotionCode}
                    onChange={(e) =>
                      setPromotionCode(e.target.value.toUpperCase())
                    }
                    placeholder="Mã giảm giá..."
                    className="flex-1 p-3 bg-gray-50 rounded-xl text-xs font-bold uppercase mr-10 outline-none w-full"
                  />
                  <button
                    onClick={() =>
                      applyPromotion(promotionCode, [
                        {
                          product_id: product.id,
                          category_id: product.category_id,
                          subtotal: activeVariant?.price * quantity,
                        },
                      ])
                    }
                    disabled={isApplying}
                    className="p-3 right-0 h-full bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors absolute flex items-center justify-center min-w-[50px]"
                  >
                    {isApplying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "OK"
                    )}
                  </button>
                </div>
                <button
                  onClick={async () => {
                    const data = await fetchEligiblePromotions(
                      [
                        {
                          product_id: product.id,
                          category_id: product.category_id,
                          subtotal: Number(activeVariant?.price) * quantity,
                        },
                      ],
                      null,
                      "storefront",
                    );
                    if (data) setIsPromotionModalOpen(true);
                  }}
                  className="w-full py-5 border-2 border-dashed border-gray-200 rounded-xl text-[10px] text-gray-400 font-bold uppercase hover:border-blue-200 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                >
                  {isLoadingEligible ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Tag className="w-3 h-3" />
                  )}{" "}
                  DANH SÁCH MÃ GIẢM GIÁ
                </button>

                {appliedPromotion && (
                  <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex justify-between items-center animate-in slide-in-from-top-2">
                    <div>
                      <p className="text-[13px] text-green-600 font-black uppercase  mb-1 ">
                        Mã được áp dụng:
                      </p>
                      <h4 className="text-sm font-bold text-green-700 uppercase">
                        {appliedPromotion.promotion?.name}
                      </h4>
                      <p className="text-xs font-medium text-green-600">
                        Giảm: -{formatPrice(discountAmount)}
                      </p>
                    </div>
                    <button
                      onClick={() => clearPromotion()}
                      className="p-2 text-green-400 hover:text-green-600 hover:bg-green-100/50 rounded-lg transition-all"
                    >
                      <Plus className="rotate-45" size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Selection Options */}
              <div className="space-y-8 pt-4">
                {/* Color Selector */}
                <div className="space-y-4 flex items-center gap-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Màu sắc:
                  </h4>
                  <div className="flex items-center flex-wrap gap-4">
                    {availableColors.map((color, i) => {
                      const isAvailable = isColorAvailable(color, selectedSize);
                      return (
                        <button
                          key={i}
                          onClick={() => handleColorChange(color)}
                          className={`w-9 h-9 rounded-full p-0.5 transition-all ${
                            selectedColor === color
                              ? "bg-black text-white"
                              : "border-transparent"
                          } ${!isAvailable ? "opacity-20 grayscale" : ""}`}
                        >
                          <div
                            className={`w-full h-full rounded-full border border-gray-100 shadow-sm`}
                            style={{
                              backgroundColor: color.startsWith("#")
                                ? color
                                : "transparent",
                              border: !color.startsWith("#")
                                ? "1px solid #e5e7eb"
                                : "none",
                            }}
                            title={color}
                          >
                            {!color.startsWith("#") && (
                              <span className="text-[10px] truncate px-0.5">
                                {color}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {availableColors.length === 0 && (
                      <span className="text-xs text-gray-400">Mặc định</span>
                    )}
                  </div>
                </div>

                {/* Size Selector */}
                <div className="space-y-4 flex items-center gap-4">
                  <h4 className="text-sm font-medium text-gray-900">Size:</h4>
                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map((size) => {
                      const isAvailable = isColorAvailable(selectedColor, size);
                      return (
                        <button
                          key={size}
                          onClick={() => handleSizeChange(size)}
                          className={`min-w-12 h-10 px-3 border rounded-lg font-bold text-xs transition-all ${
                            selectedSize === size
                              ? "bg-black text-white border-black shadow-md"
                              : "bg-white text-gray-500 border-gray-200 hover:border-gray-900"
                          } ${!isAvailable ? "opacity-20 bg-gray-50 border-dashed" : ""}`}
                        >
                          {size}
                        </button>
                      );
                    })}
                    {availableSizes.length === 0 && (
                      <span className="text-xs text-gray-400">Mặc định</span>
                    )}
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-4 flex items-center gap-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Số lượng:
                  </h4>
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-6 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 h-12">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="text-gray-400 hover:text-black"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-bold text-sm w-4 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="text-gray-400 hover:text-black"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                  <button
                    onClick={handleToggleWishlist}
                    className={`hidden sm:flex w-16 h-16 items-center justify-center rounded-lg transition-colors ${
                      isInWishlist(product.id)
                        ? "bg-red-50 text-red-500 border border-red-100"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                    }`}
                  >
                    <Heart
                      size={24}
                      fill={isInWishlist(product.id) ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="hidden sm:flex w-16 h-16 border-2 border-black hover:bg-black hover:text-white items-center justify-center rounded-lg transition-colors"
                  >
                    <ShoppingCart />
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 p-5 h-10 md:h-16 bg-[#222] text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all rounded-lg shadow-xl shadow-black/10"
                  >
                    Mua ngay
                  </button>
                  {/* Mobile Heart Button */}
                  <button
                    onClick={handleToggleWishlist}
                    className={`sm:hidden h-14 flex items-center justify-center rounded-lg border transition-all ${
                      isInWishlist(product.id)
                        ? "bg-red-50 text-red-500 border-red-100"
                        : "bg-gray-50 text-gray-600 border-gray-100"
                    }`}
                  >
                    <Heart
                      size={20}
                      className="mr-2"
                      fill={isInWishlist(product.id) ? "currentColor" : "none"}
                    />
                    <span className="text-xs font-bold">
                      {isInWishlist(product.id) ? "Đã thích" : "Yêu thích"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-12 space-y-px border-t border-gray-100">
            <div className="border-b border-gray-100">
              <button
                onClick={() => toggleSection("details")}
                className="w-full py-6 flex items-center justify-between text-left group"
              >
                <span className="text-sm font-bold text-gray-900 group-hover:text-black transition-colors">
                  Thông tin chi tiết
                </span>
                {openSections.details ? (
                  <Plus size={18} className="rotate-45 transition-transform" />
                ) : (
                  <Plus size={18} />
                )}
              </button>
              {openSections.details && (
                <div className="pb-6 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    {product.description ||
                      "Chất liệu cao cấp, đường may tinh tế. Thiết kế tối giản phù hợp cho nhiều dịp khác nhau."}
                  </p>
                </div>
              )}
            </div>

            <div className="border-b border-gray-100">
              <button
                onClick={() => toggleSection("sizeGuide")}
                className="w-full py-6 flex items-center justify-between text-left group"
              >
                <span className="text-sm font-bold text-gray-900">
                  Bảng size
                </span>
                {openSections.sizeGuide ? (
                  <Plus size={18} className="rotate-45 transition-transform" />
                ) : (
                  <Plus size={18} />
                )}
              </button>
              {openSections.sizeGuide && (
                <div className="pb-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-medium">
                      Hướng dẫn chọn kích thước chuẩn xác nhất theo chiều cao và
                      cân nặng.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Review Summary */}
          <div className="mt-32 pt-16 border-t border-gray-100">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">
                Đánh giá sản phẩm
              </h3>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="none" stroke="currentColor" />
                  ))}
                </div>
                <p className="text-sm font-medium text-gray-400">0 đánh giá</p>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-40 space-y-12">
              <div className="flex items-end justify-between">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                  CÓ THỂ BẠN THÍCH
                </h2>
                <Link
                  to="/products"
                  className="text-xs font-bold border-b border-black pb-1 hover:text-gray-500 hover:border-gray-500 transition-all"
                >
                  XEM TẤT CẢ
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedProducts.map((prod) => (
                  <div key={prod.id} className="group flex flex-col pt-4">
                    <Link
                      to={`/products/${prod.slug}`}
                      className="relative aspect-[3/4] mb-6 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 transition-all group-hover:shadow-xl group-hover:shadow-black/5"
                    >
                      <img
                        src={getImageUrl(prod.image)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        alt={prod.name}
                      />
                    </Link>
                    <div className="space-y-1">
                      <h4 className=" text-[1.2rem] text-gray-700 hover:text-black transition-colors">
                        <Link to={`/products/${prod.slug}`}>{prod.name}</Link>
                      </h4>
                      <p className="text-lg  text-gray-700">
                        {formatPrice(prod.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default ProductDetail;
