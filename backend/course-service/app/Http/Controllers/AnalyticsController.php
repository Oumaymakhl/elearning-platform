<?php
namespace App\Http\Controllers;
 
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
 
class AnalyticsController extends Controller
{
    public function teacherStats(Request $request)
    {
        $userId = $request->auth_user_id;
        $role   = $request->auth_user_role;
 
        $coursesQuery = Course::query();
        if ($role === 'teacher') {
            $coursesQuery->where('instructor_id', $userId);
        }
 
        $courses   = $coursesQuery->withCount('enrollments')->get();
        $courseIds = $courses->pluck('id');
 
        $totalEnrollments = Enrollment::whereIn('course_id', $courseIds)->count();
        $completed        = Enrollment::whereIn('course_id', $courseIds)->where('progress', 100)->count();
        $avgProgress      = Enrollment::whereIn('course_id', $courseIds)->avg('progress') ?? 0;
 
        $enrollmentsByMonth = Enrollment::whereIn('course_id', $courseIds)
            ->where('created_at', '>=', now()->subMonths(6))
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
            ->groupBy('month')
            ->orderBy('month')
            ->get();
 
        $topCourses = $courses->sortByDesc('enrollments_count')
            ->take(5)
            ->map(fn($c) => [
                'id'          => $c->id,
                'title'       => $c->title,
                'enrollments' => $c->enrollments_count,
                'level'       => $c->level,
            ])->values();
 
        $completionByCourse = Enrollment::whereIn('course_id', $courseIds)
            ->selectRaw('course_id, COUNT(*) as total, SUM(progress = 100) as done, AVG(progress) as avg_progress')
            ->groupBy('course_id')
            ->get()
            ->map(function ($row) use ($courses) {
                $course = $courses->firstWhere('id', $row->course_id);
                return [
                    'course_id'       => $row->course_id,
                    'title'           => $course?->title ?? 'Cours #' . $row->course_id,
                    'total'           => $row->total,
                    'done'            => $row->done,
                    'avg_progress'    => round($row->avg_progress, 1),
                    'completion_rate' => $row->total > 0
                        ? round(($row->done / $row->total) * 100, 1)
                        : 0,
                ];
            })
            ->sortByDesc('completion_rate')
            ->values();
 
        $activeStudents = Enrollment::whereIn('course_id', $courseIds)
            ->where('progress', '>', 0)
            ->where('progress', '<', 100)
            ->count();
 
        return response()->json([
            'summary' => [
                'total_courses'     => $courses->count(),
                'total_enrollments' => $totalEnrollments,
                'completed'         => $completed,
                'active_students'   => $activeStudents,
                'avg_progress'      => round($avgProgress, 1),
                'completion_rate'   => $totalEnrollments > 0
                    ? round(($completed / $totalEnrollments) * 100, 1)
                    : 0,
            ],
            'top_courses'          => $topCourses,
            'completion_by_course' => $completionByCourse,
            'enrollments_by_month' => $enrollmentsByMonth,
        ]);
    }
 
    public function courseStats(Request $request, $courseId)
    {
        $course = Course::with('chapters.subChapters')->findOrFail($courseId);
 
        if ($course->instructor_id != $request->auth_user_id && $request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
 
        $enrollments = Enrollment::where('course_id', $courseId)->get();
 
        $progressDistribution = [
            ['label' => '0%',     'min' => 0,   'max' => 0,   'count' => 0],
            ['label' => '1–25%',  'min' => 1,   'max' => 25,  'count' => 0],
            ['label' => '26–50%', 'min' => 26,  'max' => 50,  'count' => 0],
            ['label' => '51–75%', 'min' => 51,  'max' => 75,  'count' => 0],
            ['label' => '76–99%', 'min' => 76,  'max' => 99,  'count' => 0],
            ['label' => '100%',   'min' => 100, 'max' => 100, 'count' => 0],
        ];
        foreach ($enrollments as $e) {
            $p = (float) $e->progress;
            foreach ($progressDistribution as &$bucket) {
                if ($p >= $bucket['min'] && $p <= $bucket['max']) { $bucket['count']++; break; }
            }
        }
 
        $visitedSubs = DB::table('visited_sub_chapters')
            ->where('course_id', $courseId)
            ->selectRaw('sub_chapter_id, COUNT(DISTINCT user_id) as visitors')
            ->groupBy('sub_chapter_id')
            ->orderByDesc('visitors')
            ->take(10)
            ->get();
 
        return response()->json([
            'course' => [
                'id'          => $course->id,
                'title'       => $course->title,
                'level'       => $course->level,
                'chapters'    => $course->chapters->count(),
                'subchapters' => $course->chapters->sum(fn($c) => $c->subChapters->count()),
            ],
            'enrollment_summary' => [
                'total'        => $enrollments->count(),
                'completed'    => $enrollments->where('progress', 100)->count(),
                'active'       => $enrollments->where('progress', '>', 0)->where('progress', '<', 100)->count(),
                'not_started'  => $enrollments->where('progress', 0)->count(),
                'avg_progress' => round($enrollments->avg('progress'), 1),
            ],
            'progress_distribution'   => collect($progressDistribution)->map(fn($b) => ['label' => $b['label'], 'count' => $b['count']])->values(),
            'top_visited_subchapters' => $visitedSubs,
        ]);
    }
}
