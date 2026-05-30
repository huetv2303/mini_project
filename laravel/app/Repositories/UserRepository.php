<?php

namespace App\Repositories;

use App\Models\User;
use App\Models\Role;
use App\Interfaces\UserRepositoryInterface;
use App\Models\CustomerProfile;
use Illuminate\Support\Facades\Hash;

class UserRepository implements UserRepositoryInterface
{
    public function getAllUsers()
    {
        return User::with('role', 'customerProfile')->get();
    }

    public function createUser(array $data)
    {
        $roleId = $data['role_id'] ?? null;

        if (!$roleId) {
            $defaultRole = Role::where('code', 'customer')->first();
            $roleId = $defaultRole ? $defaultRole->id : null;
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role_id' => $roleId,
        ]);

        if ($roleId) {
            $customerRole = Role::where('code', 'customer')->first();
            if ($customerRole && $roleId == $customerRole->id) {
                CustomerProfile::create([
                    'user_id' => $user->id,
                ]);
            }
        }

        return $user;
    }

    public function getUserById($id)
    {
        return User::with('role', 'customerProfile')->findOrFail($id);
    }

    public function updateUser($id, array $data)
    {
        $user = User::findOrFail($id);

        $updateData = [
            'name' => $data['name'] ?? $user->name,
            'email' => $data['email'] ?? $user->email,
        ];

        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        if (isset($data['role_id'])) {
            $updateData['role_id'] = $data['role_id'];
        }

        if (isset($data['is_active'])) {
            $updateData['is_active'] = $data['is_active'];
            if ($data['is_active']) {
                $updateData['failed_attempts'] = 0;
            }
        }

        $user->update($updateData);

        // Nếu chuyển sang role customer mà chưa có profile thì tạo mới
        $customerRole = Role::where('code', 'customer')->first();
        if ($customerRole && $user->role_id == $customerRole->id) {
            if (!$user->customerProfile) {
                CustomerProfile::create(['user_id' => $user->id]);
            }
        }

        return $user->load('role', 'customerProfile');
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        return $user->delete();
    }

    public function updateRole($userId, $roleId)
    {
        $user = User::findOrFail($userId);
        $user->update(['role_id' => $roleId]);

        // Nếu chuyển sang role customer mà chưa có profile thì tạo mới
        $customerRole = Role::where('code', 'customer')->first();
        if ($customerRole && $roleId == $customerRole->id) {
            if (!$user->customerProfile) {
                CustomerProfile::create(['user_id' => $user->id]);
            }
        }

        return $user->load('role', 'customerProfile');
    }
}
