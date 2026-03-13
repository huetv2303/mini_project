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
       return $this->userRepo->createUser($data);
    }

    public function login(array $credentials)
    {
        if (!$token = auth('api')->attempt($credentials)) {
            return false;
        }

        return $token;
    }
}