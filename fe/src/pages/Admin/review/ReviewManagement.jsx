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
  Filter,
} from "lucide-react";
import {
  fetchAdminCommentsRequest,
  replyCommentRequest,
  toggleVisibilityRequest,
  deleteCommentRequest,
} from "../../../services/CommentService";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Pagination from "../../../components/common/Pagination";

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [pagination, setPagination] = useState({
    total: 0,
    lastPage: 1,
    perPage: 15,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [replyText, setReplyText] = useState({});
  const [replyingId, setReplyingId] = useState(null);

  const fetchReviews = useCallback(
    async (page = 1, perPageCount = 15) => {
      try {
        setLoading(true);
        const params = {
          page,
          search: searchTerm,
          rating: ratingFilter,
          is_hidden: visibilityFilter,
          per_page: perPageCount,
        };
        const response = await fetchAdminCommentsRequest(params);
        setReviews(response.data.data);
        setPagination({
          currentPage: response.data.current_page || 1,
          lastPage: response.data.last_page || 1,
          total: response.data.total || 0,
          perPage: response.data.per_page || perPageCount,
        });
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải danh sách đánh giá!");
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, ratingFilter, visibilityFilter],
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      fetchReviews(newPage, itemsPerPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReviews(1, itemsPerPage);
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchReviews, itemsPerPage]);

  const handleToggleVisibility = async (id) => {
    try {
      const response = await toggleVisibilityRequest(id);
      toast.success(response.message);
      setReviews(
        reviews.map((r) =>
          r.id === id ? { ...r, is_hidden: !r.is_hidden } : r,
        ),
      );
    } catch (error) {
      toast.error("Thao tác thất bại!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    try {
      await deleteCommentRequest(id);
      toast.success("Đã xóa đánh giá.");
      setReviews(reviews.filter((r) => r.id !== id));
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
      setReviews(
        reviews.map((r) =>
          r.id === id
            ? {
                ...r,
                admin_reply: content,
                replied_at: new Date().toISOString(),
              }
            : r,
        ),
      );
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
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        {/* Header and Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Quản lý đánh giá
            </h1>
            <p className="text-xs text-slate-500 mt-1 italic">
              Theo dõi và phản hồi nhận xét từ khách hàng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm sản phẩm, khách hàng..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 transition-all font-semibold text-slate-600"
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
              className="px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 transition-all font-semibold text-slate-600"
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
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse space-y-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-50 rounded w-1/4"></div>
                    <div className="h-3 bg-slate-50/50 rounded w-1/6"></div>
                  </div>
                </div>
                <div className="h-16 bg-slate-50 rounded-xl"></div>
              </div>
            ))
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-200 text-center">
              <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-slate-500 font-bold">
                Không tìm thấy đánh giá nào
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className={`bg-white rounded-xl border p-5 transition-all shadow-sm ${
                  review.is_hidden
                    ? "border-rose-100 bg-rose-50/10"
                    : "border-slate-100"
                }`}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Customer & Product Info */}
                  <div className="md:w-1/4 flex flex-col gap-3 border-r border-slate-100 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100/50 flex items-center justify-center flex-shrink-0">
                        {review.user?.avatar ? (
                          <img
                            src={review.user.avatar}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {review.user?.name}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center mt-0.5 font-semibold">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(
                            new Date(review.created_at),
                            "HH:mm, dd/MM/yyyy",
                            { locale: vi },
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                        <Package className="w-3 h-3 mr-1" /> Sản phẩm
                      </p>
                      <p className="text-xs font-bold text-slate-700 line-clamp-2 leading-relaxed">
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
                              ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                          title={
                            review.is_hidden ? "Hiện đánh giá" : "Ẩn đánh giá"
                          }
                        >
                          {review.is_hidden ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="p-2 bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                          title="Xóa đánh giá"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-slate-700 bg-slate-50/30 p-4 rounded-xl italic leading-relaxed mb-4 border border-slate-100">
                      "{review.content}"
                    </div>

                    {/* Admin Reply Area */}
                    {review.admin_reply ? (
                      <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100 relative">
                        <div className="absolute -top-2 left-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Phản hồi từ Admin
                        </div>
                        <p className="text-sm text-blue-900 font-semibold leading-relaxed pt-1">
                          {review.admin_reply}
                        </p>
                        <p className="text-[10px] text-blue-400 font-semibold mt-2 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(review.replied_at), "dd/MM/yyyy", {
                            locale: vi,
                          })}
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nhập phản hồi cho khách hàng..."
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm text-slate-800 font-semibold"
                          value={replyText[review.id] || ""}
                          onChange={(e) =>
                            setReplyText({
                              ...replyText,
                              [review.id]: e.target.value,
                            })
                          }
                        />
                        <button
                          onClick={() => handleReply(review.id)}
                          disabled={replyingId === review.id}
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 hover:from-blue-700 hover:to-indigo-700 transition active:scale-95 disabled:opacity-50 shadow-md shadow-blue-500/20"
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
        <div className=" bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            label="đánh giá"
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReviewManagement;
