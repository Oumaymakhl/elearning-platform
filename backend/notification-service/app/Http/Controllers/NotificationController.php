<?php

namespace App\Http\Controllers;

use App\Events\NotificationRequested;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function send(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer',
            'type' => 'required|string',
            'data' => 'nullable|array',
        ]);

        event(new NotificationRequested(
            $request->user_id,
            $request->type,
            $request->data ?? []
        ));

        return response()->json(['message' => 'Notification queued'], 202);
    }

    public function index(Request $request)
    {
        $userId = auth()->id();
        $notifications = \App\Models\Notification::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        return response()->json($notifications);
    }

    public function markAsRead($id)
    {
        $notification = \App\Models\Notification::find($id);
        if (!$notification) {
            return response()->json(['message' => 'Not found'], 404);
        }
        if ($notification->user_id != auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $notification->update(['read_at' => now()]);
        return response()->json(['message' => 'Marked as read']);
    }
}
