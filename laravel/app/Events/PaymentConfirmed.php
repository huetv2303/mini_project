<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentConfirmed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Order $order) {}

    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('admin')];
        if ($this->order->customer_id) {
            $channels[] = new PrivateChannel('user.' . $this->order->customer_id);
        }
        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'payment.confirmed';
    }

    public function broadcastWith(): array
    {
        return [
            'id'             => $this->order->id,
            'code'           => $this->order->code,
            'final_amount'   => $this->order->final_amount,
            'payment_status' => $this->order->payment_status,
            'customer_id'    => $this->order->customer_id,
            'confirmed_at'   => now()->toIso8601String(),
        ];
    }
}
