<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class TestCase extends Model
{
    protected $fillable = ['question_id', 'input', 'expected_output', 'is_hidden', 'order'];
    protected $casts = ['is_hidden' => 'boolean'];
}
