<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Option extends Model
{
    protected $fillable = ['question_id', 'text', 'image', 'is_correct'];
    protected $casts = ['is_correct' => 'boolean'];
}
