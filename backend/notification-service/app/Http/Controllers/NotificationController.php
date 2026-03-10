<?php
namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // Envoi interne (appelé par les autres services)
    public function send(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|integer',
            'type'    => 'required|string',
            'data'    => 'nullable|array',
        ]);

        $notification = Notification::create([
            'user_id' => $data['user_id'],
            'type'    => $data['type'],
            'data'    => json_encode($data['data'] ?? []),
        ]);

        return response()->json($notification, 201);
    }

    // Mes notifications
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', (int) $request->auth_user_id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        return response()->json($notifications);
    }

    // Marquer comme lu
    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);
        if ((int)$notification->user_id !== (int)$request->auth_user_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $notification->update(['read_at' => now()]);
        return response()->json(['message' => 'Marked as read']);
    }

    // Marquer tout comme lu
    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', (int) $request->auth_user_id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        return response()->json(['message' => 'All marked as read']);
    }

    // Nombre non lus
    public function unreadCount(Request $request)
    {
        $count = Notification::where('user_id', (int) $request->auth_user_id)
            ->whereNull('read_at')
            ->count();
        return response()->json(['unread' => $count]);
    }
}
