<?php
namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\Attempt;
use Illuminate\Http\Request;

class QuizResultsController extends Controller
{
    // Résultats détaillés d'un quiz (formateur)
    public function quizResults(Request $request, $quizId)
    {
        $quiz = Quiz::with('questions')->findOrFail($quizId);

        $attempts = Attempt::where('quiz_id', $quizId)
            ->with('answers')
            ->get();

        // Grouper par user
        $byUser = $attempts->groupBy('user_id')->map(function($userAttempts) {
            $best = $userAttempts->sortByDesc('score')->first();
            return [
                'user_id'       => $best->user_id,
                'attempts_count'=> $userAttempts->count(),
                'best_score'    => $best->score,
                'max_score'     => $best->max_score,
                'passed'        => $best->passed,
                'last_attempt'  => $best->completed_at,
                'all_attempts'  => $userAttempts->values(),
            ];
        });

        return response()->json([
            'quiz'             => $quiz,
            'total_attempts'   => $attempts->count(),
            'unique_students'  => $byUser->count(),
            'pass_rate'        => $byUser->count() > 0
                ? round($byUser->filter(fn($u) => $u['passed'])->count() / $byUser->count() * 100, 1)
                : 0,
            'results_by_user'  => $byUser->values(),
        ]);
    }

    // Stats globales quiz (admin)
    public function globalStats()
    {
        return response()->json([
            'total_quizzes'   => Quiz::count(),
            'total_attempts'  => Attempt::count(),
            'completed'       => Attempt::whereNotNull('completed_at')->count(),
            'pass_rate'       => Attempt::whereNotNull('completed_at')->count() > 0
                ? round(Attempt::where('passed', true)->count() / Attempt::whereNotNull('completed_at')->count() * 100, 1)
                : 0,
        ]);
    }
}
