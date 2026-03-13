<?php
namespace App\Http\Controllers;
use App\Models\Enrollment;
use App\Models\SubChapter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgressController extends Controller
{
    public function update(Request $request, $courseId) {
        $data = $request->validate([
            "sub_chapter_id" => "required|integer",
        ]);
        $userId = $request->auth_user_id;
        $enrollment = Enrollment::where("user_id", $userId)
            ->where("course_id", $courseId)
            ->firstOrFail();

        DB::table("visited_sub_chapters")->insertOrIgnore([
            "user_id" => $userId,
            "course_id" => $courseId,
            "sub_chapter_id" => $data["sub_chapter_id"]
        ]);

        $totalSubs = SubChapter::whereHas("chapter", fn($q) => $q->where("course_id", $courseId))->count();
        $visitedCount = DB::table("visited_sub_chapters")
            ->where("user_id", $userId)
            ->where("course_id", $courseId)
            ->count();
        $progress = $totalSubs > 0 ? round(($visitedCount / $totalSubs) * 100, 2) : 0;

        $enrollment->update([
            "current_sub_chapter_id" => $data["sub_chapter_id"],
            "progress" => $progress,
        ]);
        return response()->json(["progress" => $progress, "current_sub_chapter_id" => $data["sub_chapter_id"]]);
    }

    public function show(Request $request, $courseId) {
        $enrollment = Enrollment::where("user_id", $request->auth_user_id)
            ->where("course_id", $courseId)
            ->firstOrFail();
        return response()->json($enrollment);
    }
}
