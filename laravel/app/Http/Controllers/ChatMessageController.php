<?php

namespace App\Http\Controllers;

use App\Events\ChatMessageCreated;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\ChatMessageAttachment;
use App\Models\ChatMessageRead;
use App\Models\ChatParticipant;
use App\Models\User;
use App\Services\NotificationDispatchService;
use App\Support\NotificationTypes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ChatMessageController extends Controller
{
    public function __construct(private NotificationDispatchService $notifications)
    {
    }

    public function index(Request $request, string $conversationId): JsonResponse
    {
        $conversation = ChatConversation::query()->find($conversationId);

        if (! $conversation) {
            return response()->json([
                'error' => 'Conversation not found.',
            ], 404);
        }

        $user = $request->user();

        if (! $this->canAccessConversation($user, $conversation)) {
            return response()->json([
                'error' => 'Forbidden.',
            ], 403);
        }

        $validated = $request->validate([
            'limit' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'before' => ['sometimes', 'date'],
        ]);

        $limit = (int) ($validated['limit'] ?? 50);
        $before = $validated['before'] ?? null;

        $query = ChatMessage::query()
            ->where('conversation_id', $conversation->id)
            ->with(['author:id,name', 'reads', 'attachments'])
            ->orderByDesc('created_at');

        if ($before) {
            $query->where('created_at', '<', $before);
        }

        $messages = $query->limit($limit)->get()->reverse()->values();

        return response()->json([
            'items' => $messages->map(fn (ChatMessage $message) => $this->formatMessage($message, $user))->values(),
        ]);
    }

    public function store(Request $request, string $conversationId): JsonResponse
    {
        $conversation = ChatConversation::query()->with('participants')->find($conversationId);

        if (! $conversation) {
            return response()->json([
                'error' => 'Conversation not found.',
            ], 404);
        }

        $user = $request->user();

        if (! $this->canPostMessage($user, $conversation)) {
            return response()->json([
                'error' => 'Forbidden.',
            ], 403);
        }

        $validated = $request->validate([
            'body' => ['sometimes', 'nullable', 'string', 'max:4000'],
            'attachments' => ['sometimes', 'array', 'max:5'],
            'attachments.*.imageData' => ['required', 'string'],
            'attachments.*.fileName' => ['required', 'string', 'max:255'],
            'attachments.*.contentType' => ['sometimes', 'nullable', 'string', 'max:120'],
        ]);

        $body = trim((string) ($validated['body'] ?? ''));
        $attachmentsPayload = array_values($validated['attachments'] ?? []);

        if ($body === '' && $attachmentsPayload === []) {
            return response()->json([
                'error' => 'Message body or at least one image is required.',
            ], 422);
        }

        $message = DB::transaction(function () use ($attachmentsPayload, $body, $conversation, $user) {
            if ($this->isAdmin($user) && ! $this->isParticipant($user, $conversation)) {
                ChatParticipant::create([
                    'conversation_id' => $conversation->id,
                    'user_id' => $user->id,
                    'role' => 'admin',
                    'joined_at' => now(),
                ]);
            }

            $message = ChatMessage::create([
                'id' => (string) Str::uuid(),
                'conversation_id' => $conversation->id,
                'author_user_id' => $user->id,
                'body' => $body,
            ]);

            foreach ($attachmentsPayload as $attachmentPayload) {
                $storedAttachment = $this->storeAttachment($conversation, $attachmentPayload);

                ChatMessageAttachment::create([
                    'message_id' => $message->id,
                    'file_name' => $storedAttachment['file_name'],
                    'mime_type' => $storedAttachment['mime_type'],
                    'size_bytes' => $storedAttachment['size_bytes'],
                    'storage_path' => $storedAttachment['storage_path'],
                    'public_url' => $storedAttachment['public_url'],
                ]);
            }

            ChatMessageRead::updateOrCreate([
                'message_id' => $message->id,
                'user_id' => $user->id,
            ], [
                'read_at' => now(),
            ]);

            $conversation->update([
                'last_message_at' => $message->created_at,
            ]);

            return $message;
        });

        $conversation->load('participants.user');

        foreach ($conversation->participants as $participant) {
            if ((int) $participant->user_id === (int) $user->id) {
                continue;
            }

            if (! $participant->user) {
                continue;
            }

            $this->notifications->dispatchToUser($participant->user, NotificationTypes::CHAT_MESSAGE_RECEIVED, [
                'channels' => ['database'],
                'title' => 'Nuevo mensaje de chat',
                'body' => $user->name.' envio un nuevo mensaje.',
                'entity' => [
                    'type' => 'chat_conversation',
                    'id' => (string) $conversation->id,
                    'messageId' => (string) $message->id,
                ],
                'ctaUrl' => '/',
                'dedupeKey' => NotificationTypes::CHAT_MESSAGE_RECEIVED.':'.$message->id.':'.$participant->user_id,
            ]);
        }

        $formattedMessage = $this->formatMessage($message->load(['author:id,name', 'reads', 'attachments']), $user);

        event(new ChatMessageCreated(
            $formattedMessage,
            $conversation->participants->pluck('user_id')->map(fn ($participantUserId) => (string) $participantUserId)->values()->all(),
            (bool) $conversation->requires_admin_intervention,
        ));

        return response()->json($formattedMessage, 201);
    }

    public function markRead(Request $request, string $conversationId): JsonResponse
    {
        $conversation = ChatConversation::query()->find($conversationId);

        if (! $conversation) {
            return response()->json([
                'error' => 'Conversation not found.',
            ], 404);
        }

        $user = $request->user();

        if (! $this->canAccessConversation($user, $conversation)) {
            return response()->json([
                'error' => 'Forbidden.',
            ], 403);
        }

        $unreadMessageIds = ChatMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('author_user_id', '!=', $user->id)
            ->whereNotExists(function ($query) use ($user) {
                $query->select(DB::raw(1))
                    ->from('chat_message_reads')
                    ->whereColumn('chat_message_reads.message_id', 'chat_messages.id')
                    ->where('chat_message_reads.user_id', $user->id);
            })
            ->pluck('id')
            ->all();

        $readAt = now();

        if ($unreadMessageIds !== []) {
            $payload = collect($unreadMessageIds)->map(function (string $messageId) use ($user, $readAt) {
                return [
                    'message_id' => $messageId,
                    'user_id' => $user->id,
                    'read_at' => $readAt,
                    'created_at' => $readAt,
                    'updated_at' => $readAt,
                ];
            })->all();

            ChatMessageRead::upsert($payload, ['message_id', 'user_id'], ['read_at', 'updated_at']);
        }

        $unreadCount = ChatMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('author_user_id', '!=', $user->id)
            ->whereNotExists(function ($query) use ($user) {
                $query->select(DB::raw(1))
                    ->from('chat_message_reads')
                    ->whereColumn('chat_message_reads.message_id', 'chat_messages.id')
                    ->where('chat_message_reads.user_id', $user->id);
            })
            ->count();

        return response()->json([
            'conversationId' => (string) $conversation->id,
            'readCount' => count($unreadMessageIds),
            'unreadCount' => $unreadCount,
            'readAt' => $readAt->toISOString(),
        ]);
    }

    private function canPostMessage(User $user, ChatConversation $conversation): bool
    {
        if ($this->isParticipant($user, $conversation)) {
            return true;
        }

        return $this->isAdmin($user) && (bool) $conversation->requires_admin_intervention;
    }

    private function canAccessConversation(User $user, ChatConversation $conversation): bool
    {
        if ($this->isParticipant($user, $conversation)) {
            return true;
        }

        return $this->isAdmin($user) && (bool) $conversation->requires_admin_intervention;
    }

    private function isParticipant(User $user, ChatConversation $conversation): bool
    {
        return ChatParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->exists();
    }

    private function isAdmin(User $user): bool
    {
        return (string) $user->role === 'admin';
    }

    private function formatMessage(ChatMessage $message, User $viewer): array
    {
        $isReadByMe = $message->reads->contains(fn (ChatMessageRead $read) => (int) $read->user_id === (int) $viewer->id);

        return [
            'id' => (string) $message->id,
            'conversationId' => (string) $message->conversation_id,
            'authorUserId' => (string) $message->author_user_id,
            'authorName' => $message->author?->name,
            'body' => $message->body,
            'createdAt' => optional($message->created_at)?->toISOString(),
            'editedAt' => optional($message->edited_at)?->toISOString(),
            'isReadByMe' => $isReadByMe,
            'readByCount' => $message->reads->count(),
            'attachments' => $message->attachments->map(fn (ChatMessageAttachment $attachment) => [
                'id' => (string) $attachment->id,
                'fileName' => $attachment->file_name,
                'mimeType' => $attachment->mime_type,
                'sizeBytes' => $attachment->size_bytes,
                'url' => $attachment->public_url,
            ])->values(),
        ];
    }

    private function storeAttachment(ChatConversation $conversation, array $payload): array
    {
        $rawData = (string) ($payload['imageData'] ?? '');

        if (str_contains($rawData, ',')) {
            [, $rawData] = explode(',', $rawData, 2);
        }

        $binary = base64_decode($rawData, true);

        if ($binary === false) {
            throw new HttpResponseException(response()->json(['error' => 'Invalid image data'], 400));
        }

        $sizeInBytes = strlen($binary);
        if ($sizeInBytes > 5 * 1024 * 1024) {
            throw new HttpResponseException(response()->json(['error' => 'Image size exceeds 5MB'], 400));
        }

        $contentType = strtolower((string) ($payload['contentType'] ?? ''));
        $extension = $this->resolveImageExtension((string) $payload['fileName'], $contentType);

        if (! in_array($extension, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) {
            throw new HttpResponseException(response()->json(['error' => 'Unsupported image type'], 400));
        }

        $storagePath = sprintf(
            'chat-images/%s/%s.%s',
            $conversation->id,
            Str::uuid()->toString(),
            $extension
        );

        Storage::disk('public')->put($storagePath, $binary, ['visibility' => 'public']);

        return [
            'file_name' => (string) $payload['fileName'],
            'mime_type' => $contentType !== '' ? $contentType : 'image/'.$extension,
            'size_bytes' => $sizeInBytes,
            'storage_path' => $storagePath,
            'public_url' => asset('storage/'.$storagePath),
        ];
    }

    private function resolveImageExtension(string $fileName, string $contentType): string
    {
        $fromName = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        if ($fromName !== '') {
            return $fromName;
        }

        return match ($contentType) {
            'image/jpeg', 'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => 'jpg',
        };
    }
}
