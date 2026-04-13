<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MessagingController extends Controller
{
    private function getUser(Request $request): ?array
    {
        $userData = $request->header('X-User-Data');
        if (!$userData) return null;
        return json_decode(base64_decode($userData), true);
    }

    // GET /api/messaging/conversations
    public function conversations(Request $request)
    {
        $user = $this->getUser($request);
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $convs = DB::table('conversations')
            ->where('user1_id', $user['id'])
            ->orWhere('user2_id', $user['id'])
            ->orderByDesc('last_message_at')
            ->get();

        foreach ($convs as $conv) {
            // Dernier message
            $last = DB::table('messages')
                ->where('conversation_id', $conv->id)
                ->orderByDesc('created_at')
                ->first();
            $conv->last_message = $last?->body ?? '';
            $conv->last_message_time = $last?->created_at ?? $conv->created_at;

            // Non lus
            $conv->unread = DB::table('messages')
                ->where('conversation_id', $conv->id)
                ->where('sender_id', '!=', $user['id'])
                ->whereNull('read_at')
                ->count();

            // L'autre utilisateur
            if ($conv->user1_id == $user['id']) {
                $conv->other_id     = $conv->user2_id;
                $conv->other_name   = $conv->user2_name;
                $conv->other_avatar = $conv->user2_avatar;
            } else {
                $conv->other_id     = $conv->user1_id;
                $conv->other_name   = $conv->user1_name;
                $conv->other_avatar = $conv->user1_avatar;
            }
        }

        return response()->json($convs);
    }

    // POST /api/messaging/conversations
    public function startConversation(Request $request)
    {
        $user = $this->getUser($request);
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate([
            'other_id'     => 'required|integer',
            'other_name'   => 'required|string',
            'other_avatar' => 'nullable|string',
        ]);

        $u1 = min($user['id'], $request->other_id);
        $u2 = max($user['id'], $request->other_id);

        $existing = DB::table('conversations')
            ->where('user1_id', $u1)
            ->where('user2_id', $u2)
            ->first();

        if ($existing) return response()->json($existing);

        $id = DB::table('conversations')->insertGetId([
            'user1_id'     => $u1,
            'user1_name'   => $u1 == $user['id'] ? $user['name'] : $request->other_name,
            'user1_avatar' => $u1 == $user['id'] ? ($user['avatar_url'] ?? null) : $request->other_avatar,
            'user2_id'     => $u2,
            'user2_name'   => $u2 == $user['id'] ? $user['name'] : $request->other_name,
            'user2_avatar' => $u2 == $user['id'] ? ($user['avatar_url'] ?? null) : $request->other_avatar,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        return response()->json(DB::table('conversations')->find($id), 201);
    }

    // GET /api/messaging/conversations/{id}/messages
    public function messages(Request $request, $convId)
    {
        $user = $this->getUser($request);
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $conv = DB::table('conversations')->find($convId);
        if (!$conv) return response()->json(['message' => 'Not found'], 404);
        if ($conv->user1_id != $user['id'] && $conv->user2_id != $user['id']) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Marquer comme lus
        DB::table('messages')
            ->where('conversation_id', $convId)
            ->where('sender_id', '!=', $user['id'])
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = DB::table('messages')
            ->where('conversation_id', $convId)
            ->orderBy('created_at')
            ->get();

        return response()->json($messages);
    }

    // POST /api/messaging/conversations/{id}/messages
    public function sendMessage(Request $request, $convId)
    {
        $user = $this->getUser($request);
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate(['body' => 'required|string']);

        $conv = DB::table('conversations')->find($convId);
        if (!$conv) return response()->json(['message' => 'Not found'], 404);
        if ($conv->user1_id != $user['id'] && $conv->user2_id != $user['id']) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $id = DB::table('messages')->insertGetId([
            'conversation_id' => $convId,
            'sender_id'       => $user['id'],
            'sender_name'     => $user['name'],
            'sender_avatar'   => $user['avatar_url'] ?? null,
            'body'            => $request->body,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        DB::table('conversations')->where('id', $convId)->update([
            'last_message_at' => now(),
            'updated_at'      => now(),
        ]);

        return response()->json(DB::table('messages')->find($id), 201);
    }

    // GET /api/messaging/conversations/{id}/stream (SSE)
    public function stream(Request $request, $convId): StreamedResponse
    {
        $user = $this->getUser($request);
        $lastId = (int) ($request->query('lastId', 0));

        return response()->stream(function () use ($convId, $user, $lastId) {
            echo "retry: 3000\n\n";
            ob_flush(); flush();

            $start = time();
            while ((time() - $start) < 25) {
                $messages = DB::table('messages')
                    ->where('conversation_id', $convId)
                    ->where('id', '>', $lastId)
                    ->orderBy('id')
                    ->get();

                if ($messages->isNotEmpty()) {
                    foreach ($messages as $m) {
                        echo "id: {$m->id}\n";
                        echo "data: " . json_encode($m) . "\n\n";
                        $lastId = $m->id;
                    }
                    ob_flush(); flush();
                } else {
                    echo ": ping\n\n";
                    ob_flush(); flush();
                }

                sleep(2);
                if (connection_aborted()) break;
            }
        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection'        => 'keep-alive',
        ]);
    }

    // GET /api/messaging/unread-count
    public function unreadCount(Request $request)
    {
        $user = $this->getUser($request);
        if (!$user) return response()->json(['unread' => 0]);

        $convIds = DB::table('conversations')
            ->where('user1_id', $user['id'])
            ->orWhere('user2_id', $user['id'])
            ->pluck('id');

        $count = DB::table('messages')
            ->whereIn('conversation_id', $convIds)
            ->where('sender_id', '!=', $user['id'])
            ->whereNull('read_at')
            ->count();

        return response()->json(['unread' => $count]);
    }

    // DELETE /api/messaging/conversations/{id}
    public function deleteConversation(Request $request, $id)
    {
        $user = $this->getUser($request);
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);
        $conv = DB::table('conversations')->find($id);
        if (!$conv) return response()->json(['message' => 'Not found'], 404);
        if ($conv->user1_id != $user['id'] && $conv->user2_id != $user['id']) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        DB::table('messages')->where('conversation_id', $id)->delete();
        DB::table('conversations')->where('id', $id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // POST /api/messaging/upload
    public function uploadFile(Request $request)
    {
        $user = $this->getUser($request);
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate(['file' => 'required|file|max:10240']);

        $path = $request->file('file')->store('messaging', 'public');
        $url  = url('storage/' . $path);

        return response()->json(['url' => $url, 'name' => $request->file('file')->getClientOriginalName()]);
    }
}
