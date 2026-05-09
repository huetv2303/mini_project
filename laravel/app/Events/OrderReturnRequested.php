<?php

namespace App\Events;

use App\Models\OrderReturn;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderReturnRequested implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public OrderReturn $orderReturn) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('admin')];
    }

    public function broadcastAs(): string
    {
        return 'order.return.requested';
    }

    public function broadcastWith(): array
    {
        return [
            'id'           => $this->orderReturn->id,
            'order_id'     => $this->orderReturn->order_id,
            'order_code'   => $this->orderReturn->order?->code,
            'reason'       => $this->orderReturn->reason,
            'total_amount' => $this->orderReturn->total_amount,
            'created_at'   => $this->orderReturn->created_at?->toIso8601String(),
        ];
    }
}
