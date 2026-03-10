<?php
namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Answer;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\Option;
use Illuminate\Http\Request;

class AttemptController extends Controller
{
    public function start(Request $request, $quizId) {
        $quiz = Quiz::findOrFail($quizId);
        $attempt = Attempt::create([
            'quiz_id'    => $quizId,
            'user_id'    => (int) $request->auth_user_id,
            'score'      => 0,
            'max_score'  => $quiz->questions()->sum('points') ?: 0,
            'passed'     => false,
            'started_at' => now(),
        ]);
        return response()->json($attempt->load('quiz.questions.options'), 201);
    }

    public function submit(Request $request, $quizId, $attemptId) {
        $attempt = Attempt::where('quiz_id', $quizId)
            ->where('user_id', (int) $request->auth_user_id)
            ->findOrFail($attemptId);

        if ($attempt->completed_at) {
            return response()->json(['message' => 'Already submitted'], 400);
        }

        $data = $request->validate([
            'answers'               => 'required|array',
            'answers.*.question_id' => 'required|integer',
            'answers.*.option_id'   => 'nullable|integer',
            'answers.*.text_answer' => 'nullable|string',
        ]);

        $score = 0;
        foreach ($data['answers'] as $ans) {
            $question = Question::find($ans['question_id']);
            if (!$question) continue;

            $isCorrect = false;
            if (!empty($ans['option_id'])) {
                $option = Option::find($ans['option_id']);
                $isCorrect = $option && $option->is_correct;
                if ($isCorrect) $score += $question->points ?? 1;
            }

            Answer::create([
                'attempt_id'  => $attempt->id,
                'question_id' => $ans['question_id'],
                'option_id'   => $ans['option_id'] ?? null,
                'text_answer' => $ans['text_answer'] ?? null,
                'is_correct'  => $isCorrect,
            ]);
        }

        $quiz = Quiz::findOrFail($quizId);
        $maxScore = (int) $attempt->max_score;

        // passed_score est un pourcentage (ex: 50 = 50%)
        if ($quiz->passing_score && $maxScore > 0) {
            $percentage = ($score / $maxScore) * 100;
            $passed = $percentage >= $quiz->passing_score;
        } else {
            $passed = true;
        }

        $attempt->update([
            'score'        => $score,
            'passed'       => $passed,
            'completed_at' => now(),
        ]);

        return response()->json([
            'score'      => $score,
            'max_score'  => $maxScore,
            'percentage' => $maxScore > 0 ? round(($score / $maxScore) * 100, 1) : 0,
            'passed'     => $passed,
            'answers'    => $attempt->answers,
        ]);
    }

    public function myAttempts(Request $request, $quizId) {
        $attempts = Attempt::where('quiz_id', $quizId)
            ->where('user_id', (int) $request->auth_user_id)
            ->with('answers')
            ->get();
        return response()->json($attempts);
    }

    public function allAttempts($quizId) {
        return response()->json(Attempt::where('quiz_id', $quizId)->get());
    }
}
