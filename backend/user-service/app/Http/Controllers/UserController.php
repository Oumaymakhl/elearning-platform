<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;

class UserController extends Controller
{
    public function index(Request $request)
    {
        if ($request->auth_user_role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return response()->json(
            User::when($request->role,   fn($q) => $q->where('role', $request->role))
                ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
                ->get()
        );
    }

    public function search(Request $request)
    {
        $role = $request->auth_user_role ?? null;
        if (!in_array($role, ['teacher', 'admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $q = $request->get('search', '');
        $users = User::when($q, fn($query) => $query
                ->where('name', 'like', '%' . $q . '%')
                ->orWhere('email', 'like', '%' . $q . '%'))
            ->where('role', 'student')
            ->select('id', 'name', 'email', 'role', 'avatar')
            ->limit(50)
            ->get();
        return response()->json($users);
    }

    public function show($id)
    {
        return response()->json(User::findOrFail($id));
    }

    public function me(Request $request)
    {
        $authId = (int) $request->auth_user_id;
        $user   = User::where('auth_id', $authId)->first();
        if (!$user) return response()->json(['message' => 'Not found'], 404);
        return response()->json($user);
    }

    public function updateMe(Request $request)
    {
        $authId = (int) $request->auth_user_id;
        $user   = User::where('auth_id', $authId)->firstOrFail();
        $user->update($request->only(['name', 'bio', 'phone', 'address']));
        return response()->json($user);
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $authId = (int) $request->auth_user_id;
        $user   = User::where('auth_id', $authId)->firstOrFail();

        $oldPath = $user->avatar;
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->forceFill(['avatar' => $path])->saveOrFail();

        if ($oldPath && $oldPath !== $path) {
            Storage::disk('public')->delete($oldPath);
        }

        // Mettre à jour les conversations dans messaging-service
        try {
            $avatarUrl = '/storage/' . $path;
            Http::timeout(3)->put('http://nginx-messaging/api/internal/update-avatar', [
                'user_id'    => $authId,
                'avatar_url' => $avatarUrl,
            ]);
            Http::timeout(3)->put('http://nginx-forum/api/internal/update-avatar', [
                'user_id'    => $authId,
                'avatar_url' => $avatarUrl,
            ]);
        } catch (\Exception $e) {
        }

        $fresh = $user->fresh();
        $fresh->setAttribute('avatar_url', '/storage/' . $path);
        return response()->json($fresh);
    }

    public function sync(Request $request)
    {
        $data = $request->validate([
            'auth_id' => 'required|integer',
            'name'    => 'required|string',
            'email'   => 'required|email',
            'role'    => 'required|string',
        ]);
        $user = User::updateOrCreate(['auth_id' => $data['auth_id']], $data);
        return response()->json($user);
    }

    public function teachers()
    {
        return response()->json(User::where('role', 'teacher')->get());
    }

    public function students()
    {
        return response()->json(User::where('role', 'student')->get());
    }

    public function allStudents()
    {
        return response()->json(User::where('role', 'student')->get());
    }

    public function studentsByIds(Request $request)
    {
        $ids   = $request->input('ids', []);
        // user_id dans enrollments = auth_id dans user-service
        $users = User::whereIn('auth_id', $ids)
                     ->where('role', 'student')
                     ->get();
        return response()->json($users);
    }

    public function allAdmins()
    {
        $profiles = User::where('role', 'admin')->get()->keyBy('auth_id');

        try {
            $response = Http::timeout(3)->get('http://nginx-auth/api/internal/admins');
            if ($response->successful()) {
                return response()->json(collect($response->json())->map(function ($admin) use ($profiles) {
                    $profile = $profiles->get($admin['id']);
                    $avatar = $profile?->avatar;
                    return [
                        'id' => (int) $admin['id'],
                        'name' => $admin['name'],
                        'email' => $admin['email'],
                        'role' => 'admin',
                        'avatar_url' => $avatar ? '/storage/' . $avatar : null,
                    ];
                })->values());
            }
        } catch (\Throwable $e) {
            \Log::warning('Unable to load admins from auth service: ' . $e->getMessage());
        }

        return response()->json($profiles->values()->map(fn ($admin) => [
            'id' => (int) $admin->auth_id,
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => 'admin',
            'avatar_url' => $admin->avatar ? '/storage/' . $admin->avatar : null,
        ]));
    }

}
