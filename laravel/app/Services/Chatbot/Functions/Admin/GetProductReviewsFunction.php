<?php

namespace App\Services\Chatbot\Functions\Admin;

use App\Models\Comment;
use App\Models\Product;
use App\Services\Chatbot\Functions\ChatFunctionInterface;

class GetProductReviewsFunction implements ChatFunctionInterface
{
    public function getName(): string
    {
        return 'getProductReviews';
    }

    public function getDescription(): string
    {
        return 'Lấy danh sách đánh giá của khách hàng cho một sản phẩm cụ thể hoặc toàn bộ cửa hàng để admin theo dõi.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'product_id' => [
                    'type' => 'integer',
                    'description' => 'ID của sản phẩm cần xem đánh giá (tùy chọn).'
                ],
                'rating' => [
                    'type' => 'integer',
                    'description' => 'Lọc theo số sao (1-5).'
                ],
                'limit' => [
                    'type' => 'integer',
                    'description' => 'Số lượng đánh giá cần lấy (mặc định 5).'
                ]
            ]
        ];
    }

    public function execute(array $args): array
    {
        $query = Comment::with(['user:id,name', 'product:id,name']);

        if (isset($args['product_id'])) {
            $query->where('product_id', $args['product_id']);
        }

        if (isset($args['rating'])) {
            $query->where('rating', $args['rating']);
        }

        $limit = $args['limit'] ?? 5;
        $comments = $query->orderBy('created_at', 'desc')->take($limit)->get();

        if ($comments->isEmpty()) {
            return ['message' => 'Không tìm thấy đánh giá nào phù hợp.'];
        }

        return [
            'reviews' => $comments->map(fn($c) => [
                'id' => $c->id,
                'customer' => $c->user->name,
                'product' => $c->product->name,
                'rating' => $c->rating,
                'content' => $c->content,
                'replied' => !empty($c->admin_reply),
                'date' => $c->created_at->format('d/m/Y H:i')
            ])->toArray()
        ];
    }
}
