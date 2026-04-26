<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
class EnsureEnrolled
{
    public function handle(Request $request, Closure $next)
    {
        $userId   = $request->auth_user_id;
        $userRole = $request->auth_user_role ?? '';
        $courseId = $request->route('courseId') ?? $request->route('id');

        if (!$userId || !$courseId) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        // Teachers et admins ont toujours accès
        if (in_array($userRole, ['teacher', 'admin'])) {
            return $next($request);
        }

        try {
            $response = Http::timeout(3)
                ->withHeaders(['Authorization' => $request->header('Authorization')])
                ->get(env('COURSE_SERVICE_URL', 'http://nginx-course') . '/api/my-courses');
            if ($response->successful()) {
                $enrolled = collect($response->json())
                    ->contains(fn($e) => (int)($e['course_id'] ?? 0) === (int)$courseId
                                      && ($e['status'] ?? '') === 'active');
                if ($enrolled) return $next($request);
            }
        } catch (\Exception $e) {
            $enrolled = \Illuminate\Support\Facades\DB::table('enrollments')
                ->where('user_id', $userId)
                ->where('course_id', $courseId)
                ->where('status', 'active')
                ->exists();
            if ($enrolled) return $next($request);
        }

        return response()->json(['error' => 'Vous devez être inscrit à ce cours'], 403);
    }
}
