<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Verifie que l'utilisateur possede l'un des roles autorises.
     *
     * Usage :
     *   Route::middleware('role:admin')
     *   Route::middleware('role:admin,teacher')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifie'], 401);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json([
                'message' => 'Acces refuse. Role requis : ' . implode(' ou ', $roles),
            ], 403);
        }

        return $next($request);
    }
}
