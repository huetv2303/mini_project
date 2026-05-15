<?php

namespace App\Services;

use App\Models\User;
use App\Models\WalletTransaction;
use App\Notifications\WalletBalanceUpdatedNotification;
use Illuminate\Support\Facades\DB;

class WalletService
{
    /**
     * Nạp tiền vào ví (Hoàn tiền, nạp thủ công)
     */
    public function deposit(User $user, $amount, $referenceType = null, $referenceId = null, $description = null)
    {
        return DB::transaction(function () use ($user, $amount, $referenceType, $referenceId, $description) {
            $balanceBefore = $user->wallet_balance;
            $balanceAfter = $balanceBefore + $amount;

            // Cập nhật số dư User
            $user->update(['wallet_balance' => $balanceAfter]);

            $transaction = WalletTransaction::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'type' => 'deposit',
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'description' => $description,
            ]);

            // Gửi thông báo
            $user->notify(new WalletBalanceUpdatedNotification($amount, 'deposit', $description, $balanceAfter));

            return $transaction;
        });
    }

    /**
     * Trừ tiền từ ví (Thanh toán đơn hàng)
     */
    public function withdraw(User $user, $amount, $referenceType = null, $referenceId = null, $description = null)
    {
        return DB::transaction(function () use ($user, $amount, $referenceType, $referenceId, $description) {
            if ($user->wallet_balance < $amount) {
                throw new \Exception('Số dư ví không đủ để thực hiện giao dịch.');
            }

            $balanceBefore = $user->wallet_balance;
            $balanceAfter = $balanceBefore - $amount;

            // Cập nhật số dư User
            $user->update(['wallet_balance' => $balanceAfter]);

            $transaction = WalletTransaction::create([
                'user_id' => $user->id,
                'amount' => -$amount,
                'type' => 'withdraw',
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'description' => $description,
            ]);

            // Gửi thông báo
            $user->notify(new WalletBalanceUpdatedNotification(-$amount, 'withdraw', $description, $balanceAfter));

            return $transaction;
        });
    }
}
