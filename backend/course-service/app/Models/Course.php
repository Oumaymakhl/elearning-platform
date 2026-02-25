<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;
public function teacher()
{
    return $this->belongsTo(User::class, 'teacher_id');
}

public function lessons()
{
    return $this->hasMany(Lesson::class);
}

public function enrollments()
{
    return $this->hasMany(Enrollment::class);
}
}
