<?php

namespace App\Listeners;

use App\Events\NotificationRequested;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;

class SendNotificationListener
{
    public function handle(NotificationRequested $event): void
    {
        Notification::create([
            'user_id' => $event->userId,
            'type' => $event->type,
            'data' => json_encode($event->data),
        ]);

        Log::info('Notification created', ['user_id' => $event->userId, 'type' => $event->type]);
    }
}
