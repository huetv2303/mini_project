<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class OrderPlacedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'     => 'order_placed',
            'title'    => 'Đơn hàng mới!',
            'message'  => "#{$this->order->code} - {$this->order->customer_name} - " . number_format($this->order->final_amount) . 'đ',
            'icon'     => '🛍️',
            'color'    => 'blue',
            'order_id' => $this->order->id,
            'order_code' => $this->order->code,
            'action_url' => '/admin/orders/' . $this->order->id,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }
}
