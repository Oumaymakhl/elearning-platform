<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

    public function show($id)
    {
        return response()->json(User::findOrFail($id));
    }

    public function me(Request $request)
    {
        $authId = (int) $request->auth_user_id;
        $user   = User::where('auth_id', $authId)->first();
        if (!$user) {
            $user = User::updateOrCreate(
                ['email' => $request->auth_user_email],
                ['auth_id' => $authId, 'name' => $request->auth_user_name ?? 'Unknown', 'email' => $request->auth_user_email ?? '', 'role' => $request->auth_user_role ?? 'student']
            );
        }
        return response()->json($this->withAvatarUrl($user));
    }

    public function updateMe(Request $request)
    {
        $authId = (int) $request->auth_user_id;
        $user   = User::where('auth_id', $authId)->first();
        if (!$user) {
            $user = User::updateOrCreate(
                ['email' => $request->auth_user_email],
                ['auth_id' => $authId, 'name' => $request->auth_user_name ?? 'Unknown', 'email' => $request->auth_user_email ?? '', 'role' => $request->auth_user_role ?? 'student']
            );
        }
        $data = $request->validate([
            'name'       => 'sometimes|string|max:255',
            'bio'        => 'nullable|string|max:1000',
            'speciality' => 'nullable|string|max:255',
        ]);
        $user->update($data);
        return response()->json($this->withAvatarUrl($user));
    }

    public function uploadAvatar(Request $request)
    {
        $authId = (int) $request->auth_user_id;
        $user   = User::where('auth_id', $authId)->firstOrFail();
        $request->validate(['avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048']);
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);
        return response()->json(['avatar' => $path, 'avatar_url' => 'http://localhost:8080/storage/' . $path]);
    }

    public function sync(Request $request)
    {
        $data = $request->validate(['auth_id' => 'required|integer', 'name' => 'required|string', 'email' => 'required|email', 'role' => 'required|in:student,teacher,admin']);
        $user = User::updateOrCreate(['email' => $data['email']], $data);
        return response()->json($user, 201);
    }

    public function teachers()
    {
        return response()->json(User::where('role', 'teacher')->where('is_active', true)->get()->map(fn($u) => $this->withAvatarUrl($u)));
    }

    public function toggleActive(Request $request, $id)
    {
        if ($request->auth_user_role !== 'admin') return response()->json(['message' => 'Forbidden'], 403);
        $user = User::findOrFail($id);
        $user->update(['is_active' => !$user->is_active]);
        return response()->json(['is_active' => $user->is_active]);
    }

    public function studentsByIds(Request $request)
    {
        $ids = $request->input('ids', []);
        return response()->json(User::whereIn('auth_id', $ids)->get(['auth_id', 'name', 'email', 'avatar', 'role'])->map(fn($u) => $this->withAvatarUrl($u)));
    }

    public function allStudents()
    {
        return response()->json(User::where('role', 'student')->whereNotNull('auth_id')->pluck('auth_id'));
    }

    private function withAvatarUrl(User $user): array
    {
        $data = $user->toArray();
        $av = $user->avatar && is_string($user->avatar) && strlen($user->avatar) > 3 ? $user->avatar : null;
        $data['avatar_url'] = $av ? 'http://localhost:8080/storage/' . $av : null;
        return $data;
    }
}
