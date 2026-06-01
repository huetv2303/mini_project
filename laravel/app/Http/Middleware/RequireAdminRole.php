<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireAdminRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user || !$user->role || $user->role->code !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền thực hiện hành động này. Chỉ Admin mới được phép.',
                'error' => 'permission_denied'
            ], Response::HTTP_FORBIDDEN);
        }
        return $next($request);
    }
}
