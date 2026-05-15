<?php
namespace App\Interfaces;

interface UserRepositoryInterface {
    public function createUser(array $data);
    public function getAllUsers();
    public function getUserById($id);
    public function updateUser($id, array $data);
    public function deleteUser($id);
    public function updateRole($userId, $roleId);
}