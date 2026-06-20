<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class UserController extends Controller
{
    private function profileFromRequest(Request $request): User
    {
        $authId = (int) $request->auth_user_id;
        $email = $request->auth_user_email ?: ('user' . $authId . '@local.invalid');
        $user = User::where('auth_id', $authId)->first() ?: User::where('email', $email)->first();

        $data = [
            'auth_id' => $authId,
            'name' => $request->auth_user_name ?: ('User #' . $authId),
            'email' => $email,
            'role' => $request->auth_user_role ?: 'student',
            'is_active' => true,
        ];

        if ($user) {
            $user->forceFill($data)->save();
            return $user;
        }

        return User::create($data + ['password' => Hash::make(Str::random(32))]);
    }

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
        $user = $this->profileFromRequest($request);
        $user->setAttribute('avatar_url', $user->avatar ? '/storage/' . $user->avatar : null);
        return response()->json($user);
    }

    public function updateMe(Request $request)
    {
        $user = $this->profileFromRequest($request);
        $user->update($request->only(['name', 'bio', 'phone', 'address']));
        $user->setAttribute('avatar_url', $user->avatar ? '/storage/' . $user->avatar : null);
        return response()->json($user);
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $authId = (int) $request->auth_user_id;
        $user = $this->profileFromRequest($request);

        $oldPath = $user->avatar;
        Storage::disk('public')->makeDirectory('avatars');
        $path = $request->file('avatar')->store('avatars', 'public');
        if (!$path) {
            return response()->json(['message' => 'Avatar could not be saved. Please try again.'], 500);
        }

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
        $user = User::where('auth_id', $data['auth_id'])->first() ?: User::where('email', $data['email'])->first();
        if ($user) {
            $user->forceFill($data)->save();
        } else {
            $user = User::create($data + ['password' => Hash::make(Str::random(32))]);
        }
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
                        'auth_id' => (int) $admin['id'],
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
            'auth_id' => (int) $admin->auth_id,
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => 'admin',
            'avatar_url' => $admin->avatar ? '/storage/' . $admin->avatar : null,
        ]));
    }

    public function avatarsByIds(Request $request)
    {
        $ids = collect(explode(',', (string) $request->query('ids', '')))
            ->map(fn ($id) => (int) trim($id))
            ->filter()
            ->unique()
            ->values();

        if ($ids->isEmpty()) return response()->json([]);

        $avatars = User::whereIn('auth_id', $ids)
            ->whereNotNull('avatar')
            ->get(['auth_id', 'avatar'])
            ->mapWithKeys(fn ($user) => [(int) $user->auth_id => '/storage/' . $user->avatar]);

        return response()->json($avatars);
    }

}
