<?php

namespace App\Notifications;

use App\Models\Comment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class ReviewRepliedNotification extends Notification
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
            'type' => 'review_replied',
            'comment_id' => $this->comment->id,
            'product_name' => $this->comment->product->name,
            'admin_reply' => $this->comment->admin_reply,
            'message' => "Quản trị viên đã phản hồi đánh giá của bạn về sản phẩm {$this->comment->product->name}",
            'action_url' => "/my-reviews"
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
