<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatMessageCreated implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    /**
     * @param  array<string, mixed>  $message
     * @param  array<int, string>  $participantUserIds
     */
    public function __construct(
        private readonly array $message,
        private readonly array $participantUserIds,
        private readonly bool $requiresAdminIntervention,
    ) {
    }

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        $channels = [];

        foreach (array_unique($this->participantUserIds) as $participantUserId) {
            $channels[] = new PrivateChannel('chat.user.'.$participantUserId);
        }

        if ($this->requiresAdminIntervention) {
            $channels[] = new PrivateChannel('chat.admin');
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'chat.message.created';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'chat.message.created',
            'message' => $this->message,
        ];
    }
}
