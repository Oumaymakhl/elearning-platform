<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['login', 'register', 'verifyEmail', 'forgotPassword', 'resetPassword', 'verifyResetToken']]);
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'role'     => 'nullable|in:student,teacher',
        ]);
        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $verificationToken = Str::random(64);
        $user = User::create([
            'name'               => $request->name,
            'email'              => $request->email,
            'password'           => Hash::make($request->password),
            'role'               => $request->role ?? 'student',
            'verification_token' => $verificationToken,
            'email_verified_at'  => null,
        ]);

        // Envoyer email de vérification
        $verificationUrl = 'http://localhost:4200/verify-email?token=' . $verificationToken;
        \Mail::to($user->email)->send(new \App\Mail\VerificationEmail($verificationUrl, $user->name));

        return response()->json([
            'status'  => 'success',
            'message' => 'User created successfully. Please check your email to verify your account.',
            'user'    => $user,
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'       => 'required|string|email',
            'password'    => 'required|string',
            'remember_me' => 'boolean',
        ]);
        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $credentials = $request->only('email', 'password');
        if (!$token = auth()->attempt($credentials)) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $user = auth()->user();

        if (!$user->email_verified_at) {
            auth()->logout();
            return response()->json(['status' => 'error', 'message' => 'Email not verified'], 403);
        }

        if ($request->boolean('remember_me')) {
            $user->forceFill(['remember_token' => Str::random(60)])->save();
        } else {
            $user->forceFill(['remember_token' => null])->save();
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
        $user = User::where('verification_token', $token)
            ->whereNull('email_verified_at')
            ->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid or expired token'], 400);
        }

        $user->forceFill([
            'email_verified_at' => now(),
            'verification_token' => null,
        ])->save();

        return response()->json(['message' => 'Email verified successfully']);
    }

    public function logout()
    {
        $user = auth()->user();
        if ($user) {
            $user->forceFill(['remember_token' => null])->save();
        }
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

    // Admin only
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

    // Liste users (admin)
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

        $user = \App\Models\User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Aucun compte trouvé avec cet email'], 404);
        }

        $token = \Illuminate\Support\Str::random(64);

        \Illuminate\Support\Facades\DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => bcrypt($token), 'created_at' => now()]
        );

        $resetUrl = env('FRONTEND_URL', 'http://localhost:4200') . '/reset-password?token=' . $token . '&email=' . urlencode($request->email);

        \Illuminate\Support\Facades\Mail::send('emails.reset-password', ['url' => $resetUrl, 'user' => $user], function($m) use ($user) {
            $m->to($user->email)->subject('Réinitialisation de votre mot de passe');
        });

        return response()->json(['message' => 'Email de réinitialisation envoyé']);
    }

    public function verifyResetToken(Request $request)
    {
        $request->validate(['email' => 'required|email', 'token' => 'required']);
        $record = \Illuminate\Support\Facades\DB::table('password_reset_tokens')
            ->where('email', $request->email)->first();
        if (!$record || !\Illuminate\Support\Facades\Hash::check($request->token, $record->token)) {
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

        $record = \Illuminate\Support\Facades\DB::table('password_reset_tokens')
            ->where('email', $request->email)->first();

        if (!$record || !\Illuminate\Support\Facades\Hash::check($request->token, $record->token)) {
            return response()->json(['message' => 'Token invalide ou expiré'], 422);
        }

        $user = \App\Models\User::where('email', $request->email)->first();
        $user->update(['password' => bcrypt($request->password)]);

        \Illuminate\Support\Facades\DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Mot de passe réinitialisé avec succès']);
    }
}
