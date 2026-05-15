import React, { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../../components/layout/Admin/AdminLayout";
import { 
  Search, 
  Star, 
  MessageSquare, 
  Eye, 
  EyeOff, 
  Trash2, 
  Send,
  User,
  Package,
  Calendar,
  Filter
} from "lucide-react";
import { 
  fetchAdminCommentsRequest, 
  replyCommentRequest, 
  toggleVisibilityRequest, 
  deleteCommentRequest 
} from "../../../services/CommentService";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [replyText, setReplyText] = useState({});
  const [replyingId, setReplyingId] = useState(null);

  const fetchReviews = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        search: searchTerm,
        rating: ratingFilter,
        is_hidden: visibilityFilter,
      };
      const response = await fetchAdminCommentsRequest(params);
      setReviews(response.data.data);
      setPagination(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách đánh giá!");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, ratingFilter, visibilityFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReviews();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchReviews]);

  const handleToggleVisibility = async (id) => {
    try {
      const response = await toggleVisibilityRequest(id);
      toast.success(response.message);
      setReviews(reviews.map(r => r.id === id ? { ...r, is_hidden: !r.is_hidden } : r));
    } catch (error) {
      toast.error("Thao tác thất bại!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    try {
      await deleteCommentRequest(id);
      toast.success("Đã xóa đánh giá.");
      setReviews(reviews.filter(r => r.id !== id));
    } catch (error) {
      toast.error("Không thể xóa đánh giá!");
    }
  };

  const handleReply = async (id) => {
    const content = replyText[id];
    if (!content || content.trim().length < 2) {
      toast.error("Vui lòng nhập nội dung phản hồi!");
      return;
    }

    try {
      setReplyingId(id);
      const response = await replyCommentRequest(id, content);
      toast.success("Đã gửi phản hồi thành công.");
      setReviews(reviews.map(r => r.id === id ? { 
        ...r, 
        admin_reply: content, 
        replied_at: new Date().toISOString() 
      } : r));
      setReplyText({ ...replyText, [id]: "" });
    } catch (error) {
      toast.error("Gửi phản hồi thất bại!");
    } finally {
      setReplyingId(null);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-6">
        {/* Header and Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quản lý đánh giá</h1>
            <p className="text-xs text-gray-500 mt-1">
              Theo dõi và phản hồi nhận xét từ khách hàng
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm sản phẩm, khách hàng..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-4 py-2 bg-gray-50 border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="">Tất cả sao</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>

            <select
              className="px-4 py-2 bg-gray-50 border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all"
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
            >
              <option value="">Trạng thái</option>
              <option value="0">Đang hiện</option>
              <option value="1">Đang ẩn</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
              <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">Không tìm thấy đánh giá nào</p>
              <p className="text-gray-400 text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div 
                key={review.id} 
                className={`bg-white rounded-2xl shadow-sm border p-5 transition-all ${
                  review.is_hidden ? "border-red-100 bg-red-50/10" : "border-gray-100"
                }`}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Customer & Product Info */}
                  <div className="md:w-1/4 flex flex-col gap-3 border-r border-gray-50 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        {review.user?.avatar ? (
                          <img src={review.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-gray-900 truncate">{review.user?.name}</p>
                        <p className="text-[10px] text-gray-400 flex items-center mt-0.5">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(review.created_at), "HH:mm, dd/MM/yyyy", { locale: vi })}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center">
                        <Package className="w-3 h-3 mr-1" /> Sản phẩm
                      </p>
                      <p className="text-xs font-semibold text-gray-700 line-clamp-2 leading-relaxed">
                        {review.product?.name}
                      </p>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      {renderStars(review.rating)}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleToggleVisibility(review.id)}
                          className={`p-2 rounded-xl transition-all ${
                            review.is_hidden 
                            ? "bg-red-100 text-red-600 hover:bg-red-200" 
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                          title={review.is_hidden ? "Hiện đánh giá" : "Ẩn đánh giá"}
                        >
                          {review.is_hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(review.id)}
                          className="p-2 bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                          title="Xóa đánh giá"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 bg-gray-50/50 p-4 rounded-2xl italic leading-relaxed mb-4 border border-gray-100">
                      "{review.content}"
                    </div>

                    {/* Admin Reply Area */}
                    {review.admin_reply ? (
                      <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 relative">
                        <div className="absolute -top-2 left-4 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Phản hồi từ Admin
                        </div>
                        <p className="text-sm text-indigo-900 leading-relaxed pt-1">
                          {review.admin_reply}
                        </p>
                        <p className="text-[10px] text-indigo-400 mt-2 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(review.replied_at), "dd/MM/yyyy", { locale: vi })}
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nhập phản hồi cho khách hàng..."
                          className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 transition-all shadow-sm"
                          value={replyText[review.id] || ""}
                          onChange={(e) => setReplyText({ ...replyText, [review.id]: e.target.value })}
                        />
                        <button 
                          onClick={() => handleReply(review.id)}
                          disabled={replyingId === review.id}
                          className="px-4 py-2 bg-black text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition active:scale-95 disabled:opacity-50"
                        >
                          {replyingId === review.id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Gửi
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => fetchReviews(page)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                  pagination.current_page === page
                    ? "bg-black text-white shadow-lg"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ReviewManagement;
