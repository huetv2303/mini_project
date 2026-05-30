import React, { useEffect, useState } from "react";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import {
  MessageSquare,
  Star,
  Calendar,
  Edit3,
  Trash2,
  ArrowRight,
  MessageCircle,
  Home,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import {
  fetchMyCommentsRequest,
  updateCommentRequest,
  deleteCommentRequest,
} from "../../services/CommentService";
import { getImageUrl } from "../../helper/helper";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "react-router-dom";

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ content: "", rating: 5 });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetchMyCommentsRequest(page);
      if (response.status === "success" && response.data) {
        setReviews(response.data.data || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách đánh giá!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    try {
      await deleteCommentRequest(id);
      toast.success("Đã xóa đánh giá thành công.");
      if (reviews.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchReviews();
      }
    } catch (error) {
      toast.error("Xóa đánh giá thất bại!");
    }
  };

  const handleEdit = (review) => {
    setEditingId(review.id);
    setEditForm({ content: review.content, rating: review.rating });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateCommentRequest(editingId, editForm);
      toast.success("Cập nhật đánh giá thành công!");
      setEditingId(null);
      fetchReviews();
    } catch (error) {
      toast.error("Cập nhật đánh giá thất bại!");
    }
  };

  const renderStars = (rating, clickable = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            onClick={() =>
              clickable && setEditForm({ ...editForm, rating: star })
            }
            className={`w-4 h-4 ${
              star <= rating
                ? "text-amber-400 fill-amber-400"
                : "text-slate-200"
            } ${clickable ? "cursor-pointer transition-transform hover:scale-125" : ""}`}
          />
        ))}
      </div>
    );
  };

  return (
    <CustomerLayout>
      <div className="bg-[#f8fafc] pt-32 pb-24 min-h-screen text-left">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
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
            <span className="text-slate-800">Đánh giá của tôi</span>
          </div>

          {/* Title and stats summary */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div>
              <h1 className="text-2xl md:text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">
                ĐÁNH GIÁ CỦA TÔI
              </h1>
              <p className="text-sm text-slate-400 font-medium">
                Xem lại lịch sử nhận xét và phản hồi từ phía cửa hàng
              </p>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 self-start sm:self-auto">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                <MessageSquare size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">
                  Đã nhận xét
                </p>
                <p className="text-lg font-black text-slate-800 leading-none">
                  {total}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 bg-white rounded-3xl border border-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center shadow-sm">
              <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle size={36} className="text-sky-400" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide mb-2">
                Bạn chưa có đánh giá nào
              </h3>
              <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto font-medium">
                Hãy mua sắm sản phẩm và chia sẻ cảm nhận tuyệt vời của bạn ngay
                nhé!
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-sky-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-sky-700 transition-all shadow-md shadow-sky-500/10 active:scale-95"
              >
                MUA SẮM NGAY
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-8">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-200/60 transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Left: Product brief info */}
                      <div className="md:w-1/3 bg-slate-50/50 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col items-center text-center justify-center">
                        <div className="w-24 h-24 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-4 group flex-shrink-0">
                          <img
                            src={getImageUrl(review.product?.feature_image)}
                            alt={review.product?.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <h4 className="text-[13px] font-medium text-slate-800  line-clamp-2 mb-2 px-2 leading-relaxed">
                          {review.product?.name}
                        </h4>
                        <Link
                          to={`/products/${review.product?.slug}`}
                          className="text-[10px] font-black text-sky-600 hover:text-sky-700 uppercase tracking-widest flex items-center gap-1 hover:underline"
                        >
                          Xem chi tiết
                        </Link>
                      </div>

                      {/* Right: Review details and actions */}
                      <div className="flex-1 p-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex flex-wrap items-center gap-3">
                              {renderStars(review.rating)}
                              <span className="w-1 h-1 bg-slate-200 rounded-full hidden sm:inline-block"></span>
                              <div className="flex items-center text-[13px] font-medium text-slate-600 ">
                                <Calendar
                                  size={13}
                                  className="mr-1.5 text-sky-500"
                                />
                                {format(
                                  new Date(review.created_at),
                                  "dd MMMM, yyyy",
                                  { locale: vi },
                                )}
                              </div>
                            </div>

                            {!review.admin_reply && editingId !== review.id && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleEdit(review)}
                                  className="w-8 h-8 hover:bg-sky-50 text-slate-400 hover:text-sky-600 rounded-xl flex items-center justify-center transition-all active:scale-90"
                                  title="Sửa đánh giá"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(review.id)}
                                  className="w-8 h-8 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl flex items-center justify-center transition-all active:scale-90"
                                  title="Xóa"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>

                          {editingId === review.id ? (
                            <form onSubmit={handleUpdate} className="space-y-4">
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">
                                  Chọn lại số sao
                                </p>
                                {renderStars(editForm.rating, true)}
                              </div>
                              <textarea
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-bold text-slate-600 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all resize-none"
                                rows={3}
                                value={editForm.content}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    content: e.target.value,
                                  })
                                }
                                placeholder="Cảm nhận của bạn về sản phẩm..."
                              />
                              <div className="flex items-center gap-3">
                                <button
                                  type="submit"
                                  className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-sky-500/10 hover:-translate-y-0.5 transition-all active:scale-95"
                                >
                                  LƯU THAY ĐỔI
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                                >
                                  HỦY
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="space-y-5">
                              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100/50 italic">
                                <p className="text-xs text-slate-600 leading-relaxed font-bold">
                                  "{review.content}"
                                </p>
                              </div>

                              {review.admin_reply && (
                                <div className="bg-sky-50/30 p-5 rounded-xl border border-sky-100/50 relative mt-4">
                                  <div className="absolute -top-3 left-6 px-3 py-1 bg-sky-600 text-white text-[9px] font-black uppercase rounded-full tracking-wider shadow-md shadow-sky-500/10">
                                    Phản hồi từ cửa hàng
                                  </div>
                                  <p className="text-xs font-bold text-sky-900 leading-relaxed mt-1">
                                    {review.admin_reply}
                                  </p>
                                  <p className="text-[9px] text-sky-500 font-black mt-3 flex items-center uppercase tracking-wider">
                                    <MessageCircle
                                      size={12}
                                      className="mr-1.5 text-sky-500"
                                    />
                                    Đã phản hồi ngày{" "}
                                    {format(
                                      new Date(review.replied_at),
                                      "dd/MM/yyyy",
                                      { locale: vi },
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {total > 10 && (
                <div className="flex items-center justify-center gap-3 pt-6">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-sky-600 hover:bg-slate-50 transition-all shadow-sm active:scale-90"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="h-10 px-4 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                      Trang {page} / {Math.ceil(total / 10)}
                    </span>
                  </div>
                  <button
                    disabled={page >= Math.ceil(total / 10)}
                    onClick={() => setPage(page + 1)}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-sky-600 hover:bg-slate-50 transition-all shadow-sm active:scale-90"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default MyReviews;
