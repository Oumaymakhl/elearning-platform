<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['login', 'register', 'verifyEmail']]);
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
            'remember_token'     => $verificationToken,
            'email_verified_at'  => null,
        ]);

        // TODO: envoyer email avec lien /api/verify-email?token=$verificationToken
        // Pour l'instant on auto-vérifie en dev
        $user->forceFill(['email_verified_at' => now()])->save();

        $token = auth()->login($user);
        return response()->json([
            'status'  => 'success',
            'message' => 'User created successfully',
            'user'    => $user,
            'authorization' => [
                'token'      => $token,
                'type'       => 'bearer',
                'expires_in' => auth()->factory()->getTTL() * 60,
            ]
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
        $token = $request->query('token');
        $user = User::where('remember_token', $token)
            ->whereNull('email_verified_at')
            ->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid or expired token'], 400);
        }

        $user->forceFill([
            'email_verified_at' => now(),
            'remember_token'    => null,
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
}
