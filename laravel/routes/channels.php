<?php

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
