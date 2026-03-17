<?php
namespace App\Interfaces;

interface UserRepositoryInterface {
    public function createUser(array $data);
    public function getAllUsers();
    public function updateRole($userId, $roleId);
}