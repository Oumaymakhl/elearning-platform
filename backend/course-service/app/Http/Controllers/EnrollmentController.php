<?php
namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class EnrollmentController extends Controller
{
    public function myCourses(Request $request) {
        $enrollments = Enrollment::with('course')->where('user_id', $request->auth_user_id)->get();
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
        $enrollments = Enrollment::where('course_id', $courseId)->get();
        // Enrichir avec les infos étudiants depuis user-service
        try {
            $userIds = $enrollments->pluck('user_id')->unique()->values()->toArray();
            $usersRes = Http::timeout(3)->post('http://nginx-user/api/internal/users-by-ids', ['ids' => $userIds]);
            $users = collect($usersRes->json() ?? [])->keyBy('id');
            $enrollments = $enrollments->map(function($e) use ($users) {
                $e->student = $users->get($e->user_id);
                return $e;
            });
        } catch (\Exception $ex) {}
        return response()->json($enrollments);
    }

    public static function enrollInternal($userId, $courseId) {
        Enrollment::firstOrCreate(['user_id' => $userId, 'course_id' => $courseId], ['progress' => 0, 'status' => 'active']);
    }
}
