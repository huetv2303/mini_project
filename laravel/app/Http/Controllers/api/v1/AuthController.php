<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Services\AuthService;

class AuthController extends Controller
{
    protected $userService;
    public function __construct(AuthService $userService)
    {
        $this->userService = $userService;
    }
    public function register(RegisterRequest $request)
    {
        $validatedData = $request->validated();

        $user = $this->userService->register($validatedData);

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user,
            'status' => 200,
        ], 200);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        try {
            $token = $this->userService->login($credentials);
        } catch (\Exception $e) {
            $status = 401;
            $message = 'Tài khoản hoặc mật khẩu không chính xác.';

            if ($e->getMessage() === 'EmailNotVerified') {
                $status = 403;
                $message = 'Vui lòng xác nhận email trước khi đăng nhập.';
            } elseif ($e->getMessage() === 'GoogleAccountOnly') {
                $status = 422;
                $message = 'Tài khoản này đã đăng ký qua Google. Vui lòng sử dụng tính năng "Đăng nhập với Google".';
            }

            return response()->json([
                'message' => $message,
                'status' => $status
            ], $status);
        }

        return $this->createNewToken($token);
    }

    public function verify(Request $request, $id, $hash)
    {
        if (!$request->hasValidSignature()) {
            return response()->json(['message' => 'Đường dẫn xác nhận đã hết hạn hoặc không hợp lệ.'], 400);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Người dùng không tồn tại.'], 404);
        }

        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Mã xác nhận không khớp.'], 400);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email đã được xác nhận.'], 200);
        }

        if ($user->markEmailAsVerified()) {
            event(new \Illuminate\Auth\Events\Verified($user));
        }

        return response()->json(['message' => 'Email xác nhận thành công.']);
    }

    public function resendVerificationEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = \App\Models\User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Người dùng không tồn tại.'], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email đã được xác nhận.'], 200);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Đã gửi lại email xác nhận.']);
    }

    public function logout()
    {
        auth('api')->logout();
        return response()->json(['message' => 'Successfully logged out']);
    }

    public function changePassword(Request $request)
    {
        $user = auth('api')->user();

        if ($user->password) {
            $request->validate([
                'old_password' => 'required|string',
                'password' => 'required|string|min:8|confirmed',
            ], [
                'old_password.required' => 'Mật khẩu cũ không được để trống.',
                'password.required' => 'Mật khẩu mới không được để trống.',
                'password.min' => 'Mật khẩu mới phải có ít nhất 8 ký tự.',
                'password.confirmed' => 'Mật khẩu xác nhận không khớp.',
            ]);

            if (!Hash::check($request->old_password, $user->password)) {
                return response()->json([
                    'message' => 'Mật khẩu cũ không chính xác.',
                    'status' => 422
                ], 422);
            }
        } else {
            $request->validate([
                'password' => 'required|string|min:8|confirmed',
            ], [
                'password.required' => 'Mật khẩu mới không được để trống.',
                'password.min' => 'Mật khẩu mới phải có ít nhất 8 ký tự.',
                'password.confirmed' => 'Mật khẩu xác nhận không khớp.',
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'message' => 'Đổi mật khẩu thành công.',
            'status' => 200
        ]);
    }

    protected function createNewToken($token)
    {
        $user = auth('api')->user()->load(['role.permissions', 'customerProfile']);
        return response()->json([
            'access_token' => $token,
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => new UserResource($user)
        ]);
    }
}
