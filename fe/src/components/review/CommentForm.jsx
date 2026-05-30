import React, { useState } from "react";
import StarRating from "./StarRating";
import { toast } from "react-hot-toast";
import { storeCommentRequest } from "../../services/CommentService";

const CommentForm = ({ productId, orderId, onSubmitSuccess }) => {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }

    setLoading(true);
    try {
      const data = await storeCommentRequest({
        product_id: productId,
        order_id: orderId,
        content,
        rating,
      });

      if (data.status === "success") {
        toast.success(data.message);
        setContent("");
        setRating(5);
        if (onSubmitSuccess) onSubmitSuccess(data.data);
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại sau";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-50 mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        Viết đánh giá của bạn
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chất lượng sản phẩm
          </label>
          <div className="bg-gray-50 p-4 rounded-xl flex justify-center">
            <StarRating
              rating={rating}
              interactive
              size={32}
              onRatingChange={setRating}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chia sẻ trải nghiệm của bạn
          </label>
          <textarea
            rows="4"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none bg-gray-50 hover:bg-white"
            placeholder="Sản phẩm rất tốt, giao hàng nhanh..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Đang gửi...
            </div>
          ) : (
            "Gửi đánh giá"
          )}
        </button>
      </form>
    </div>
  );
};

export default CommentForm;
