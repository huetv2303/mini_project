<?php

namespace App\Repositories;

use App\Models\Customer;
use App\Interfaces\CustomerRepositoryInterface;

class CustomerRepository implements CustomerRepositoryInterface
{
    public function getAllCustomers()
    {
        return Customer::all();
    }
    public function getCustomerById($id)
    {
        return Customer::find($id);
    }
    public function createCustomer(array $data)
    {
        return Customer::create($data);
    }

    public function updateCustomer($id, array $data)
    {
        $customer = Customer::findOrFail($id);
        return $customer->update($data);
    }

    public function deleteCustomer($id)
    {
        $customer = Customer::findOrFail($id);
        return $customer->delete();
    }
}
