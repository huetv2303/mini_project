<?php

use Illuminate\Support\Facades\Broadcast;


Broadcast::channel('admin', function ($user) {
    // Chỉ admin mới được nghe kênh này
    return $user->role && $user->role->name === 'admin';
});

Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

