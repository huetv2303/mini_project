import React from "react";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import { Link } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { getImageUrl, formatPrice } from "../../helper/helper";
import {
  Heart,
  ShoppingBag,
  ChevronRight,
  ArrowRight,
  Home,
  Trash2,
} from "lucide-react";
import StarRating from "../../components/review/StarRating";

const Wishlist = () => {
  const { wishlistItems, toggleWishlist, loading } = useWishlist();
  const { addToCart, setIsCartOpen } = useCart();

  const handleAddToCart = (product) => {
    if (product.variants && product.variants.length > 0) {
      addToCart(product, product.variants[0], 1);
    } else {
      addToCart(product, null, 1);
    }
    setIsCartOpen(true);
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
            <span className="text-slate-800">Danh sách yêu thích</span>
          </div>

          {/* Page Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <div>
              <h1 className="text-2xl md:text-2xl font-black text-slate-800 uppercase tracking-tight mb-2 mb-2">
                Danh sách yêu thích
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Bạn đang lưu lại{" "}
                <span className="font-extrabold text-sky-600">
                  {wishlistItems.length}
                </span>{" "}
                sản phẩm tuyệt vời
              </p>
            </div>
            {wishlistItems.length > 0 && (
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Tiếp tục mua sắm
                <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-3xl border border-slate-100 p-4 space-y-4 flex flex-col h-full"
                >
                  <div className="aspect-[3/4] bg-slate-100 rounded-xl w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                  <div className="h-3 bg-slate-50 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : wishlistItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {wishlistItems.map((prod) => (
                <div
                  key={prod.id}
                  className="group bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md hover:border-slate-200/60 transition-all duration-300"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-50 flex-shrink-0">
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
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        alt={prod.name}
                      />
                    </Link>

                    {/* Glassmorphic Delete heart Wishlist toggle */}
                    <button
                      onClick={() => toggleWishlist(prod)}
                      className="absolute top-4 right-4 z-10 p-2.5 rounded-full shadow-sm bg-rose-50/90 text-rose-500 hover:bg-rose-500 hover:text-white backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95"
                    >
                      <Heart size={15} fill="currentColor" />
                    </button>

                    {/* Quick Add to Cart button on hover */}
                    <button
                      onClick={() => handleAddToCart(prod)}
                      className="absolute hover:bg-sky-700 bottom-4 left-1/2 -translate-x-1/2 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 text-[11px] whitespace-nowrap"
                    >
                      <ShoppingBag size={14} />
                      Thêm vào giỏ
                    </button>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-black/80 line-clamp-2 group-hover:text-sky-600 transition-colors t">
                        <Link to={`/products/${prod.slug}`}>{prod.name}</Link>
                      </h3>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-base font-medium text-sky-700">
                          {formatPrice(prod.price)}
                        </span>
                      </div>
                      {prod.average_rating ? (
                        <div className="flex items-center gap-1.5">
                          <StarRating rating={prod.average_rating} size={12} />
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm px-6">
              <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart size={36} className="text-sky-400 animate-pulse" />
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-wide mb-3">
                Danh sách của bạn đang trống
              </h2>
              <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto font-medium">
                Hãy thêm những sản phẩm yêu thích vào danh sách để cập nhật các
                ưu đãi đặc biệt và mua sắm dễ dàng hơn nhé.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-sky-600 text-white px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-sky-700 transition-all shadow-md shadow-sky-500/10 hover:-translate-y-0.5 active:scale-95"
              >
                Khám phá ngay
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default Wishlist;
