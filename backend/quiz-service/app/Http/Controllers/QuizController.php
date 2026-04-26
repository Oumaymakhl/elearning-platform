<?php
namespace App\Http\Controllers;

use App\Models\Quiz;
use Illuminate\Http\Request;

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
            'passing_score' => 'nullable|integer|min:0|max:100',
        ]);
        if (!empty($data['chapter_id'])) {
            $exists = Quiz::where('chapter_id', $data['chapter_id'])->exists();
            if ($exists) {
                return response()->json(['message' => 'Ce chapitre a déjà un quiz. Supprimez-le avant d\'en créer un nouveau.'], 422);
            }
        }
        $data['created_by'] = (int) $request->auth_user_id;
        $quiz = Quiz::create($data);
        return response()->json($quiz, 201);
    }

    public function show($id) {
        $quiz = Quiz::with('questions.options')->findOrFail($id);
        return response()->json($quiz);
    }

    public function update(Request $request, $id) {
        $quiz = Quiz::findOrFail($id);
        $quiz->update($request->validate([
            'title'         => 'sometimes|string|max:255',
            'description'   => 'nullable|string',
            'chapter_id'    => 'nullable|integer',
            'passing_score' => 'nullable|integer|min:0|max:100',
        ]));
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
}
