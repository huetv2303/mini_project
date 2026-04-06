import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";
import { useWishlist } from "../../../context/WishlistContext";
import {
  ShoppingBag,
  Search,
  User,
  LogOut,
  Menu,
  X,
  Heart,
  Package,
  Settings,
  ChevronDown,
  ChevronRight,
  Ticket,
  LayoutDashboard,
} from "lucide-react";
import LogoTrendora from "../../../assets/LogoTrendora.png";
import { getImageUrl } from "../../../helper/helper";
import { fetchCategoriesRequest } from "../../../services/CategoryService";
import CartDrawer from "./CartDrawer";
import { usePromotion } from "../../../hooks/usePromotion";

const CustomerNavbar = () => {
  const { user, logout } = useAuth();
  const { cartItems, isCartOpen, setIsCartOpen } = useCart();
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState(null);
  const [isMobileAnimating, setIsMobileAnimating] = useState(false);

  const { promotions, fetchPromotions } = usePromotion();
  // Remove isCartOpen local state

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const loadCategories = async () => {
      try {
        const response = await fetchCategoriesRequest();
        if (response.status === "success") {
          // The response.data contains the paginated result if from controller
          // or is the array itself depending on implementation
          const categoryList = response.data?.data || response.data || [];
          setCategories(categoryList);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    window.addEventListener("scroll", handleScroll);
    loadCategories();
    fetchPromotions();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-full mx-auto px-10 md:px-20">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className=" flex items-center justify-center w-full ">
                <img
                  src={LogoTrendora}
                  alt="Logo"
                  className="w-10 h-10 object-cover rounded-lg"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">
                TRENDORA<span className="text-gray-400">FASHION</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {/* Dynamic Categories */}
              {categories.slice(0, 5).map((category) => (
                <div
                  key={category.id}
                  className="relative group py-2"
                  onMouseEnter={() => setActiveCategory(category.id)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  <Link
                    to={`/products?category=${category.slug}`}
                    className="px-4 py-2 text-sm font-bold text-gray-500 group-hover:text-black group-hover:bg-gray-50 rounded-xl transition-all flex items-center gap-1"
                  >
                    {category.name.toUpperCase()}
                    {category.children && category.children.length > 0 && (
                      <ChevronDown
                        size={14}
                        className="group-hover:rotate-180 transition-transform duration-300"
                      />
                    )}
                  </Link>

                  {category.children && category.children.length > 0 && (
                    <div className="absolute top-full left-0 min-w-[220px] bg-white border border-gray-100 shadow-2xl rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-3 translate-y-2 group-hover:translate-y-0">
                      <div className="flex flex-col gap-1">
                        {category.children.map((child) => (
                          <Link
                            key={child.id}
                            to={`/products?category=${child.slug}`}
                            className="px-4 py-2.5 text-sm text-gray-600 hover:text-black hover:bg-gray-50 rounded-xl transition-colors"
                          >
                            {child.name}
                          </Link>
                        ))}
                        <div className="border-t border-gray-50 mt-1 pt-1">
                          <Link
                            to={`/products?category=${category.slug}`}
                            className="px-4 py-2 text-xs font-bold text-purple-600 hover:bg-purple-50 rounded-lg transition-colors inline-block w-full"
                          >
                            XEM TẤT CẢ {category.name.toUpperCase()}
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-all">
                <Search size={22} />
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-all relative"
              >
                <ShoppingBag size={22} />
                {cartItems.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    {cartItems.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate("/wishlist")}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-all relative"
              >
                <Heart size={22} />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    {wishlistItems.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigate("/promotions")}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-all relative"
              >
                <Ticket size={22} />
                {promotions.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    {promotions.length}
                  </span>
                )}
              </button>
              {/* User Account */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-gray-200 hover:shadow-md transition-all bg-white"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100">
                      {user.avatar ? (
                        <img
                          src={getImageUrl(user.avatar)}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black text-white text-xs font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden lg:block mr-2">
                      {user.name}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsUserDropdownOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 shadow-xl rounded-2xl z-20 py-2 p-1 animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-3 border-b border-gray-100 mb-2">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                            Tài khoản của tôi
                          </p>
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {user.email}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded-full uppercase">
                              {user.customer_profile?.loyalty_tier || "Bronze"}{" "}
                              Member
                            </span>
                          </div>
                        </div>

                        {user.role?.code === "admin" && (
                          <Link
                            to="/admin/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                          >
                            <LayoutDashboard size={18} />
                            Trang Quản Trị
                          </Link>
                        )}

                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          <User size={18} />
                          Thông tin cá nhân
                        </Link>
                        <Link
                          to="/orders"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          <Package size={18} />
                          Đơn hàng của tôi
                        </Link>
                        <Link
                          to="/wishlist"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          <Heart size={18} />
                          Yêu thích
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          <Settings size={18} />
                          Cài đặt
                        </Link>
                        <div className="border-t border-gray-50 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <LogOut size={18} />
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-5 py-2 text-sm font-bold text-gray-700 hover:text-black transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2 bg-black text-white text-sm font-bold rounded-full hover:bg-black/80 transition-all shadow-lg shadow-black/10"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-all"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 z-[100] lg:hidden transition-all duration-300 ${
          isMobileMenuOpen ? "visible" : "invisible pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Drawer Content */}
        <div
          className={`absolute top-0 right-0 w-[85%] max-w-sm h-full bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2"
            >
              <img
                src={LogoTrendora}
                alt="Logo"
                className="w-9 h-9 object-cover rounded-lg"
              />
              <span className="text-lg font-bold tracking-tight text-slate-900">
                TRENDORA<span className="text-gray-400">FASHION</span>
              </span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={22} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="p-6 space-y-2">
              <Link
                to="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-gray-400" />
                  <span className="text-lg font-bold text-slate-900">
                    Sản phẩm
                  </span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </Link>

              {/* Mobile Categories Accordion */}
              <div className="bg-gray-50 rounded-2xl overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedMobileCategory(
                      expandedMobileCategory === "all" ? null : "all",
                    )
                  }
                  className="w-full flex items-center justify-between p-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Menu size={20} className="text-gray-400" />
                    <span className="text-lg font-bold text-slate-900">
                      Danh mục
                    </span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-300 ${
                      expandedMobileCategory === "all" ? "rotate-180" : ""
                    } text-gray-400`}
                  />
                </button>

                {expandedMobileCategory && (
                  <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-4 pt-2 border-t border-gray-100">
                      {(expandedMobileCategory === "all"
                        ? categories
                        : categories.filter(
                            (c) => c.id === expandedMobileCategory,
                          )
                      ).map((category) => (
                        <div key={category.id} className="space-y-2">
                          <div
                            className="flex items-center justify-between"
                            onClick={(e) => {
                              if (
                                category.children &&
                                category.children.length > 0
                              ) {
                                e.preventDefault();
                                e.stopPropagation();
                                setExpandedMobileCategory(
                                  expandedMobileCategory === category.id
                                    ? "all"
                                    : category.id,
                                );
                              }
                            }}
                          >
                            <Link
                              to={`/products?category=${category.slug}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="font-bold text-slate-700 text-sm py-1"
                            >
                              {category.name}
                            </Link>
                            {category.children &&
                              category.children.length > 0 && (
                                <ChevronRight
                                  size={16}
                                  className={`text-gray-300 transition-transform ${
                                    expandedMobileCategory === category.id
                                      ? "rotate-90"
                                      : ""
                                  }`}
                                />
                              )}
                          </div>

                          {expandedMobileCategory === category.id && (
                            <div className="pl-4 space-y-3 pt-1 border-l border-gray-100 ml-1">
                              {category.children.map((child) => (
                                <Link
                                  key={child.id}
                                  to={`/products?category=${child.slug}`}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="block text-sm text-gray-500 font-medium py-1"
                                >
                                  {child.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/promotions"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <Ticket size={20} className="text-gray-400" />
                  <span className="text-lg font-bold text-slate-900">
                    Khuyến mãi
                  </span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </Link>

              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <User size={20} className="text-gray-400" />
                  <span className="text-lg font-bold text-slate-900">
                    Tài khoản
                  </span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </Link>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0">
            {!user ? (
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-4 text-center text-sm font-bold border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-4 text-center text-sm font-bold bg-black text-white rounded-2xl hover:bg-black/90 shadow-lg shadow-black/10 transition-all"
                >
                  Đăng ký
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 border border-white shadow-sm">
                    {user.avatar ? (
                      <img
                        src={getImageUrl(user.avatar)}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black text-white text-sm font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-4 text-center text-sm font-bold bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default CustomerNavbar;
