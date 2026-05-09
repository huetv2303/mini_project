<?php

namespace App\Events;

use App\Models\ProductVariant;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LowStockAlert implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ProductVariant $variant, public int $threshold = 10) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('admin')];
    }

    public function broadcastAs(): string
    {
        return 'stock.low';
    }

    public function broadcastWith(): array
    {
        return [
            'variant_id'   => $this->variant->id,
            'product_name' => $this->variant->product?->name,
            'sku'          => $this->variant->sku,
            'stock'        => $this->variant->stock,
            'threshold'    => $this->threshold,
            'alerted_at'   => now()->toIso8601String(),
        ];
    }
}
