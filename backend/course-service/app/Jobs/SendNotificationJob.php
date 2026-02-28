<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $userId;
    protected $type;
    protected $data;

    /**
     * Create a new job instance.
     */
    public function __construct($userId, $type, $data)
    {
        $this->userId = $userId;
        $this->type = $type;
        $this->data = $data;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Http::post('http://nginx-notification/api/internal/send', [
            'user_id' => $this->userId,
            'type' => $this->type,
            'data' => $this->data,
        ]);
    }
}
