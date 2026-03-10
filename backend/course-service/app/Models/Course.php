<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $fillable = ['title', 'description', 'language', 'image_path', 'instructor_id'];

    public function chapters() {
        return $this->hasMany(Chapter::class)->orderBy('order');
    }
    public function enrollments() {
        return $this->hasMany(Enrollment::class);
    }
}
