<?php
namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\Course;
use Illuminate\Http\Request;

class ChapterController extends Controller
{
    public function index($courseId)
    {
        Course::findOrFail($courseId);
        $chapters = Chapter::with('subChapters.exercise')
            ->where('course_id', $courseId)
            ->orderBy('order')
            ->get();
        return response()->json($chapters);
    }

    public function show($courseId, $id)
    {
        $chapter = Chapter::with('subChapters.exercise')
            ->where('course_id', $courseId)
            ->findOrFail($id);
        return response()->json($chapter);
    }

    public function store(Request $request, $courseId)
    {
        $course = Course::findOrFail($courseId);
        if ((int)$course->instructor_id !== (int)$request->auth_user_id && $request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $data = $request->validate([
            'title'     => 'required|string|max:255',
            'objective' => 'nullable|string',
            'order'     => 'nullable|integer',
        ]);
        $data['course_id'] = $courseId;
        $data['order'] = $data['order'] ?? (Chapter::where('course_id', $courseId)->max('order') + 1);
        $chapter = Chapter::create($data);
        return response()->json($chapter->load('subChapters'), 201);
    }

    public function update(Request $request, $courseId, $id)
    {
        $course = Course::findOrFail($courseId);
        if ((int)$course->instructor_id !== (int)$request->auth_user_id && $request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $chapter = Chapter::where('course_id', $courseId)->findOrFail($id);
        $chapter->update($request->validate([
            'title'     => 'sometimes|string|max:255',
            'objective' => 'nullable|string',
            'order'     => 'nullable|integer',
        ]));
        return response()->json($chapter->load('subChapters'));
    }

    public function destroy(Request $request, $courseId, $id)
    {
        $course = Course::findOrFail($courseId);
        if ((int)$course->instructor_id !== (int)$request->auth_user_id && $request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        Chapter::where('course_id', $courseId)->findOrFail($id)->delete();
        return response()->json(['message' => 'Chapter deleted']);
    }
}
