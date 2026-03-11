<?php
namespace App\Http\Controllers;

use App\Models\SubChapter;
use App\Models\Chapter;
use App\Models\Course;
use Illuminate\Http\Request;

class SubChapterController extends Controller
{
    public function index($courseId, $chapterId)
    {
        Chapter::where('course_id', $courseId)->findOrFail($chapterId);
        $subChapters = SubChapter::where('chapter_id', $chapterId)
            ->orderBy('order')
            ->get();
        return response()->json($subChapters);
    }

    public function show($courseId, $chapterId, $id)
    {
        Chapter::where('course_id', $courseId)->findOrFail($chapterId);
        $subChapter = SubChapter::where('chapter_id', $chapterId)->findOrFail($id);
        return response()->json($subChapter);
    }

    public function store(Request $request, $courseId, $chapterId)
    {
        $course = Course::findOrFail($courseId);
        if ((int)$course->instructor_id !== (int)$request->auth_user_id && $request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        Chapter::where('course_id', $courseId)->findOrFail($chapterId);
        $data = $request->validate([
            'title'   => 'required|string|max:255',
            'content' => 'nullable|string',
            'order'   => 'nullable|integer',
            'is_lab'  => 'nullable|boolean',
        ]);
        $data['chapter_id'] = $chapterId;
        $data['order'] = $data['order'] ?? (SubChapter::where('chapter_id', $chapterId)->max('order') + 1);
        $subChapter = SubChapter::create($data);
        return response()->json($subChapter, 201);
    }

    public function update(Request $request, $courseId, $chapterId, $id)
    {
        $course = Course::findOrFail($courseId);
        if ((int)$course->instructor_id !== (int)$request->auth_user_id && $request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        Chapter::where('course_id', $courseId)->findOrFail($chapterId);
        $subChapter = SubChapter::where('chapter_id', $chapterId)->findOrFail($id);
        $subChapter->update($request->validate([
            'title'   => 'sometimes|string|max:255',
            'content' => 'nullable|string',
            'order'   => 'nullable|integer',
            'is_lab'  => 'nullable|boolean',
        ]));
        return response()->json($subChapter);
    }

    public function destroy(Request $request, $courseId, $chapterId, $id)
    {
        $course = Course::findOrFail($courseId);
        if ((int)$course->instructor_id !== (int)$request->auth_user_id && $request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        Chapter::where('course_id', $courseId)->findOrFail($chapterId);
        SubChapter::where('chapter_id', $chapterId)->findOrFail($id)->delete();
        return response()->json(['message' => 'SubChapter deleted']);
    }
}
