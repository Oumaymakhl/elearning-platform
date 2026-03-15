<?php
namespace App\Http\Controllers;
use App\Models\Enrollment;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class EnrollmentController extends Controller
{
    public function myCourses(Request $request) {
        $enrollments = Enrollment::with('course.chapters.subChapters')
            ->where('user_id', $request->auth_user_id)
            ->get();
        return response()->json($enrollments);
    }

    public function enroll(Request $request, $courseId) {
        $course = Course::findOrFail($courseId);
        $enrollment = Enrollment::firstOrCreate(
            ['user_id' => $request->auth_user_id, 'course_id' => $courseId],
            ['progress' => 0, 'status' => 'active']
        );

        // Envoyer notification au teacher seulement si nouvelle inscription
        if ($enrollment->wasRecentlyCreated) {
            try {
                Http::post('http://nginx-notification/api/internal/send', [
                    'user_id' => $course->instructor_id,
                    'type'    => 'course_enrolled',
                    'data'    => [
                        'title'        => 'Nouvel étudiant inscrit',
                        'message'      => 'Un étudiant vient de s\'inscrire à votre cours : ' . $course->title,
                        'course_id'    => $course->id,
                        'course_title' => $course->title,
                        'student_id'   => $request->auth_user_id,
                    ]
                ]);
            } catch (\Exception $e) {
                // Ne pas bloquer l'inscription si la notif échoue
            }
        }

        return response()->json($enrollment, 201);
    }

    public function courseStudents(Request $request, $courseId) {
        $course = Course::findOrFail($courseId);
        if ($course->instructor_id != $request->auth_user_id && $request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $enrollments = Enrollment::where('course_id', $courseId)->get();
        // Récupérer les infos des étudiants depuis user-service
        $userIds = $enrollments->pluck('user_id')->toArray();
        $usersData = [];
        try {
            $response = Http::post('http://nginx-user/api/internal/students-by-ids', ['ids' => $userIds]);
            $users = $response->json();
            foreach ($users as $user) {
                $usersData[$user['auth_id']] = $user;
            }
        } catch (\Exception $e) {}
        $result = $enrollments->map(function($e) use ($usersData) {
            return [
                'id'         => $e->id,
                'user_id'    => $e->user_id,
                'course_id'  => $e->course_id,
                'progress'   => $e->progress,
                'status'     => $e->status,
                'created_at' => $e->created_at,
                'student'    => $usersData[$e->user_id] ?? ['name' => 'Étudiant #' . $e->user_id, 'email' => ''],
            ];
        });
        return response()->json($result);
    }

    public function unenroll(Request $request, $courseId) {
        Enrollment::where('user_id', $request->auth_user_id)
            ->where('course_id', $courseId)
            ->delete();
        return response()->json(['message' => 'Unenrolled']);
    }
}
