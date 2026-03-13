<?php
namespace App\Http\Controllers;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
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
        ]));
        return response()->json($course);
    }
    public function destroy(Request $request, $id) {
        $course = Course::findOrFail($id);
        if ((int)$course->instructor_id !== (int)$request->auth_user_id && $request->auth_user_role !== "admin") {
            return response()->json(["message" => "Forbidden"], 403);
        }
        $course->delete();
        return response()->json(["message" => "Course deleted"]);
    }
}
