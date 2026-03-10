<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Attempt extends Model
{
    protected $fillable = ['quiz_id', 'user_id', 'score', 'max_score', 'passed', 'started_at', 'completed_at'];
    protected $casts = ['passed' => 'boolean'];
    public function quiz()    { return $this->belongsTo(Quiz::class); }
    public function answers() { return $this->hasMany(Answer::class); }
}
