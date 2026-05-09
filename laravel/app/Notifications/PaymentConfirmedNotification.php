<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class PaymentConfirmedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase(object $notifiable): array
    {
        $isAdmin = $notifiable->role && $notifiable->role->code === 'admin';
        $url = $isAdmin ? '/admin/orders/' . $this->order->id : '/orders/' . $this->order->id;

        return [
            'type'       => 'payment_confirmed',
            'title'      => 'Thanh toán thành công!',
            'message'    => "Đơn hàng #{$this->order->code} đã được thanh toán " . number_format($this->order->final_amount) . 'đ',
            'icon'       => '💳',
            'color'      => 'green',
            'order_id'   => $this->order->id,
            'order_code' => $this->order->code,
            'amount'     => $this->order->final_amount,
            'action_url' => $url,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }
}
