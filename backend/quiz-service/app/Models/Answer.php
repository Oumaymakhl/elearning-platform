<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Answer extends Model
{
    use HasFactory;
public function attempt()
{
    return $this->belongsTo(Attempt::class);
}

public function question()
{
    return $this->belongsTo(Question::class);
}

public function option()
{
    return $this->belongsTo(Option::class);
}
}
