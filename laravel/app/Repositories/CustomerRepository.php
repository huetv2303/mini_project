<?php

namespace App\Repositories;

use App\Models\User;
use App\Models\Role;
use App\Interfaces\CustomerRepositoryInterface;
use App\Models\CustomerProfile;
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
        return User::where('role_id', $roleId)->with('customerProfile')->paginate(15);
    }

    public function searchCustomers(string $query)
    {
        $roleId = $this->getCustomerRoleId();
        return User::where('role_id', $roleId)
            ->with('customerProfile')
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%")
                  ->orWhereHas('customerProfile', function ($qp) use ($query) {
                      $qp->where('phone', 'like', "%{$query}%");
                  });
            })
            ->limit(10)
            ->get();
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

        $userData = array_intersect_key($data, array_flip(['name', 'email', 'avatar', 'password']));
        if (!empty($userData)) {
            if (isset($userData['password'])) {
                $userData['password'] = Hash::make($userData['password']);
            }
            $user->update($userData);
        }

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
    public function bulkUpdateStatus(array $ids, bool $isActive)
    {
        return CustomerProfile::whereIn('user_id', $ids)->update(['is_active' => $isActive]);
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
