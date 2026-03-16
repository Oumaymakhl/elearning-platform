<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CertificateController extends Controller
{
    public function check(Request $request, $courseId)
    {
        $userId = (int) $request->auth_user_id;

        $enrollment = DB::table('enrollments')
            ->where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();
        if (!$enrollment) {
            return response()->json(['eligible' => false, 'message' => 'Non inscrit'], 403);
        }

        // Total TDs du cours
        $total = DB::table('exercises as e')
            ->join('sub_chapters as sc', 'e.sub_chapter_id', '=', 'sc.id')
            ->join('chapters as c', 'sc.chapter_id', '=', 'c.id')
            ->where('c.course_id', $courseId)
            ->count();

        if ($total === 0) {
            return response()->json(['eligible' => false, 'message' => 'Aucun TD', 'total' => 0, 'completed' => 0]);
        }

        // TDs complétés - utiliser selectRaw pour DISTINCT
        $completed = DB::select("
            SELECT COUNT(DISTINCT e.id) as cnt
            FROM submissions s
            JOIN exercise_questions eq ON s.question_id = eq.id
            JOIN exercises e ON eq.exercise_id = e.id
            JOIN sub_chapters sc ON e.sub_chapter_id = sc.id
            JOIN chapters c ON sc.chapter_id = c.id
            WHERE c.course_id = ? AND s.user_id = ? AND s.passed = 1
        ", [$courseId, $userId]);
        $completed = $completed[0]->cnt ?? 0;

        $eligible = $completed >= $total;

        // Certificat déjà émis ?
        $existing = DB::table('certificates')
            ->where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();

        if ($existing) {
            return response()->json([
                'eligible' => true,
                'already_issued' => true,
                'certificate' => $existing,
                'total' => $total,
                'completed' => $completed,
            ]);
        }

        if (!$eligible) {
            return response()->json([
                'eligible' => false,
                'total' => $total,
                'completed' => $completed,
                'remaining' => $total - $completed,
            ]);
        }

        // Générer le certificat
        $course = DB::table('courses')->find($courseId);
        $certificateNumber = 'CERT-' . strtoupper(Str::random(8)) . '-' . date('Y');

        $certId = DB::table('certificates')->insertGetId([
            'user_id'            => $userId,
            'course_id'          => $courseId,
            'course_title'       => $course->title,
            'student_name'       => $request->auth_user_name ?? 'Étudiant',
            'certificate_number' => $certificateNumber,
            'issued_at'          => now(),
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        $certificate = DB::table('certificates')->find($certId);

        return response()->json([
            'eligible'       => true,
            'already_issued' => false,
            'certificate'    => $certificate,
            'total'          => $total,
            'completed'      => $completed,
        ]);
    }

    public function get(Request $request, $courseId)
    {
        $cert = DB::table('certificates')
            ->where('user_id', (int) $request->auth_user_id)
            ->where('course_id', $courseId)
            ->first();
        if (!$cert) return response()->json(['message' => 'Certificat non trouvé'], 404);
        return response()->json($cert);
    }

    public function myCertificates(Request $request)
    {
        $certs = DB::table('certificates')
            ->where('user_id', (int) $request->auth_user_id)
            ->orderBy('issued_at', 'desc')
            ->get();
        return response()->json($certs);
    }
}
