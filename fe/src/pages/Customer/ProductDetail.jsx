import React, { useState, useEffect } from "react";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import { useParams, Link } from "react-router-dom";
import {
  fetchProductRequest,
  fetchProductsRequest,
} from "../../services/ProductService";
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
} from "lucide-react";

const ProductDetail = () => {
  const { slug } = useParams();
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

  return (
    <CustomerLayout>
      <div className="pt-24 pb-24 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Breadcrumbs */}
          <div className="mt-[50px] flex items-center gap-2 text-[1rem] font-medium text-gray-400 uppercase  mb-12">
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
          <div className="flex flex-col lg:flex-row gap-16 max-h-[700px]">
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
            <div className="lg:w-2/5 space-y-8">
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

                      <div className="pt-2">
                        <span className="text-3xl text-red-500">
                          {formatPrice(activeVariant?.price || product.price)}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="h-px bg-dashed border-t border-dashed border-gray-200 w-full my-8"></div>

              {/* Installment Banner */}
              <div className="space-y-4">
                <p className="text-sm font-medium">
                  Trả sau đến 12 tháng với{" "}
                  <span className="text-[#3edcdc] font-black italic">f</span>
                  <span className="text-blue-600 font-bold">undiin</span>{" "}
                  <Info size={14} className="inline ml-1 text-gray-400" />
                </p>
                <div className="bg-gradient-to-r from-[#00d8cc] to-[#7b5ef0] rounded-xl p-4 flex items-center justify-between group cursor-pointer shadow-lg shadow-blue-500/10 hover:brightness-110 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <CheckCircle2 className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">
                        Giảm đến{" "}
                        <span className="underline underline-offset-4">
                          50K
                        </span>{" "}
                        khi thanh toán qua Fundiin.
                      </p>
                      <button className="text-white/80 text-[10px] uppercase font-bold tracking-widest mt-0.5 hover:text-white transition-colors italic">
                        xem thêm
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selection Options */}
              <div className="space-y-8 pt-4">
                {/* Color Selector */}
                <div className="space-y-4 flex items-center gap-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Màu sắc:
                  </h4>
                  <div className="flex items-center gap-4">
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
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                  <button className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-gray-600">
                    <Heart size={24} />
                  </button>
                  <button className="flex-1 h-16 border-2 border-black text-black text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all rounded-lg">
                    Thêm vào giỏ hàng
                  </button>
                  <button className="flex-1 h-16 bg-[#222] text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all rounded-lg shadow-xl shadow-black/10">
                    Mua ngay
                  </button>
                </div>
              </div>

              {/* Accordion Sections */}
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
                      <Plus
                        size={18}
                        className="rotate-45 transition-transform"
                      />
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
                      <Plus
                        size={18}
                        className="rotate-45 transition-transform"
                      />
                    ) : (
                      <Plus size={18} />
                    )}
                  </button>
                  {openSections.sizeGuide && (
                    <div className="pb-6 animate-in slide-in-from-top-2 duration-300">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 font-medium">
                          Hướng dẫn chọn kích thước chuẩn xác nhất theo chiều
                          cao và cân nặng.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
                      <h4 className="font-bold text-sm text-gray-900 hover:text-black transition-colors">
                        <Link to={`/products/${prod.slug}`}>{prod.name}</Link>
                      </h4>
                      <p className="text-lg font-black text-gray-900">
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
