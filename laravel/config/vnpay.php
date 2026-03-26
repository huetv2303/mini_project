<?php

return [
    'tmn_code' => env('VNP_TMN_CODE', ''),
    'hash_secret' => env('VNP_HASH_SECRET', ''),
    'url' => env('VNP_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
    'return_url' => env('VNP_RETURN_URL', 'http://localhost:3000/admin/payment-result'),
];
