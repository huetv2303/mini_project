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

    public function updateRole($userId, $roleId)
    {
        $user = User::findOrFail($userId);
        $user->update(['role_id' => $roleId]);
        return $user->load('role');
    }
}
