<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    protected $fillable = [
        'question_id', 'user_id', 'code', 'file_path', 'output',
        'tests_passed', 'tests_total', 'passed', 'score', 'error', 'executed_at'
    ];
    protected $casts = [
        'passed'      => 'boolean',
        'executed_at' => 'datetime',
    ];
    public function question() { return $this->belongsTo(ExerciseQuestion::class, 'question_id'); }
}
