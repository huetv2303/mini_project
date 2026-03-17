<?php

namespace App\Services;

use App\Interfaces\CustomerRepositoryInterface;
use App\Models\Customer;

class CustomerService
{

    protected $customerRepo;

    public function __construct(CustomerRepositoryInterface $customerRepo)
    {
        $this->customerRepo = $customerRepo;
    }
    public function getAll()
    {
        return $this->customerRepo->getAllCustomers();
    }

    public function createCustomer(array $data)
    {
        if (empty($data['code'])) {
            $data['code'] = 'CUS' . time() . rand(100, 999);
        }
        if (!empty($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        }
        return $this->customerRepo->createCustomer($data);
    }

    public function updateCustomer($id, array $data)
    {
        if (!empty($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        }
        return $this->customerRepo->updateCustomer($id, $data);
    }

    public function destroyCustomer($id)
    {
        return $this->customerRepo->deleteCustomer($id);
    }

    public function getCustomerById($id)
    {
        return $this->customerRepo->getCustomerById($id);
    }
}
