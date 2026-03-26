<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\ChatParticipant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatStreamController extends Controller
{
    public function stream(Request $request): StreamedResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'since' => ['sometimes', 'date'],
            'timeout' => ['sometimes', 'integer', 'min:5', 'max:55'],
        ]);

        $since = isset($validated['since']) ? Carbon::parse($validated['since']) : now()->subSeconds(30);
        $timeout = (int) ($validated['timeout'] ?? 25);

        $conversationIds = $this->resolveConversationIds($user);

        return response()->stream(function () use ($conversationIds, $since, $timeout): void {
            @ini_set('output_buffering', 'off');
            @ini_set('zlib.output_compression', '0');

            $startedAt = now();
            $cursor = clone $since;

            while (now()->diffInSeconds($startedAt) < $timeout) {
                if (connection_aborted()) {
                    break;
                }

                $messages = ChatMessage::query()
                    ->whereIn('conversation_id', $conversationIds)
                    ->where('created_at', '>', $cursor)
                    ->with(['author:id,name'])
                    ->withCount('attachments')
                    ->orderBy('created_at')
                    ->limit(100)
                    ->get();

                foreach ($messages as $message) {
                    $payload = [
                        'type' => 'chat.message.created',
                        'message' => [
                            'id' => (string) $message->id,
                            'conversationId' => (string) $message->conversation_id,
                            'authorUserId' => (string) $message->author_user_id,
                            'authorName' => $message->author?->name,
                            'body' => $message->body,
                            'createdAt' => optional($message->created_at)?->toISOString(),
                            'hasAttachments' => ((int) $message->attachments_count) > 0,
                            'attachmentsCount' => (int) $message->attachments_count,
                        ],
                    ];

                    echo "event: message\n";
                    echo 'data: '.json_encode($payload)."\n\n";

                    $cursor = $message->created_at;
                }

                echo "event: heartbeat\n";
                echo 'data: '.json_encode(['ts' => now()->toISOString()])."\n\n";

                @ob_flush();
                @flush();
                sleep(1);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-transform',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function resolveConversationIds(User $user): array
    {
        $isAdmin = (string) $user->role === 'admin';

        return ChatParticipant::query()
            ->select('conversation_id')
            ->when(! $isAdmin, function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }, function ($query) use ($user) {
                $query->where(function ($subQuery) use ($user) {
                    $subQuery
                        ->where('user_id', $user->id)
                        ->orWhereIn('conversation_id', function ($conversationQuery) {
                            $conversationQuery
                                ->select('id')
                                ->from('chat_conversations')
                                ->where('requires_admin_intervention', true);
                        });
                });
            })
            ->distinct()
            ->pluck('conversation_id')
            ->all();
    }
}
