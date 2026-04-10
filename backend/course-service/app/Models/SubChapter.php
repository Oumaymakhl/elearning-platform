<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class SubChapter extends Model {
    protected $fillable = [
        'chapter_id', 'title', 'content', 'order',
        'is_lab', 'quiz_id', 'passing_score', 'exercise_id'
    ];

    public function chapter() {
        return $this->belongsTo(Chapter::class);
    }

    public function exercise() {
        return $this->hasOne(Exercise::class, 'sub_chapter_id');
    }
}
