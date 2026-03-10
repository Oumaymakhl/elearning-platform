<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    private function checkAdmin(Request $request)
    {
        if ($request->auth_user_role !== 'admin') {
            abort(response()->json(['message' => 'Forbidden'], 403));
        }
    }

    // Liste tous les utilisateurs avec filtres
    public function users(Request $request)
    {
        $this->checkAdmin($request);
        $users = User::when($request->role, fn($q) => $q->where('role', $request->role))
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%"))
            ->when($request->is_active !== null, fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->paginate(20);
        return response()->json($users);
    }

    // Créer un utilisateur
    public function createUser(Request $request)
    {
        $this->checkAdmin($request);
        $data = $request->validate([
            'auth_id' => 'required|integer|unique:users,auth_id',
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|unique:users,email',
            'role'    => 'required|in:student,teacher,admin',
        ]);
        return response()->json(User::create($data), 201);
    }

    // Modifier un utilisateur
    public function updateUser(Request $request, $id)
    {
        $this->checkAdmin($request);
        $user = User::findOrFail($id);
        $user->update($request->validate([
            'name'       => 'sometimes|string|max:255',
            'role'       => 'sometimes|in:student,teacher,admin',
            'is_active'  => 'sometimes|boolean',
            'bio'        => 'nullable|string',
            'speciality' => 'nullable|string',
        ]));
        return response()->json($user);
    }

    // Supprimer un utilisateur
    public function deleteUser(Request $request, $id)
    {
        $this->checkAdmin($request);
        User::findOrFail($id)->delete();
        return response()->json(['message' => 'User deleted']);
    }

    // Activer/désactiver
    public function toggleActive(Request $request, $id)
    {
        $this->checkAdmin($request);
        $user = User::findOrFail($id);
        $user->update(['is_active' => !$user->is_active]);
        return response()->json(['is_active' => $user->is_active, 'user' => $user]);
    }

    // Stats globales
    public function stats(Request $request)
    {
        $this->checkAdmin($request);
        return response()->json([
            'total_users'    => User::count(),
            'students'       => User::where('role', 'student')->count(),
            'teachers'       => User::where('role', 'teacher')->count(),
            'admins'         => User::where('role', 'admin')->count(),
            'active_users'   => User::where('is_active', true)->count(),
            'inactive_users' => User::where('is_active', false)->count(),
            'recent_users'   => User::orderBy('created_at', 'desc')->take(5)->get(),
        ]);
    }
}
