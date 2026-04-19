<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AdminController extends Controller
{
    private function checkAdmin(Request $request)
    {
        if ($request->auth_user_role !== "admin") {
            abort(response()->json(["message" => "Forbidden"], 403));
        }
    }

    public function users(Request $request)
    {
        $this->checkAdmin($request);
        $users = User::when($request->role, fn($q) => $q->where("role", $request->role))
            ->when($request->search, fn($q) => $q->where("name", "like", "%{$request->search}%")
                ->orWhere("email", "like", "%{$request->search}%"))
            ->when($request->is_active !== null, fn($q) => $q->where("is_active", $request->boolean("is_active")))
            ->paginate(20);
        return response()->json($users);
    }

    public function createUser(Request $request)
    {
        $this->checkAdmin($request);
        $data = $request->validate([
            "auth_id" => "required|integer|unique:users,auth_id",
            "name"    => "required|string|max:255",
            "email"   => "required|email|unique:users,email",
            "role"    => "required|in:student,teacher,admin",
        ]);
        return response()->json(User::create($data), 201);
    }

    public function updateUser(Request $request, $id)
    {
        $this->checkAdmin($request);
        $user = User::findOrFail($id);
        $user->update($request->validate([
            "name"       => "sometimes|string|max:255",
            "role"       => "sometimes|in:student,teacher,admin",
            "is_active"  => "sometimes|boolean",
            "bio"        => "nullable|string",
            "speciality" => "nullable|string",
        ]));
        return response()->json($user);
    }

    public function deleteUser(Request $request, $id)
    {
        $this->checkAdmin($request);
        $user = User::findOrFail($id);
        $email = $user->email;
        $user->delete();
        // Supprimer aussi dans auth_db directement
        try {
            $pdo = new \PDO('mysql:host=mysql-auth;port=3306;dbname=auth_db', 'auth_user', 'auth_password');
            $stmt = $pdo->prepare("DELETE FROM users WHERE email = ?");
            $stmt->execute([$email]);
        } catch (\Exception $e) {
            // Log erreur silencieuse
        }
        return response()->json(["message" => "User deleted"]);
    }

    public function toggleActive(Request $request, $id)
    {
        $this->checkAdmin($request);
        $user = User::findOrFail($id);
        $user->update(["is_active" => !$user->is_active]);
        return response()->json(["is_active" => $user->is_active, "user" => $user]);
    }

    public function stats(Request $request)
    {
        $this->checkAdmin($request);

        $userStats = [
            "total_users"    => User::count(),
            "students"       => User::where("role", "student")->count(),
            "teachers"       => User::where("role", "teacher")->count(),
            "admins"         => User::where("role", "admin")->count(),
            "active_users"   => User::where("is_active", true)->count(),
            "inactive_users" => User::where("is_active", false)->count(),
            "recent_users"   => User::orderBy("created_at", "desc")->take(5)->get(),
        ];

        $courseStats = [];
        try {
            $response = Http::timeout(5)->get("http://nginx-course/api/courses");
            if ($response->ok()) {
                $courses = $response->json();
                $totalEnrolled = 0;
                $totalProgress = 0;
                $progressCount = 0;
                foreach ($courses as $course) {
                    $enroll = Http::timeout(5)
                        ->withHeaders(["X-Auth-User-Id" => $request->auth_user_id, "X-Auth-User-Role" => "admin"])
                        ->get("http://nginx-course/api/courses/{$course["id"]}/students");
                    if ($enroll->ok()) {
                        $students = $enroll->json();
                        $totalEnrolled += count($students);
                        foreach ($students as $s) {
                            if (isset($s["progress"])) {
                                $totalProgress += $s["progress"];
                                $progressCount++;
                            }
                        }
                    }
                }
                $courseStats = [
                    "total_courses"     => count($courses),
                    "total_enrollments" => $totalEnrolled,
                    "average_progress"  => $progressCount > 0 ? round($totalProgress / $progressCount, 1) : 0,
                ];
            }
        } catch (\Exception $e) {
            $courseStats = ["error" => "Course service unavailable"];
        }

        $quizStats = [];
        try {
            $response = Http::timeout(5)->get("http://nginx-quiz/api/quiz-stats");
            if ($response->ok()) {
                $quizStats = $response->json();
            }
        } catch (\Exception $e) {
            $quizStats = ["error" => "Quiz service unavailable"];
        }

        return response()->json([
            "users"   => $userStats,
            "courses" => $courseStats,
            "quizzes" => $quizStats,
        ]);
    }

    public function globalReport(Request $request)
    {
        $this->checkAdmin($request);

        $teachers = User::where("role", "teacher")->get();
        $teacherStats = [];
        foreach ($teachers as $teacher) {
            try {
                $response = Http::timeout(5)->get("http://nginx-course/api/courses");
                $courses = $response->ok() ? $response->json() : [];
                $myCourses = array_filter($courses, fn($c) => $c["instructor_id"] == $teacher->id);
                $teacherStats[] = [
                    "teacher_id"    => $teacher->id,
                    "name"          => $teacher->name,
                    "email"         => $teacher->email,
                    "total_courses" => count($myCourses),
                ];
            } catch (\Exception $e) {
                $teacherStats[] = [
                    "teacher_id"    => $teacher->id,
                    "name"          => $teacher->name,
                    "email"         => $teacher->email,
                    "total_courses" => 0,
                ];
            }
        }

        usort($teacherStats, fn($a, $b) => $b["total_courses"] - $a["total_courses"]);

        return response()->json([
            "top_teachers"   => array_slice($teacherStats, 0, 10),
            "total_teachers" => count($teacherStats),
            "total_students" => User::where("role", "student")->count(),
            "generated_at"   => now(),
        ]);
    }
}
