<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use App\Http\Resources\UserResource;
use App\Models\CustomerProfile;

class SocialAuthController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')
            ->stateless()
            ->with(['prompt' => 'select_account'])
            ->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            return redirect(env('FRONTEND_URL') . '/login?error=Google authentication failed');
        }

        // Tìm user theo google_id
        $user = User::where('google_id', $googleUser->id)->first();

        if (!$user) {
            // Nếu chưa có google_id, tìm theo email
            $user = User::where('email', $googleUser->email)->first();

            if ($user) {
                // Nếu tìm thấy email, cập nhật google_id và avatar
                $user->update([
                    'google_id' => $googleUser->id,
                    'avatar' => $googleUser->avatar,
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ]);
            } else {
                // Nếu chưa có cả email, tạo user mới
                $defaultRole = Role::where('code', 'customer')->first();

                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'google_id' => $googleUser->id,
                    'avatar' => $googleUser->avatar,
                    'password' => null,
                    'email_verified_at' => null,
                    'role_id' => 4,
                ]);

                // Create customer profile if role is customer
                if ($defaultRole && $defaultRole->code === 'customer') {
                    CustomerProfile::create([
                        'user_id' => $user->id,
                    ]);
                }

                // Gửi email xác nhận
                $user->sendEmailVerificationNotification();
            }
        } else {
            $user->update(['avatar' => $googleUser->avatar]);
        }

        if (is_null($user->email_verified_at)) {
            return redirect(env('FRONTEND_URL') . '/login?error=Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập.');
        }

        $token = auth('api')->login($user);

        return redirect(env('FRONTEND_URL') . '/login?token=' . $token);
    }
}
