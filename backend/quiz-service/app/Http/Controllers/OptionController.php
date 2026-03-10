<?php
namespace App\Http\Controllers;

use App\Models\Option;
use App\Models\Question;
use Illuminate\Http\Request;

class OptionController extends Controller
{
    public function index($quizId, $questionId) {
        return response()->json(Option::where('question_id', $questionId)->get());
    }

    public function store(Request $request, $quizId, $questionId) {
        Question::where('quiz_id', $quizId)->findOrFail($questionId);
        $data = $request->validate([
            'text'       => 'required|string',
            'image'      => 'nullable|string',
            'is_correct' => 'required|boolean',
        ]);
        $data['question_id'] = $questionId;
        $option = Option::create($data);
        return response()->json($option, 201);
    }

    public function update(Request $request, $quizId, $questionId, $id) {
        $option = Option::where('question_id', $questionId)->findOrFail($id);
        $option->update($request->validate([
            'text'       => 'sometimes|string',
            'image'      => 'nullable|string',
            'is_correct' => 'sometimes|boolean',
        ]));
        return response()->json($option);
    }

    public function destroy($quizId, $questionId, $id) {
        Option::where('question_id', $questionId)->findOrFail($id)->delete();
        return response()->json(['message' => 'Option deleted']);
    }
}
