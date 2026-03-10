<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ExerciseQuestion extends Model
{
    protected $fillable = ['exercise_id', 'title', 'statement', 'template_code', 'points', 'order'];

    public function exercise()    { return $this->belongsTo(Exercise::class); }
    public function testCases()   { return $this->hasMany(TestCase::class, 'question_id')->orderBy('order'); }
    public function submissions() { return $this->hasMany(Submission::class, 'question_id'); }
}
