<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index()
    {
        return response()->json(Course::with('lessons')->paginate());
    }

    public function show($id)
    {
        $course = Course::with('lessons')->find($id);
        if (!$course) {
            return response()->json(['message' => 'Course not found'], 404);
        }
        return response()->json($course);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $course = Course::create(array_merge($validated, [
            'teacher_id' => auth()->id(),
        ]));

        return response()->json($course, 201);
    }

    public function update(Request $request, $id)
    {
        $course = Course::find($id);
        if (!$course) {
            return response()->json(['message' => 'Course not found'], 404);
        }

        // Vérifier que l'utilisateur est le professeur ou admin
        if (auth()->id() != $course->teacher_id && auth()->user()->role != 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $course->update($validated);
        return response()->json($course);
    }

    public function destroy($id)
    {
        $course = Course::find($id);
        if (!$course) {
            return response()->json(['message' => 'Course not found'], 404);
        }

        if (auth()->id() != $course->teacher_id && auth()->user()->role != 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $course->delete();
        return response()->json(['message' => 'Course deleted']);
    }
}
