<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    protected $fillable = ['user_id', 'course_id', 'current_sub_chapter_id', 'progress', 'enrolled_at', 'status'];

    public function course() {
        return $this->belongsTo(Course::class);
    }
}
