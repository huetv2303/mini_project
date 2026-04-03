import React, { useState, useEffect } from "react";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import PromotionService from "../../services/PromotionService";
import { formatPrice } from "../../helper/helper";
import {
  Ticket,
  Percent,
  Tag,
  Calendar,
  ShoppingCart,
  LayoutGrid,
  ChevronRight,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
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
          per_page: 100, // Get all active promotions
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
      icon: <LayoutGrid className="w-8 h-8 text-indigo-600" />,
      color: "indigo",
    },
    category: {
      title: "Ưu đãi theo danh mục",
      description: "Dành riêng cho các nhóm sản phẩm chọn lọc",
      icon: <Tag className="w-8 h-8 text-purple-600" />,
      color: "purple",
    },
    product: {
      title: "Ưu đãi theo sản phẩm",
      description: "Áp dụng cho một số sản phẩm đặc biệt",
      icon: <ShoppingCart className="w-8 h-8 text-blue-600" />,
      color: "blue",
    },
  };

  const PromotionCard = ({ promo }) => {
    const isExpired =
      promo.expires_at && new Date(promo.expires_at) < new Date();
    const isSoon = promo.starts_at && new Date(promo.starts_at) > new Date();

    return (
      <div className="group relative bg-white rounded-[32px] border border-slate-100 p-6 transition-all duration-500 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 overflow-hidden">
        {/* Background Accent */}
        <div
          className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50 to-transparent -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700`}
        />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div
              className={`p-4 rounded-2xl bg-slate-50 group-hover:scale-110 transition-transform duration-500`}
            >
              {promo.type === "percent" ? (
                <Percent className="w-6 h-6 text-slate-900" />
              ) : (
                <Ticket className="w-6 h-6 text-slate-900" />
              )}
            </div>
            {promo.usage_limit && (
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Số lượng còn lại
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {Math.max(0, promo.usage_limit - (promo.used_count || 0))}{" "}
                  lượt
                </span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-black transition-colors">
              {promo.name}
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 min-h-[40px]">
              {promo.description ||
                "Không có mô tả chi tiết cho chương trình này."}
            </p>
            {promo.scope === "category" && promo.categories?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {promo.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100"
                  >
                    #{cat.name.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
            {promo.scope === "product" && promo.products?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {promo.products.map((prod) => (
                  <span
                    key={prod.id}
                    className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100"
                  >
                    {prod.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <span>
                Giảm{" "}
                {promo.type === "percent"
                  ? `${promo.value}%`
                  : formatPrice(promo.value)}
              </span>
            </div>
            {promo.min_order_amount > 0 && (
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                </div>
                <span>Đơn hàng từ {formatPrice(promo.min_order_amount)}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <span>
                Hết hạn:{" "}
                {promo.expires_at
                  ? new Date(promo.expires_at).toLocaleDateString("vi-VN")
                  : "Không thời hạn"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between group/code transition-colors hover:border-slate-300">
              <span className="text-lg font-black tracking-wider text-slate-900 uppercase">
                {promo.code}
              </span>
              <button
                onClick={() => copyToClipboard(promo.code)}
                className="p-2 text-slate-400 hover:text-black transition-colors"
                title="Sao chép mã"
              >
                {copiedCode === promo.code ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Copy className="w-5 h-5" />
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
      <div className="pt-32 pb-24 bg-slate-50/50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="mb-16">
            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase mb-4">
              <Link to="/" className="hover:text-black transition-colors">
                Trang chủ
              </Link>
              <ChevronRight size={12} />
              <span className="text-slate-900">Khuyến mãi</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Ưu Đãi Tuyệt Vời <br />
              Dành Riêng Cho Bạn
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl leading-relaxed font-medium">
              Khám phá các mã giảm giá hấp dẫn nhất. Trendora Fashion luôn mang
              đến những cơ hội mua sắm tốt nhất cho khách hàng thân thiết.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-[32px] h-[400px] border border-slate-100"
                />
              ))}
            </div>
          ) : promotions.length > 0 ? (
            <div className="space-y-24">
              {Object.keys(scopeInfo).map(
                (scope) =>
                  groupedPromotions[scope]?.length > 0 && (
                    <div key={scope} className="relative">
                      <div className="flex flex-col md:flex-row md:items-center  justify-between gap-6 mb-12">
                        <div className="flex items-start gap-6">
                          <div className="p-4 bg-white rounded-3xl shadow-sm border border-slate-100 ring-4 ring-slate-50">
                            {scopeInfo[scope].icon}
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">
                              {scopeInfo[scope].title}
                            </h2>
                            <p className="text-slate-500 font-medium italic">
                              {scopeInfo[scope].description}
                            </p>
                          </div>
                        </div>
                        <div className="h-px flex-1 bg-slate-200  hidden lg:block mx-12 mb-6" />
                      </div>
                      {/* <div className="hidden md:block mb-3">
                        <span className="text-sm font-black  items-center   uppercase">
                          {groupedPromotions[scope].length} Mã khả dụng
                        </span>
                      </div> */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {groupedPromotions[scope].map((promo) => (
                          <PromotionCard key={promo.id} promo={promo} />
                        ))}
                      </div>
                    </div>
                  ),
              )}
            </div>
          ) : (
            <div className="text-center py-40 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Ticket className="w-12 h-12 text-slate-200" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-4">
                Hiện không có mã khuyến mãi nào
              </h2>
              <p className="text-slate-400 font-medium mb-8">
                Hãy quay lại sau để nhận những ưu đãi mới nhất từ Trendora.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-black/10"
              >
                Tiếp tục mua sắm
                <ChevronRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default Promotions;
