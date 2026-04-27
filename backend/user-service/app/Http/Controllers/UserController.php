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
        $authId = (int) $request->auth_user_id;
        $user   = User::where('auth_id', $authId)->firstOrFail();
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['avatar' => $path]);
        }
        return response()->json($user);
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
}
