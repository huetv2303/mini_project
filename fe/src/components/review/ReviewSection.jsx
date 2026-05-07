import React, { useState, useEffect } from "react";
import CommentList from "./CommentList";
import CommentForm from "./CommentForm";
import StarRating from "./StarRating";
import {
  fetchCommentsRequest,
  checkCanReviewRequest,
} from "../../services/CommentService";
import { getToken } from "../../services/AuthService";

const ReviewSection = ({ productId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [stats, setStats] = useState({ average: 0, count: 0 });

  useEffect(() => {
    fetchData();
    checkReviewPermission();
  }, [productId]);

  const fetchData = async () => {
    try {
      const data = await fetchCommentsRequest(productId);
      if (data.status === "success") {
        const commentData = data.data.data || [];
        setComments(commentData);

        if (commentData.length > 0) {
          const avg =
            commentData.reduce((acc, curr) => acc + curr.rating, 0) /
            commentData.length;
          setStats({
            average: avg,
            count: data.data.total || commentData.length,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkReviewPermission = async () => {
    if (!getToken()) return;

    try {
      const data = await checkCanReviewRequest(productId);
      setCanReview(data.can_review);
      if (data.can_review && data.eligible_orders) {
        setEligibleOrders(data.eligible_orders);

        // Parse order_id from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const urlOrderId = urlParams.get("order_id");

        if (
          urlOrderId &&
          data.eligible_orders.some((o) => o.id == urlOrderId)
        ) {
          setSelectedOrderId(urlOrderId);
        } else if (data.eligible_orders.length > 0) {
          setSelectedOrderId(data.eligible_orders[0].id);
        }
      }
    } catch (error) {
      console.error("Error checking review permission:", error);
    }
  };

  const handleNewComment = (newComment) => {
    setComments([newComment, ...comments]);
    setStats({
      average:
        (stats.average * stats.count + newComment.rating) / (stats.count + 1),
      count: stats.count + 1,
    });
    checkReviewPermission(); // Cập nhật lại quyền đánh giá và danh sách đơn hàng
  };

  return (
    <div id="reviews" className="mt-16 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-gray-100 pb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Đánh giá từ khách hàng
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full">
              <StarRating rating={stats.average} size={18} />
              <span className="font-bold text-yellow-700">
                {Number(stats.average || 0).toFixed(1)}
              </span>
            </div>
            <span className="text-gray-500 font-medium">
              ({stats.count} nhận xét)
            </span>
          </div>
        </div>
      </div>

      <div className="mb-12">
        {canReview && (
          <div className="space-y-6">
            {eligibleOrders.length > 1 && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                <p className="text-sm text-blue-700 font-medium mb-2">
                  Chọn đơn hàng bạn muốn đánh giá:
                </p>
                <div className="flex flex-wrap gap-2">
                  {eligibleOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedOrderId == order.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"}`}
                    >
                      #{order.code} ({order.date})
                    </button>
                  ))}
                </div>
              </div>
            )}
            <CommentForm
              productId={productId}
              orderId={selectedOrderId}
              onSubmitSuccess={handleNewComment}
            />
          </div>
        )}

        {!canReview && !getToken() && (
          <p className="text-sm text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg font-medium">
            Vui lòng đăng nhập để đánh giá sản phẩm.
          </p>
        )}

        {!canReview && getToken() && (
          <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg font-medium">
            Bạn cần mua và nhận hàng thành công qua website để đánh giá sản phẩm
            này.
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <CommentList comments={comments} />
      )}
    </div>
  );
};

export default ReviewSection;
