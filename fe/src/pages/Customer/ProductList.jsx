import React, { useState, useEffect } from "react";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import { Link, useSearchParams } from "react-router-dom";
import { fetchProductsRequest } from "../../services/ProductService";
import { fetchCategoriesRequest } from "../../services/CategoryService";
import { getImageUrl, formatPrice } from "../../helper/helper";
import {
  Filter,
  Grid,
  List as ListIcon,
  ChevronRight,
  ChevronLeft,
  Heart,
  Home,
  Coins,
  Search,
} from "lucide-react";
import StarRating from "../../components/review/StarRating";
import { useWishlist } from "../../context/WishlistContext";

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");
  const initialSearch = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("latest");
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 12,
  });

  // Advanced search & filter states
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [categorySlug]);

  // Synchronize input query with URL search param
  const searchQueryParam = searchParams.get("search") || "";
  useEffect(() => {
    setSearchQuery(searchQueryParam);
  }, [searchQueryParam]);

  // Price range and rating filters
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(2000000);
  const [ratingFilter, setRatingFilter] = useState("");

  const priceRanges = [
    { label: "Dưới 200.000đ", min: 0, max: 200000 },
    { label: "200.000đ - 500.000đ", min: 200000, max: 500000 },
    { label: "500.000đ - 1.000.000đ", min: 500000, max: 1000000 },
    { label: "Trên 1.000.000đ", min: 1000000, max: 99999999 },
  ];

  const availableSizes = [
    { label: "S", value: "S" },
    { label: "M", value: "M" },
    { label: "L", value: "L" },
    { label: "XL", value: "XL" },
    { label: "XXL", value: "XXL" },
  ];

  const pantSizes = [
    { label: "29", value: "29" },
    { label: "30", value: "30" },
    { label: "31", value: "31" },
    { label: "32", value: "32" },
    { label: "33", value: "33" },
  ];

  const availableColors = [
    { name: "Đen", hex: "#000000", border: false },
    { name: "Trắng", hex: "#ffffff", border: true },
    { name: "Xám", hex: "#8e8e93", border: false },
    { name: "Be", hex: "#f5f5dc", border: true },
    { name: "Hồng", hex: "#ffc0cb", border: false },
    { name: "Đỏ", hex: "#e60000", border: false, value: "Đỏ Rượu" },
    { name: "Xanh Navy", hex: "#000080", border: false },
    { name: "Nâu", hex: "#8b4513", border: false },
    { name: "Vàng", hex: "#ffeb3b", border: false, value: "Vàng Nhạt" },
    { name: "Xanh Dương", hex: "#2196f3", border: false },
  ];

  const transitionStyle = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
  `;

  const sliderStyle = `
    .price-slider-container {
      position: relative;
      width: 100%;
      height: 24px;
      display: flex;
      align-items: center;
    }
    .price-slider-container input[type="range"] {
      position: absolute;
      width: 100%;
      height: 100%;
      background: transparent !important;
      pointer-events: none;
      -webkit-appearance: none;
      appearance: none;
      margin: 0;
      padding: 0;
      z-index: 30;
      outline: none;
      border: none;
    }
    /* Webkit (Chrome, Safari, Edge) */
    .price-slider-container input[type="range"]::-webkit-slider-runnable-track {
      background: transparent !important;
      border: none;
      -webkit-appearance: none;
      height: 100%;
    }
    .price-slider-container input[type="range"]::-webkit-slider-thumb {
      pointer-events: auto;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #0284c7;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -2px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      -webkit-appearance: none;
      margin-top: 2px; /* Perfect vertical alignment */
      transition: transform 0.15s ease, background-color 0.15s ease;
    }
    .price-slider-container input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.2);
      background: #0369a1;
    }
    .price-slider-container input[type="range"]::-webkit-slider-thumb:active {
      transform: scale(0.95);
    }
    /* Firefox */
    .price-slider-container input[type="range"]::-moz-range-track {
      background: transparent !important;
      border: none;
      height: 100%;
    }
    .price-slider-container input[type="range"]::-moz-range-thumb {
      pointer-events: auto;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #0284c7;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -2px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition: transform 0.15s ease, background-color 0.15s ease;
    }
    .price-slider-container input[type="range"]::-moz-range-thumb:hover {
      transform: scale(1.2);
      background: #0369a1;
    }
    .price-slider-container input[type="range"]::-moz-range-thumb:active {
      transform: scale(0.95);
    }
  `;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load categories for sidebar
        const catRes = await fetchCategoriesRequest();
        if (catRes.status === "success") {
          setCategories(catRes.data?.data || catRes.data || []);
        }

        // Load products
        const params = {
          category: categorySlug,
          sort: sortBy,
          limit: 12,
          page: currentPage,
        };

        const currentSearch = searchParams.get("search") || "";
        if (currentSearch.trim()) params.search = currentSearch.trim();
        if (minPrice !== "") params.min_price = minPrice;
        if (maxPrice !== "") params.max_price = maxPrice;
        if (ratingFilter !== "") params.rating = ratingFilter;
        if (selectedSizes.length > 0) params.sizes = selectedSizes.join(",");
        if (selectedColors.length > 0) params.colors = selectedColors.join(",");
        if (inStockOnly) params.in_stock = "true";
        if (onSaleOnly) params.on_sale = "true";

        const productRes = await fetchProductsRequest(params);
        const rawData = productRes?.data;
        const items =
          rawData?.data || (Array.isArray(productRes) ? productRes : []);
        const meta = rawData?.meta || {};

        setProducts(items);
        setPagination({
          currentPage: meta.current_page || 1,
          lastPage: meta.last_page || 1,
          total: meta.total || items.length,
          perPage: meta.per_page || 12,
        });
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    categorySlug,
    sortBy,
    minPrice,
    maxPrice,
    ratingFilter,
    currentPage,
    selectedSizes,
    selectedColors,
    inStockOnly,
    onSaleOnly,
    searchParams,
  ]);

  const activeCategory = (Array.isArray(categories) ? categories : []).find(
    (c) => c.slug === categorySlug,
  );

  const handleCustomPriceFilter = () => {
    setMinPrice(minVal);
    setMaxPrice(maxVal);
    setCurrentPage(1);
  };

  const handleQuickPriceFilter = (min, max) => {
    setMinVal(min);
    setMaxVal(max === 99999999 ? 2000000 : max);
    setMinPrice(min);
    setMaxPrice(max);
    setCurrentPage(1);
  };

  const handleSizeToggle = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
    setCurrentPage(1);
  };

  const handleColorToggle = (color) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set("search", searchQuery.trim());
    } else {
      newParams.delete("search");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setMinVal(0);
    setMaxVal(2000000);
    setMinPrice("");
    setMaxPrice("");
    setRatingFilter("");
    setSelectedSizes([]);
    setSelectedColors([]);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSearchQuery("");

    // Clear URL search params
    const newParams = new URLSearchParams();
    if (categorySlug) newParams.set("category", categorySlug);
    setSearchParams(newParams);

    setCurrentPage(1);
  };

  return (
    <CustomerLayout>
      <div className="pt-32 pb-24 bg-[#f8fafc] min-h-screen text-left">
        <div className="max-w-7xl mx-auto px-10 md:px-20">
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
            <span className="text-slate-800">Cửa hàng</span>
            {activeCategory && (
              <>
                <ChevronRight size={12} className="text-slate-300" />
                <span className="text-sky-600 font-black">
                  {activeCategory.name}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-1/4 space-y-6">
              {/* Category Card */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 pb-3 border-b border-slate-50 flex items-center gap-2">
                  <Filter size={14} className="text-sky-500" />
                  Danh mục
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/products"
                      className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        !categorySlug
                          ? "bg-sky-600 text-white shadow-md shadow-sky-500/10"
                          : "text-slate-600 hover:text-sky-600 hover:bg-slate-50"
                      }`}
                    >
                      Tất cả sản phẩm
                    </Link>
                  </li>
                  {Array.isArray(categories) &&
                    categories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          to={`/products?category=${cat.slug}`}
                          className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            categorySlug === cat.slug
                              ? "bg-sky-600 text-white shadow-md shadow-sky-500/10"
                              : "text-slate-600 hover:text-sky-600 hover:bg-slate-50"
                          }`}
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Price filter Card */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <style>{sliderStyle}</style>
                <style>{transitionStyle}</style>
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-50">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Coins size={14} className="text-sky-500" />
                    Khoảng giá
                  </h3>
                  {(minPrice !== "" || maxPrice !== "") && (
                    <button
                      onClick={clearFilters}
                      className="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-wider"
                    >
                      Xóa lọc
                    </button>
                  )}
                </div>

                {/* Dual range price slider */}
                <div className="price-slider-container relative w-full h-6 mt-4 mb-4">
                  <input
                    type="range"
                    min="0"
                    max="2000000"
                    step="20000"
                    value={minVal}
                    onChange={(e) => {
                      const val = Math.min(
                        Number(e.target.value),
                        maxVal - 100000,
                      );
                      setMinVal(val);
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="2000000"
                    step="20000"
                    value={maxVal}
                    onChange={(e) => {
                      const val = Math.max(
                        Number(e.target.value),
                        minVal + 100000,
                      );
                      setMaxVal(val);
                    }}
                  />

                  {/* Simulated range track */}
                  <div className="absolute w-full h-1.5 bg-slate-100 rounded-full z-10 pointer-events-none">
                    <div
                      className="absolute h-full bg-sky-500 rounded-full"
                      style={{
                        left: `${(minVal / 2000000) * 100}%`,
                        width: `${((maxVal - minVal) / 2000000) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Amount display values */}
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-6 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">
                      Từ
                    </span>
                    <span className="text-slate-800 text-[13px]">
                      {formatPrice(minVal)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 font-medium">
                      Đến
                    </span>
                    <span className="text-slate-800 text-[13px]">
                      {maxVal === 2000000 ? "2.000.000đ+" : formatPrice(maxVal)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCustomPriceFilter}
                  className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-sky-500/10 active:scale-95 mb-6"
                >
                  Lọc giá
                </button>

                {/* Quick select price ranges */}
                <div className="space-y-1 pt-4 border-t border-slate-50">
                  <span className="block text-[14px] font-medium text-slate-700 mb-3">
                    Chọn nhanh khoảng giá
                  </span>
                  {priceRanges.map((range, index) => {
                    const isActive =
                      minPrice === range.min && maxPrice === range.max;
                    return (
                      <button
                        key={index}
                        onClick={() =>
                          handleQuickPriceFilter(range.min, range.max)
                        }
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? "bg-sky-50 text-sky-600 font-bold"
                            : "text-slate-500 hover:text-sky-600 hover:bg-slate-50"
                        }`}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ratings filter Card */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mt-6">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-50">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <span className="text-amber-400 text-sm">★</span> Đánh giá
                  </h3>
                  {ratingFilter !== "" && (
                    <button
                      onClick={() => {
                        setRatingFilter("");
                        setCurrentPage(1);
                      }}
                      className="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-wider"
                    >
                      Xóa lọc
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const isActive = ratingFilter === stars;
                    return (
                      <button
                        key={stars}
                        onClick={() => {
                          setRatingFilter(stars);
                          setCurrentPage(1);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                          isActive
                            ? "bg-sky-50 text-sky-600 font-extrabold"
                            : "text-slate-500 hover:text-sky-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-[15px] leading-none ${
                                i < stars ? "text-amber-400" : "text-slate-200"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-[14px] font-medium">
                          {stars === 5 ? "5 sao" : `Từ ${stars} sao`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status filter Card */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mt-6">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 pb-3 border-b border-slate-50 flex items-center gap-2">
                  <span className="text-sky-500 font-bold text-sm">✔</span>{" "}
                  Trạng thái sản phẩm
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => {
                        setInStockOnly(e.target.checked);
                        setCurrentPage(1);
                      }}
                      className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500/20"
                    />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                      Còn hàng trong kho
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={onSaleOnly}
                      onChange={(e) => {
                        setOnSaleOnly(e.target.checked);
                        setCurrentPage(1);
                      }}
                      className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500/20"
                    />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                      Đang giảm giá (Sale)
                    </span>
                  </label>
                </div>
              </div>

              {/* Sizes filter Card */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mt-6">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 pb-3 border-b border-slate-50 flex items-center gap-2">
                  <span className="text-sky-500 font-bold text-sm">📐</span>{" "}
                  Kích thước (Size)
                </h3>

                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Áo & Váy
                </span>
                <div className="flex flex-wrap gap-2 mb-5">
                  {availableSizes.map((size) => {
                    const isSelected = selectedSizes.includes(size.value);
                    return (
                      <button
                        key={size.value}
                        onClick={() => handleSizeToggle(size.value)}
                        className={`w-10 h-10 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/10"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {size.label}
                      </button>
                    );
                  })}
                </div>

                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Quần
                </span>
                <div className="flex flex-wrap gap-2">
                  {pantSizes.map((size) => {
                    const isSelected = selectedSizes.includes(size.value);
                    return (
                      <button
                        key={size.value}
                        onClick={() => handleSizeToggle(size.value)}
                        className={`w-10 h-10 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/10"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {size.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors filter Card */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mt-6">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 pb-3 border-b border-slate-50 flex items-center gap-2">
                  <span className="text-sky-500 font-bold text-sm">🎨</span> Màu
                  sắc
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {availableColors.map((color) => {
                    const dbValue = color.value || color.name;
                    const isSelected = selectedColors.includes(dbValue);
                    return (
                      <button
                        key={color.name}
                        onClick={() => handleColorToggle(dbValue)}
                        title={color.name}
                        className={`w-9 h-9 rounded-full relative flex items-center justify-center transition-all ${
                          color.border ? "border border-slate-200" : ""
                        } hover:scale-110 active:scale-95`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {isSelected && (
                          <span
                            className={`text-[12px] font-black ${
                              color.hex === "#ffffff"
                                ? "text-slate-800"
                                : "text-white"
                            }`}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:w-3/4 space-y-6">
              {/* Premium Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="bg-white p-2 pl-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 transition-all duration-300"
              >
                <Search className="text-slate-400 flex-shrink-0" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm theo tên, từ khóa hoặc mã SKU..."
                  className="w-full bg-transparent border-none outline-none text-slate-800 text-sm font-medium placeholder-slate-400 py-2"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-[13px] font-medium  transition-all shadow-md shadow-sky-500/10 active:scale-95 flex-shrink-0"
                >
                  Tìm kiếm
                </button>
              </form>

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="bg-slate-50 p-1.5 rounded-xl flex gap-1 border border-slate-100">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-xl transition-all ${
                        viewMode === "grid"
                          ? "bg-white text-sky-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <Grid size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-xl transition-all ${
                        viewMode === "list"
                          ? "bg-white text-sky-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <ListIcon size={16} />
                    </button>
                  </div>
                  <span className="text-sm font-medium text-slate-500">
                    Hiển thị{" "}
                    <span className="font-black text-slate-800">
                      {Array.isArray(products) ? products.length : 0}
                    </span>{" "}
                    kết quả
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 ">Sắp xếp:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 px-4 py-2.5 pr-10 shadow-sm outline-none transition cursor-pointer"
                  >
                    <option value="latest">Mới nhất</option>
                    <option value="price_low">Giá: Thấp đến Cao</option>
                    <option value="price_high">Giá: Cao đến Thấp</option>
                    <option value="popular">Bán chạy nhất</option>
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-8">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className="animate-pulse bg-white rounded-3xl border border-slate-100 p-4 space-y-4 flex flex-col h-full animate-fade-in-up"
                    >
                      <div className="aspect-[3/4] bg-slate-100 rounded-xl w-full"></div>
                      <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                      <div className="h-3 bg-slate-50 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : Array.isArray(products) && products.length > 0 ? (
                <div
                  className={`grid gap-8 ${
                    viewMode === "grid"
                      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3"
                      : "grid-cols-1"
                  }`}
                >
                  {products.map((prod, index) => {
                    // Check if all variants are out of stock (available quantity <= 0)
                    const isOutOfStock =
                      !prod.variants ||
                      prod.variants.length === 0 ||
                      prod.variants.every((v) => {
                        const inv = v.inventory;
                        if (!inv) return true;
                        return inv.available <= 0;
                      });

                    // Generate premium tag logic to match the UI reference
                    const tagType =
                      prod.discount > 0
                        ? "Sale"
                        : prod.id % 3 === 0
                          ? "Hot"
                          : prod.id % 3 === 1
                            ? "Mới"
                            : null;

                    return (
                      <div
                        key={prod.id}
                        style={{ animationDelay: `${(index % 6) * 60}ms` }}
                        className={`group bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md hover:border-slate-200/60 transition-all duration-300 animate-fade-in-up ${
                          viewMode === "list"
                            ? "flex-col md:flex-row gap-6 p-5"
                            : ""
                        } ${isOutOfStock ? "opacity-90" : ""}`}
                      >
                        <div
                          className={`relative overflow-hidden bg-slate-50 flex-shrink-0 ${
                            viewMode === "list"
                              ? "w-full md:w-56 aspect-square rounded-lg"
                              : "aspect-[3/4] w-full"
                          }`}
                        >
                          <Link
                            to={`/products/${prod.slug}`}
                            className="block w-full h-full"
                          >
                            <img
                              src={
                                prod.image
                                  ? getImageUrl(prod.image)
                                  : "https://placehold.co/600x600/e2e8f0/475569?text=No+Image"
                              }
                              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                                isOutOfStock ? "grayscale opacity-75" : ""
                              }`}
                              alt={prod.name}
                            />
                          </Link>

                          {/* Dynamic premium badges */}
                          {isOutOfStock ? (
                            <div className="absolute top-4 left-4 z-10">
                              <span className="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm bg-rose-600 text-white animate-pulse">
                                Hết hàng
                              </span>
                            </div>
                          ) : (
                            tagType && (
                              <div className="absolute top-4 left-4 z-10">
                                <span
                                  className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                                    tagType === "Sale"
                                      ? "bg-rose-500 text-white"
                                      : tagType === "Hot"
                                        ? "bg-amber-500 text-white"
                                        : "bg-emerald-500 text-white"
                                  }`}
                                >
                                  {tagType}
                                </span>
                              </div>
                            )
                          )}

                          {/* Wishlist toggle heart icon */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(prod);
                            }}
                            className={`absolute top-4 right-4 z-10 p-2.5 rounded-full shadow-sm backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                              isInWishlist(prod.id)
                                ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
                                : "bg-white/80 text-slate-400 hover:bg-white hover:text-rose-500"
                            }`}
                          >
                            <Heart
                              size={15}
                              fill={
                                isInWishlist(prod.id) ? "currentColor" : "none"
                              }
                            />
                          </button>

                          {/* Hover View Details/Buy Now Button */}
                          <Link
                            to={`/products/${prod.slug}`}
                            className={`absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg text-[11px] whitespace-nowrap ${
                              isOutOfStock
                                ? "bg-slate-500 hover:bg-slate-600 text-white shadow-slate-500/20"
                                : "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/20"
                            }`}
                          >
                            {isOutOfStock ? "Xem chi tiết" : "Mua ngay"}
                          </Link>
                        </div>

                        {/* Card details body */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-2">
                            <Link
                              to={`/products/${prod.slug}`}
                              className="block"
                            >
                              <h3 className="text-sm font-medium text-black/80 line-clamp-2 group-hover:text-sky-600 transition-colors">
                                {prod.name}
                              </h3>
                            </Link>

                            {/* Ratings rating */}
                          </div>

                          <div className="flex items-baseline justify-between pt-1">
                            <div className="flex items-baseline gap-2.5">
                              <span className="text-base font-medium text-sky-700">
                                {formatPrice(prod.price)}
                              </span>
                              {prod.discount > 0 && (
                                <span className="text-sm text-slate-400 line-through font-medium">
                                  {formatPrice(
                                    prod.price * (1 + prod.discount / 100),
                                  )}
                                </span>
                              )}
                            </div>
                            {prod.average_rating ? (
                              <div className="flex items-center gap-1.5">
                                <StarRating
                                  rating={prod.average_rating}
                                  size={12}
                                />
                                <span className="text-[11px] font-medium text-slate-400">
                                  ({prod.review_count})
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-400">
                                Chưa có đánh giá
                              </span>
                            )}
                          </div>

                          {viewMode === "list" && prod.description && (
                            <p className="text-slate-500 text-xs line-clamp-2 pt-2 border-t border-slate-50">
                              {prod.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-32 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-400 mb-4">
                    Không tìm thấy sản phẩm nào phù hợp
                  </h2>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-sky-500/10 transition-all active:scale-95"
                  >
                    Xem tất cả sản phẩm
                  </button>
                </div>
              )}

              {/* Pagination */}
              {pagination.lastPage > 1 && (
                <div className="mt-16 flex justify-center items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(currentPage - 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-500 hover:border-sky-600 hover:text-sky-600 shadow-sm flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {[...Array(pagination.lastPage)].map((_, i) => {
                    const pageNumber = i + 1;
                    const isActive = pageNumber === currentPage;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => {
                          setCurrentPage(pageNumber);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`w-10 h-10 rounded-xl font-black text-xs transition-all hover:-translate-y-0.5 shadow-sm ${
                          isActive
                            ? "bg-sky-600 text-white shadow-md shadow-sky-500/10"
                            : "bg-white border border-slate-100 text-slate-500 hover:border-sky-600 hover:text-sky-600"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    disabled={currentPage === pagination.lastPage}
                    onClick={() => {
                      setCurrentPage(currentPage + 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-500 hover:border-sky-600 hover:text-sky-600 shadow-sm flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default ProductList;
