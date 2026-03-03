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
        $this->middleware("auth:api", ["except" => ["login", "register"]]);
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            "name"     => "required|string|max:255",
            "email"    => "required|string|email|max:255|unique:users",
            "password" => "required|string|min:6|confirmed",
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::create([
            "name"           => $request->name,
            "email"          => $request->email,
            "password"       => Hash::make($request->password),
            "role"           => $request->role ?? "student",
            "remember_token" => Str::random(60),
        ]);

        $token = auth()->login($user);

        return response()->json([
            "status"  => "success",
            "message" => "User created successfully",
            "user"    => $user,
            "authorization" => [
                "token"      => $token,
                "type"       => "bearer",
                "expires_in" => auth()->factory()->getTTL() * 60
            ]
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            "email"       => "required|string|email",
            "password"    => "required|string",
            "remember_me" => "boolean",
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $credentials = $request->only("email", "password");

        if (!$token = auth()->attempt($credentials)) {
            return response()->json([
                "status"  => "error",
                "message" => "Unauthorized",
            ], 401);
        }

        $user = auth()->user();

        // Gérer le remember_token selon le choix de l'utilisateur
        if ($request->boolean('remember_me')) {
            $user->forceFill(['remember_token' => Str::random(60)])->save();
        } else {
            $user->forceFill(['remember_token' => null])->save();
        }

        return response()->json([
            "status" => "success",
            "user"   => $user,
            "authorization" => [
                "token"      => $token,
                "type"       => "bearer",
                "expires_in" => auth()->factory()->getTTL() * 60
            ]
        ]);
    }

    public function logout()
    {
        $user = auth()->user();

        // Effacer le remember_token à la déconnexion
        if ($user) {
            $user->forceFill(['remember_token' => null])->save();
        }

        auth()->logout();

        return response()->json([
            "status"  => "success",
            "message" => "Successfully logged out",
        ]);
    }

    public function refresh()
    {
        return response()->json([
            "status" => "success",
            "user"   => auth()->user(),
            "authorization" => [
                "token"      => auth()->refresh(),
                "type"       => "bearer",
                "expires_in" => auth()->factory()->getTTL() * 60
            ]
        ]);
    }

    public function me()
    {
        return response()->json(auth()->user());
    }
}
