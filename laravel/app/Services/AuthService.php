<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\UserRepository;

class AuthService {

    protected $userRepo;
    public function __construct(UserRepository $userRepo) {   
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