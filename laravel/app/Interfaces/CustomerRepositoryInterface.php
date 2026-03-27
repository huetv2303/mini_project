<?php

namespace App\Interfaces;

interface CustomerRepositoryInterface
{
    public function getAllCustomers();
    public function searchCustomers(string $query);
    public function createCustomer(array $data);
    public function updateCustomer($id, array $data);
    public function bulkUpdateStatus(array $ids, bool $isActive);
    public function deleteCustomer($id);
    public function getCustomerById($id);
}
