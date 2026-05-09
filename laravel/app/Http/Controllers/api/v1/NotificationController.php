<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Lấy danh sách thông báo (phân trang)
     */
    public function index(Request $request)
    {
        $limit = $request->query('limit', 15);
        $notifications = Auth::user()->notifications()->paginate($limit);

        return response()->json([
            'status' => 'success',
            'data' => $notifications
        ]);
    }

    /**
     * Lấy số lượng thông báo chưa đọc
     */
    public function unreadCount()
    {
        return response()->json([
            'status' => 'success',
            'unread_count' => Auth::user()->unreadNotifications()->count()
        ]);
    }

    /**
     * Đánh dấu là đã đọc
     */
    public function markAsRead(Request $request)
    {
        $id = $request->input('id');

        if ($id) {
            Auth::user()->unreadNotifications()->where('id', $id)->first()?->markAsRead();
        } else {
            Auth::user()->unreadNotifications->markAsRead();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Đã đánh dấu đã đọc'
        ]);
    }

    /**
     * Xóa thông báo
     */
    public function destroy($id)
    {
        Auth::user()->notifications()->where('id', $id)->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa thông báo'
        ]);
    }
}
