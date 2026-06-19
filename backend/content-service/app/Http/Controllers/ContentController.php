<?php
namespace App\Http\Controllers;

use App\Models\Content;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ContentController extends Controller
{
    public function uploadMedia(Request $request)
    {
        if (!in_array($request->auth_user_role, ['teacher', 'admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $validated = $request->validate([
            'course_id' => 'required|integer',
            'file' => 'required|file|mimetypes:image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime|max:102400',
        ]);
        $file = $request->file('file');
        $path = $file->store('course-media/' . $validated['course_id'], 'public');
        DB::table('media_assets')->insert([
            'course_id' => $validated['course_id'],
            'uploader_id' => (int) $request->auth_user_id,
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'url' => '/api/contents/media/' . basename($path),
            'mime_type' => $file->getMimeType(),
        ], 201);
    }

    public function media(string $filename)
    {
        $asset = DB::table('media_assets')->where('file_path', 'like', '%/' . $filename)->first();
        abort_unless($asset && Storage::disk('public')->exists($asset->file_path), 404);
        return response()->file(Storage::disk('public')->path($asset->file_path), [
            'Content-Type' => $asset->mime_type,
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    public function destroyForCourse($courseId)
    {
        $assets = DB::table('media_assets')->where('course_id', $courseId)->get();
        foreach ($assets as $asset) Storage::disk('public')->delete($asset->file_path);

        Content::where('course_id', $courseId)->get()->each(function (Content $content) {
            if ($content->file_path) Storage::disk('public')->delete($content->file_path);
            $content->delete();
        });
        DB::table('media_assets')->where('course_id', $courseId)->delete();
        return response()->json(['deleted' => true]);
    }

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
                Storage::disk('public')->delete($content->file_path);
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
            Storage::disk('public')->delete($content->file_path);
        }

        $content->delete();
        return response()->json(['message' => 'Content deleted']);
    }
}
