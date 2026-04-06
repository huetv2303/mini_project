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
    <footer className="bg-white border-t border-gray-100 pt-32 pb-16">
      <div className="max-w-full mx-auto px-4 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-24">
          <div className="lg:col-span-2 space-y-8">
            <Link to="/" className="  flex items-center gap-3">
              <div className="w-12 h-12 bg-black flex items-center justify-center rounded-2xl shadow-xl shadow-black/10">
                <img
                  src={LogoTrendora}
                  className="w-10 h-10 object-contain contrast-125"
                />
              </div>
              <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
                TRENDORA<span className="text-gray-300 font-bold">FASHION</span>
              </span>
            </Link>
            <p className="text-gray-400 text-lg leading-relaxed max-w-sm font-medium">
              Chúng tôi không chỉ bán thời trang, chúng tôi kiến tạo phong cách
              sống hiện đại, tinh tế và bền vững cho thế hệ mới.
            </p>
            <div className="flex items-center gap-5">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center hover:bg-black hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-sm"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-black text-slate-900 mb-8 uppercase text-xs tracking-[0.2em]">
              Khám phá
            </h4>
            <ul className="space-y-4">
              {[
                { name: "Tất cả sản phẩm", path: "/products" },
                { name: "Danh mục nổi bật", path: "/categories" },
                { name: "Khuyến mãi hấp dẫn", path: "/promotions" },
                { name: "Bộ sưu tập mới", path: "/new-arrivals" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-500 hover:text-black transition-colors text-sm font-bold"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-black text-slate-900 mb-8 uppercase text-xs tracking-[0.2em]">
              Dịch vụ
            </h4>
            <ul className="space-y-4">
              {[
                { name: "Trung tâm trợ giúp", path: "/help" },
                { name: "Chính sách vận chuyển", path: "/shipping" },
                { name: "Hướng dẫn đổi trả", path: "/returns" },
                { name: "Câu hỏi thường gặp", path: "/faq" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-500 hover:text-black transition-colors text-sm font-bold"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">
              Newsletter
            </h4>
            <p className="text-gray-400 text-sm font-medium">
              Đăng ký để nhận thông tin về các bộ sưu tập và ưu đãi sớm nhất từ
              TRENDORA.
            </p>
            <div className="relative group">
              <input
                type="email"
                placeholder="Email của bạn"
                className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
              />
              <button className="absolute right-2 top-2 w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            © 2026 TRENDORA FASHION.
          </p>
          <div className="flex items-center gap-10">
            {["Điều khoản", "Bảo mật", "Cookies"].map((item) => (
              <Link
                key={item}
                to="#"
                className="text-gray-400 hover:text-black transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CustomerFooter;
