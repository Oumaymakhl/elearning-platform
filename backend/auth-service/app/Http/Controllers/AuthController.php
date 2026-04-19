<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => [
            'login', 'register', 'verifyEmail',
            'forgotPassword', 'resetPassword', 'verifyResetToken'
        ]]);
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'role'     => 'nullable|in:student,teacher',
            'cv'       => 'nullable|file|mimes:pdf,doc,docx|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $cvPath = null;
        if ($request->hasFile('cv') && $request->role === 'teacher') {
            $cvPath = $request->file('cv')->store('cvs', 'public');
        }

        $verificationToken = Str::random(64);
        $isTeacher = $request->role === 'teacher';

        $user = User::create([
            'name'               => $request->name,
            'email'              => $request->email,
            'password'           => Hash::make($request->password),
            'role'               => $request->role ?? 'student',
            'cv_path'            => $cvPath,
            'is_approved'        => !$isTeacher,
            'verification_token' => $verificationToken,
            'email_verified_at'  => null,
        ]);

        $verificationUrl = 'http://localhost:4200/verify-email?token=' . $verificationToken;
        Mail::to($user->email)->send(new \App\Mail\VerificationEmail($verificationUrl, $user->name));

        $message = $isTeacher
            ? 'Compte créé. Vérifiez votre email puis attendez l\'approbation de l\'administrateur.'
            : 'Compte créé. Vérifiez votre email pour activer votre compte.';

        return response()->json([
            'status'  => 'success',
            'message' => $message,
            'user'    => $user,
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        if (!$token = auth()->attempt($request->only('email', 'password'))) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $user = auth()->user();

        if (!$user->email_verified_at) {
            auth()->logout();
            return response()->json(['status' => 'error', 'message' => 'Email not verified'], 403);
        }

        if ($user->role === 'teacher' && !$user->is_approved) {
            auth()->logout();
            return response()->json(['status' => 'error', 'message' => 'Account pending admin approval'], 403);
        }

        return response()->json([
            'status' => 'success',
            'user'   => $user,
            'authorization' => [
                'token'      => $token,
                'type'       => 'bearer',
                'expires_in' => auth()->factory()->getTTL() * 60,
            ]
        ]);
    }

    public function verifyEmail(Request $request)
    {
        $token = $request->query('token') ?? $request->input('token');
        $user  = User::where('verification_token', $token)->whereNull('email_verified_at')->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid or expired token'], 400);
        }

        $user->forceFill([
            'email_verified_at'  => now(),
            'verification_token' => null,
        ])->save();

        // Notifier les admins si c'est un enseignant en attente
        if ($user->role === 'teacher') {
            $admins = User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                Mail::to($admin->email)->send(new \App\Mail\TeacherPendingApprovalMail($user));
            }
        }

        return response()->json(['message' => 'Email verified successfully']);
    }

    public function approveTeacher(Request $request, $id)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $teacher = User::findOrFail($id);

        if ($teacher->role !== 'teacher') {
            return response()->json(['message' => 'User is not a teacher'], 422);
        }

        $validator = Validator::make($request->all(), [
            'approved' => 'required|boolean',
            'reason'   => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $teacher->forceFill(['is_approved' => $request->approved])->save();

        Mail::to($teacher->email)->send(
            new \App\Mail\TeacherApprovalResultMail($teacher, $request->approved, $request->reason)
        );

        $msg = $request->approved ? 'Enseignant approuvé.' : 'Enseignant rejeté.';
        return response()->json(['message' => $msg, 'user' => $teacher]);
    }

    public function pendingTeachers()
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $teachers = User::where('role', 'teacher')
            ->where('is_approved', false)
            ->whereNotNull('email_verified_at')
            ->get();

        return response()->json($teachers);
    }

    public function getCv($id)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $teacher = User::findOrFail($id);

        if (!$teacher->cv_path) {
            return response()->json(['message' => 'No CV found'], 404);
        }

        return response()->json([
            'cv_url' => 'http://localhost:8000/storage/' . $teacher->cv_path
        ]);
    }

    public function logout()
    {
        auth()->logout();
        return response()->json(['status' => 'success', 'message' => 'Successfully logged out']);
    }

    public function refresh()
    {
        return response()->json([
            'status' => 'success',
            'user'   => auth()->user(),
            'authorization' => [
                'token'      => auth()->refresh(),
                'type'       => 'bearer',
                'expires_in' => auth()->factory()->getTTL() * 60,
            ]
        ]);
    }

    public function me()
    {
        return response()->json(auth()->user());
    }

    public function updateRole(Request $request, $id)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $validator = Validator::make($request->all(), [
            'role' => 'required|in:student,teacher,admin',
        ]);
        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }
        $user = User::findOrFail($id);
        $user->forceFill(['role' => $request->role])->save();
        return response()->json(['message' => 'Role updated', 'user' => $user]);
    }

    public function users()
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return response()->json(User::all());
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'Aucun compte trouvé avec cet email'], 404);
        }
        $token = Str::random(64);
        \Illuminate\Support\Facades\DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => bcrypt($token), 'created_at' => now()]
        );
        $resetUrl = env('FRONTEND_URL', 'http://localhost:4200') . '/reset-password?token=' . $token . '&email=' . urlencode($request->email);
        Mail::send('emails.reset-password', ['url' => $resetUrl, 'user' => $user], function($m) use ($user) {
            $m->to($user->email)->subject('Réinitialisation de votre mot de passe');
        });
        return response()->json(['message' => 'Email de réinitialisation envoyé']);
    }

    public function verifyResetToken(Request $request)
    {
        $request->validate(['email' => 'required|email', 'token' => 'required']);
        $record = \Illuminate\Support\Facades\DB::table('password_reset_tokens')->where('email', $request->email)->first();
        if (!$record || !Hash::check($request->token, $record->token)) {
            return response()->json(['message' => 'Token invalide ou expiré'], 422);
        }
        return response()->json(['message' => 'Token valide']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'token'    => 'required',
            'password' => 'required|min:6|confirmed',
        ]);
        $record = \Illuminate\Support\Facades\DB::table('password_reset_tokens')->where('email', $request->email)->first();
        if (!$record || !Hash::check($request->token, $record->token)) {
            return response()->json(['message' => 'Token invalide ou expiré'], 422);
        }
        $user = User::where('email', $request->email)->first();
        $user->update(['password' => bcrypt($request->password)]);
        \Illuminate\Support\Facades\DB::table('password_reset_tokens')->where('email', $request->email)->delete();
        return response()->json(['message' => 'Mot de passe réinitialisé avec succès']);
    }
}
