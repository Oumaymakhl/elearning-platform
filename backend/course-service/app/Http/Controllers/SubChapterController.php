<?php
namespace App\Http\Controllers;
use App\Models\SubChapter;
use App\Models\Chapter;
use Illuminate\Http\Request;

class SubChapterController extends Controller {
    public function index($courseId, $chapterId) {
        $chapter = Chapter::where('course_id', $courseId)->findOrFail($chapterId);
        return response()->json(SubChapter::where('chapter_id', $chapterId)->orderBy('order')->get());
    }

    public function show($courseId, $chapterId, $id) {
        return response()->json(SubChapter::with('exercise')->where('chapter_id', $chapterId)->findOrFail($id));
    }

    public function store(Request $request, $courseId, $chapterId) {
        $chapter = Chapter::where('course_id', $courseId)->findOrFail($chapterId);
        $data = $request->validate([
            'title'         => 'required|string|max:255',
            'content'       => 'nullable|string',
            'order'         => 'nullable|integer',
            'is_lab'        => 'nullable|boolean',
            'quiz_id'       => 'nullable|integer',
            'passing_score' => 'nullable|integer|min:0|max:100',
            'exercise_id'   => 'nullable|integer',
        ]);
        $data['chapter_id'] = $chapterId;
        $data['order'] = $data['order'] ?? (SubChapter::where('chapter_id', $chapterId)->max('order') + 1);
        return response()->json(SubChapter::create($data)->load('exercise'), 201);
    }

    public function update(Request $request, $courseId, $chapterId, $id) {
        $sub = SubChapter::where('chapter_id', $chapterId)->findOrFail($id);
        $data = $request->validate([
            'title'         => 'sometimes|string|max:255',
            'content'       => 'nullable|string',
            'order'         => 'nullable|integer',
            'is_lab'        => 'nullable|boolean',
            'quiz_id'       => 'nullable|integer',
            'passing_score' => 'nullable|integer|min:0|max:100',
            'exercise_id'   => 'nullable|integer',
        ]);
        $sub->update($data);
        return response()->json($sub->load('exercise'));
    }

    public function destroy($courseId, $chapterId, $id) {
        $sub = SubChapter::where('chapter_id', $chapterId)->findOrFail($id);
        $sub->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
