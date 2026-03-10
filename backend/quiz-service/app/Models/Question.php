<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    protected $fillable = ['quiz_id', 'text', 'type', 'points'];
    public function options() { return $this->hasMany(Option::class); }
    public function answers() { return $this->hasMany(Answer::class); }
}
