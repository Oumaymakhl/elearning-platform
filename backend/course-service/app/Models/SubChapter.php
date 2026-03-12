<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class SubChapter extends Model {
    protected $fillable = ['chapter_id', 'title', 'content', 'order', 'is_lab', 'quiz_id', 'passing_score'];

    public function chapter() {
        return $this->belongsTo(Chapter::class);
    }
}
