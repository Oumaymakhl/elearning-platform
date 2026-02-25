<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Progress extends Model
{
    use HasFactory;
public function enrollment()
{
    return $this->belongsTo(Enrollment::class);
}

public function lesson()
{
    return $this->belongsTo(Lesson::class);
}
}
