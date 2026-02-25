<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    public function index(Course $course)
    {
        return response()->json($course->lessons()->orderBy('order')->get());
    }

    public function show(Course $course, Lesson $lesson)
    {
        if ($lesson->course_id != $course->id) {
            return response()->json(['message' => 'Lesson not found in this course'], 404);
        }
        return response()->json($lesson);
    }

    public function store(Request $request, Course $course)
    {
        if (auth()->id() != $course->teacher_id && auth()->user()->role != 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'order' => 'integer',
        ]);

        $lesson = $course->lessons()->create($validated);
        return response()->json($lesson, 201);
    }

    public function update(Request $request, Course $course, Lesson $lesson)
    {
        if ($lesson->course_id != $course->id) {
            return response()->json(['message' => 'Lesson not found in this course'], 404);
        }
        if (auth()->id() != $course->teacher_id && auth()->user()->role != 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'nullable|string',
            'order' => 'integer',
        ]);

        $lesson->update($validated);
        return response()->json($lesson);
    }

    public function destroy(Course $course, Lesson $lesson)
    {
        if ($lesson->course_id != $course->id) {
            return response()->json(['message' => 'Lesson not found in this course'], 404);
        }
        if (auth()->id() != $course->teacher_id && auth()->user()->role != 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $lesson->delete();
        return response()->json(['message' => 'Lesson deleted']);
    }
}
