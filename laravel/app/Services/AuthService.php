<?php

namespace App\Services;

use App\Models\User;
use App\Interfaces\UserRepositoryInterface;

class AuthService
{

    protected $userRepo;
    public function __construct(UserRepositoryInterface $userRepo)
    {
        $this->userRepo = $userRepo;
    }
    public function register(array $data)
    {
        $user = $this->userRepo->createUser($data);
        $user->sendEmailVerificationNotification();
        return $user;
    }

    public function login(array $credentials)
    {
        $user = User::where('email', $credentials['email'])->first();

        if (!$user) {
            throw new \Exception('InvalidCredentials');
        }

        if (!$user->is_active || ($user->customerProfile && !$user->customerProfile->is_active)) {
            throw new \Exception('AccountLocked');
        }

        if ($user->google_id && !$user->password) {
            throw new \Exception('GoogleAccountOnly');
        }

        if (!$token = auth('api')->attempt($credentials)) {
            $user->increment('failed_attempts');
            if ($user->failed_attempts >= 5) {
                $user->update(['is_active' => false]);
                if ($user->customerProfile) {
                    $user->customerProfile->update(['is_active' => false]);
                }
                throw new \Exception('AccountLocked');
            }
            $remaining = 5 - $user->failed_attempts;
            throw new \Exception("InvalidCredentials|{$remaining}");
        }

        if (!$user->hasVerifiedEmail()) {
            auth('api')->logout();
            throw new \Exception('EmailNotVerified');
        }

        // Reset failed attempts upon successful login
        if ($user->failed_attempts > 0) {
            $user->update(['failed_attempts' => 0]);
        }

        return $token;
    }
}
