<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Content extends Model
{
    protected $fillable = [
        'course_id', 'sub_chapter_id', 'uploader_id',
        'title', 'type', 'url', 'file_path', 'description',
    ];
}
