import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import CustomerLayout from "../components/layout/Customer/CustomerLayout";
import {
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Link, Navigate } from "react-router-dom";
import { fetchCategoriesRequest } from "../services/CategoryService";
import { fetchProductsRequest } from "../services/ProductService";
import { getImageUrl, formatPrice } from "../helper/helper";
import StarRating from "../components/review/StarRating";

const Home = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        // Fetch featured categories (assuming we just take the top 4 for now)
        const categoriesRes = await fetchCategoriesRequest();
        if (categoriesRes.status === "success") {
          const list = categoriesRes.data?.data || categoriesRes.data || [];
          setCategories(list.slice(0, 4));
        }

        // Fetch best sellers (popular)
        const productsRes = await fetchProductsRequest({
          sort: "popular",
          limit: 10,
        });
        if (productsRes.status === "success") {
          setFeaturedProducts(productsRes.data?.data || productsRes.data || []);
        }
      } catch (error) {
        console.error("Failed to load home data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  // Automatically redirect Admin and Staff to dashboard if they land on Home
  if (!authLoading && isAuthenticated) {
    const isAdminOrStaff =
      user?.role?.code === "admin" || user?.role?.code === "staff";
    if (isAdminOrStaff) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return (
    <CustomerLayout>
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden bg-slate-950">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=80"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-40 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto pt-20 px-6 md:px-10 relative z-10 w-full text-left">
          <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-left-10 duration-1000">
            <h1 className="text-5xl md:text-8xl font-black text-white leading-none tracking-tighter uppercase">
              ĐỊNH HÌNH <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600">
                PHONG CÁCH
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-300 max-w-lg leading-relaxed font-bold">
              Kiến tạo dấu ấn cá nhân thông qua những thiết kế tối giản, tinh tế
              và dẫn đầu xu hướng thời trang hiện đại toàn cầu.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                to="/products"
                className="group px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-2xl flex items-center gap-2 transition-all duration-300 shadow-lg shadow-sky-500/20 hover:-translate-y-0.5 active:scale-95 text-xs uppercase tracking-widest"
              >
                KHÁM PHÁ NGAY
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1.5 transition-transform"
                />
              </Link>
              <Link
                to="/categories"
                className="group px-8 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all duration-300 flex items-center gap-2 text-xs uppercase tracking-widest"
              >
                DANH MỤC
                <ChevronDown
                  size={14}
                  className="text-white/40 group-hover:text-white transition-colors"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40 animate-bounce">
          <div className="w-0.5 h-3 bg-white rounded-full"></div>
          <span className="text-[9px] text-white font-black tracking-widest uppercase">
            Cuộn xuống
          </span>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-white border-b border-slate-50 text-left">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 flex-shrink-0">
                <Truck size={20} />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 mb-0.5">
                  Giao hàng nhanh
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Miễn phí từ 500k
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 flex-shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 mb-0.5">
                  Bảo đảm chính hãng
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Hoàn tiền 200% nếu giả
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 flex-shrink-0">
                <RotateCcw size={20} />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 mb-0.5">
                  Đổi trả 30 ngày
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Thủ tục cực kì siêu tốc
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 flex-shrink-0">
                <Star size={20} />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 mb-0.5">
                  Hỗ trợ 24/7
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Tư vấn thời trang tận tâm
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-20 bg-[#f8fafc] text-left">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Bộ sưu tập hoàn mỹ
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">
                Danh mục <span className="text-sky-600">cảm hứng</span>
              </h2>
            </div>
            <Link
              to="/categories"
              className="group text-xs font-black text-slate-400 hover:text-sky-600 uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto transition-colors"
            >
              Xem tất cả
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                to={`/products?category=${cat.id}`}
                key={cat.id}
                className="group relative h-80 overflow-hidden rounded-3xl bg-slate-100 flex flex-col justify-end p-6 border border-slate-100"
              >
                <img
                  src={
                    getImageUrl(cat.image) ||
                    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
                <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-1">
                  <h3 className="text-lg font-black text-white mb-1 tracking-tight uppercase">
                    {cat.name}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-white/80 uppercase tracking-widest">
                    Khám phá ngay <ArrowRight size={11} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="py-12 bg-white text-left">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="relative h-[380px] rounded-[32px] overflow-hidden bg-slate-950 flex items-center p-8 md:p-16 group">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent z-10"></div>
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=80"
              alt="Promotion"
              className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-1000 group-hover:scale-105"
            />

            <div className="relative z-20 space-y-6 max-w-lg">
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white text-[9px] font-black uppercase tracking-widest">
                Siêu ưu đãi tuần này
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none uppercase">
                ƯU ĐÃI KHỦNG <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
                  GIẢM GIÁ 50%
                </span>
              </h2>
              <p className="text-slate-300 text-xs font-bold leading-relaxed">
                Áp dụng cho tất cả các sản phẩm thời trang trong bộ sưu tập mới
                nhất. Sở hữu ngay những siêu phẩm với mức giá không tưởng.
              </p>
              <Link
                to="/promotions"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-md shadow-sky-500/20 hover:-translate-y-0.5 active:scale-95"
              >
                LẤY MÃ KHUYẾN MÃI NGAY
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-[#f8fafc] text-left">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Bán chạy nhất tuần qua
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">
                Siêu phẩm <span className="text-sky-600">săn đón</span>
              </h2>
            </div>
            <Link
              to="/products"
              className="group text-xs font-black text-slate-400 hover:text-sky-600 uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto transition-colors"
            >
              Cửa hàng
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          <div className="relative group/swiper">
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={24}
              slidesPerView={1.2}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              breakpoints={{
                640: { slidesPerView: 2.2 },
                1024: { slidesPerView: 3.2 },
                1280: { slidesPerView: 4 },
              }}
              className="featured-swiper !pb-14"
            >
              {featuredProducts.map((prod) => (
                <SwiperSlide key={prod.id}>
                  <div className="group bg-white rounded-3xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-slate-200/60 transition-all duration-300 flex flex-col justify-between">
                    <Link
                      to={`/products/${prod.slug}`}
                      className="relative h-64 mb-4 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center flex-shrink-0"
                    >
                      <img
                        src={
                          getImageUrl(prod.image) ||
                          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
                        }
                        alt={prod.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />

                      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-sky-500/10 z-10 whitespace-nowrap">
                        <ShoppingBag size={12} /> MUA NGAY
                      </span>
                    </Link>

                    <div className="flex flex-col justify-between">
                      <div className="space-y-1 text-left">
                        <h3 className="text-[1rem] font-medium text-slate-800  line-clamp-1">
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
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Custom Navigation Buttons */}
            <button
              onClick={() => swiperRef.current?.slidePrev()}
              className="absolute top-1/2 -left-4 -translate-y-1/2 w-10 h-10 bg-white shadow-md rounded-2xl flex items-center justify-center z-50 opacity-0 group-hover/swiper:opacity-100 transition-opacity hover:bg-slate-50 border border-slate-100"
            >
              <ChevronLeft
                size={20}
                className="text-slate-500 hover:text-sky-600"
              />
            </button>
            <button
              onClick={() => swiperRef.current?.slideNext()}
              className="absolute top-1/2 -right-4 -translate-y-1/2 w-12 h-12 bg-white shadow-md rounded-2xl flex items-center justify-center z-50 opacity-0 group-hover/swiper:opacity-100 transition-opacity hover:bg-slate-50 border border-slate-100"
            >
              <ChevronRight
                size={20}
                className="text-slate-500 hover:text-sky-600"
              />
            </button>
          </div>
        </div>
      </section>

      {/* Brand Section */}
      <section className="py-24 bg-white overflow-hidden border-t border-slate-50">
        <div className="max-w-7xl mx-auto px-6 md:px-8 text-center space-y-12">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">
            ĐỐI TÁC CHIẾN LƯỢC TOÀN CẦU
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 opacity-35 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="text-2xl font-black italic tracking-tighter text-slate-700">
              NIKE
            </div>
            <div className="text-2xl font-black italic tracking-tighter text-slate-700">
              ADIDAS
            </div>
            <div className="text-2xl font-black italic tracking-tighter text-slate-700">
              ZARA
            </div>
            <div className="text-2xl font-black italic tracking-tighter text-slate-700">
              APPLE
            </div>
            <div className="text-2xl font-black italic tracking-tighter text-slate-700">
              SONY
            </div>
          </div>
        </div>
      </section>
    </CustomerLayout>
  );
};

export default Home;
