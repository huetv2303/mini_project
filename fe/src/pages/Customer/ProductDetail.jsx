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
  ShoppingCart,
  Home,
} from "lucide-react";
import { usePromotion } from "../../hooks/usePromotion";
import PromotionModal from "../Admin/order/components/PromotionModal";
import ReviewSection from "../../components/review/ReviewSection";
import StarRating from "../../components/review/StarRating";

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
            limit: 5,
          });
          if (relatedRes.status === "success") {
            setRelatedProducts(
              (relatedRes.data?.data || relatedRes.data || []).filter(
                (p) => p.id !== productRes.data.id,
              ),
            );
          }
        }
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
          <div className="animate-spin w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full"></div>
        </div>
      </CustomerLayout>
    );
  }

  if (!product) {
    return (
      <CustomerLayout>
        <div className="pt-32 pb-24 text-center min-h-screen">
          <h1 className="text-3xl font-black text-slate-800 uppercase mb-4">
            Sản phẩm không tồn tại
          </h1>
          <Link
            to="/products"
            className="text-sky-600 font-bold hover:underline"
          >
            Về cửa hàng
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  // Helper to check if a color+size combination exists in variants
  const isColorAvailable = (color, size) => {
    if (!product || !product.variants) return false;

    const hasColorAttrs = availableColors.length > 0;
    const hasSizeAttrs = availableSizes.length > 0;

    return product.variants.some((v) => {
      // If product has color options, match the color. Otherwise, assume match.
      const cMatch =
        !hasColorAttrs ||
        v.attributes?.some((a) => {
          const n = a.attribute_name?.toLowerCase() || "";
          return (
            (n.includes("color") || n.includes("màu") || n.includes("mầu")) &&
            a.attribute_value === color
          );
        });

      // If product has size options, match the size. Otherwise, assume match.
      const sMatch =
        !hasSizeAttrs ||
        v.attributes?.some((a) => {
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
      const hasColorAttrs = availableColors.length > 0;
      const hasSizeAttrs = availableSizes.length > 0;

      const colorMatch =
        !hasColorAttrs ||
        v.attributes?.some((a) => {
          const attrName = a.attribute_name?.toLowerCase() || "";
          return (
            (attrName.includes("color") ||
              attrName.includes("màu") ||
              attrName.includes("mầu")) &&
            a.attribute_value === selectedColor
          );
        });
      const sizeMatch =
        !hasSizeAttrs ||
        v.attributes?.some((a) => {
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

  const isOutOfStock =
    !activeVariant ||
    !activeVariant.inventory ||
    activeVariant.inventory.available <= 0;

  // Get gallery images
  const fallbackImage =
    "https://placehold.co/600x600/e2e8f0/475569?text=No+Image";

  const variantImage = activeVariant?.image
    ? getImageUrl(activeVariant.image)
    : null;
  const images = [];

  if (variantImage) {
    images.push(variantImage);
  }

  if (product.images && product.images.length > 0) {
    product.images.forEach((img) => {
      const imgUrl = getImageUrl(img.url);
      if (imgUrl !== variantImage) {
        images.push(imgUrl);
      }
    });
  } else if (product.image) {
    const mainImg = getImageUrl(product.image);
    if (mainImg !== variantImage) {
      images.push(mainImg);
    }
  }

  if (images.length === 0) {
    images.push(fallbackImage);
  }

  // Smart Selection Handlers
  const handleColorChange = (color) => {
    setSelectedColor(color);
    setActiveImage(0); // Reset main image viewer to show the selected variant image
    if (!isColorAvailable(color, selectedSize)) {
      const firstValidSize = availableSizes.find((s) =>
        isColorAvailable(color, s),
      );
      if (firstValidSize) setSelectedSize(firstValidSize);
    }
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    setActiveImage(0); // Reset main image viewer to show the selected variant image
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
    const subtotal = unitPrice * quantity;
    const finalTotal = Math.max(0, subtotal - (discountAmount || 0));

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3.5 flex-wrap bg-sky-50/40 border border-sky-100/30 px-4 py-3 rounded-xl ">
          <span className="text-xl font-semibold text-sky-700">
            {formatPrice(finalTotal)}
          </span>
          {discountAmount > 0 && unitPrice > 0 && (
            <span className="text-xs text-slate-400 line-through font-bold">
              {formatPrice(unitPrice * quantity)}
            </span>
          )}
          {discountAmount > 0 && (
            <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-md shadow-emerald-500/10">
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
      is_taxable: product.is_taxable || false,
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
      <div className="pt-32 pb-24 bg-[#f8fafc] min-h-screen text-left">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
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
          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-600  mb-6 bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm w-fit">
            <Link
              to="/"
              className="hover:text-sky-600 transition-colors flex items-center gap-1"
            >
              <Home size={13} className="text-slate-400" />
              Trang chủ
            </Link>
            <ChevronRight size={12} className="text-slate-300" />
            <Link
              to="/products"
              className="hover:text-sky-600 transition-colors"
            >
              Sản phẩm
            </Link>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-800 line-clamp-1 max-w-[200px]">
              {product.name}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start justify-center">
            {/* Left: Image Gallery */}
            <div className="flex flex-row gap-6 lg:w-[40%] w-full flex-shrink-0">
              {/* Vertical Thumbnails */}
              {images.length > 1 && (
                <div className="flex flex-col gap-4 w-20 hidden md:flex flex-shrink-0">
                  {images.slice(0, 5).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`aspect-[3/4] border overflow-hidden transition-all duration-300 rounded-xl ${
                        activeImage === i
                          ? "border-sky-600 shadow-md shadow-sky-500/10 scale-105"
                          : "border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-300"
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
              )}

              {/* Main Image */}
              <div className="flex-1 max-w-[360px] aspect-square overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm mx-auto lg:mx-0">
                <img
                  src={images[activeImage] || images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-500"
                />
              </div>
            </div>

            {/* Right: Product Details */}
            <div className="lg:w-[40%] w-full space-y-5 lg:sticky lg:top-32 h-fit bg-white border border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm">
              <div className="space-y-4">
                <h1 className="text-xl font-semibold text-slate-800 tracking-tight leading-snug">
                  {product.name}
                </h1>

                {/* Dynamic Variant Tracking */}
                {(() => {
                  return (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-slate-500 text-xs font-bold bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                          SKU: {activeVariant?.sku || "N/A"}
                        </span>

                        {/* Dynamic Stock Indicator Badge */}
                        {isOutOfStock ? (
                          <span className="text-rose-600 text-xs font-extrabold bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg uppercase tracking-wider animate-pulse">
                            Hết hàng
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-[14px] font-medium bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                            Còn lại: {activeVariant.inventory.available} sản
                            phẩm
                          </span>
                        )}

                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl w-fit">
                          <StarRating
                            rating={product.average_rating}
                            size={13}
                          />
                          <span className="text-xs font-black text-slate-700">
                            {Number(product.average_rating || 0).toFixed(1)}
                          </span>
                          <span className="text-[14px] text-slate-400 font-medium ">
                            ({product.review_count || 0} Đánh giá)
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">{calculateSubtotal()}</div>
                    </div>
                  );
                })()}
              </div>

              <div className="h-px bg-dashed border-t border-dashed border-slate-200 w-full my-8"></div>

              {/* Voucher Promotion Input */}
              <div className="space-y-2">
                <div className="flex gap-2 relative bg-slate-50 border border-slate-100 p-2 rounded-xl">
                  <input
                    type="text"
                    value={promotionCode}
                    onChange={(e) =>
                      setPromotionCode(e.target.value.toUpperCase())
                    }
                    placeholder="Mã giảm giá..."
                    className="flex-1 px-4 py-2.5 bg-transparent text-xs font-medium uppercase outline-none"
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
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium tracking-wider shadow-md shadow-sky-500/10 transition-all disabled:opacity-50"
                  >
                    {isApplying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Áp dụng"
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
                  className="w-full py-2.5 border border-dashed border-sky-200 bg-sky-50/20 text-sky-600 hover:bg-sky-50 hover:border-sky-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {isLoadingEligible ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Tag className="w-3.5 h-3.5" />
                  )}{" "}
                  DANH SÁCH MÃ GIẢM GIÁ
                </button>

                {appliedPromotion && (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex justify-between items-center animate-in slide-in-from-top-2">
                    <div>
                      <p className="text-[10px] text-emerald-600 font-black uppercase mb-1 tracking-wider">
                        Mã được áp dụng:
                      </p>
                      <h4 className="text-xs font-black text-emerald-700 uppercase">
                        {appliedPromotion.promotion?.name}
                      </h4>
                      <p className="text-[11px] font-bold text-emerald-600">
                        Giảm: -{formatPrice(discountAmount)}
                      </p>
                    </div>
                    <button
                      onClick={() => clearPromotion()}
                      className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100/50 rounded-xl transition-all"
                    >
                      <Plus className="rotate-45" size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Selection Options */}
              <div className="space-y-4 pt-1">
                {/* Color Selector */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-700">
                    Màu sắc:
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {availableColors.map((color, i) => {
                      const isAvailable = isColorAvailable(color, selectedSize);
                      return (
                        <button
                          key={i}
                          onClick={() => handleColorChange(color)}
                          className={`min-w-[44px] h-10 px-3.5 border rounded-xl font-medium text-xs transition-all duration-300 ${
                            selectedColor === color
                              ? "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/10 hover:bg-sky-700 hover:border-sky-700"
                              : "bg-white text-slate-600 border-slate-200 hover:border-sky-600 hover:text-sky-600"
                          } ${!isAvailable ? "opacity-25 bg-slate-50 border-dashed cursor-not-allowed" : ""}`}
                        >
                          {color}
                        </button>
                      );
                    })}
                    {availableColors.length === 0 && (
                      <span className="text-xs text-slate-400 font-medium">
                        Mặc định
                      </span>
                    )}
                  </div>
                </div>

                {/* Size Selector */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-700">
                    Kích thước:
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {availableSizes.map((size) => {
                      const isAvailable = isColorAvailable(selectedColor, size);
                      return (
                        <button
                          key={size}
                          onClick={() => handleSizeChange(size)}
                          className={`min-w-[44px] h-10 px-3.5 border rounded-xl font-medium text-xs transition-all duration-300 ${
                            selectedSize === size
                              ? "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/10 hover:bg-sky-700 hover:border-sky-700"
                              : "bg-white text-slate-600 border-slate-200 hover:border-sky-600 hover:text-sky-600"
                          } ${!isAvailable ? "opacity-25 bg-slate-50 border-dashed cursor-not-allowed" : ""}`}
                        >
                          {size}
                        </button>
                      );
                    })}
                    {availableSizes.length === 0 && (
                      <span className="text-xs text-slate-400 font-bold">
                        Mặc định
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-2 flex items-center gap-2 ">
                  <h4 className="text-sm font-semibold text-slate-700">
                    Số lượng:
                  </h4>
                  <div className="flex items-center gap-4 px-3 bg-slate-50 rounded-xl border border-slate-100 h-10 w-fit">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="text-slate-400 hover:text-slate-800 transition-colors"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="font-black text-sm w-4 text-center text-slate-800">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="text-slate-400 hover:text-slate-800 transition-colors"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <button
                    onClick={handleToggleWishlist}
                    className={`hidden sm:flex w-10 h-10 items-center justify-center rounded-xl transition-all duration-300 shadow-sm ${
                      isInWishlist(product.id)
                        ? "bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100"
                        : "bg-white text-slate-400 border border-slate-200 hover:border-rose-500 hover:text-rose-500"
                    }`}
                  >
                    <Heart
                      size={16}
                      fill={isInWishlist(product.id) ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`hidden sm:flex w-10 h-10 border items-center justify-center rounded-xl transition-all duration-300 shadow-sm ${
                      isOutOfStock
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : "border-slate-200 bg-white hover:border-sky-600 hover:text-sky-600 text-slate-500"
                    }`}
                  >
                    <ShoppingCart size={16} />
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className={`flex-1 h-10 text-white text-xs font-bold uppercase tracking-wider transition-all rounded-xl shadow-md ${
                      isOutOfStock
                        ? "bg-slate-400 cursor-not-allowed shadow-none"
                        : "bg-sky-600 hover:bg-sky-700 hover:-translate-y-0.5 shadow-sky-500/10"
                    }`}
                  >
                    {isOutOfStock ? "Hết hàng" : "Mua ngay"}
                  </button>
                  {/* Mobile Heart & Cart Button */}
                  <div className="sm:hidden grid grid-cols-2 gap-4">
                    <button
                      onClick={handleToggleWishlist}
                      className={`h-14 flex items-center justify-center rounded-xl border transition-all ${
                        isInWishlist(product.id)
                          ? "bg-rose-50 text-rose-500 border-rose-100"
                          : "bg-white text-slate-500 border-slate-200"
                      }`}
                    >
                      <Heart
                        size={18}
                        className="mr-2"
                        fill={
                          isInWishlist(product.id) ? "currentColor" : "none"
                        }
                      />
                      <span className="text-xs font-bold">
                        {isInWishlist(product.id) ? "Đã thích" : "Yêu thích"}
                      </span>
                    </button>
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className={`h-14 flex items-center justify-center rounded-xl border transition-all ${
                        isOutOfStock
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      <ShoppingCart size={18} className="mr-2" />
                      <span className="text-xs font-bold">
                        {isOutOfStock ? "Hết hàng" : "Thêm giỏ hàng"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 space-y-4 border-t border-slate-100">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6">
              <button
                onClick={() => toggleSection("details")}
                className="w-full py-5 flex items-center justify-between text-left group"
              >
                <span className="text-[14px] font-medium text-slate-800 group-hover:text-sky-600 transition-colors uppercase tracking-wider text-xs">
                  Thông tin chi tiết
                </span>
                {openSections.details ? (
                  <Minus
                    size={16}
                    className="text-slate-400 group-hover:text-sky-600"
                  />
                ) : (
                  <Plus
                    size={16}
                    className="text-slate-400 group-hover:text-sky-600"
                  />
                )}
              </button>
              {openSections.details && (
                <div className="pb-6 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {product.description ||
                      "Chất liệu cao cấp, đường may tinh tế. Thiết kế tối giản phù hợp cho nhiều dịp khác nhau."}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6">
              <button
                onClick={() => toggleSection("sizeGuide")}
                className="w-full py-5 flex items-center justify-between text-left group"
              >
                <span className="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors uppercase tracking-wider text-xs">
                  Bảng size
                </span>
                {openSections.sizeGuide ? (
                  <Minus
                    size={16}
                    className="text-slate-400 group-hover:text-sky-600"
                  />
                ) : (
                  <Plus
                    size={16}
                    className="text-slate-400 group-hover:text-sky-600"
                  />
                )}
              </button>
              {openSections.sizeGuide && (
                <div className="pb-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 font-medium">
                      Hướng dẫn chọn kích thước chuẩn xác nhất theo chiều cao và
                      cân nặng.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <ReviewSection productId={product.id} />

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-40 space-y-12">
              <div className="flex items-end justify-between border-b border-slate-100 pb-5">
                <h2 className="text-xl font-medium text-slate-800 uppercase tracking-wider">
                  Có thể bạn thích
                </h2>
                <Link
                  to="/products"
                  className="text-[14px] font-medium text-sky-600 hover:text-sky-700 transition-colors   border-b border-sky-600 pb-1"
                >
                  Xem tất cả
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {relatedProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="group bg-white rounded-3xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-slate-200/60 transition-all duration-300 flex flex-col justify-between"
                  >
                    <Link
                      to={`/products/${prod.slug}`}
                      className="relative h-64 mb-4 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center flex-shrink-0"
                    >
                      <img
                        src={
                          prod.image ? getImageUrl(prod.image) : fallbackImage
                        }
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        alt={prod.name}
                      />
                    </Link>
                    <div className="flex flex-col justify-between">
                      <div className="space-y-1 text-left">
                        <h3 className="text-[1rem] font-medium text-slate-800 line-clamp-1">
                          <Link to={`/products/${prod.slug}`}>{prod.name}</Link>
                        </h3>
                      </div>
                      <div className="pt-2 flex items-center justify-between border-t border-slate-50 mt-2">
                        <p className="text-[14px] font-medium text-sky-700">
                          {formatPrice(prod.price)}
                        </p>
                        <div>
                          {prod.review_count > 0 ? (
                            <div className="flex items-center gap-1">
                              <StarRating
                                rating={prod.average_rating}
                                size={12}
                              />
                              <span className="text-[14px] font-medium text-slate-400">
                                ({Number(prod.average_rating || 0).toFixed(1)})
                              </span>
                            </div>
                          ) : (
                            <span className="text-[14px] font-medium text-slate-700">
                              Chưa có đánh giá
                            </span>
                          )}
                        </div>
                      </div>
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
