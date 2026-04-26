<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
class JwtMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        try {
            $payload = JWTAuth::parseToken()->getPayload();
            $request->merge([
                'auth_user_id'   => $payload->get('sub'),
                'auth_user_role' => $payload->get('role'),
                'auth_user_name' => $payload->get('name'),
                'auth_user_email'=> $payload->get('email'),
            ]);
        } catch (TokenExpiredException $e) {
            return response()->json(['message' => 'Token expired'], 401);
        } catch (TokenInvalidException $e) {
            return response()->json(['message' => 'Token invalid'], 401);
        } catch (JWTException $e) {
            return response()->json(['message' => 'Token absent'], 401);
        }
        return $next($request);
    }
}
