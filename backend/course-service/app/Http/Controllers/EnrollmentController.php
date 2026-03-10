<?php
namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Course;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    // Liste des cours de l'apprenant connecté
    public function myCourses(Request $request) {
        $enrollments = Enrollment::with('course.chapters.subChapters')
            ->where('user_id', $request->auth_user_id)
            ->get();
        return response()->json($enrollments);
    }

    // S'inscrire à un cours
    public function enroll(Request $request, $courseId) {
        Course::findOrFail($courseId);
        $enrollment = Enrollment::firstOrCreate(
            ['user_id' => $request->auth_user_id, 'course_id' => $courseId],
            ['progress' => 0, 'status' => 'active']
        );
        return response()->json($enrollment, 201);
    }

    // Liste des apprenants d'un cours (formateur/admin)
    public function courseStudents(Request $request, $courseId) {
        $course = Course::findOrFail($courseId);
        if ($course->instructor_id != $request->auth_user_id && $request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $enrollments = Enrollment::where('course_id', $courseId)->get();
        return response()->json($enrollments);
    }

    // Se désinscrire
    public function unenroll(Request $request, $courseId) {
        Enrollment::where('user_id', $request->auth_user_id)
            ->where('course_id', $courseId)
            ->delete();
        return response()->json(['message' => 'Unenrolled']);
    }
}
