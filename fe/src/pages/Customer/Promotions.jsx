import React, { useState, useEffect } from "react";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import PromotionService from "../../services/PromotionService";
import { formatPrice } from "../../helper/helper";
import {
  Ticket,
  Percent,
  Tag,
  ShoppingCart,
  LayoutGrid,
  ChevronRight,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  Home,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await PromotionService.getAll({
          is_active: true,
          per_page: 100,
        });
        const data = res.data?.data?.data || res.data?.data || res.data || [];
        setPromotions(data);
      } catch (error) {
        console.error("Failed to fetch promotions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const groupedPromotions = (promotions || []).reduce((acc, promo) => {
    const scope = promo.scope || "all";
    if (!acc[scope]) acc[scope] = [];
    acc[scope].push(promo);
    return acc;
  }, {});

  const scopeInfo = {
    all: {
      title: "Ưu đãi toàn cửa hàng",
      description: "Áp dụng cho mọi đơn hàng đủ điều kiện",
      icon: <LayoutGrid className="w-6 h-6 text-sky-600" />,
    },
    category: {
      title: "Ưu đãi theo danh mục",
      description: "Dành riêng cho các nhóm sản phẩm chọn lọc",
      icon: <Tag className="w-6 h-6 text-sky-600" />,
    },
    product: {
      title: "Ưu đãi theo sản phẩm",
      description: "Áp dụng cho một số sản phẩm đặc biệt",
      icon: <ShoppingCart className="w-6 h-6 text-sky-600" />,
    },
  };

  const PromotionCard = ({ promo }) => {
    const isExpired =
      promo.expires_at && new Date(promo.expires_at) < new Date();
    const isSoon = promo.starts_at && new Date(promo.starts_at) > new Date();

    return (
      <div className="group relative bg-white rounded-lg border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-slate-200/60 transition-all duration-300 flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-start mb-5">
            <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform duration-300">
              {promo.type === "percent" ? (
                <Percent size={20} />
              ) : (
                <Ticket size={20} />
              )}
            </div>
            {promo.usage_limit && (
              <div className="text-right">
                <span className="text-[11px] font-medium text-slate-400 block mb-0.5">
                  Số lượng còn lại
                </span>
                <span className="text-xs font-black text-slate-700 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                  {Math.max(0, promo.usage_limit - (promo.used_count || 0))}{" "}
                  lượt
                </span>
              </div>
            )}
          </div>

          <div className="mb-5">
            <h3 className="text-base font-semibold text-slate-800 uppercase tracking-tight mb-2">
              {promo.name}
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 min-h-[32px] font-medium">
              {promo.description ||
                "Không có mô tả chi tiết cho chương trình này."}
            </p>

            {promo.scope === "category" && promo.categories?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {promo.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="px-2 py-0.5 bg-sky-50/50 text-sky-600 text-[1rem] font-medium rounded-lg border border-sky-100/50 "
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
            {promo.scope === "product" && promo.products?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {promo.products.map((prod) => (
                  <span
                    key={prod.id}
                    className="px-2 py-0.5 bg-sky-50/50 text-sky-600 text-[1rem] font-medium rounded-lg border border-sky-100/50 "
                  >
                    {prod.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="space-y-2 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>
                Giảm giá:{" "}
                <span className="text-sky-600 font-extrabold">
                  {promo.type === "percent"
                    ? `${promo.value}%`
                    : formatPrice(promo.value)}
                </span>
              </span>
            </div>
            {promo.min_order_amount > 0 && (
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>
                  Đơn hàng tối thiểu:{" "}
                  <span className="text-slate-700 font-extrabold">
                    {formatPrice(promo.min_order_amount)}
                  </span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>
                Hạn dùng:{" "}
                <span className="text-slate-600">
                  {promo.expires_at
                    ? new Date(promo.expires_at).toLocaleDateString("vi-VN")
                    : "Không giới hạn"}
                </span>
              </span>
            </div>
          </div>

          {/* Dotted code copier holder */}
          <div className="flex gap-2">
            <div className="flex-1 bg-sky-50/50 border-2 border-dashed border-sky-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-base font-black tracking-widest text-sky-800 uppercase">
                {promo.code}
              </span>
              <button
                onClick={() => copyToClipboard(promo.code)}
                className="w-8 h-8 hover:bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-sky-600 transition-all active:scale-90"
                title="Sao chép mã"
              >
                {copiedCode === promo.code ? (
                  <CheckCircle2
                    size={16}
                    className="text-emerald-500 animate-in fade-in zoom-in"
                  />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
            <span className="text-slate-800">Mã khuyến mãi</span>
          </div>

          {/* Top Banner */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="space-y-3 max-w-2xl">
              <h1 className="text-2xl md:text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">
                Ưu Đãi Tuyệt Vời Dành Riêng Cho Bạn
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Khám phá và lưu ngay các mã giảm giá hấp dẫn nhất từ chúng tôi.
                Cam kết mang đến những đặc quyền mua sắm vượt trội cùng trải
                nghiệm thời trang tốt nhất cho khách hàng thân thiết.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-sky-500/10 transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap self-start md:self-auto"
            >
              Xem sản phẩm
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-3xl border border-slate-100 p-6 space-y-4 h-[320px] flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
                    <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                    <div className="h-3 bg-slate-50 rounded w-full"></div>
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                </div>
              ))}
            </div>
          ) : promotions.length > 0 ? (
            <div className="space-y-16">
              {Object.keys(scopeInfo).map(
                (scope) =>
                  groupedPromotions[scope]?.length > 0 && (
                    <div key={scope} className="relative">
                      {/* Section Title */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 shadow-sm">
                            {scopeInfo[scope].icon}
                          </div>
                          <div>
                            <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">
                              {scopeInfo[scope].title}
                            </h2>
                            <p className="text-slate-400 text-xs font-medium">
                              {scopeInfo[scope].description}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-black text-sky-600 bg-sky-50 px-3 py-1 rounded-full uppercase tracking-wider">
                          {groupedPromotions[scope].length} Voucher
                        </span>
                      </div>

                      {/* Card Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                        {groupedPromotions[scope].map((promo) => (
                          <PromotionCard key={promo.id} promo={promo} />
                        ))}
                      </div>
                    </div>
                  ),
              )}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm px-6">
              <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket size={36} className="text-sky-400" />
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-wide mb-3">
                Hiện không có mã khuyến mãi nào
              </h2>
              <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto font-medium">
                Vui lòng ghé thăm lại sau để nhận các đặc quyền ưu đãi hấp dẫn
                tiếp theo nhé.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-sky-600 text-white px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-sky-700 transition-all shadow-md shadow-sky-500/10 hover:-translate-y-0.5 active:scale-95"
              >
                Tiếp tục mua sắm
                <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default Promotions;
