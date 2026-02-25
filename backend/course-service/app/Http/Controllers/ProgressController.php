<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\Enrollment;
use App\Models\Progress;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function complete(Lesson $lesson)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $enrollment = Enrollment::where('user_id', $user->id)
                                ->where('course_id', $lesson->course_id)
                                ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'You are not enrolled in this course'], 403);
        }

        $progress = Progress::firstOrCreate([
            'enrollment_id' => $enrollment->id,
            'lesson_id' => $lesson->id,
        ], [
            'completed' => true,
        ]);

        if (!$progress->wasRecentlyCreated) {
            $progress->completed = true;
            $progress->save();
        }

        return response()->json(['message' => 'Progress updated']);
    }
}
