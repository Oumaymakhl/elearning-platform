<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\Enrollment;
use App\Models\Progress;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    public function complete(Request $request, $lessonId)
    {
        // Validation simple (on pourrait ajouter une clé secrète)
        $request->validate([
            'user_id' => 'required|integer',
            'score' => 'required|integer',
        ]);

        $lesson = Lesson::find($lessonId);
        if (!$lesson) {
            return response()->json(['message' => 'Lesson not found'], 404);
        }

        // Trouver l'inscription de l'utilisateur pour le cours
        $enrollment = Enrollment::where('user_id', $request->user_id)
                                ->where('course_id', $lesson->course_id)
                                ->first();
        if (!$enrollment) {
            return response()->json(['message' => 'User not enrolled in this course'], 403);
        }

        // Mettre à jour ou créer la progression
        $progress = Progress::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'lesson_id' => $lessonId,
            ],
            [
                'completed' => true,
                'score' => $request->score,
            ]
        );

        return response()->json(['message' => 'Progress updated']);
    }
public function index(Course $course)
{
    $user = auth()->user();
    if (!$user) {
        return response()->json(['message' => 'Unauthenticated'], 401);
    }

    // Récupérer l'inscription de l'utilisateur
    $enrollment = Enrollment::where('user_id', $user->id)
                            ->where('course_id', $course->id)
                            ->first();
    if (!$enrollment) {
        return response()->json(['message' => 'You are not enrolled in this course'], 403);
    }

    // Récupérer toutes les leçons du cours, ordonnées
    $lessons = $course->lessons()->orderBy('order')->get();

    // Récupérer les progrès de l'utilisateur pour ce cours
    $progress = Progress::where('enrollment_id', $enrollment->id)
                        ->pluck('completed', 'lesson_id')
                        ->toArray();

    // Déterminer le verrouillage : première leçon toujours accessible, les suivantes seulement si la précédente est complétée
    $previousCompleted = true;
    foreach ($lessons as $index => $lesson) {
        $lesson->is_locked = !$previousCompleted;
        $lesson->completed = $progress[$lesson->id] ?? false;
        if (!$lesson->completed) {
            $previousCompleted = false;
        }
    }

    return response()->json($lessons);
}
}
