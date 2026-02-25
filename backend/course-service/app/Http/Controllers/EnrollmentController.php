<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function store(Course $course)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $existing = Enrollment::where('user_id', $user->id)
                              ->where('course_id', $course->id)
                              ->first();
        if ($existing) {
            return response()->json(['message' => 'Already enrolled'], 400);
        }

        $enrollment = Enrollment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
        ]);

        return response()->json($enrollment, 201);
    }

    public function myCourses()
    {
        $user = auth()->user();
        $enrollments = Enrollment::with('course')
                                 ->where('user_id', $user->id)
                                 ->paginate();
        return response()->json($enrollments);
    }
}
