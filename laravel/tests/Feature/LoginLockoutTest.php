<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginLockoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_failed_login_attempts_increment_and_lockout_user()
    {
        // 1. Create a user
        $user = User::factory()->create([
            'email' => 'lockout@example.com',
            'password' => Hash::make('secret123'),
            'failed_attempts' => 0,
            'is_active' => true,
        ]);

        // 2. Perform 4 wrong attempts
        for ($i = 1; $i <= 4; $i++) {
            $response = $this->postJson('/api/v1/login', [
                'email' => 'lockout@example.com',
                'password' => 'wrongpassword',
            ]);

            $response->assertStatus(401);
            $remaining = 5 - $i;
            $response->assertJsonFragment([
                'message' => "Mật khẩu không chính xác. Bạn còn {$remaining} lần thử trước khi tài khoản bị khóa.",
                'status' => 401,
            ]);

            $user->refresh();
            $this->assertEquals($i, $user->failed_attempts);
            $this->assertTrue((bool)$user->is_active);
        }

        // 3. The 5th wrong attempt locks the account
        $response = $this->postJson('/api/v1/login', [
            'email' => 'lockout@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(403);
        $adminPhone = env('ADMIN_PHONE', '0987654321');
        $response->assertJsonFragment([
            'message' => "Tài khoản của bạn đã bị khóa do nhập sai mật khẩu quá 5 lần. Vui lòng liên hệ Admin qua SĐT: {$adminPhone} để được hỗ trợ.",
            'status' => 403,
        ]);

        $user->refresh();
        $this->assertEquals(5, $user->failed_attempts);
        $this->assertFalse((bool)$user->is_active);

        // 4. Any subsequent login attempts (even with correct password) fail immediately
        $response = $this->postJson('/api/v1/login', [
            'email' => 'lockout@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(403);
        $response->assertJsonFragment([
            'message' => "Tài khoản của bạn đã bị khóa do nhập sai mật khẩu quá 5 lần. Vui lòng liên hệ Admin qua SĐT: {$adminPhone} để được hỗ trợ.",
            'status' => 403,
        ]);
    }

    public function test_successful_login_resets_failed_attempts()
    {
        // 1. Create a user with some failed attempts
        $user = User::factory()->create([
            'email' => 'reset@example.com',
            'password' => Hash::make('secret123'),
            'failed_attempts' => 3,
            'is_active' => true,
        ]);

        // 2. Log in with the correct password
        $response = $this->postJson('/api/v1/login', [
            'email' => 'reset@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'access_token',
            'expires_in',
            'user',
        ]);

        $user->refresh();
        $this->assertEquals(0, $user->failed_attempts);
    }

    public function test_unlocking_user_resets_failed_attempts_and_sets_active()
    {
        $user = User::factory()->create([
            'email' => 'unlock_test@example.com',
            'failed_attempts' => 5,
            'is_active' => false,
        ]);
        $user->customerProfile()->create([
            'is_active' => false,
        ]);

        $repo = app(\App\Interfaces\CustomerRepositoryInterface::class);
        $repo->updateCustomer($user->id, [
            'is_active' => true,
        ]);

        $user->refresh();
        $this->assertTrue((bool)$user->is_active);
        $this->assertTrue((bool)$user->customerProfile->is_active);
        $this->assertEquals(0, $user->failed_attempts);
    }
}
