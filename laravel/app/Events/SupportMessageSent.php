<?php

namespace App\Events;

use App\Models\SupportMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SupportMessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    /**
     * Create a new event instance.
     */
    public function __construct(SupportMessage $message)
    {
        $this->message = $message;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin'),
            new PrivateChannel('user.' . $this->message->customer_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'support.message.sent';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        // Load relationships if they are not already loaded
        if (!$this->message->relationLoaded('sender')) {
            $this->message->load('sender.role');
        }

        return [
            'message' => [
                'id' => $this->message->id,
                'sender_id' => $this->message->sender_id,
                'customer_id' => $this->message->customer_id,
                'message' => $this->message->message,
                'is_read' => $this->message->is_read,
                'created_at' => $this->message->created_at->toIso8601String(),
                'sender' => [
                    'id' => $this->message->sender->id,
                    'name' => $this->message->sender->name,
                    'avatar' => $this->message->sender->avatar,
                    'role_code' => $this->message->sender->role ? $this->message->sender->role->code : 'customer',
                ],
            ],
        ];
    }
}
