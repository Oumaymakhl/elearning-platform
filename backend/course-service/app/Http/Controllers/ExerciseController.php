<?php
namespace App\Http\Controllers;

use App\Models\Exercise;
use App\Models\ExerciseQuestion;
use App\Models\TestCase;
use App\Models\Submission;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ExerciseController extends Controller
{
    // === EXERCISES ===
    public function index(Request $request)
    {
        $query = Exercise::with('questions.testCases');
        if ($request->sub_chapter_id) $query->where('sub_chapter_id', $request->sub_chapter_id);
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'sub_chapter_id' => 'required|integer',
            'title'          => 'required|string|max:255',
            'description'    => 'nullable|string',
            'language'       => 'nullable|in:python,java,cpp,php,node',
            'max_score'      => 'nullable|integer',
        ]);
        return response()->json(Exercise::create($data), 201);
    }

    public function show($id)
    {
        return response()->json(Exercise::with('questions.testCases')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $exercise = Exercise::findOrFail($id);
        $exercise->update($request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'language'    => 'nullable|in:python,java,cpp,php,node',
            'max_score'   => 'nullable|integer',
        ]));
        return response()->json($exercise);
    }

    public function destroy($id)
    {
        Exercise::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // === QUESTIONS ===
    public function storeQuestion(Request $request, $exerciseId)
    {
        Exercise::findOrFail($exerciseId);
        $data = $request->validate([
            'title'         => 'required|string|max:255',
            'statement'     => 'required|string',
            'template_code' => 'nullable|string',
            'points'        => 'nullable|integer|min:1',
            'order'         => 'nullable|integer',
        ]);
        $data['exercise_id'] = $exerciseId;
        return response()->json(ExerciseQuestion::create($data), 201);
    }

    public function updateQuestion(Request $request, $exerciseId, $questionId)
    {
        $question = ExerciseQuestion::where('exercise_id', $exerciseId)->findOrFail($questionId);
        $question->update($request->validate([
            'title'         => 'sometimes|string|max:255',
            'statement'     => 'sometimes|string',
            'template_code' => 'nullable|string',
            'points'        => 'nullable|integer|min:1',
            'order'         => 'nullable|integer',
        ]));
        return response()->json($question);
    }

    public function destroyQuestion($exerciseId, $questionId)
    {
        ExerciseQuestion::where('exercise_id', $exerciseId)->findOrFail($questionId)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // === TEST CASES ===
    public function storeTestCase(Request $request, $exerciseId, $questionId)
    {
        ExerciseQuestion::where('exercise_id', $exerciseId)->findOrFail($questionId);
        $data = $request->validate([
            'input'           => 'nullable|string',
            'expected_output' => 'required|string',
            'is_hidden'       => 'nullable|boolean',
            'order'           => 'nullable|integer',
        ]);
        $data['question_id'] = $questionId;
        return response()->json(TestCase::create($data), 201);
    }

    public function destroyTestCase($exerciseId, $questionId, $testCaseId)
    {
        TestCase::where('question_id', $questionId)->findOrFail($testCaseId)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // === SOUMISSION & ÉVALUATION ===
    public function submit(Request $request, $exerciseId, $questionId)
    {
        $question  = ExerciseQuestion::with('testCases', 'exercise')
            ->where('exercise_id', $exerciseId)->findOrFail($questionId);
        $data      = $request->validate(['code' => 'required|string|max:10000']);
        $userId    = (int) $request->auth_user_id;
        $language  = $question->exercise->language;
        $testCases = $question->testCases;

        if ($testCases->isEmpty()) {
            return response()->json(['message' => 'No test cases defined'], 422);
        }

        $testsPassed = 0;
        $results     = [];
        $globalError = null;

        foreach ($testCases as $tc) {
            $finalCode = $question->template_code
                ? str_replace('{{marque}}', $data['code'], $question->template_code)
                : $data['code'];

            try {
                $response = Http::timeout(20)->post('http://nginx-executor/api/internal/execute', [
                    'language' => $language,
                    'code'     => $finalCode,
                    'input'    => $tc->input ?? '',
                ]);
                $result   = $response->json();
                $output   = trim($result['output'] ?? '');
                $expected = trim($tc->expected_output);
                $passed   = ($output === $expected);
                if ($passed) $testsPassed++;

                $results[] = [
                    'test_case_id' => $tc->id,
                    'input'        => $tc->is_hidden ? '[caché]' : $tc->input,
                    'expected'     => $tc->is_hidden ? '[caché]' : $expected,
                    'output'       => $output,
                    'passed'       => $passed,
                    'is_hidden'    => $tc->is_hidden,
                ];
            } catch (\Exception $e) {
                $globalError = 'Erreur executor: ' . $e->getMessage();
                break;
            }
        }

        $testsTotal = $testCases->count();
        $score      = $testsTotal > 0 ? round(($testsPassed / $testsTotal) * $question->points) : 0;
        $passed     = $testsPassed === $testsTotal;

        $submission = Submission::create([
            'question_id'  => $questionId,
            'user_id'      => $userId,
            'code'         => $data['code'],
            'output'       => json_encode($results),
            'tests_passed' => $testsPassed,
            'tests_total'  => $testsTotal,
            'passed'       => $passed,
            'score'        => $score,
            'error'        => $globalError,
            'executed_at'  => now(),
        ]);

        return response()->json([
            'submission_id' => $submission->id,
            'tests_passed'  => $testsPassed,
            'tests_total'   => $testsTotal,
            'score'         => $score,
            'passed'        => $passed,
            'error'         => $globalError,
            'results'       => $results,
        ]);
    }

    // === RÉSULTATS FORMATEUR ===
    public function results(Request $request, $exerciseId)
    {
        $exercise    = Exercise::with('questions')->findOrFail($exerciseId);
        $questionIds = $exercise->questions->pluck('id');

        // Toutes les soumissions groupées par user
        $allSubmissions = Submission::whereIn('question_id', $questionIds)
            ->orderBy('executed_at', 'desc')
            ->get()
            ->groupBy('user_id');

        // Meilleure soumission par user par question
        $bestSubmissions = Submission::whereIn('question_id', $questionIds)
            ->get()
            ->groupBy('user_id')
            ->map(function ($userSubs) use ($questionIds) {
                return $questionIds->map(function ($qId) use ($userSubs) {
                    return $userSubs->where('question_id', $qId)->sortByDesc('score')->first();
                })->filter();
            });

        return response()->json([
            'exercise'         => $exercise,
            'all_submissions'  => $allSubmissions,
            'best_submissions' => $bestSubmissions,
            'participants'     => $allSubmissions->keys(),
            'total_submitted'  => $allSubmissions->count(),
        ]);
    }

    // === PARTICIPATION TD (participants vs non-participants) ===
    public function participation(Request $request, $exerciseId)
    {
        $exercise = Exercise::with('questions.testCases')->findOrFail($exerciseId);

        // Récupérer le cours via sub_chapter → chapter → course
        $subChapter = \App\Models\SubChapter::find($exercise->sub_chapter_id);
        $chapter    = \App\Models\Chapter::find($subChapter->chapter_id ?? null);
        $courseId   = $chapter->course_id ?? null;

        // Apprenants inscrits au cours
        $enrolledUserIds = $courseId
            ? Enrollment::where('course_id', $courseId)->pluck('user_id')
            : collect();

        // Apprenants ayant soumis
        $questionIds      = $exercise->questions->pluck('id');
        $submittedUserIds = Submission::whereIn('question_id', $questionIds)
            ->distinct('user_id')->pluck('user_id');

        $notSubmitted = $enrolledUserIds->diff($submittedUserIds);

        return response()->json([
            'exercise_id'       => $exerciseId,
            'enrolled_count'    => $enrolledUserIds->count(),
            'submitted_count'   => $submittedUserIds->count(),
            'not_submitted_count' => $notSubmitted->count(),
            'submitted_user_ids'   => $submittedUserIds,
            'not_submitted_user_ids' => $notSubmitted->values(),
        ]);
    }

    // === MES SOUMISSIONS (apprenant) ===
    public function mySubmissions(Request $request, $exerciseId)
    {
        $exercise    = Exercise::with('questions')->findOrFail($exerciseId);
        $questionIds = $exercise->questions->pluck('id');
        $userId      = (int) $request->auth_user_id;

        $submissions = Submission::whereIn('question_id', $questionIds)
            ->where('user_id', $userId)
            ->orderBy('executed_at', 'desc')
            ->get();

        // Meilleure soumission par question
        $best = $submissions->groupBy('question_id')->map(fn($s) => $s->sortByDesc('score')->first());

        return response()->json([
            'all'  => $submissions,
            'best' => $best->values(),
        ]);
    }
}
