<?php
namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotificationController extends Controller
{
    // ──────────────────────────────────────────────────────────────────
    // POST /api/internal/send  (interne — appelé par les autres services)
    // ──────────────────────────────────────────────────────────────────
    public function send(Request $request)
    {
        $data = $request->validate([
            'user_id'    => 'required|integer',
            'type'       => 'required|string',
            'data'       => 'nullable|array',
            'priority'   => 'nullable|in:low,medium,high',
            'action_url' => 'nullable|string|max:500',
        ]);

        // Récupère l'icône et la priorité par défaut selon le type
        $meta = Notification::metaForType($data['type']);

        $notification = Notification::create([
            'user_id'    => $data['user_id'],
            'type'       => $data['type'],
            'data'       => json_encode($data['data'] ?? []),
            'priority'   => $data['priority'] ?? $meta['priority'],
            'icon'       => $meta['icon'],
            'action_url' => $data['action_url'] ?? ($data['data']['action_url'] ?? null),
        ]);

        return response()->json($notification, 201);
    }

    // ──────────────────────────────────────────────────────────────────
    // GET /api/notifications  (liste paginée avec filtres)
    // ──────────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Notification::where('user_id', (int) $request->auth_user_id)
            ->orderBy('created_at', 'desc');

        // Filtre non-lus seulement
        if ($request->query('unread') === 'true') {
            $query->whereNull('read_at');
        }

        // Filtre par priorité
        if ($priority = $request->query('priority')) {
            $query->where('priority', $priority);
        }

        // Filtre par type
        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        $notifications = $query->paginate(20);

        // Transformer data JSON
        $notifications->getCollection()->transform(function ($n) {
            $n->data = json_decode($n->data, true) ?? [];
            return $n;
        });

        return response()->json($notifications);
    }

    // ──────────────────────────────────────────────────────────────────
    // GET /api/notifications/stream  (SSE)
    // ──────────────────────────────────────────────────────────────────
    public function stream(Request $request): StreamedResponse
    {
        $userId = (int) $request->auth_user_id;
        $lastId = (int) ($request->query('lastId', 0));

        return response()->stream(function () use ($userId, $lastId) {
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
                            'priority'   => $n->priority,
                            'icon'       => $n->icon,
                            'action_url' => $n->action_url,
                            'read_at'    => $n->read_at,
                            'created_at' => $n->created_at,
                        ]);
                        echo "id: {$n->id}\n";
                        echo "data: {$payload}\n\n";
                        $lastId = $n->id;
                    }
                    ob_flush(); flush();
                } else {
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

    // ──────────────────────────────────────────────────────────────────
    // GET /api/notifications/stats  (résumé pour le dashboard)
    // ──────────────────────────────────────────────────────────────────
    public function stats(Request $request)
    {
        $userId = (int) $request->auth_user_id;
        $total  = Notification::where('user_id', $userId)->count();
        $unread = Notification::where('user_id', $userId)->whereNull('read_at')->count();

        $byType = Notification::where('user_id', $userId)
            ->selectRaw('type, count(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type');

        $byPriority = Notification::where('user_id', $userId)
            ->selectRaw('priority, count(*) as count')
            ->groupBy('priority')
            ->pluck('count', 'priority');

        return response()->json([
            'total'       => $total,
            'unread'      => $unread,
            'by_type'     => $byType,
            'by_priority' => $byPriority,
        ]);
    }

    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);
        if ((int) $notification->user_id !== (int) $request->auth_user_id) {
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

    public function destroy(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);
        if ((int) $notification->user_id !== (int) $request->auth_user_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $notification->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function clearAll(Request $request)
    {
        Notification::where('user_id', (int) $request->auth_user_id)->delete();
        return response()->json(['message' => 'All notifications cleared']);
    }
}
