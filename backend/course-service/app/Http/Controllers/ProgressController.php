<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Enrollment;
use App\Models\Progress;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    /**
     * Marquer une leçon comme terminée (appelé par l'étudiant).
     * POST /api/lessons/{lesson}/complete
     */
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
            return response()->json(['message' => 'Vous n\'etes pas inscrit a ce cours'], 403);
        }

        $progress = Progress::firstOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'lesson_id'     => $lesson->id,
            ],
            ['completed' => true]
        );

        if (!$progress->wasRecentlyCreated) {
            $progress->update(['completed' => true]);
        }

        return response()->json([
            'message'         => 'Lecon marquee comme terminee',
            'course_progress' => $this->calcProgress($enrollment),
        ]);
    }

    /**
     * Retourner la progression globale de l'étudiant dans un cours.
     * GET /api/courses/{course}/my-progress
     */
    public function courseProgress(Course $course)
    {
        $user = auth()->user();

        $enrollment = Enrollment::where('user_id', $user->id)
                                ->where('course_id', $course->id)
                                ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'Vous n\'etes pas inscrit a ce cours'], 403);
        }

        return response()->json($this->calcProgress($enrollment));
    }

    /**
     * Calcule le pourcentage de progression d'une inscription.
     */
    private function calcProgress(Enrollment $enrollment): array
    {
        $total     = Lesson::where('course_id', $enrollment->course_id)->count();
        $completed = Progress::where('enrollment_id', $enrollment->id)
                             ->where('completed', true)
                             ->count();

        $percentage = $total > 0 ? round(($completed / $total) * 100) : 0;

        if ($percentage === 100 && $enrollment->status !== 'completed') {
            $enrollment->update(['status' => 'completed']);
        }

        return [
            'total_lessons'     => $total,
            'completed_lessons' => $completed,
            'percentage'        => $percentage,
            'enrollment_status' => $enrollment->fresh()->status,
        ];
    }
}
