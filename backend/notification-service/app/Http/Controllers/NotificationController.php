<?php
namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotificationController extends Controller
{
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

    public function stream(Request $request): StreamedResponse
    {
        $userId = (int) $request->auth_user_id;
        $lastId = (int) ($request->query('lastId', 0));

        return response()->stream(function () use ($userId, $lastId) {
            // Headers SSE
            echo "retry: 3000\n\n";
            ob_flush(); flush();

            $maxTime = 25;
            $start   = time();

            while ((time() - $start) < $maxTime) {
                $notifications = Notification::where('user_id', $userId)
                    ->where('id', '>', $lastId)
                    ->orderBy('id', 'asc')
                    ->get();

                if ($notifications->isNotEmpty()) {
                    foreach ($notifications as $n) {
                        $payload = json_encode([
                            'id'         => $n->id,
                            'type'       => $n->type,
                            'data'       => json_decode($n->data, true),
                            'read_at'    => $n->read_at,
                            'created_at' => $n->created_at,
                        ]);
                        echo "id: {$n->id}\n";
                        echo "data: {$payload}\n\n";
                        $lastId = $n->id;
                    }
                    ob_flush(); flush();
                } else {
                    // Heartbeat
                    echo ": ping\n\n";
                    ob_flush(); flush();
                }

                sleep(3);

                if (connection_aborted()) break;
            }
        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection'        => 'keep-alive',
        ]);
    }

    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', (int) $request->auth_user_id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        return response()->json($notifications);
    }

    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);
        if ((int)$notification->user_id !== (int)$request->auth_user_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $notification->update(['read_at' => now()]);
        return response()->json(['message' => 'Marked as read']);
    }

    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', (int) $request->auth_user_id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        return response()->json(['message' => 'All marked as read']);
    }

    public function unreadCount(Request $request)
    {
        $count = Notification::where('user_id', (int) $request->auth_user_id)
            ->whereNull('read_at')
            ->count();
        return response()->json(['unread' => $count]);
    }
}
