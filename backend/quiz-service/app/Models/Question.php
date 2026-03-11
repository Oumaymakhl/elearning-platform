<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    protected $fillable = ['quiz_id', 'text', 'image_path', 'type', 'points'];

    public function quiz() {
        return $this->belongsTo(Quiz::class);
    }

    public function options() {
        return $this->hasMany(Option::class);
    }
}
