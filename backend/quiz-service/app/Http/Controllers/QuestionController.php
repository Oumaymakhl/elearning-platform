<?php
namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\Quiz;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function index($quizId) {
        $questions = Question::with('options')->where('quiz_id', $quizId)->get();
        return response()->json($questions);
    }

    public function store(Request $request, $quizId) {
        Quiz::findOrFail($quizId);
        $data = $request->validate([
            'text'   => 'required|string',
            'type'   => 'nullable|in:multiple_choice,true_false',
            'points' => 'nullable|integer|min:1',
        ]);
        $data['quiz_id'] = $quizId;
        $question = Question::create($data);
        return response()->json($question, 201);
    }

    public function show($quizId, $id) {
        $question = Question::with('options')->where('quiz_id', $quizId)->findOrFail($id);
        return response()->json($question);
    }

    public function update(Request $request, $quizId, $id) {
        $question = Question::where('quiz_id', $quizId)->findOrFail($id);
        $question->update($request->validate([
            'text'   => 'sometimes|string',
            'type'   => 'nullable|in:multiple_choice,true_false',
            'points' => 'nullable|integer|min:1',
        ]));
        return response()->json($question);
    }

    public function destroy($quizId, $id) {
        Question::where('quiz_id', $quizId)->findOrFail($id)->delete();
        return response()->json(['message' => 'Question deleted']);
    }
}
