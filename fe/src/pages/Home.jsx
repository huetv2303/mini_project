import React, { useState, useEffect } from "react";
import CustomerLayout from "../components/layout/Customer/CustomerLayout";
import {
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Note: These would normally fetch from your real API
  // Using placeholders for now to show the design
  useEffect(() => {
    // Mimic API load
    setTimeout(() => {
      setCategories([
        {
          id: 1,
          name: "THỜI TRANG",
          image:
            "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
        },
        {
          id: 2,
          name: "ĐIỆN TỬ",
          image:
            "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80",
        },
        {
          id: 3,
          name: "PHỤ KIỆN",
          image:
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        },
        {
          id: 4,
          name: "Nội Thất",
          image:
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
        },
      ]);
      setFeaturedProducts([
        {
          id: 1,
          name: "Premium Wireless Headphones",
          price: 299,
          category: "Electronics",
          image:
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
          rating: 4.8,
        },
        {
          id: 2,
          name: "Minimalist Leather Watch",
          price: 150,
          category: "Accessories",
          image:
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
          rating: 4.5,
        },
        {
          id: 3,
          name: "Smart Fitness Watch",
          price: 199,
          category: "Electronics",
          image:
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
          rating: 4.7,
        },
        {
          id: 4,
          name: "Premium Cotton Hoodie",
          price: 85,
          category: "Fashion",
          image:
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
          rating: 4.9,
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <CustomerLayout>
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/storefront_hero_banner_1774595122297.png"
            alt="Hero Banner"
            className="w-full h-full object-cover scale-105 animate-pulse-slow shadow-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 w-full">
          <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-left-10 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-xs font-bold tracking-widest uppercase">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Sản phẩm mới nhất 2026
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter">
              BỨT PHÁ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                PHONG CÁCH
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-lg leading-relaxed italic ">
              Khám phá bộ sưu tập độc quyền với những thiết kế tối giản nhưng
              đầy tinh tế, nâng tầm đẳng cấp của bạn.
            </p>

            <div className="flex flex-wrap items-center gap-6">
              <Link
                to="/products"
                className="group px-8 py-4 bg-white text-black font-bold rounded-2xl flex items-center gap-2 hover:bg-black hover:text-white transition-all duration-300 shadow-xl shadow-white/10"
              >
                MUA NGAY
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <Link
                to="/categories"
                className="px-8 py-4 bg-black/50 backdrop-blur-md border border-white/20 text-white font-bold rounded-2xl hover:bg-black/70 transition-all duration-300"
              >
                DANH MỤC
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
      <section className="py-12 border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Truck className="text-black" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Giao hàng nhanh</h4>
                <p className="text-xs text-gray-500">Miễn phí từ 500k</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="text-black" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Bảo hành 12 tháng</h4>
                <p className="text-xs text-gray-500">Cam kết chính hãng</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                <RotateCcw className="text-black" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Đổi trả 7 ngày</h4>
                <p className="text-xs text-gray-500">Thủ tục đơn giản</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Star className="text-black" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Đánh giá 5 sao</h4>
                <p className="text-xs text-gray-500">Từ +10,000 khách hàng</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-24">
        <div className="max-w-8xl mx-auto px-6 md:px-10">
          <div className="flex items-baseline justify-between mb-12">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
                Bộ sưu tập
              </p>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                DANH MỤC <span className="text-gray-300">NỔI BẬT</span>
              </h2>
            </div>
            <Link
              to="/categories"
              className="text-sm font-bold hover:underline flex items-center gap-2"
            >
              Xem tất cả <ArrowRight size={16} />
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
                  src={cat.image}
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
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="relative h-64 md:h-80 rounded-[40px] overflow-hidden bg-black flex items-center p-8 md:p-16">
            <div className="absolute right-0 top-0 w-1/2 h-full hidden md:block opacity-40">
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80"
                alt="Promotion"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative z-10 space-y-4 max-w-md">
              <span className="text-xs font-bold text-white bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">
                Siêu ưu đãi tuần này
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
                ƯU ĐÃI ĐẾN <br />
                <span className="text-7xl">50%</span>
              </h2>
              <p className="text-gray-400 text-sm">
                Áp dụng cho tất cả các sản phẩm thời trang nam nữ. Hạn cuối chủ
                nhật tuần này.
              </p>
              <button className="px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all">
                LẤY MÃ NGAY
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24">
        <div className="max-w-8xl mx-auto px-6 md:px-10">
          <div className="flex items-baseline justify-between mb-12">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
                Bán chạy nhất
              </p>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                SẢN PHẨM <span className="text-gray-300">NỔI BẬT</span>
              </h2>
            </div>
            <Link
              to="/products"
              className="text-sm font-bold hover:underline flex items-center gap-2"
            >
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((prod) => (
              <div key={prod.id} className="group flex flex-col pt-4">
                <Link
                  to={`/products/${prod.id}`}
                  className="relative h-96 mb-6 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center "
                >
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur shadow-sm rounded-full text-[10px] font-black uppercase tracking-widest">
                      New
                    </span>
                  </div>
                  <button className="absolute bottom-6 left-1/2 -translate-x-1/2 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-2xl">
                    <ShoppingBag size={18} /> MUA NGAY
                  </button>
                </Link>
                <div className="space-y-1 px-2">
                  <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-widest">
                    <span>{prod.category}</span>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star size={12} fill="currentColor" />
                      <span>{prod.rating}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-black transition-colors">
                    {prod.name}
                  </h3>
                  <p className="text-lg font-black text-slate-900">
                    {number_format(prod.price)}đ
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Section */}
      <section className="py-24 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-12">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em]">
            Hợp tác cùng những thương hiệu lớn
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

// Helper function to format currency
const number_format = (number) => {
  return new Intl.NumberFormat("vi-VN").format(number);
};

export default Home;
