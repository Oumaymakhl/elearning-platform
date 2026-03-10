<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Exercise extends Model
{
    protected $fillable = ['sub_chapter_id', 'title', 'description', 'language', 'max_score'];

    public function subChapter()  { return $this->belongsTo(SubChapter::class); }
    public function questions()   { return $this->hasMany(ExerciseQuestion::class)->orderBy('order'); }
}
