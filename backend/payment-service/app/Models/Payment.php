<?php
namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class Payment extends Model
{
    protected $fillable = [
        'user_id',
        'course_id',
        'paymee_token',
        'amount',
        'status',
        'transaction_id',
    ];
}
