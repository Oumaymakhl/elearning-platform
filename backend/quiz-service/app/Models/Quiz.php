<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    protected $fillable = ['title', 'description', 'chapter_id', 'lesson_id', 'created_by', 'passing_score'];

    public function questions() { return $this->hasMany(Question::class); }
    public function attempts()  { return $this->hasMany(Attempt::class); }
}
