<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Models\SupportMessage;
use App\Models\User;
use App\Events\SupportMessageSent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupportChatController extends Controller
{
    /**
     * CUSTOMER: Get all messages in their conversation
     */
    public function getCustomerMessages(Request $request)
    {
        $customerId = $request->user()->id;

        $messages = SupportMessage::where('customer_id', $customerId)
            ->orderBy('created_at', 'asc')
            ->with('sender.role')
            ->get();

        return response()->json($messages);
    }

    /**
     * CUSTOMER: Send a new message
     */
    public function sendCustomerMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
        ]);

        $customerId = $request->user()->id;

        $message = SupportMessage::create([
            'sender_id' => $customerId,
            'customer_id' => $customerId,
            'message' => $request->message,
            'is_read' => false,
        ]);

        // Trigger real-time broadcast
        broadcast(new SupportMessageSent($message))->toOthers();

        // Gửi thông báo hệ thống (Database notification + private broadcast) đến tất cả các admin
        try {
            $admins = User::whereHas('role', function($query) {
                $query->where('code', 'admin');
            })->get();
            
            \Illuminate\Support\Facades\Notification::send($admins, new \App\Notifications\NewSupportMessageNotification($message));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to notify admins for support message: " . $e->getMessage());
        }

        return response()->json($message->load('sender.role'));
    }

    /**
     * ADMIN: Get list of active support conversations
     */
    public function getAdminConversations(Request $request)
    {
        // Get unique customer_ids with their last message time
        $conversations = SupportMessage::select('customer_id', DB::raw('MAX(created_at) as last_message_at'))
            ->groupBy('customer_id')
            ->orderBy('last_message_at', 'desc')
            ->get();

        $data = $conversations->map(function ($convo) {
            $customer = User::find($convo->customer_id);
            if (!$customer) return null;

            $lastMessage = SupportMessage::where('customer_id', $convo->customer_id)
                ->orderBy('created_at', 'desc')
                ->first();

            $unreadCount = SupportMessage::where('customer_id', $convo->customer_id)
                ->where('sender_id', $convo->customer_id) // Sent by customer
                ->where('is_read', false)
                ->count();

            return [
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'avatar' => $customer->avatar,
                ],
                'last_message' => [
                    'message' => $lastMessage ? $lastMessage->message : '',
                    'sender_id' => $lastMessage ? $lastMessage->sender_id : null,
                    'created_at' => $lastMessage ? $lastMessage->created_at->toIso8601String() : null,
                ],
                'unread_count' => $unreadCount,
                'last_message_at' => $convo->last_message_at,
            ];
        })->filter()->values();

        return response()->json($data);
    }

    /**
     * ADMIN: Get messages for a specific customer
     */
    public function getAdminMessages(Request $request, $customerId)
    {
        $messages = SupportMessage::where('customer_id', $customerId)
            ->orderBy('created_at', 'asc')
            ->with('sender.role')
            ->get();

        // Proactively mark customer messages as read when admin opens the conversation
        SupportMessage::where('customer_id', $customerId)
            ->where('sender_id', $customerId)
            ->update(['is_read' => true]);

        return response()->json($messages);
    }

    /**
     * ADMIN: Send a reply to the customer
     */
    public function sendAdminReply(Request $request, $customerId)
    {
        $request->validate([
            'message' => 'required|string',
        ]);

        $adminId = $request->user()->id;

        $message = SupportMessage::create([
            'sender_id' => $adminId,
            'customer_id' => $customerId,
            'message' => $request->message,
            'is_read' => true, // Admin's own messages are automatically read by admin
        ]);

        // Trigger real-time broadcast
        broadcast(new SupportMessageSent($message))->toOthers();

        return response()->json($message->load('sender.role'));
    }

    /**
     * ADMIN/CUSTOMER: Mark conversation as read
     */
    public function markAsRead(Request $request, $customerId)
    {
        $user = $request->user();
        
        if ($user->id == $customerId) {
            // Customer reading Admin messages
            SupportMessage::where('customer_id', $customerId)
                ->where('sender_id', '!=', $customerId)
                ->update(['is_read' => true]);
        } else {
            // Admin reading Customer messages
            SupportMessage::where('customer_id', $customerId)
                ->where('sender_id', $customerId)
                ->update(['is_read' => true]);
        }

        return response()->json(['success' => true]);
    }
}
