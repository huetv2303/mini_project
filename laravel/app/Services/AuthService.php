<?php

namespace App\Services;

use App\Models\User;
use App\Interfaces\UserRepositoryInterface;

class AuthService {

    protected $userRepo;
    public function __construct(UserRepositoryInterface $userRepo) {   
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
        if (!$token = auth('api')->attempt($credentials)) {
            return false;
        }

        $user = auth('api')->user();
        if (!$user->hasVerifiedEmail()) {
            auth('api')->logout();
            throw new \Exception('EmailNotVerified');
        }

        return $token;
    }
}