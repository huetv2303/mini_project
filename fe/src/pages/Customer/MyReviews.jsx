import React, { useEffect, useState } from "react";
import CustomerLayout from "../../components/layout/Customer/CustomerLayout";
import { 
  MessageSquare, 
  Star, 
  Calendar, 
  Package, 
  Edit3, 
  Trash2, 
  ArrowRight,
  MessageCircle
} from "lucide-react";
import { fetchMyCommentsRequest, updateCommentRequest, deleteCommentRequest } from "../../services/CommentService";
import { getImageUrl } from "../../helper/helper";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "react-router-dom";

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ content: "", rating: 5 });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetchMyCommentsRequest();
      setReviews(response.data.data);
    } catch (error) {
      toast.error("Không thể tải danh sách đánh giá!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    try {
      await deleteCommentRequest(id);
      toast.success("Đã xóa đánh giá.");
      setReviews(reviews.filter(r => r.id !== id));
    } catch (error) {
      toast.error("Xóa thất bại!");
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
      toast.success("Cập nhật thành công!");
      setEditingId(null);
      fetchReviews();
    } catch (error) {
      toast.error("Cập nhật thất bại!");
    }
  };

  const renderStars = (rating, clickable = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            onClick={() => clickable && setEditForm({ ...editForm, rating: star })}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
            } ${clickable ? "cursor-pointer transition-transform hover:scale-125" : ""}`}
          />
        ))}
      </div>
    );
  };

  return (
    <CustomerLayout>
      <div className="bg-slate-50 pt-32 pb-24 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">ĐÁNH GIÁ CỦA TÔI</h1>
              <p className="text-gray-500 font-medium">Xem lại lịch sử nhận xét và phản hồi từ cửa hàng</p>
            </div>
            <div className="hidden md:flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Tổng cộng</p>
                <p className="text-lg font-bold text-slate-900 leading-none">{reviews.length}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-white rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle size={40} className="text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Bạn chưa có đánh giá nào</h3>
              <p className="text-gray-400 mb-8 max-w-sm mx-auto">Hãy mua sắm và chia sẻ cảm nhận của bạn về sản phẩm nhé!</p>
              <Link 
                to="/products" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-black/90 transition-all shadow-xl shadow-black/10 active:scale-95"
              >
                MUA SẮM NGAY <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50">
                  <div className="flex flex-col lg:flex-row">
                    {/* Left: Product Info */}
                    <div className="lg:w-1/3 bg-slate-50/50 p-8 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col items-center text-center">
                      <div className="w-32 h-32 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-4 group">
                        <img 
                          src={getImageUrl(review.product?.feature_image)} 
                          alt={review.product?.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2 mb-2 px-2 leading-relaxed">
                        {review.product?.name}
                      </h4>
                      <Link 
                        to={`/products/${review.product?.slug}`}
                        className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                      >
                        Xem sản phẩm
                      </Link>
                    </div>

                    {/* Right: Review Details */}
                    <div className="flex-1 p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          {renderStars(review.rating)}
                          <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                          <div className="flex items-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            <Calendar size={14} className="mr-1.5" />
                            {format(new Date(review.created_at), "dd MMMM, yyyy", { locale: vi })}
                          </div>
                        </div>

                        {!review.admin_reply && editingId !== review.id && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEdit(review)}
                              className="p-2.5 bg-slate-50 text-slate-500 hover:bg-black hover:text-white rounded-xl transition-all active:scale-90"
                              title="Sửa đánh giá"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(review.id)}
                              className="p-2.5 bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all active:scale-90"
                              title="Xóa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      {editingId === review.id ? (
                        <form onSubmit={handleUpdate} className="space-y-4">
                          <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
                             <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Chọn lại số sao</p>
                             {renderStars(editForm.rating, true)}
                          </div>
                          <textarea
                            className="w-full bg-slate-50 border border-gray-100 rounded-2xl p-5 text-sm font-medium focus:bg-white focus:border-black outline-none transition-all resize-none"
                            rows={3}
                            value={editForm.content}
                            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                            placeholder="Cảm nhận của bạn về sản phẩm..."
                          />
                          <div className="flex items-center gap-3">
                            <button 
                              type="submit"
                              className="flex-1 py-4 bg-black text-white rounded-2xl text-sm font-bold shadow-lg shadow-black/10 hover:-translate-y-0.5 transition-all active:translate-y-0"
                            >
                              LƯU THAY ĐỔI
                            </button>
                            <button 
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
                            >
                              HỦY
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-6">
                          <div className="bg-slate-50/50 p-6 rounded-[24px] border border-gray-50 italic">
                            <p className="text-slate-700 leading-relaxed">
                              "{review.content}"
                            </p>
                          </div>

                          {review.admin_reply && (
                            <div className="bg-indigo-50/50 p-6 rounded-[24px] border border-indigo-100 relative mt-4">
                              <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-full tracking-widest shadow-lg shadow-indigo-200">
                                Phản hồi từ Trendora
                              </div>
                              <p className="text-indigo-900 font-medium leading-relaxed">
                                {review.admin_reply}
                              </p>
                              <p className="text-[10px] text-indigo-400 font-bold mt-4 flex items-center uppercase tracking-tighter">
                                <MessageCircle size={12} className="mr-1.5" />
                                Đã phản hồi vào {format(new Date(review.replied_at), "dd/MM/yyyy", { locale: vi })}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default MyReviews;
