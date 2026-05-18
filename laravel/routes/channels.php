<?php

use Illuminate\Support\Facades\Broadcast;


Broadcast::channel('admin', function ($user) {
    // Cho phép admin/staff có quyền quản lý được nghe kênh này
    return $user->role && (
        $user->role->code === 'admin' || 
        $user->role->name === 'admin' || 
        $user->hasPermission('admin.manage')
    );
});

Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

