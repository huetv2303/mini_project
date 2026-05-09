<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Order $order) {}

    public function broadcastOn(): array
    {
        // Gửi đến customer (nếu có) VÀ admin
        $channels = [new PrivateChannel('admin')];
        if ($this->order->customer_id) {
            $channels[] = new PrivateChannel('user.' . $this->order->customer_id);
        }
        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'order.status.updated';
    }

    public function broadcastWith(): array
    {
        $statusLabels = [
            'pending'    => 'Chờ xác nhận',
            'confirmed'  => 'Đã xác nhận',
            'processing' => 'Đang xử lý',
            'shipping'   => 'Đang giao hàng',
            'delivered'  => 'Đã giao hàng',
            'completed'  => 'Hoàn thành',
            'cancelled'  => 'Đã hủy',
            'refunded'   => 'Đã hoàn tiền',
        ];

        return [
            'id'          => $this->order->id,
            'code'        => $this->order->code,
            'status'      => $this->order->status,
            'status_label'=> $statusLabels[$this->order->status] ?? $this->order->status,
            'customer_id' => $this->order->customer_id,
            'updated_at'  => $this->order->updated_at?->toIso8601String(),
        ];
    }
}
