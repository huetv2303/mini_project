<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class OrderPendingPaymentNotification extends Notification
{
    use Queueable;

    public function __construct(public Order $order) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase(object $notifiable): array
    {
        $url = '/orders/' . $this->order->id;

        return [
            'type'       => 'order_pending_payment',
            'title'      => 'Đơn hàng đang chờ thanh toán',
            'message'    => "Đơn hàng #{$this->order->code} của bạn đang chờ thanh toán chuyển khoản.",
            'icon'       => '💳',
            'color'      => 'orange',
            'order_id'   => $this->order->id,
            'order_code' => $this->order->code,
            'status'     => 'pending',
            'action_url' => $url,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }
}
