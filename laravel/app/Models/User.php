<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject, MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'google_id',
        'avatar',
        'wallet_balance',
        'failed_attempts',
        'is_active',
    ];

    /**
     * Relationship với Role
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Relationship với CustomerProfile
     */
    public function customerProfile()
    {
        return $this->hasOne(CustomerProfile::class);
    }

    /**
     * Relationship trực tiếp với Permission qua bảng user_permissions
     */
    public function permissions(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permissions')
                    ->withPivot('is_direct')
                    ->withTimestamps();
    }

    /**
     * Kiểm tra User có Permission cụ thể không (bao gồm quyền từ Vai trò và trực tiếp)
     */
    public function hasPermission(string $permissionCode): bool
    {
        // 1. Kiểm tra từ quyền gán trực tiếp
        if ($this->permissions()->where('code', $permissionCode)->exists()) {
            return true;
        }

        // 2. Kiểm tra từ vai trò của người dùng
        if (!$this->role) {
            return false;
        }

        return $this->role->permissions()->where('code', $permissionCode)->exists();
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [];
    }

    public function sendEmailVerificationNotification()
    {
        $this->notify(new \App\Notifications\VerifyEmailNotification);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Route notifications for the broadcast channel.
     */
    public function receivesBroadcastNotificationsOn(): string
    {
        return 'user.'.$this->id;
    }

    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }
}
