import React from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  ArrowRight,
} from "lucide-react";
import LogoTrendora from "../../../assets/LogoTrendora.png";
const CustomerFooter = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-black flex items-center justify-center rounded-xl">
                <img src={LogoTrendora} />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                TRENDORA<span className="text-gray-400">FASHION</span>
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Chúng tôi mang đến giải pháp mua sắm hiện đại, tinh tế với các sản
              phẩm cao cấp và dịch vụ tận tâm.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 border border-gray-100 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 border border-gray-100 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 border border-gray-100 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 border border-gray-100 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase text-sm tracking-widest">
              Khám phá
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/products"
                  className="text-gray-500 hover:text-black transition-colors text-sm"
                >
                  Tất cả sản phẩm
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className="text-gray-500 hover:text-black transition-colors text-sm"
                >
                  Danh mục nổi bật
                </Link>
              </li>
              <li>
                <Link
                  to="/promotions"
                  className="text-gray-500 hover:text-black transition-colors text-sm"
                >
                  Khuyến mãi mới nhất
                </Link>
              </li>
              <li>
                <Link
                  to="/new-arrivals"
                  className="text-gray-500 hover:text-black transition-colors text-sm"
                >
                  Sản phẩm mới về
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase text-sm tracking-widest">
              Hỗ trợ
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/help"
                  className="text-gray-500 hover:text-black transition-colors text-sm"
                >
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link
                  to="/shipping-policy"
                  className="text-gray-500 hover:text-black transition-colors text-sm"
                >
                  Chính sách vận chuyển
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-policy"
                  className="text-gray-500 hover:text-black transition-colors text-sm"
                >
                  Hướng dẫn đổi trả
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-gray-500 hover:text-black transition-colors text-sm"
                >
                  Câu hỏi thường gặp
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase text-sm tracking-widest">
              Bản tin
            </h4>
            <p className="text-gray-500 text-sm mb-6">
              Đăng ký để nhận thông tin về ưu đãi sớm nhất.
            </p>
            <div className="relative">
              <input
                type="email"
                placeholder="Email của bạn"
                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
              />
              <button className="absolute right-1 top-1 w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-black/80 transition-all">
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-gray-400 text-sm">
            © 2026 ModernStore. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <Link
              to="/terms"
              className="text-gray-400 hover:text-gray-600 transition-colors text-xs uppercase tracking-widest"
            >
              Điều khoản
            </Link>
            <Link
              to="/privacy"
              className="text-gray-400 hover:text-gray-600 transition-colors text-xs uppercase tracking-widest"
            >
              Bảo mật
            </Link>
            <Link
              to="/cookies"
              className="text-gray-400 hover:text-gray-600 transition-colors text-xs uppercase tracking-widest"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CustomerFooter;
