<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    protected $fillable = [
        'user_id',
        'session_id',
        'role',
        'content'
    ];

    /**
     * Relationship với User (nếu user đã đăng nhập)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
