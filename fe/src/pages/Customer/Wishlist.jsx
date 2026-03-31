import React from "react";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import { Link } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { getImageUrl, formatPrice } from "../../helper/helper";
import {
  Heart,
  Trash2,
  ShoppingBag,
  ChevronRight,
  ArrowRight,
  ShoppingBasket,
} from "lucide-react";

const Wishlist = () => {
  const { wishlistItems, toggleWishlist, loading } = useWishlist();
  const { addToCart, setIsCartOpen } = useCart();

  const handleAddToCart = (product) => {
    // If product has variants, we should ideally redirect to detail page
    // to choose variant, but for simplicity if we want to add directly:
    if (product.variants && product.variants.length > 0) {
      // Add first variant by default or redirect
      addToCart(product, product.variants[0], 1);
    } else {
      addToCart(product, null, 1);
    }
    setIsCartOpen(true);
  };

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
            <span className="text-black">Danh sách yêu thích</span>
          </div>

          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">
                Danh sách yêu thích
              </h1>
              <p className="text-gray-500 font-medium">
                {wishlistItems.length} sản phẩm bạn đã lưu lại
              </p>
            </div>
            {wishlistItems.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Bạn có chắc chắn muốn xóa tất cả?")) {
                    // Logic to clear all if needed
                  }
                }}
                className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest hidden md:block"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-4">
                  <div className="aspect-[3/4] bg-gray-100 rounded-[30px]"></div>
                  <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : wishlistItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {wishlistItems.map((prod) => (
                <div key={prod.id} className="group relative">
                  <div className="relative aspect-[3/4] mb-6 overflow-hidden bg-gray-50 rounded-[30px] shadow-sm transition-all hover:shadow-xl group-hover:-translate-y-2">
                    <Link to={`/products/${prod.slug}`}>
                      <img
                        src={getImageUrl(prod.image)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={prod.name}
                      />
                    </Link>

                    {/* Delete Toggle */}
                    <button
                      onClick={() => toggleWishlist(prod)}
                      className="absolute top-6 right-6 z-10 p-3 bg-white/90 backdrop-blur-md rounded-2xl text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-all duration-300"
                    >
                      <Heart size={18} />
                    </button>

                    {/* Quick Add */}
                    <button
                      onClick={() => handleAddToCart(prod)}
                      className="absolute bottom-6 left-6 right-6 h-14 bg-black text-white text-[13px] hover:bg-black/80 font-black uppercase  rounded-lg flex items-center justify-center gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 "
                    >
                      <ShoppingBag size={16} />
                      Thêm vào giỏ
                    </button>
                  </div>

                  <div className="space-y-1 px-2">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                      <Link to={`/products/${prod.slug}`}>{prod.name}</Link>
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm  text-gray-900">
                        {formatPrice(prod.price)}
                      </span>
                      {prod.old_price && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(prod.old_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-gray-50 rounded-[40px] px-8 border-2 border-dashed border-gray-100">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/10">
                <Heart size={40} className="text-gray-200" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 uppercase mb-4">
                Danh sách của bạn đang trống
              </h2>
              <p className="text-gray-500 mb-10 max-w-md mx-auto font-medium">
                Hãy thêm những sản phẩm bạn yêu thích vào danh sách để dễ dàng
                mua sắm sau này.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-3 bg-black text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-xl shadow-black/10 hover:-translate-y-1"
              >
                Khám phá ngay
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* Recently Viewed or Suggestions can go here */}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default Wishlist;
