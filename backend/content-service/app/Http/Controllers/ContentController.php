<?php

namespace App\Http\Controllers;

use App\Models\Content;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    public function index(Request $request)
    {
        $courseId = $request->query('course_id');
        $query = Content::query();
        if ($courseId) {
            $query->where('course_id', $courseId);
        }
        return response()->json($query->paginate());
    }

    public function show($id)
    {
        $content = Content::find($id);
        if (!$content) {
            return response()->json(['message' => 'Content not found'], 404);
        }
        return response()->json($content);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'required|integer',
            'title' => 'required|string|max:255',
            'type' => 'required|in:pdf,video,link,text',
            'url' => 'required_if:type,video,link|nullable|url',
            'file' => 'required_if:type,pdf|nullable|file|mimes:pdf|max:10240',
            'description' => 'nullable|string',
        ]);

        $data = [
            'course_id' => $validated['course_id'],
            'uploader_id' => auth()->id(),
            'title' => $validated['title'],
            'type' => $validated['type'],
            'description' => $validated['description'] ?? null,
        ];

        if (in_array($validated['type'], ['video', 'link'])) {
            $data['url'] = $validated['url'];
        }

        if ($validated['type'] === 'pdf' && $request->hasFile('file')) {
            $path = $request->file('file')->store('contents', 'public');
            $data['file_path'] = $path;
        }

        $content = Content::create($data);
        return response()->json($content, 201);
    }

    public function update(Request $request, $id)
    {
        $content = Content::find($id);
        if (!$content) {
            return response()->json(['message' => 'Content not found'], 404);
        }

        if (auth()->id() != $content->uploader_id && auth()->user()->role != 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|in:pdf,video,link,text',
            'url' => 'nullable|url',
            'file' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        if (isset($validated['type']) && $validated['type'] !== $content->type) {
            // Si le type change, on gère l'ancien fichier si nécessaire
            if ($content->type === 'pdf' && $content->file_path) {
                \Storage::disk('public')->delete($content->file_path);
                $content->file_path = null;
            }
            if ($content->type === 'video' || $content->type === 'link') {
                $content->url = null;
            }
        }

        $content->fill($validated);

        if ($request->hasFile('file')) {
            if ($content->file_path) {
                \Storage::disk('public')->delete($content->file_path);
            }
            $path = $request->file('file')->store('contents', 'public');
            $content->file_path = $path;
            $content->url = null;
        }

        if ($request->has('url')) {
            $content->url = $request->url;
            if ($content->file_path) {
                \Storage::disk('public')->delete($content->file_path);
                $content->file_path = null;
            }
        }

        $content->save();
        return response()->json($content);
    }

    public function destroy($id)
    {
        $content = Content::find($id);
        if (!$content) {
            return response()->json(['message' => 'Content not found'], 404);
        }

        if (auth()->id() != $content->uploader_id && auth()->user()->role != 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($content->file_path) {
            \Storage::disk('public')->delete($content->file_path);
        }

        $content->delete();
        return response()->json(['message' => 'Content deleted']);
    }
}
