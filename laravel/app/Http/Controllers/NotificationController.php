<?php

namespace App\Http\Controllers;

use App\Support\NotificationTypes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if ($disabled = $this->ensureEnabled()) {
            return $disabled;
        }

        $validated = $request->validate([
            'cursor' => ['sometimes', 'nullable', 'string'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'unread' => ['sometimes', 'boolean'],
            'type' => ['sometimes', 'string', 'in:'.implode(',', NotificationTypes::ALL)],
        ]);

        $user = $request->user();
        $limit = (int) ($validated['limit'] ?? 20);
        $cursor = $validated['cursor'] ?? null;

        $query = $user->notifications()->orderByDesc('created_at');

        if (array_key_exists('unread', $validated)) {
            if ((bool) $validated['unread']) {
                $query->whereNull('read_at');
            } else {
                $query->whereNotNull('read_at');
            }
        }

        if (array_key_exists('type', $validated)) {
            $query->where('data->notificationType', $validated['type']);
        }

        $page = $query->cursorPaginate($limit, ['*'], 'cursor', $cursor);

        return response()->json([
            'items' => collect($page->items())->map(fn (DatabaseNotification $notification) => $this->formatNotification($notification))->values(),
            'pageInfo' => [
                'nextCursor' => optional($page->nextCursor())->encode(),
                'hasMore' => $page->hasMorePages(),
                'limit' => $page->perPage(),
            ],
            'unreadCount' => $user->unreadNotifications()->count(),
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        if ($disabled = $this->ensureEnabled()) {
            return $disabled;
        }

        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        if ($disabled = $this->ensureEnabled()) {
            return $disabled;
        }

        $notification = $request->user()->notifications()->whereKey($id)->first();

        if (! $notification) {
            return response()->json([
                'error' => 'Notification not found.',
            ], 404);
        }

        if (! $notification->read_at) {
            $notification->markAsRead();
            $notification->refresh();
        }

        return response()->json([
            'id' => (string) $notification->id,
            'readAt' => optional($notification->read_at)?->toISOString(),
            'unreadCount' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        if ($disabled = $this->ensureEnabled()) {
            return $disabled;
        }

        $readAt = now();

        $updated = $request->user()->unreadNotifications()->update([
            'read_at' => $readAt,
            'updated_at' => $readAt,
        ]);

        return response()->json([
            'updated' => (int) $updated,
            'readAt' => $readAt->toISOString(),
            'unreadCount' => 0,
        ]);
    }

    private function ensureEnabled(): ?JsonResponse
    {
        if (! (bool) env('NOTIFICATIONS_IN_APP_ENABLED', true)) {
            return response()->json([
                'error' => 'Notifications are disabled.',
            ], 404);
        }

        return null;
    }

    private function formatNotification(DatabaseNotification $notification): array
    {
        $data = is_array($notification->data) ? $notification->data : [];

        return [
            'id' => (string) $notification->id,
            'type' => (string) ($data['notificationType'] ?? $notification->type),
            'title' => (string) ($data['title'] ?? ''),
            'body' => (string) ($data['body'] ?? ''),
            'priority' => (string) ($data['priority'] ?? 'normal'),
            'entity' => is_array($data['entity'] ?? null) ? $data['entity'] : null,
            'ctaUrl' => $data['ctaUrl'] ?? null,
            'createdAt' => optional($notification->created_at)?->toISOString(),
            'readAt' => optional($notification->read_at)?->toISOString(),
            'isRead' => (bool) $notification->read_at,
        ];
    }
}
