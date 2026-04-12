<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ForumController extends Controller
{
    // Récupérer le user depuis le token JWT (passé en header)
    private function getUser(Request $request): ?array
    {
        $userData = $request->header('X-User-Data');
        if (!$userData) return null;
        return json_decode(base64_decode($userData), true);
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
            'course_id' => $courseId,
            'user_id'     => $user['id'],
            'user_name'   => $user['name'],
            'user_role'   => $user['role'] ?? 'student',
            'user_avatar' => $user['avatar_url'] ?? null,
            'title'       => $request->title,
            'body'      => $request->body,
            'created_at'=> now(),
            'updated_at'=> now(),
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
            'body'      => $request->body,
            'created_at'=> now(),
            'updated_at'=> now(),
        ]);

        return response()->json(DB::table('forum_replies')->find($id), 201);
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
            'title' => $request->title,
            'body'  => $request->body,
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

        // Seul l'auteur ou un teacher/admin peut supprimer
        if ($post->user_id != $user['id'] && !in_array($user['role'], ['teacher', 'admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        DB::table('forum_replies')->where('post_id', $postId)->delete();
        DB::table('forum_posts')->where('id', $postId)->delete();

        return response()->json(['message' => 'Deleted']);
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
