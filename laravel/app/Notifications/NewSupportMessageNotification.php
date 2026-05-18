<?php

namespace App\Notifications;

use App\Models\SupportMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class NewSupportMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public SupportMessage $supportMessage) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase(object $notifiable): array
    {
        $senderName = $this->supportMessage->sender ? $this->supportMessage->sender->name : 'Khách hàng';
        
        return [
            'type'        => 'support_message',
            'title'       => 'Tin nhắn hỗ trợ mới!',
            'message'     => "{$senderName}: " . mb_strimwidth($this->supportMessage->message, 0, 45, '...'),
            'icon'        => '💬',
            'color'       => 'green',
            'message_id'  => $this->supportMessage->id,
            'customer_id' => $this->supportMessage->customer_id,
            'action_url'  => '/admin/support',
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }
}
