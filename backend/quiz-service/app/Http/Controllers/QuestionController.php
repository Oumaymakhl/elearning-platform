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
            'image'  => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('quiz-images', 'public');
        }
        unset($data['image']);
        $data['quiz_id'] = $quizId;
        $question = Question::create($data);
        return response()->json($question->load('options'), 201);
    }

    public function show($quizId, $id) {
        $question = Question::with('options')->where('quiz_id', $quizId)->findOrFail($id);
        return response()->json($question);
    }

    public function update(Request $request, $quizId, $id) {
        $question = Question::where('quiz_id', $quizId)->findOrFail($id);
        $data = $request->validate([
            'text'   => 'sometimes|string',
            'type'   => 'nullable|in:multiple_choice,true_false',
            'points' => 'nullable|integer|min:1',
            'image'  => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        if ($request->hasFile('image')) {
            if ($question->image_path) {
                \Storage::disk('public')->delete($question->image_path);
            }
            $data['image_path'] = $request->file('image')->store('quiz-images', 'public');
        }
        unset($data['image']);
        $question->update($data);
        return response()->json($question->load('options'));
    }

    public function destroy($quizId, $id) {
        $question = Question::where('quiz_id', $quizId)->findOrFail($id);
        if ($question->image_path) {
            \Storage::disk('public')->delete($question->image_path);
        }
        $question->delete();
        return response()->json(['message' => 'Question deleted']);
    }
}
