<?php
namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index() {
        return response()->json(Course::with('chapters.subChapters')->get());
    }

    public function store(Request $request) {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'language'    => 'nullable|string|max:10',
            'image_path'  => 'nullable|string',
        ]);
        $data['instructor_id'] = (int) $request->auth_user_id;
        $course = Course::create($data);
        return response()->json($course, 201);
    }

    public function show($id) {
    $course = Course::with('chapters.subChapters')->findOrFail($id);
    return response()->json($course);
}

    public function update(Request $request, $id) {
        $course = Course::findOrFail($id);
        if ((int)$course->instructor_id !== (int)$request->auth_user_id && $request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $course->update($request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'language'    => 'nullable|string|max:10',
            'image_path'  => 'nullable|string',
        ]));
        return response()->json($course);
    }

    public function destroy(Request $request, $id) {
        $course = Course::findOrFail($id);
        if ((int)$course->instructor_id !== (int)$request->auth_user_id && $request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $course->delete();
        return response()->json(['message' => 'Course deleted']);
    }
}
