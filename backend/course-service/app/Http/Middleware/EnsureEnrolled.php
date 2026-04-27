<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class EnsureEnrolled
{
    public function handle(Request $request, Closure $next)
    {
        $userId   = $request->auth_user_id;
        $courseId = $request->route('courseId') ?? $request->route('id');
        if (!$userId || !$courseId) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }
        // Admin et teacher ont toujours accès
        $role = $request->auth_user_role ?? '';
        if (in_array($role, ['admin', 'teacher'])) {
            return $next($request);
        }
        // Instructor du cours a toujours accès
        $isInstructor = DB::table('courses')
            ->where('id', $courseId)
            ->where('instructor_id', $userId)
            ->exists();
        if ($isInstructor) {
            return $next($request);
        }
        // Vérifier l'inscription
        $enrolled = DB::table('enrollments')
            ->where('user_id', $userId)
            ->where('course_id', $courseId)
            ->where('status', 'active')
            ->exists();
        if (!$enrolled) {
            return response()->json([
                'error' => 'Vous devez être inscrit à ce cours pour accéder à ce contenu'
            ], 403);
        }
        return $next($request);
    }
}
