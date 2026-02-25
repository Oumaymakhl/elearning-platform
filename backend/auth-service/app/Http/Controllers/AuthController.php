<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function __construct()
    {
        $this->middleware("auth:api", ["except" => ["login", "register"]]);
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            "name" => "required|string|max:255",
            "email" => "required|string|email|max:255|unique:users",
            "password" => "required|string|min:6|confirmed",
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::create([
            "name" => $request->name,
            "email" => $request->email,
            "password" => Hash::make($request->password),
            "role" => $request->role ?? "student",
        ]);

        $token = auth()->login($user);

        return response()->json([
            "status" => "success",
            "message" => "User created successfully",
            "user" => $user,
            "authorization" => [
                "token" => $token,
                "type" => "bearer",
                "expires_in" => auth()->factory()->getTTL() * 60
            ]
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            "email" => "required|string|email",
            "password" => "required|string",
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $credentials = $request->only("email", "password");

        if (!$token = auth()->attempt($credentials)) {
            return response()->json([
                "status" => "error",
                "message" => "Unauthorized",
            ], 401);
        }

        $user = auth()->user();

        return response()->json([
            "status" => "success",
            "user" => $user,
            "authorization" => [
                "token" => $token,
                "type" => "bearer",
                "expires_in" => auth()->factory()->getTTL() * 60
            ]
        ]);
    }

    public function logout()
    {
        auth()->logout();

        return response()->json([
            "status" => "success",
            "message" => "Successfully logged out",
        ]);
    }

    public function refresh()
    {
        return response()->json([
            "status" => "success",
            "user" => auth()->user(),
            "authorization" => [
                "token" => auth()->refresh(),
                "type" => "bearer",
                "expires_in" => auth()->factory()->getTTL() * 60
            ]
        ]);
    }

    public function me()
    {
        return response()->json(auth()->user());
    }
}
