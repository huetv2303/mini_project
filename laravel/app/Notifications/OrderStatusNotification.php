<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class OrderStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private array $statusConfig = [
        'pending'    => ['title' => 'Đặt hàng thành công',   'icon' => '🛒', 'color' => 'blue'],
        'confirmed'  => ['title' => 'Đơn hàng đã xác nhận', 'icon' => '✅', 'color' => 'green'],
        'processing' => ['title' => 'Đơn hàng đang xử lý',  'icon' => '⚙️', 'color' => 'yellow'],
        'shipped'    => ['title' => 'Đơn hàng đang giao',    'icon' => '🚚', 'color' => 'blue'],
        'delivered'  => ['title' => 'Đã giao hàng thành công', 'icon' => '📦', 'color' => 'green'],
        'completed'  => ['title' => 'Đơn hàng hoàn thành',   'icon' => '🎉', 'color' => 'green'],
        'cancelled'  => ['title' => 'Đơn hàng đã bị hủy',    'icon' => '❌', 'color' => 'red'],
        'refunded'   => ['title' => 'Hoàn tiền thành công',   'icon' => '💰', 'color' => 'purple'],
    ];

    public function __construct(public Order $order) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase(object $notifiable): array
    {
        $config = $this->statusConfig[$this->order->status] ?? [
            'title' => 'Cập nhật đơn hàng',
            'icon'  => '📋',
            'color' => 'gray',
        ];

        $isAdmin = $notifiable->role && $notifiable->role->code === 'admin';
        $url = $isAdmin ? '/admin/orders/' . $this->order->id : '/orders/' . $this->order->id;

        return [
            'type'       => 'order_status_updated',
            'title'      => $config['title'],
            'message'    => "Đơn hàng #{$this->order->code} " . strtolower($config['title']),
            'icon'       => $config['icon'],
            'color'      => $config['color'],
            'order_id'   => $this->order->id,
            'order_code' => $this->order->code,
            'status'     => $this->order->status,
            'action_url' => $url,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }
}
