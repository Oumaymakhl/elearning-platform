<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\Question;
use App\Models\Option;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function index(Quiz $quiz)
    {
        return response()->json($quiz->questions()->with('options')->get());
    }

    public function show(Quiz $quiz, Question $question)
    {
        if ($question->quiz_id != $quiz->id) {
            return response()->json(['message' => 'Question not found in this quiz'], 404);
        }
        return response()->json($question->load('options'));
    }

    public function store(Request $request, Quiz $quiz)
    {
        if (auth()->id() != $quiz->created_by && auth()->user()->role != 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'text' => 'required|string',
            'type' => 'required|in:multiple_choice,true_false',
            'points' => 'integer|min:1',
            'options' => 'required_if:type,multiple_choice|array|min:2',
            'options.*.text' => 'required_with:options|string',
            'options.*.is_correct' => 'required_with:options|boolean',
            'correct_answer' => 'required_if:type,true_false|boolean',
        ]);

        $question = $quiz->questions()->create([
            'text' => $validated['text'],
            'type' => $validated['type'],
            'points' => $validated['points'] ?? 1,
        ]);

        if ($validated['type'] == 'multiple_choice' && isset($validated['options'])) {
            foreach ($validated['options'] as $opt) {
                $question->options()->create($opt);
            }
        } elseif ($validated['type'] == 'true_false') {
            $correct = $request->input('correct_answer', true);
            $question->options()->createMany([
                ['text' => 'Vrai', 'is_correct' => $correct],
                ['text' => 'Faux', 'is_correct' => !$correct],
            ]);
        }

        return response()->json($question->load('options'), 201);
    }

    public function update(Request $request, Quiz $quiz, Question $question)
    {
        if ($question->quiz_id != $quiz->id) {
            return response()->json(['message' => 'Question not found in this quiz'], 404);
        }
        if (auth()->id() != $quiz->created_by && auth()->user()->role != 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'text' => 'sometimes|string',
            'type' => 'sometimes|in:multiple_choice,true_false',
            'points' => 'sometimes|integer|min:1',
        ]);

        $question->update($validated);
        return response()->json($question);
    }

    public function destroy(Quiz $quiz, Question $question)
    {
        if ($question->quiz_id != $quiz->id) {
            return response()->json(['message' => 'Question not found in this quiz'], 404);
        }
        if (auth()->id() != $quiz->created_by && auth()->user()->role != 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $question->delete();
        return response()->json(['message' => 'Question deleted']);
    }
}
