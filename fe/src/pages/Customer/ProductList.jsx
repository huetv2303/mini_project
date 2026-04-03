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
  Heart,
} from "lucide-react";

const ProductList = () => {
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("latest");

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
        };
        const productRes = await fetchProductsRequest(params);
        setProducts(productRes.data?.data || productRes.data || []);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categorySlug, sortBy]);

  const activeCategory = (Array.isArray(categories) ? categories : []).find(
    (c) => c.slug === categorySlug,
  );

  return (
    <CustomerLayout>
      <div className="pt-32 pb-24 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-12">
            <Link to="/" className="hover:text-black transition-colors">
              Trang chủ
            </Link>
            <ChevronRight size={12} />
            <span className="text-black">Cửa hàng</span>
            {activeCategory && (
              <>
                <ChevronRight size={12} />
                <span className="text-purple-600">{activeCategory.name}</span>
              </>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar Filters */}
            <aside className="lg:w-1/4 space-y-10">
              <div>
                <h3 className="text-sm font-bold uppercase mb-6 border-b pb-4">
                  Danh mục
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/products"
                      className={`text-sm font-bold transition-all hover:pl-2 ${!categorySlug ? "text-purple-600" : "text-gray-500 hover:text-black"}`}
                    >
                      Tất cả sản phẩm
                    </Link>
                  </li>
                  {Array.isArray(categories) &&
                    categories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          to={`/products?category=${cat.slug}`}
                          className={`text-sm font-medium transition-all hover:pl-2 ${categorySlug === cat.slug ? "text-purple-600" : "text-gray-500 hover:text-black"}`}
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b pb-4">
                  Khoảng giá
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      placeholder="Từ"
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-gray-300">-</span>
                    <input
                      type="number"
                      placeholder="Đến"
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button className="w-full h-12 bg-black text-white rounded-lg text-xs font-black uppercase hover:bg-purple-600 transition-all">
                    Lọc giá
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:w-3/4">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-6">
                  <div className="bg-white p-2 rounded-xl flex gap-1 shadow-sm">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-black text-white" : "text-gray-400 hover:bg-gray-100"}`}
                    >
                      <Grid size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-black text-white" : "text-gray-400 hover:bg-gray-100"}`}
                    >
                      <ListIcon size={18} />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-gray-500">
                    Hiển thị {Array.isArray(products) ? products.length : 0} kết
                    quả
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-gray-400 uppercase">
                    Sắp xếp:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white border-none rounded-lg text-sm font-bold focus:ring-2 focus:ring-purple-500 px-4 py-2 pr-10 shadow-sm"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-4">
                      <div className="aspect-[3/4] bg-gray-100 rounded-[40px]"></div>
                      <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                    </div>
                  ))}
                </div>
              ) : Array.isArray(products) && products.length > 0 ? (
                <div
                  className={`grid gap-10 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
                >
                  {products.map((prod) => (
                    <div
                      key={prod.id}
                      className={`group ${viewMode === "list" ? "flex flex-col md:flex-row gap-8 items-center bg-gray-50 p-6 rounded-[40px]" : ""}`}
                    >
                      <Link
                        to={`/products/${prod.slug}`}
                        className={`relative block overflow-hidden bg-gray-50 rounded-lg shadow-sm transition-all hover:shadow-xl group-hover:-translate-y-2 ${viewMode === "list" ? "w-full md:w-64 aspect-square" : "aspect-[3/4] mb-6"}`}
                      >
                        <img
                          src={getImageUrl(prod.image)}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          alt={prod.name}
                        />
                        {prod.discount > 0 && (
                          <div className="absolute top-6 left-6 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                            -{prod.discount}%
                          </div>
                        )}
                        <button className="absolute top-4 right-4 z-10 p-2 bg-white/70 backdrop-blur-md rounded-full text-gray-900 shadow-sm hover:bg-black hover:text-white transition-all duration-300 transform hover:scale-110 active:scale-95">
                          <Heart size={18} />
                        </button>
                        <button className="absolute hover:bg-black/80 bottom-6 left-1/2 -translate-x-1/2 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-2xl">
                          Mua ngay
                        </button>
                      </Link>
                      <div
                        className={`relative space-y-1 ${viewMode === "list" ? "flex-1" : ""}`}
                      >
                        {/* <div className="flex items-center gap-2">
                          <span className="text-[1rem] font-medium uppercase  ">
                            {prod.category?.name}
                          </span>
                        </div> */}
                        <h3 className="text-[1rem] font-medium text-gray-900 uppercase">
                          <Link to={`/products/${prod.slug}`}>{prod.name}</Link>
                        </h3>
                        <div className="flex items-baseline gap-3">
                          <span className="text-sm text-gray-800">
                            {formatPrice(prod.price)}
                          </span>
                        </div>
                        {viewMode === "list" && (
                          <p className="text-gray-500 text-sm line-clamp-2 mb-6">
                            {prod.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-40 bg-gray-50 rounded-[40px]">
                  <h2 className="text-2xl font-black text-gray-300">
                    Không tìm thấy sản phẩm nào
                  </h2>
                  <button
                    onClick={() => (window.location.href = "/products")}
                    className="mt-6 text-purple-600 font-bold hover:underline"
                  >
                    {" "}
                    Xem tất cả sản phẩm
                  </button>
                </div>
              )}

              {/* Pagination (Simple for now) */}
              {Array.isArray(products) && products.length >= 12 && (
                <div className="mt-20 flex justify-center gap-2">
                  <button className="w-12 h-12 rounded-xl bg-black text-white font-black shadow-lg shadow-black/20 text-sm transition-all hover:-translate-y-1">
                    1
                  </button>
                  <button className="w-12 h-12 rounded-xl bg-white border-2 border-gray-100 text-gray-400 font-black text-sm hover:border-black hover:text-black transition-all hover:-translate-y-1">
                    2
                  </button>
                  <button className="w-12 h-12 rounded-xl bg-white border-2 border-gray-100 text-gray-400 font-black text-sm hover:border-black hover:text-black transition-all hover:-translate-y-1">
                    3
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
