<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
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

    // Récupérer les étudiants inscrits
    $enrollments = $course->enrollments()->with('user')->where('status', 'active')->get();

    foreach ($enrollments as $enrollment) {
        if ($enrollment->user) {
            Http::post('http://nginx-notification/api/internal/send', [
                'user_id' => $enrollment->user_id,
                'type' => 'new_lesson',
                'data' => [
                    'email' => $enrollment->user->email,
                    'lesson_title' => $lesson->title,
                    'course_title' => $course->title,
                ],
            ]);
        }
    }

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
