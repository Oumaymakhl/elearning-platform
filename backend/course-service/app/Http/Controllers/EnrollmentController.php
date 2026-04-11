<?php
namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EnrollmentController extends Controller
{
    public function myCourses(Request $request) {
        $enrollments = Enrollment::with('course.chapters.subChapters')
            ->where('user_id', $request->auth_user_id)
            ->get();
        return response()->json($enrollments);
    }

    public function enroll(Request $request, $courseId) {
        $course     = Course::findOrFail($courseId);
        $enrollment = Enrollment::firstOrCreate(
            ['user_id' => $request->auth_user_id, 'course_id' => $courseId],
            ['progress' => 0, 'status' => 'active']
        );

        if ($enrollment->wasRecentlyCreated) {
            $studentId = (int) $request->auth_user_id;

            // Récupérer le nom de l'étudiant via auth_id (pas la PK DB)
            $studentName  = 'Étudiant #' . $studentId;
            $studentEmail = '';
            try {
                $resp = Http::timeout(3)->post(
                    'http://nginx-user/api/internal/students-by-ids',
                    ['ids' => [$studentId]]
                );
                if ($resp->successful()) {
                    $users = $resp->json();
                    if (!empty($users)) {
                        $studentName  = $users[0]['name']  ?? $studentName;
                        $studentEmail = $users[0]['email'] ?? '';
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Could not fetch student info: ' . $e->getMessage());
            }

            $totalStudents = Enrollment::where('course_id', $courseId)->count();

            // Notif teacher
            if ($course->instructor_id) {
                $this->sendNotification($course->instructor_id, 'new_student', [
                    'title'          => '👤 Nouvel étudiant inscrit',
                    'message'        => $studentName . ' vient de s\'inscrire à votre cours « ' . $course->title . ' ». Vous avez maintenant ' . $totalStudents . ' étudiant(s) inscrit(s).',
                    'course_id'      => $course->id,
                    'course_title'   => $course->title,
                    'student_id'     => $studentId,
                    'student_name'   => $studentName,
                    'student_email'  => $studentEmail,
                    'total_students' => $totalStudents,
                    'enrolled_at'    => now()->toIso8601String(),
                    'action_url'     => '/courses/' . $courseId . '/students',
                ], 'low');
            }

            // Notif étudiant — confirmation
            $this->sendNotification($studentId, 'course_enrolled', [
                'title'        => '📚 Inscription confirmée',
                'message'      => 'Vous êtes inscrit(e) au cours « ' . $course->title . ' ». Bonne formation !',
                'course_id'    => $course->id,
                'course_title' => $course->title,
                'enrolled_at'  => now()->toIso8601String(),
                'action_url'   => '/courses/' . $courseId,
            ], 'medium');
        }

        return response()->json($enrollment, 201);
    }

    public function courseStudents(Request $request, $courseId) {
        $course = Course::findOrFail($courseId);
        if ($course->instructor_id != $request->auth_user_id && $request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $enrollments = Enrollment::where('course_id', $courseId)->get();
        $userIds     = $enrollments->pluck('user_id')->toArray();
        $usersData   = [];
        try {
            $response = Http::post('http://nginx-user/api/internal/students-by-ids', ['ids' => $userIds]);
            foreach ($response->json() as $user) {
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

    private function sendNotification(int $userId, string $type, array $data, string $priority = 'medium'): void
    {
        try {
            Http::timeout(3)->post('http://nginx-notification/api/internal/send', [
                'user_id'  => $userId,
                'type'     => $type,
                'data'     => $data,
                'priority' => $priority,
            ]);
        } catch (\Exception $e) {
            Log::warning("Notification failed [{$type}] user={$userId}: " . $e->getMessage());
        }
    }
}
