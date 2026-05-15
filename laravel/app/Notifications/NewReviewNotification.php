<?php

namespace App\Notifications;

use App\Models\Comment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class NewReviewNotification extends Notification
{
    use Queueable;

    protected $comment;

    public function __construct(Comment $comment)
    {
        $this->comment = $comment;
    }

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'new_review',
            'comment_id' => $this->comment->id,
            'product_name' => $this->comment->product->name,
            'customer_name' => $this->comment->user->name,
            'rating' => $this->comment->rating,
            'content' => $this->comment->content,
            'message' => "Khách hàng {$this->comment->user->name} đã đánh giá {$this->comment->rating} sao cho sản phẩm {$this->comment->product->name}",
            'action_url' => "/admin/reviews?id={$this->comment->id}"
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
