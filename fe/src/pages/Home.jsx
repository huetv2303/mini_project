import React, { useState, useEffect, useRef } from "react";
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
import { Link } from "react-router-dom";
import axios from "axios";
import { fetchCategoriesRequest } from "../services/CategoryService";
import { fetchProductsRequest } from "../services/ProductService";
import { getImageUrl, formatPrice } from "../helper/helper";

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);

  // Note: These would normally fetch from your real API
  // Using placeholders for now to show the design
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

  return (
    <CustomerLayout>
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
        </div>

        <div className="max-w-9xl mx-auto px-4 md:px-12 relative z-10 w-full">
          <div className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-left-10 duration-1000">
            <h1 className="text-7xl md:text-[140px] font-black text-white leading-[0.85] tracking-tighter">
              ĐỊNH HÌNH <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                PHONG CÁCH
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/60 max-w-xl leading-relaxed font-medium italic">
              Kiến tạo dấu ấn cá nhân thông qua những thiết kế tối giản, tinh tế
              và dẫn đầu xu hướng thời trang hiện đại.
            </p>

            <div className="flex flex-wrap items-center gap-8 pt-4">
              <Link
                to="/products"
                className="group px-10 py-5 bg-white text-black font-black rounded-[32px] flex items-center gap-3 hover:bg-black hover:text-white transition-all duration-500 shadow-2xl shadow-white/10 hover:-translate-y-1"
              >
                KHÁM PHÁ NGAY
                <ArrowRight
                  size={22}
                  className="group-hover:translate-x-2 transition-transform"
                />
              </Link>
              <Link
                to="/categories"
                className="group px-10 py-5 bg-white/5 backdrop-blur-xl border border-white/10 text-white font-black rounded-[32px] hover:bg-white/10 transition-all duration-500 flex items-center gap-2"
              >
                DANH MỤC
                <ChevronDown
                  size={18}
                  className="text-white/40 group-hover:text-white transition-colors"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-bounce">
          <div className="w-1 h-3 bg-white rounded-full"></div>
          <span className="text-[10px] text-white font-bold tracking-widest uppercase">
            Cuộn xuống
          </span>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 border-b border-gray-50 bg-white">
        <div className="max-w-full mx-auto px-4 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="flex items-center gap-6 group">
              <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-sm">
                <Truck size={28} />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-1">
                  Giao hàng nhanh
                </h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Miễn phí từ 500k
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 group">
              <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-sm">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-1">
                  Bảo đảm chính hãng
                </h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Hoàn tiền 200% nếu giả
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 group">
              <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-sm">
                <RotateCcw size={28} />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-1">
                  Đổi trả 30 ngày
                </h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Thủ tục siêu tốc
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 group">
              <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-sm">
                <Star size={28} />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-1">
                  Hỗ trợ 24/7
                </h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Tư vấn tận tâm
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-15">
        <div className="max-w-full mx-auto px-4 md:px-12">
          <div className="flex items-baseline justify-between mb-16">
            <div>
              <p className="text-[1rem] font-bold text-gray-400 uppercase  mb-4">
                Bộ sưu tập hoàn mỹ
              </p>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
                DANH MỤC <span className="text-gray-300">CẢM HỨNG</span>
              </h2>
            </div>
            <Link
              to="/categories"
              className="group text-sm font-bold flex items-center gap-3 transition-all hover:gap-5"
            >
              XEM TẤT CẢ{" "}
              <ArrowRight
                size={18}
                className="text-gray-300 group-hover:text-black transition-colors"
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                to={`/products?category=${cat.id}`}
                key={cat.id}
                className="group relative h-80 overflow-hidden rounded-3xl bg-gray-100 flex flex-col justify-end p-8"
              >
                <img
                  src={
                    getImageUrl(cat.image) ||
                    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                  <h3 className="text-xl font-black text-white mb-2 tracking-tight">
                    {cat.name}
                  </h3>
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-white/70 uppercase tracking-widest">
                    Khám phá ngay <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="py-12 translate-y-24">
        <div className="max-w-full mx-auto px-4 md:px-12">
          <div className="relative h-[450px] rounded-[64px]overflow-hidden bg-black flex items-center p-8 md:p-24 group">
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent z-10"></div>
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=80"
              alt="Promotion"
              className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110"
            />

            <div className="relative z-20 space-y-8 max-w-xl ">
              <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur rounded-full text-white text-[10px] font-black uppercase tracking-[0.3em]">
                Siêu ưu đãi tuần này
              </div>
              <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">
                ƯU ĐÃI <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                  50% PHÍP
                </span>
              </h2>
              <p className="text-white/40 text-lg font-medium">
                Áp dụng cho tất cả các sản phẩm thời trang trong bộ sưu tập mới
                nhất. Sở hữu ngay những siêu phẩm với mức giá không tưởng.
              </p>
              <button className="px-12 py-5 bg-white text-black font-black rounded-[32px] hover:bg-black hover:text-white transition-all duration-500 shadow-2xl shadow-white/10">
                LẤY MÃ NGAY
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-40">
        <div className="max-w-full mx-auto px-4 md:px-12">
          <div className="flex items-baseline justify-between mb-16">
            <div>
              <p className="text-[1rem] font-bold text-gray-400 uppercase  mb-4">
                Bán chạy nhất tuần qua
              </p>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
                SIÊU PHẨM <span className="text-gray-300">SĂN ĐÓN</span>
              </h2>
            </div>
            <Link
              to="/products"
              className="group text-sm font-bold flex items-center gap-3 transition-all hover:gap-5"
            >
              CỬA HÀNG{" "}
              <ArrowRight
                size={18}
                className="text-gray-300 group-hover:text-black transition-colors"
              />
            </Link>
          </div>

          <div className="relative group/swiper">
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={30}
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
              className="featured-swiper !pb-16"
            >
              {featuredProducts.map((prod) => (
                <SwiperSlide key={prod.id}>
                  <div className="group flex flex-col pt-4">
                    <Link
                      to={`/products/${prod.slug}`}
                      className="relative h-96 mb-6 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center"
                    >
                      <img
                        src={
                          getImageUrl(prod.image) ||
                          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
                        }
                        alt={prod.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />

                      <button className="absolute bottom-6 left-1/2 -translate-x-1/2 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-2xl z-10">
                        <ShoppingBag size={18} /> MUA NGAY
                      </button>
                    </Link>
                    <div className="space-y-2 px-2">
                      <div className="flex items-center justify-between text-[1rem] text-gray-400  uppercase">
                        {/* <span>{prod.category?.name || "Premium"}</span> */}
                        <h3 className="text-[1rem] font-medium text-gray-800">
                          <Link to={`/products/${prod.slug}`}>{prod.name}</Link>
                        </h3>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star size={12} fill="currentColor" />
                          <span>{prod.rating || 4.8}</span>
                        </div>
                      </div>

                      <p className="text-[1rem] ">{formatPrice(prod.price)}</p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            {/* Custom Navigation Buttons */}
            <button
              onClick={() => swiperRef.current?.slidePrev()}
              className="absolute top-1/2 -left-6 -translate-y-1/2 w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center z-50 opacity-0 group-hover/swiper:opacity-100 transition-opacity hover:bg-black hover:text-white border border-gray-100 pointer-events-auto"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => swiperRef.current?.slideNext()}
              className="absolute top-1/2 -right-6 -translate-y-1/2 w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center z-50 opacity-0 group-hover/swiper:opacity-100 transition-opacity hover:bg-black hover:text-white border border-gray-100 pointer-events-auto"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

      {/* Brand Section */}
      <section className="py-32 bg-slate-50 overflow-hidden">
        <div className="max-w-full mx-auto px-4 md:px-12 text-center space-y-16">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">
            ĐỐI TÁC CHIẾN LƯỢC TOÀN CẦU
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all">
            <div className="text-4xl font-black italic tracking-tighter">
              NIKE
            </div>
            <div className="text-4xl font-black italic tracking-tighter">
              ADIDAS
            </div>
            <div className="text-4xl font-black italic tracking-tighter">
              ZARA
            </div>
            <div className="text-4xl font-black italic tracking-tighter">
              APPLE
            </div>
            <div className="text-4xl font-black italic tracking-tighter">
              SONY
            </div>
          </div>
        </div>
      </section>
    </CustomerLayout>
  );
};

export default Home;
