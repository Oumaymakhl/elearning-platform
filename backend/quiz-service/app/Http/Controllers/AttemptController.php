<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\Attempt;
use App\Models\Answer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AttemptController extends Controller
{
    public function store(Quiz $quiz)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Vérifier si l'utilisateur a déjà une tentative en cours
        $existing = Attempt::where('quiz_id', $quiz->id)
                          ->where('user_id', $user->id)
                          ->whereNull('completed_at')
                          ->first();
        if ($existing) {
            return response()->json($existing);
        }

        $attempt = Attempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'started_at' => now(),
        ]);

        return response()->json($attempt, 201);
    }

    public function submit(Request $request, Attempt $attempt)
    {
        if ($attempt->user_id != auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($attempt->completed_at) {
            return response()->json(['message' => 'Attempt already completed'], 400);
        }

        $validated = $request->validate([
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.option_id' => 'nullable|exists:options,id',
        ]);

        $quiz = $attempt->quiz;
        $totalPoints = 0;
        $earnedPoints = 0;

        foreach ($validated['answers'] as $ans) {
            $question = $quiz->questions()->find($ans['question_id']);
            if (!$question) continue;

            $isCorrect = false;
            if (isset($ans['option_id'])) {
                $option = $question->options()->find($ans['option_id']);
                $isCorrect = $option ? $option->is_correct : false;
            }

            Answer::create([
                'attempt_id' => $attempt->id,
                'question_id' => $ans['question_id'],
                'option_id' => $ans['option_id'] ?? null,
                'is_correct' => $isCorrect,
            ]);

            $totalPoints += $question->points;
            if ($isCorrect) {
                $earnedPoints += $question->points;
            }
        }

        $scorePercent = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100) : 0;
        $passed = $scorePercent >= $quiz->passing_score;

        $attempt->update([
            'score' => $earnedPoints,
            'max_score' => $totalPoints,
            'passed' => $passed,
            'completed_at' => now(),
        ]);

        // Si réussi, notifier le course-service pour débloquer la leçon suivante
        if ($passed) {
            // On suppose que le quiz a un champ lesson_id
            Http::post('http://nginx-course/api/internal/lessons/' . $quiz->lesson_id . '/complete', [
                'user_id' => $attempt->user_id,
                'score' => $scorePercent,
            ]);
        }

        return response()->json($attempt->load('answers'));
    }

    public function show(Attempt $attempt)
    {
        if ($attempt->user_id != auth()->id() && auth()->user()->role != 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return response()->json($attempt->load('answers.question', 'answers.option'));
    }
}
