<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
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
            if (!$token = $this->userService->login($credentials)) {
                return response()->json([
                    'message' => 'Unauthorized',
                    'status' => 401
                ], 401);
            }
        } catch (\Exception $e) {
            if ($e->getMessage() === 'EmailNotVerified') {
                return response()->json([
                    'message' => 'Vui lòng xác nhận email trước khi đăng nhập.',
                    'status' => 403
                ], 403);
            }
            throw $e;
        }

        return $this->createNewToken($token);
    }

    public function verify(Request $request, $id, $hash)
    {
        // Kiểm tra chữ ký hợp lệ của Laravel
        if (!$request->hasValidSignature()) {
            return response()->json(['message' => 'Đường dẫn xác nhận đã hết hạn hoặc không hợp lệ.'], 400);
        }

        $user = \App\Models\User::find($id);

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

    protected function createNewToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => auth('api')->user()
        ]);
    }
}