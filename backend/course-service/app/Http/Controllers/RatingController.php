<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
class RatingController extends Controller
{
    public function store(Request $request, $courseId)
    {
        $userId = (int) $request->auth_user_id;
        $enrolled = DB::table('enrollments')
            ->where('user_id', $userId)->where('course_id', $courseId)->exists();
        if (!$enrolled) {
            return response()->json(['message' => 'Vous devez etre inscrit pour noter ce cours.'], 403);
        }
        $validated = $request->validate([
            'stars'   => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);
        DB::table('ratings')->updateOrInsert(
            ['course_id' => $courseId, 'user_id' => $userId],
            [
                'stars'      => $validated['stars'],
                'comment'    => $validated['comment'] ?? null,
                'user_name'  => $request->auth_user_name ?? 'Etudiant',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );
        return response()->json(['message' => 'Note enregistree.']);
    }
    public function myRating(Request $request, $courseId)
    {
        $rating = DB::table('ratings')
            ->where('course_id', $courseId)
            ->where('user_id', (int) $request->auth_user_id)
            ->first();
        return response()->json($rating);
    }
    public function stats($courseId)
    {
        $ratings = DB::table('ratings')->where('course_id', $courseId)->get();
        if ($ratings->isEmpty()) {
            return response()->json([
                'average' => null, 'count' => 0,
                'distribution' => [1=>0,2=>0,3=>0,4=>0,5=>0], 'comments' => []
            ]);
        }
        $dist = [1=>0,2=>0,3=>0,4=>0,5=>0];
        foreach ($ratings as $r) { $dist[$r->stars]++; }
        $comments = DB::table('ratings')
            ->where('course_id', $courseId)
            ->whereNotNull('comment')
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get(['stars', 'comment', 'updated_at', 'user_name', 'user_id']);

        $userIds = $comments->pluck('user_id')->toArray();
        $avatars = [];
        try {
            $res = Http::post('http://nginx-user/api/internal/students-by-ids', ['ids' => $userIds]);
            foreach ($res->json() as $u) {
                $avatars[$u['auth_id']] = $u['avatar_url'] ?? null;
            }
        } catch (\Exception $e) {}

        $comments = $comments->map(function($c) use ($avatars) {
            return [
                'stars'      => $c->stars,
                'comment'    => $c->comment,
                'updated_at' => $c->updated_at,
                'user_name'  => $c->user_name,
                'avatar_url' => $avatars[$c->user_id] ?? null,
            ];
        });

        return response()->json([
            'average'      => round($ratings->avg('stars'), 1),
            'count'        => $ratings->count(),
            'distribution' => $dist,
            'comments'     => $comments,
        ]);
    }
    public function destroy(Request $request, $courseId)
    {
        DB::table('ratings')
            ->where('course_id', $courseId)
            ->where('user_id', (int) $request->auth_user_id)
            ->delete();
        return response()->json(['message' => 'Note supprimee.']);
    }
}
