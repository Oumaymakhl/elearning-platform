<?php
namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\SubChapter;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProgressController extends Controller
{
    public function update(Request $request, $courseId)
    {
        $data = $request->validate([
            'sub_chapter_id' => 'required|integer',
        ]);
        $userId = $request->auth_user_id;

        $enrollment = Enrollment::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->firstOrFail();

        $wasComplete = $enrollment->progress >= 100;

        DB::table('visited_sub_chapters')->insertOrIgnore([
            'user_id'        => $userId,
            'course_id'      => $courseId,
            'sub_chapter_id' => $data['sub_chapter_id'],
        ]);

        $totalSubs   = SubChapter::whereHas('chapter', fn($q) => $q->where('course_id', $courseId))->count();
        $visitedCount = DB::table('visited_sub_chapters')
            ->where('user_id', $userId)
            ->where('course_id', $courseId)
            ->count();
        $progress    = $totalSubs > 0 ? round(($visitedCount / $totalSubs) * 100, 2) : 0;

        $enrollment->update([
            'current_sub_chapter_id' => $data['sub_chapter_id'],
            'progress'               => $progress,
        ]);

        // ── Notif quand le cours est terminé à 100% ──────────────────
        if (!$wasComplete && $progress >= 100) {
            $course = Course::find($courseId);

            // Notif étudiant — félicitations
            $this->sendNotification($userId, 'course_completed', [
                'title'        => '🎓 Félicitations ! Cours terminé',
                'message'      => 'Vous avez complété le cours « ' . ($course->title ?? 'N/A') . ' » à 100% ! Excellent travail.',
                'course_id'    => $courseId,
                'course_title' => $course->title ?? '',
                'progress'     => 100,
                'completed_at' => now()->toIso8601String(),
                'action_url'   => '/courses/' . $courseId . '/certificate',
            ], 'high');

            // Notif teacher — un étudiant a terminé
            if ($course && $course->instructor_id) {
                $this->sendNotification($course->instructor_id, 'student_completed', [
                    'title'        => '🏆 Étudiant a terminé votre cours',
                    'message'      => 'L\'étudiant #' . $userId . ' a terminé le cours « ' . $course->title . ' » à 100%.',
                    'course_id'    => $courseId,
                    'course_title' => $course->title ?? '',
                    'student_id'   => $userId,
                    'completed_at' => now()->toIso8601String(),
                    'action_url'   => '/courses/' . $courseId . '/students',
                ], 'medium');
            }
        }

        // ── Notif étape 50% ──────────────────────────────────────────
        $previousProgress = $enrollment->getOriginal('progress') ?? 0;
        if ($previousProgress < 50 && $progress >= 50 && $progress < 100) {
            $course = $course ?? Course::find($courseId);
            $this->sendNotification($userId, 'progress_milestone', [
                'title'        => '🌟 Mi-chemin atteint !',
                'message'      => 'Vous avez complété 50% du cours « ' . ($course->title ?? '') . ' ». Continuez comme ça !',
                'course_id'    => $courseId,
                'course_title' => $course->title ?? '',
                'progress'     => 50,
                'action_url'   => '/courses/' . $courseId,
            ], 'low');
        }

        return response()->json([
            'progress'              => $progress,
            'current_sub_chapter_id' => $data['sub_chapter_id'],
            'visited'               => $visitedCount,
            'total'                 => $totalSubs,
        ]);
    }

    public function show(Request $request, $courseId)
    {
        $enrollment = Enrollment::where('user_id', $request->auth_user_id)
            ->where('course_id', $courseId)
            ->firstOrFail();
        return response()->json($enrollment);
    }

    private function sendNotification(int $userId, string $type, array $data, string $priority = 'medium'): void
    {
        try {
            Http::timeout(3)->post('http://nginx-notification/api/internal/send', [
                'user_id'  => $userId,
                'type'     => $type,
                'data'     => $data,
                'priority' => $priority,
            ]);
        } catch (\Exception $e) {
            Log::warning("Notification failed [{$type}] user={$userId}: " . $e->getMessage());
        }
    }
}
