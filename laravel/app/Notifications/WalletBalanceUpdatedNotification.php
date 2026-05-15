<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class WalletBalanceUpdatedNotification extends Notification
{
    use Queueable;

    protected $amount;
    protected $type;
    protected $description;
    protected $newBalance;

    public function __construct($amount, $type, $description, $newBalance)
    {
        $this->amount = $amount;
        $this->type = $type;
        $this->description = $description;
        $this->newBalance = $newBalance;
    }

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable): array
    {
        $message = $this->amount > 0 
            ? "Tài khoản của bạn đã được cộng " . number_format($this->amount) . "đ. " . $this->description
            : "Tài khoản của bạn đã bị trừ " . number_format(abs($this->amount)) . "đ. " . $this->description;

        return [
            'title' => $this->amount > 0 ? 'Biến động số dư (+)' : 'Biến động số dư (-)',
            'message' => $message,
            'amount' => $this->amount,
            'new_balance' => $this->newBalance,
            'type' => 'wallet_update',
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
