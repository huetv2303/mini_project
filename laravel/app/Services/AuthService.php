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

        // Nếu là tài khoản Google mà chưa đặt mật khẩu
        if ($user->google_id && !$user->password) {
            throw new \Exception('GoogleAccountOnly');
        }

        if (!$token = auth('api')->attempt($credentials)) {
            throw new \Exception('InvalidCredentials');
        }

        if (!$user->hasVerifiedEmail()) {
            auth('api')->logout();
            throw new \Exception('EmailNotVerified');
        }

        return $token;
    }
}
