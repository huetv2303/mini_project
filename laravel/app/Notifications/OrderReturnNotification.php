<?php

namespace App\Notifications;

use App\Models\OrderReturn;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class OrderReturnNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public OrderReturn $orderReturn) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'order_return_requested',
            'title' => 'Yêu cầu trả hàng mới',
            'message' => "Đơn hàng #{$this->orderReturn->order->code} yêu cầu trả hàng.",
            'icon' => '🔄',
            'color' => 'orange',
            'order_id' => $this->orderReturn->order_id,
            'return_id' => $this->orderReturn->id,
            'action_url' => "/admin/order-returns/{$this->orderReturn->id}",
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
