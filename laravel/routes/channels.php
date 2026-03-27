<?php

use App\Models\ChatConversation;
use App\Models\ChatParticipant;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes([
    'prefix' => 'api',
    'middleware' => ['api', 'auth:sanctum'],
]);

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('chat.user.{id}', function (User $user, string $id): bool {
    return (string) $user->id === (string) $id;
});

Broadcast::channel('chat.admin', function (User $user): bool {
    return (string) $user->role === 'admin';
});

Broadcast::channel('chat.conversation.{conversationId}', function (User $user, string $conversationId): array|bool {
    $conversation = ChatConversation::query()->find($conversationId);

    if (! $conversation) {
        return false;
    }

    $isParticipant = ChatParticipant::query()
        ->where('conversation_id', $conversation->id)
        ->where('user_id', $user->id)
        ->exists();

    $isAdminWithAccess = (string) $user->role === 'admin' && (bool) $conversation->requires_admin_intervention;

    if (! $isParticipant && ! $isAdminWithAccess) {
        return false;
    }

    return [
        'id' => (string) $user->id,
        'name' => $user->name,
        'role' => $user->role,
    ];
});
