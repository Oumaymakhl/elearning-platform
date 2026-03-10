<?php
namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\SubChapter;
use App\Models\Chapter;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    // Mettre à jour la position de lecture
    public function update(Request $request, $courseId) {
        $data = $request->validate([
            'sub_chapter_id' => 'required|integer',
        ]);

        $enrollment = Enrollment::where('user_id', $request->auth_user_id)
            ->where('course_id', $courseId)
            ->firstOrFail();

        // Calculer la progression en %
        $totalSubs = SubChapter::whereHas('chapter', fn($q) => $q->where('course_id', $courseId))->count();
        
        $currentSub = SubChapter::findOrFail($data['sub_chapter_id']);
        $passedSubs = SubChapter::whereHas('chapter', fn($q) => $q->where('course_id', $courseId))
            ->where(function($q) use ($currentSub) {
                $q->where('chapter_id', '<', $currentSub->chapter_id)
                  ->orWhere(function($q2) use ($currentSub) {
                      $q2->where('chapter_id', $currentSub->chapter_id)
                         ->where('order', '<=', $currentSub->order);
                  });
            })->count();

        $progress = $totalSubs > 0 ? round(($passedSubs / $totalSubs) * 100, 2) : 0;

        $enrollment->update([
            'current_sub_chapter_id' => $data['sub_chapter_id'],
            'progress' => $progress,
        ]);

        return response()->json(['progress' => $progress, 'current_sub_chapter_id' => $data['sub_chapter_id']]);
    }

    public function show(Request $request, $courseId) {
        $enrollment = Enrollment::where('user_id', $request->auth_user_id)
            ->where('course_id', $courseId)
            ->firstOrFail();
        return response()->json($enrollment);
    }
}
