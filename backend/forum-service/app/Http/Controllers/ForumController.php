<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class ForumController extends Controller
{
    private function getUser(Request $request): ?array
    {
        $userData = $request->header('X-User-Data');
        if (!$userData) return null;
        return json_decode(base64_decode($userData), true);
    }

    private function notify(int $userId, string $type, array $data, string $actionUrl = '')
    {
        try {
            Http::timeout(3)->post('http://nginx-notification/api/internal/send', [
                'user_id'    => $userId,
                'type'       => $type,
                'data'       => $data,
                'action_url' => $actionUrl,
            ]);
        } catch (\Exception $e) {}
    }

    /** Récupère les avatars à jour depuis user-service pour une liste de user_ids */
    private function fetchAvatars(array $userIds): array
    {
        if (empty($userIds)) return [];
        try {
            $res = Http::timeout(3)->get('http://nginx-user/api/internal/users/avatars', [
                'ids' => implode(',', array_unique($userIds))
            ]);
            if ($res->ok()) return $res->json() ?? [];
        } catch (\Exception $e) {}
        return [];
    }

    // GET /api/forum/courses/{courseId}/posts
    public function getPosts($courseId)
    {
        $posts = DB::table('forum_posts')
            ->where('course_id', $courseId)
            ->orderByDesc('created_at')
            ->get();

        foreach ($posts as $post) {
            $post->replies = DB::table('forum_replies')
                ->where('post_id', $post->id)
                ->orderBy('created_at')
                ->get();
            $post->reply_count = count($post->replies);
        }

        // Collecter tous les user_ids (posts + replies)
        $userIds = [];
        foreach ($posts as $post) {
            $userIds[] = $post->user_id;
            foreach ($post->replies as $reply) {
                $userIds[] = $reply->user_id;
            }
        }

        // Récupérer les avatars à jour
        $avatars = $this->fetchAvatars($userIds);

        // Injecter les avatars à jour dans chaque post/reply
        foreach ($posts as $post) {
            if (isset($avatars[$post->user_id])) {
                $post->user_avatar = $avatars[$post->user_id];
            }
            foreach ($post->replies as $reply) {
                if (isset($avatars[$reply->user_id])) {
                    $reply->user_avatar = $avatars[$reply->user_id];
                }
            }
        }

        return response()->json($posts);
    }

    // POST /api/forum/courses/{courseId}/posts
    public function createPost(Request $request, $courseId)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'body'  => 'required|string',
        ]);

        $user = $this->getUser($request);
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $id = DB::table('forum_posts')->insertGetId([
            'course_id'   => $courseId,
            'user_id'     => $user['id'],
            'user_name'   => $user['name'],
            'user_role'   => $user['role'] ?? 'student',
            'user_avatar' => $user['avatar_url'] ?? null,
            'title'       => $request->title,
            'body'        => $request->body,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        return response()->json(DB::table('forum_posts')->find($id), 201);
    }

    // POST /api/forum/posts/{postId}/replies
    public function createReply(Request $request, $postId)
    {
        $request->validate(['body' => 'required|string']);

        $user = $this->getUser($request);
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $post = DB::table('forum_posts')->find($postId);
        if (!$post) return response()->json(['message' => 'Post not found'], 404);

        $id = DB::table('forum_replies')->insertGetId([
            'post_id'     => $postId,
            'user_id'     => $user['id'],
            'user_name'   => $user['name'],
            'user_role'   => $user['role'] ?? 'student',
            'user_avatar' => $user['avatar_url'] ?? null,
            'body'        => $request->body,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        $reply = DB::table('forum_replies')->find($id);

        if ($post->user_id != $user['id']) {
            $this->notify(
                $post->user_id,
                'forum_reply',
                [
                    'message'    => $user['name'] . ' a répondu à votre discussion : ' . $post->title,
                    'post_title' => $post->title,
                    'reply_by'   => $user['name'],
                    'course_id'  => $post->course_id,
                ],
                '/courses/' . $post->course_id . '/forum'
            );
        }

        return response()->json($reply, 201);
    }

    // PUT /api/forum/posts/{postId}
    public function updatePost(Request $request, $postId)
    {
        $request->validate(['title' => 'required|string|max:255', 'body' => 'required|string']);
        $user = $this->getUser($request);
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $post = DB::table('forum_posts')->find($postId);
        if (!$post) return response()->json(['message' => 'Not found'], 404);
        if ($post->user_id != $user['id'] && !in_array($user['role'], ['teacher', 'admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        DB::table('forum_posts')->where('id', $postId)->update([
            'title'      => $request->title,
            'body'       => $request->body,
            'updated_at' => now(),
        ]);

        return response()->json(DB::table('forum_posts')->find($postId));
    }

    // DELETE /api/forum/posts/{postId}
    public function deletePost(Request $request, $postId)
    {
        $user = $this->getUser($request);
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $post = DB::table('forum_posts')->find($postId);
        if (!$post) return response()->json(['message' => 'Not found'], 404);

        if ($post->user_id != $user['id'] && !in_array($user['role'], ['teacher', 'admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        DB::table('forum_replies')->where('post_id', $postId)->delete();
        DB::table('forum_posts')->where('id', $postId)->delete();

        return response()->json(['message' => 'Deleted']);
    }

    // PUT /api/internal/update-avatar (appelé par user-service)
    public function updateAvatar(Request $request)
    {
        $userId    = $request->input('user_id');
        $avatarUrl = $request->input('avatar_url');
        if (!$userId || !$avatarUrl) return response()->json(['message' => 'Missing params'], 422);
        DB::table('forum_posts')->where('user_id', $userId)->update(['user_avatar' => $avatarUrl, 'updated_at' => now()]);
        DB::table('forum_replies')->where('user_id', $userId)->update(['user_avatar' => $avatarUrl, 'updated_at' => now()]);
        return response()->json(['message' => 'Avatar updated']);
    }

    // DELETE /api/forum/replies/{replyId}
    public function deleteReply(Request $request, $replyId)
    {
        $user = $this->getUser($request);
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $reply = DB::table('forum_replies')->find($replyId);
        if (!$reply) return response()->json(['message' => 'Not found'], 404);

        if ($reply->user_id != $user['id'] && !in_array($user['role'], ['teacher', 'admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        DB::table('forum_replies')->where('id', $replyId)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
