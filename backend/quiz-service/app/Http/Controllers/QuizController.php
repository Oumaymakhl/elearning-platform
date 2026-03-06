<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class QuizController extends Controller
{
    public function index()
    {
        return response()->json(Quiz::with('questions.options')->paginate());
    }

    public function show($id)
    {
        $quiz = Quiz::with('questions.options')->find($id);
        if (!$quiz) {
            return response()->json(['message' => 'Quiz not found'], 404);
        }
        return response()->json($quiz);
    }

    public function store(Request $request)
    {
        Log::info('Store method called', $request->all());

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'lesson_id' => 'required|integer',
        ]);

        $quiz = Quiz::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'lesson_id' => $validated['lesson_id'],
            'created_by' => $request->get('auth_user_id'),
            'passing_score' => $request->input('passing_score', 70),
        ]);

        Log::info('Quiz created', ['id' => $quiz->id]);

        return response()->json($quiz, 201);
    }

    public function update(Request $request, $id)
    {
        $quiz = Quiz::find($id);
        if (!$quiz) {
            return response()->json(['message' => 'Quiz not found'], 404);
        }

        if ($request->get('auth_user_id') != $quiz->created_by && auth()->user()->role != 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'lesson_id' => 'sometimes|integer',
            'passing_score' => 'sometimes|integer|min:1|max:100',
        ]);

        $quiz->update($validated);
        return response()->json($quiz);
    }

    public function destroy($id)
    {
        $quiz = Quiz::find($id);
        if (!$quiz) {
            return response()->json(['message' => 'Quiz not found'], 404);
        }

        if ($request->get('auth_user_id') != $quiz->created_by && auth()->user()->role != 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $quiz->delete();
        return response()->json(['message' => 'Quiz deleted']);
    }
}
