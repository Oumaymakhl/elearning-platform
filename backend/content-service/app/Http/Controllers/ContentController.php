<?php
namespace App\Http\Controllers;

use App\Models\Content;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    public function index(Request $request)
    {
        $query = Content::query();
        if ($request->course_id)       $query->where('course_id', $request->course_id);
        if ($request->sub_chapter_id)  $query->where('sub_chapter_id', $request->sub_chapter_id);
        if ($request->type)            $query->where('type', $request->type);
        return response()->json($query->paginate(20));
    }

    public function show($id)
    {
        $content = Content::findOrFail($id);
        return response()->json($content);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id'       => 'required|integer',
            'sub_chapter_id'  => 'nullable|integer',
            'title'           => 'required|string|max:255',
            'type'            => 'required|in:pdf,video,link,text',
            'url'             => 'required_if:type,video,link|nullable|url',
            'file'            => 'required_if:type,pdf|nullable|file|mimes:pdf|max:10240',
            'description'     => 'nullable|string',
        ]);

        $data = [
            'course_id'      => $validated['course_id'],
            'sub_chapter_id' => $validated['sub_chapter_id'] ?? null,
            'uploader_id'    => (int) $request->auth_user_id,
            'title'          => $validated['title'],
            'type'           => $validated['type'],
            'description'    => $validated['description'] ?? null,
        ];

        if (in_array($validated['type'], ['video', 'link'])) {
            $data['url'] = $validated['url'];
        }

        if ($validated['type'] === 'pdf' && $request->hasFile('file')) {
            $path = $request->file('file')->store('contents', 'public');
            $data['file_path'] = $path;
        }

        if ($validated['type'] === 'text') {
            $data['url'] = null;
        }

        $content = Content::create($data);
        return response()->json($content, 201);
    }

    public function update(Request $request, $id)
    {
        $content = Content::findOrFail($id);

        if ((int)$request->auth_user_id !== (int)$content->uploader_id && $request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title'          => 'sometimes|string|max:255',
            'description'    => 'nullable|string',
            'type'           => 'sometimes|in:pdf,video,link,text',
            'url'            => 'nullable|url',
            'sub_chapter_id' => 'nullable|integer',
            'file'           => 'nullable|file|mimes:pdf|max:10240',
        ]);

        if ($request->hasFile('file')) {
            if ($content->file_path) {
                \Storage::disk('public')->delete($content->file_path);
            }
            $validated['file_path'] = $request->file('file')->store('contents', 'public');
            $validated['url'] = null;
        }

        $content->update($validated);
        return response()->json($content);
    }

    public function destroy(Request $request, $id)
    {
        $content = Content::findOrFail($id);

        if ((int)$request->auth_user_id !== (int)$content->uploader_id && $request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($content->file_path) {
            \Storage::disk('public')->delete($content->file_path);
        }

        $content->delete();
        return response()->json(['message' => 'Content deleted']);
    }
}
