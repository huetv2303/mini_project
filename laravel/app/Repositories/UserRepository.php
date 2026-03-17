<?php
namespace App\Repositories;

use App\Models\User;
use App\Models\Role;
use App\Interfaces\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;

class UserRepository implements UserRepositoryInterface
{
    public function getAllUsers()
    {
        return User::with('role')->get();
    }

    public function createUser(array $data)
    {
        $roleId = $data['role_id'] ?? null;

        if (!$roleId) {
            $defaultRole = Role::where('code', 'staff')->first();
            $roleId = $defaultRole ? $defaultRole->id : null;
        }

        return User::create([
            'name' => $data['name'],
            'email'=> $data['email'],
            'password'=> Hash::make($data['password']),
            'role_id' => $roleId,
        ]);
    }

    public function updateRole($userId, $roleId)
    {
        $user = User::findOrFail($userId);
        $user->update(['role_id' => $roleId]);
        return $user->load('role');
    }
}
