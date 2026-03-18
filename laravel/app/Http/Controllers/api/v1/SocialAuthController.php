<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use App\Http\Resources\UserResource;

class SocialAuthController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
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
                $defaultRole = Role::where('code', 'staff')->first();

                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'google_id' => $googleUser->id,
                    'avatar' => $googleUser->avatar,
                    'password' => null,
                    'email_verified_at' => now(),
                    'role_id' => $defaultRole ? $defaultRole->id : null,
                ]);
            }
        } else {
            $user->update(['avatar' => $googleUser->avatar]);
        }

        $token = auth('api')->login($user);

        return redirect(env('FRONTEND_URL') . '/login?token=' . $token);
    }
}
