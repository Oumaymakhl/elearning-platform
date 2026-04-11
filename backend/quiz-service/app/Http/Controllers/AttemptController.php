<?php
namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Answer;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\Option;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AttemptController extends Controller
{
    public function start(Request $request, $quizId)
    {
        $quiz    = Quiz::findOrFail($quizId);
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

    public function submit(Request $request, $quizId, $attemptId)
    {
        $userId  = (int) $request->auth_user_id;
        $attempt = Attempt::where('quiz_id', $quizId)
            ->where('user_id', $userId)
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

        $score   = 0;
        $correct = 0;
        $total   = count($data['answers']);

        foreach ($data['answers'] as $ans) {
            $question  = Question::find($ans['question_id']);
            if (!$question) continue;

            $isCorrect = false;
            if (!empty($ans['option_id'])) {
                $option    = Option::find($ans['option_id']);
                $isCorrect = $option && $option->is_correct;
                if ($isCorrect) {
                    $score += $question->points ?? 1;
                    $correct++;
                }
            }

            Answer::create([
                'attempt_id'  => $attempt->id,
                'question_id' => $ans['question_id'],
                'option_id'   => $ans['option_id'] ?? null,
                'text_answer' => $ans['text_answer'] ?? null,
                'is_correct'  => $isCorrect,
            ]);
        }

        $quiz     = Quiz::findOrFail($quizId);
        $maxScore = (int) $attempt->max_score;
        $passingScore = $quiz->passing_score ?? 70;

        $percentage = $maxScore > 0 ? round(($score / $maxScore) * 100, 1) : 0;
        $passed     = $maxScore > 0
            ? $percentage >= $passingScore
            : true;

        $attempt->update([
            'score'        => $score,
            'passed'       => $passed,
            'completed_at' => now(),
        ]);

        // Calcul rang (tentative numéro X)
        $attemptNumber = Attempt::where('quiz_id', $quizId)
            ->where('user_id', $userId)
            ->whereNotNull('completed_at')
            ->count();

        // ── Notif étudiant ────────────────────────────────────────────
        if ($passed) {
            $this->sendNotification($userId, 'quiz_passed', [
                'title'         => '✅ Quiz réussi !',
                'message'       => 'Vous avez réussi le quiz « ' . $quiz->title . ' » avec ' . $percentage . '% (seuil : ' . $passingScore . '%). Score : ' . $score . '/' . $maxScore . '.',
                'quiz_id'       => $quizId,
                'quiz_title'    => $quiz->title,
                'score'         => $score,
                'max_score'     => $maxScore,
                'percentage'    => $percentage,
                'passing_score' => $passingScore,
                'correct'       => $correct,
                'total'         => $total,
                'attempt_no'    => $attemptNumber,
                'action_url'    => '/quiz/' . $quizId . '/result/' . $attemptId,
            ], 'medium');
        } else {
            $gap = round($passingScore - $percentage, 1);
            $this->sendNotification($userId, 'quiz_failed', [
                'title'         => '❌ Quiz non réussi',
                'message'       => 'Vous avez obtenu ' . $percentage . '% au quiz « ' . $quiz->title . ' » (seuil : ' . $passingScore . '%). Il vous manque ' . $gap . '%. Retentez votre chance !',
                'quiz_id'       => $quizId,
                'quiz_title'    => $quiz->title,
                'score'         => $score,
                'max_score'     => $maxScore,
                'percentage'    => $percentage,
                'passing_score' => $passingScore,
                'gap'           => $gap,
                'correct'       => $correct,
                'total'         => $total,
                'attempt_no'    => $attemptNumber,
                'action_url'    => '/quiz/' . $quizId,
            ], 'medium');
        }

        // ── Notif teacher (si quiz lié à un cours avec instructor) ────
        if ($quiz->course_id ?? null) {
            $this->sendNotification(0, 'student_quiz_done', [  // 0 = placeholder, remplacez par $quiz->course->instructor_id
                'title'      => '📊 Étudiant a soumis un quiz',
                'message'    => 'L\'étudiant #' . $userId . ' a obtenu ' . $percentage . '% au quiz « ' . $quiz->title . ' » (' . ($passed ? 'Réussi' : 'Échoué') . ').',
                'quiz_id'    => $quizId,
                'quiz_title' => $quiz->title,
                'student_id' => $userId,
                'percentage' => $percentage,
                'passed'     => $passed,
                'action_url' => '/quiz/' . $quizId . '/results',
            ], 'low');
        }

        return response()->json([
            'score'         => $score,
            'max_score'     => $maxScore,
            'percentage'    => $percentage,
            'passed'        => $passed,
            'passing_score' => $passingScore,
            'correct'       => $correct,
            'total_q'       => $total,
            'attempt_no'    => $attemptNumber,
            'answers'       => $attempt->answers,
        ]);
    }

    public function myAttempts(Request $request, $quizId)
    {
        $attempts = Attempt::where('quiz_id', $quizId)
            ->where('user_id', (int) $request->auth_user_id)
            ->with('answers')
            ->orderBy('started_at', 'desc')
            ->get();
        return response()->json($attempts);
    }

    public function allAttempts($quizId)
    {
        return response()->json(Attempt::where('quiz_id', $quizId)->get());
    }

    public function allMyAttempts(Request $request)
    {
        $attempts = Attempt::where('user_id', (int) $request->auth_user_id)
            ->with('quiz')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($attempts);
    }

    private function sendNotification(int $userId, string $type, array $data, string $priority = 'medium'): void
    {
        if ($userId <= 0) return;
        try {
            Http::timeout(3)->post('http://nginx-notification/api/internal/send', [
                'user_id'  => $userId,
                'type'     => $type,
                'data'     => $data,
                'priority' => $priority,
            ]);
        } catch (\Exception $e) {
            Log::warning("Notification failed [{$type}] user={$userId}: " . $e->getMessage());
        }
    }
}
