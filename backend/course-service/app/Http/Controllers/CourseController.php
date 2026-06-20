<?php
namespace App\Http\Controllers;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
class CourseController extends Controller
{
    public function index() {
        return response()->json(Course::with("chapters.subChapters")->get());
    }
    public function store(Request $request) {
        $data = $request->validate([
            "title"       => "required|string|max:255",
            "description" => "nullable|string",
            "language"    => "nullable|string|max:10",
            "image_path"  => "nullable|string",
            "level"       => "nullable|string|in:debutant,intermediaire,avance",
            "price"       => "nullable|numeric|min:0",
            "is_free"     => "nullable|boolean",
        ]);
        $data["instructor_id"] = (int) $request->auth_user_id;
        $course = Course::create($data);
        try {
            $students = Http::get("http://nginx-user/api/internal/students");
            foreach ($students->json() as $studentId) {
                Http::post("http://nginx-notification/api/internal/send", [
                    "user_id" => $studentId,
                    "type"    => "new_course",
                    "data"    => [
                        "title"        => "Nouveau cours disponible",
                        "message"      => $course->title . " vient d etre publie",
                        "course_id"    => $course->id,
                        "course_title" => $course->title,
                    ]
                ]);
            }
        } catch (\Exception $e) {}

        // Notif admin — nouveau cours créé
        try {
            $adminRes = Http::timeout(3)->get('http://nginx-user/api/internal/admins');
            $admins = collect($adminRes->json('data') ?? $adminRes->json() ?? [])
                ->filter(fn($u) => ($u['role'] ?? '') === 'admin')
                ->pluck('id');
            foreach ($admins as $adminId) {
                Http::post("http://nginx-notification/api/internal/send", [
                    "user_id" => (int)$adminId,
                    "type"    => "new_course",
                    "data"    => [
                        "title"        => "📚 Nouveau cours soumis",
                        "message"      => $request->auth_user_name . " a ajouté le cours « " . $course->title . " ».",
                        "course_id"    => $course->id,
                        "course_title" => $course->title,
                    ]
                ]);
            }
        } catch (\Exception $e) {}

        return response()->json($course, 201);
    }
    public function show($id) {
        $course = Course::with("chapters.subChapters")->findOrFail($id);
        return response()->json($course);
    }
    public function update(Request $request, $id) {
        $course = Course::findOrFail($id);
        if ((int)$course->instructor_id !== (int)$request->auth_user_id && $request->auth_user_role !== "admin") {
            return response()->json(["message" => "Forbidden"], 403);
        }
        $course->update($request->validate([
            "title"       => "sometimes|string|max:255",
            "description" => "nullable|string",
            "language"    => "nullable|string|max:10",
            "image_path"  => "nullable|string",
            "level"       => "nullable|string|in:debutant,intermediaire,avance",
            "price"       => "nullable|numeric|min:0",
            "is_free"     => "nullable|boolean",
        ]));
        return response()->json($course);
    }
    public function myTeachingCourses(Request $request) {
        $courses = Course::with('chapters.subChapters')
            ->withCount(['enrollments', 'chapters'])
            ->withCount(['enrollments as completed_students_count' => fn ($query) => $query->where('progress', '>=', 100)])
            ->withAvg('enrollments', 'progress')
            ->where('instructor_id', $request->auth_user_id)
            ->get()
            ->each(function (Course $course) {
                $course->setAttribute('students_count', $course->enrollments_count);
                $course->setAttribute('average_progress', min(100, round((float) ($course->enrollments_avg_progress ?? 0), 2)));
            });
        return response()->json($courses);
    }

    public function destroy(Request $request, $id) {
        $course = Course::findOrFail($id);
        if ((int)$course->instructor_id !== (int)$request->auth_user_id && $request->auth_user_role !== "admin") {
            return response()->json(["message" => "Forbidden"], 403);
        }
        $chapterIds = $course->chapters()->pluck('id')->all();
        $quizIds = DB::table('sub_chapters')
            ->whereIn('chapter_id', $chapterIds)
            ->whereNotNull('quiz_id')
            ->pluck('quiz_id')->unique()->values()->all();

        $cleanupFailures = [];
        foreach ([
            'quiz' => fn () => Http::timeout(10)->delete('http://nginx-quiz/api/internal/courses/' . $course->id, [
                'quiz_ids' => $quizIds,
                'chapter_ids' => $chapterIds,
            ]),
            'content' => fn () => Http::timeout(10)->delete('http://nginx-content/api/internal/courses/' . $course->id),
            'payment' => fn () => Http::timeout(10)->delete('http://nginx-payment/api/internal/courses/' . $course->id),
        ] as $service => $requestCleanup) {
            try {
                $response = $requestCleanup();
                if (!$response->successful() && $response->status() !== 404) {
                    $cleanupFailures[] = $service . ':' . $response->status();
                }
            } catch (\Throwable $e) {
                $cleanupFailures[] = $service . ':' . $e->getMessage();
            }
        }
        if ($cleanupFailures) {
            \Log::warning('Course related cleanup had non-blocking failures for course ' . $course->id . ': ' . implode(', ', $cleanupFailures));
        }

        DB::transaction(function () use ($course) {
            if (Schema::hasTable('submissions') && Schema::hasColumn('submissions', 'file_path')) {
                $submissionFiles = DB::table('submissions as submission')
                    ->join('exercise_questions as question', 'question.id', '=', 'submission.question_id')
                    ->join('exercises as exercise', 'exercise.id', '=', 'question.exercise_id')
                    ->join('sub_chapters as sub', 'sub.id', '=', 'exercise.sub_chapter_id')
                    ->join('chapters as chapter', 'chapter.id', '=', 'sub.chapter_id')
                    ->where('chapter.course_id', $course->id)
                    ->whereNotNull('submission.file_path')
                    ->pluck('submission.file_path');
                foreach ($submissionFiles as $file) Storage::disk('public')->delete($file);
            }
            $enrollmentIds = DB::table('enrollments')->where('course_id', $course->id)->pluck('id');
            if (Schema::hasTable('progress') && $enrollmentIds->isNotEmpty()) {
                DB::table('progress')->whereIn('enrollment_id', $enrollmentIds)->delete();
            }
            foreach (['visited_sub_chapters', 'certificates', 'ratings', 'enrollments'] as $table) {
                if (Schema::hasTable($table)) DB::table($table)->where('course_id', $course->id)->delete();
            }
            if (Schema::hasTable('lessons')) DB::table('lessons')->where('course_id', $course->id)->delete();
            if ($course->image_path) Storage::disk('public')->delete($course->image_path);
            $course->delete();
        });
        return response()->json(["message" => "Course deleted"]);
    }
}
