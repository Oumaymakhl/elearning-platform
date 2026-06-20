<?php
namespace App\Http\Controllers;

use App\Models\Quiz;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class QuizController extends Controller
{
    public function index() {
        return response()->json(Quiz::with('questions.options')->get());
    }

    public function store(Request $request) {
        $data = $request->validate([
            'title'         => 'required|string|max:255',
            'description'   => 'nullable|string',
            'chapter_id'    => 'nullable|integer',
            'course_id'     => 'nullable|integer',
            'passing_score' => 'nullable|integer|min:0|max:100',
            'time_limit'    => 'nullable|integer|min:1',
        ]);
        $data['created_by'] = (int) $request->auth_user_id;
        try {
            if (!empty($data['chapter_id']) && Quiz::where('chapter_id', $data['chapter_id'])->exists()) {
                return response()->json(['message' => 'Ce chapitre a déjà un quiz. Supprimez-le avant d\'en créer un nouveau.'], 422);
            }
            $quiz = DB::transaction(fn () => Quiz::create($data));
        } catch (\Illuminate\Database\QueryException $e) {
            if (($e->errorInfo[1] ?? null) === 1062) {
                return response()->json(['message' => 'Ce chapitre a déjà un quiz. Supprimez-le avant d\'en créer un nouveau.'], 422);
            }
            throw $e;
        }
        return response()->json($quiz, 201);
    }

    public function show($id) {
        $quiz = Quiz::with('questions.options')->findOrFail($id);
        return response()->json($quiz);
    }

    public function update(Request $request, $id) {
        $quiz = Quiz::findOrFail($id);
        $data = $request->validate([
            'title'         => 'sometimes|string|max:255',
            'description'   => 'nullable|string',
            'chapter_id'    => 'nullable|integer',
            'course_id'     => 'nullable|integer',
            'passing_score' => 'nullable|integer|min:0|max:100',
            'time_limit'    => 'nullable|integer|min:1',
        ]);
        if (!empty($data['chapter_id']) && Quiz::where('chapter_id', $data['chapter_id'])->where('id', '!=', $quiz->id)->exists()) {
            return response()->json(['message' => 'Ce chapitre a déjà un quiz.'], 422);
        }
        $quiz->update($data);
        return response()->json($quiz);
    }

    public function destroy($id) {
        Quiz::findOrFail($id)->delete();
        return response()->json(['message' => 'Quiz deleted']);
    }

    public function byChapter($chapterId) {
        $quizzes = Quiz::with('questions.options')
            ->where('chapter_id', $chapterId)
            ->get();
        return response()->json($quizzes);
    }

    public function destroyForCourse(Request $request, $courseId)
    {
        $quizIds = collect($request->input('quiz_ids', []))->map(fn ($id) => (int) $id)->filter();
        $chapterIds = collect($request->input('chapter_ids', []))->map(fn ($id) => (int) $id)->filter();

        $query = Quiz::query()->whereIn('id', $quizIds);
        if ($chapterIds->isNotEmpty() && Schema::hasColumn('quizzes', 'chapter_id')) {
            $query->orWhereIn('chapter_id', $chapterIds);
        }
        if (Schema::hasColumn('quizzes', 'course_id')) {
            $query->orWhere('course_id', $courseId);
        }
        $deleted = $query->get()->each->delete()->count();
        return response()->json(['deleted' => $deleted]);
    }
}
