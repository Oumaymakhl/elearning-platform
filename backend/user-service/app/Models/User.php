<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $fillable = [
        'auth_id', 'name', 'email', 'password', 'role',
        'bio', 'avatar', 'speciality', 'is_active', 'email_verified_at'
    ];
    protected $hidden = ['password', 'remember_token'];
    protected $casts = ['is_active' => 'boolean', 'email_verified_at' => 'datetime'];
}
