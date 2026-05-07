<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CommentController extends Controller
{
    /**
     * Get comments for a product.
     */
    public function index($productId)
    {
        $comments = Comment::with('user:id,name,avatar')
            ->where('product_id', $productId)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $comments
        ]);
    }

    /**
     * Store a new comment.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'order_id'   => 'required|exists:orders,id',
            'content'    => 'required|string|min:3',
            'rating'     => 'required|integer|min:1|max:5',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first()
            ], 422);
        }

        $user = Auth::user();
        $productId = $request->product_id;
        $orderId = $request->order_id;

        // Check if this specific order has already been commented for this product
        $existingComment = Comment::where('order_id', $orderId)
            ->where('product_id', $productId)
            ->first();

        if ($existingComment) {
            return response()->json([
                'status' => 'error',
                'message' => 'Đơn hàng này đã được đánh giá cho sản phẩm này.'
            ], 400);
        }

        // Check if user has purchased and received the product in this specific order
        if (!$this->canUserReview($user->id, $productId, $orderId)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Đơn hàng không hợp lệ, chưa nhận hàng hoặc không phải từ website.'
            ], 403);
        }

        $comment = Comment::create([
            'user_id' => $user->id,
            'product_id' => $productId,
            'order_id' => $orderId,
            'content' => $request->content,
            'rating' => $request->rating,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Đánh giá của bạn đã được gửi thành công.',
            'data' => $comment->load('user:id,name,avatar')
        ]);
    }


    public function checkCanReview($productId)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['can_review' => false, 'reason' => 'not_logged_in']);
        }

        // Find orders that are delivered, from website, have this product, and NO comment yet
        $eligibleOrders = Order::where('customer_id', $user->id)
            ->where('source', 'web')
            ->where('status', 'delivered')
            ->whereHas('items', function ($query) use ($productId) {
                $query->where('product_id', $productId);
            })
            ->whereDoesntHave('comments', function ($query) use ($productId) {
                $query->where('product_id', $productId);
            })
            ->get();

        if ($eligibleOrders->isEmpty()) {
            return response()->json([
                'can_review' => false,
                'reason' => 'no_eligible_order',
                'message' => 'Bạn chưa mua sản phẩm này trên website hoặc đơn hàng chưa hoàn tất/đã đánh giá rồi.'
            ]);
        }

        return response()->json([
            'can_review' => true,
            'eligible_orders' => $eligibleOrders->map(fn($o) => [
                'id' => $o->id,
                'code' => $o->code,
                'date' => $o->created_at->format('d/m/Y')
            ])
        ]);
    }

    private function canUserReview($userId, $productId, $orderId = null)
    {
        $query = Order::where('customer_id', $userId)
            ->where('source', 'web')
            ->whereIn('status', ['delivered', 'completed', 'success'])
            ->whereHas('items', function ($query) use ($productId) {
                $query->where('product_id', $productId);
            });

        if ($orderId) {
            $query->where('id', $orderId);
        }

        return $query->exists();
    }

    /**
     * Delete a comment (Owner or Admin).
     */
    public function destroy($id)
    {
        $comment = Comment::findOrFail($id);
        $user = Auth::user();

        // Only owner or admin can delete
        if ($comment->user_id !== $user->id && $user->role->code !== 'admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'Bạn không có quyền xóa đánh giá này.'
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Đánh giá đã được xóa.'
        ]);
    }
}
