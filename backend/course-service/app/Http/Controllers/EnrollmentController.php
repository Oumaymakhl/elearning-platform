<?php
namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class EnrollmentController extends Controller
{
    public function myCourses(Request $request) {
        $enrollments = Enrollment::with('course')->where('user_id', $request->auth_user_id)->get();
        foreach ($enrollments as $enrollment) {
            $totalSubs = DB::table('sub_chapters as sub')
                ->join('chapters as chapter', 'chapter.id', '=', 'sub.chapter_id')
                ->where('chapter.course_id', $enrollment->course_id)
                ->count();
            $visitedCount = DB::table('visited_sub_chapters as visited')
                ->join('sub_chapters as sub', 'sub.id', '=', 'visited.sub_chapter_id')
                ->join('chapters as chapter', 'chapter.id', '=', 'sub.chapter_id')
                ->where('visited.user_id', $request->auth_user_id)
                ->where('visited.course_id', $enrollment->course_id)
                ->where('chapter.course_id', $enrollment->course_id)
                ->distinct('visited.sub_chapter_id')
                ->count('visited.sub_chapter_id');
            $computed = $totalSubs > 0 ? min(100, round(($visitedCount / $totalSubs) * 100, 2)) : min(100, (float) $enrollment->progress);
            if ((float) $enrollment->progress !== (float) $computed) {
                $enrollment->forceFill(['progress' => $computed])->save();
            } else {
                $enrollment->progress = $computed;
            }
        }
        return response()->json($enrollments);
    }

    public function enroll(Request $request, $courseId) {
        $existing = Enrollment::where('user_id', $request->auth_user_id)->where('course_id', $courseId)->first();
        if ($existing) return response()->json(['message' => 'Already enrolled'], 409);
        $enrollment = Enrollment::create(['user_id' => $request->auth_user_id, 'course_id' => $courseId, 'progress' => 0, 'status' => 'active']);
        return response()->json($enrollment, 201);
    }

    public function unenroll(Request $request, $courseId) {
        Enrollment::where('user_id', $request->auth_user_id)->where('course_id', $courseId)->delete();
        return response()->json(['message' => 'Unenrolled']);
    }

    public function courseStudents(Request $request, $courseId) {
        $course = Course::findOrFail($courseId);
        // Seul le prof du cours ou un admin peut voir les étudiants
        if ((int)$course->instructor_id !== (int)$request->auth_user_id && $request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $enrollments = Enrollment::where('course_id', $courseId)
            ->orderByDesc('created_at')
            ->get()
            ->each(fn ($enrollment) => $enrollment->progress = min(100, (float) $enrollment->progress));
        // Enrichir avec les infos étudiants depuis user-service
        try {
            $userIds = $enrollments->pluck('user_id')->unique()->values()->toArray();
            $usersRes = Http::timeout(3)->post('http://nginx-user/api/internal/students-by-ids', ['ids' => $userIds]);
            $users = collect($usersRes->json() ?? [])->keyBy('auth_id');
            $enrollments = $enrollments->map(function($e) use ($users) {
                $e->student = $users->get($e->user_id);
                return $e;
            });
        } catch (\Exception $ex) {}
        return response()->json($enrollments);
    }

    public function internalStats() {
        $totalEnrollments = \App\Models\Enrollment::count();
        $avgProgress = \App\Models\Enrollment::avg('progress') ?? 0;
        return response()->json([
            'total_enrollments' => $totalEnrollments,
            'average_progress'  => round($avgProgress, 1),
        ]);
    }

    public static function enrollInternal($userId, $courseId) {
        Enrollment::firstOrCreate(['user_id' => $userId, 'course_id' => $courseId], ['progress' => 0, 'status' => 'active']);
    }
}
