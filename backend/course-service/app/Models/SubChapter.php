<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubChapter extends Model
{
    use HasFactory;

    protected $fillable = ['chapter_id', 'title', 'content', 'order', 'is_lab'];

    public function chapter()
    {
        return $this->belongsTo(Chapter::class);
    }
}
