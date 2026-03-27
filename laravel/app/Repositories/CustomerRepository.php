<?php

namespace App\Repositories;

use App\Models\User;
use App\Models\Role;
use App\Interfaces\CustomerRepositoryInterface;
use Illuminate\Support\Facades\Hash;

class CustomerRepository implements CustomerRepositoryInterface
{
    protected function getCustomerRoleId()
    {
        return Role::where('code', 'customer')->first()?->id;
    }

    public function getAllCustomers()
    {
        $roleId = $this->getCustomerRoleId();
        return User::where('role_id', $roleId)->with('customerProfile')->get();
    }

    public function createCustomer(array $data)
    {
        $roleId = $this->getCustomerRoleId();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password'] ?? 'password123'),
            'role_id' => $roleId,
        ]);

        $user->customerProfile()->create([
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'gender' => $data['gender'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
        ]);

        return $user->load('customerProfile');
    }

    public function updateCustomer($id, array $data)
    {
        $user = User::with('customerProfile')->findOrFail($id);

        // Cập nhật thông tin cơ bản của User (avatar nằm ở bảng users)
        $userData = array_intersect_key($data, array_flip(['name', 'email', 'avatar', 'password']));
        if (!empty($userData)) {
            if (isset($userData['password'])) {
                $userData['password'] = Hash::make($userData['password']);
            }
            $user->update($userData);
        }


        // Các trường thuộc về bảng customer_profiles
        $profileFields = ['phone', 'gender', 'date_of_birth', 'address', 'is_active'];
        $profileData = array_intersect_key($data, array_flip($profileFields));

        if (!empty($profileData)) {
            if ($user->customerProfile) {
                $user->customerProfile->update($profileData);
            } else {
                $user->customerProfile()->create(array_merge(['user_id' => $user->id], $profileData));
            }
        }

        return $user->refresh()->load('customerProfile');
    }
    public function deleteCustomer($id)
    {
        $user = User::findOrFail($id);
        return $user->delete();
    }

    public function getCustomerById($id)
    {
        return User::with('customerProfile')->findOrFail($id);
    }
}
