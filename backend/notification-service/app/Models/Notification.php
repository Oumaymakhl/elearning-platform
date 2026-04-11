<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id', 'type', 'data', 'priority', 'icon', 'action_url', 'read_at'
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    /**
     * Mapping type → icône emoji + priorité par défaut + URL action
     */
    public static function metaForType(string $type): array
    {
        return match($type) {
            'course_enrolled'     => ['icon' => '📚', 'priority' => 'medium'],
            'course_completed'    => ['icon' => '🎓', 'priority' => 'high'],
            'quiz_passed'         => ['icon' => '✅', 'priority' => 'medium'],
            'quiz_failed'         => ['icon' => '❌', 'priority' => 'medium'],
            'exercise_passed'     => ['icon' => '💻', 'priority' => 'medium'],
            'exercise_failed'     => ['icon' => '⚠️',  'priority' => 'low'],
            'new_student'         => ['icon' => '👤', 'priority' => 'low'],
            'student_completed'   => ['icon' => '🏆', 'priority' => 'medium'],
            'student_quiz_done'   => ['icon' => '📊', 'priority' => 'low'],
            'student_exercise_done'=> ['icon' => '🔧', 'priority' => 'low'],
            default               => ['icon' => 'ℹ️',  'priority' => 'low'],
        };
    }
}
