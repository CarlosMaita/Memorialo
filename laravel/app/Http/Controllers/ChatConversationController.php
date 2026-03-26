<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\ChatMessageAttachment;
use App\Models\ChatParticipant;
use App\Models\Service;
use App\Models\User;
use App\Services\NotificationDispatchService;
use App\Support\NotificationTypes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ChatConversationController extends Controller
{
    public function __construct(private NotificationDispatchService $notifications)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $conversations = ChatConversation::query()
            ->with([
                'participants.user:id,name,role',
                'latestMessage.author:id,name',
                'latestMessage.attachments',
            ])
            ->when($this->isAdmin($user), function ($query) use ($user) {
                $query->where(function ($subQuery) use ($user) {
                    $subQuery
                        ->where('requires_admin_intervention', true)
                        ->orWhereHas('participants', function ($participantQuery) use ($user) {
                            $participantQuery->where('user_id', $user->id);
                        });
                });
            }, function ($query) use ($user) {
                $query->whereHas('participants', function ($participantQuery) use ($user) {
                    $participantQuery->where('user_id', $user->id);
                });
            })
            ->orderByDesc('last_message_at')
            ->orderByDesc('updated_at')
            ->get();

        $conversationIds = $conversations->pluck('id')->all();

        $unreadCounts = empty($conversationIds)
            ? collect()
            : ChatMessage::query()
                ->select('conversation_id', DB::raw('COUNT(*) as unread_count'))
                ->whereIn('conversation_id', $conversationIds)
                ->where('author_user_id', '!=', $user->id)
                ->whereNotExists(function ($query) use ($user) {
                    $query->select(DB::raw(1))
                        ->from('chat_message_reads')
                        ->whereColumn('chat_message_reads.message_id', 'chat_messages.id')
                        ->where('chat_message_reads.user_id', $user->id);
                })
                ->groupBy('conversation_id')
                ->pluck('unread_count', 'conversation_id');

        return response()->json([
            'items' => $conversations->map(function (ChatConversation $conversation) use ($unreadCounts) {
                return $this->formatConversationListItem(
                    $conversation,
                    (int) ($unreadCounts[$conversation->id] ?? 0)
                );
            })->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bookingId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'booking_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'serviceId' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'service_id' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'clientUserId' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'client_user_id' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'providerUserId' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'provider_user_id' => ['sometimes', 'nullable', 'integer', 'min:1'],
        ]);

        $bookingId = $validated['bookingId'] ?? $validated['booking_id'] ?? null;
        $serviceId = $validated['serviceId'] ?? $validated['service_id'] ?? null;

        if (! $bookingId && ! $serviceId) {
            return response()->json([
                'error' => 'bookingId or serviceId is required.',
            ], 422);
        }

        if ($bookingId) {
            $existing = ChatConversation::query()->where('booking_id', $bookingId)->first();
            if ($existing) {
                if (! $this->canAccessConversation($request->user(), $existing)) {
                    return response()->json([
                        'error' => 'Forbidden.',
                    ], 403);
                }

                return response()->json($this->formatConversationSummary($existing->load(['participants.user:id,name,role']), $request->user()));
            }
        }

        $resolved = $this->resolveParticipants($request->user(), $bookingId, $serviceId, $validated);

        if (isset($resolved['error'])) {
            return response()->json(['error' => $resolved['error']], $resolved['status']);
        }

        $conversation = DB::transaction(function () use ($bookingId, $serviceId, $resolved) {
            $conversation = ChatConversation::create([
                'id' => (string) Str::uuid(),
                'booking_id' => $bookingId,
                'service_id' => $serviceId,
                'client_user_id' => $resolved['client_user_id'],
                'provider_user_id' => $resolved['provider_user_id'],
                'expires_at' => $resolved['expires_at'] ?? null,
            ]);

            ChatParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => $resolved['client_user_id'],
                'role' => 'client',
                'joined_at' => now(),
            ]);

            if ($resolved['provider_user_id'] !== $resolved['client_user_id']) {
                ChatParticipant::create([
                    'conversation_id' => $conversation->id,
                    'user_id' => $resolved['provider_user_id'],
                    'role' => 'provider',
                    'joined_at' => now(),
                ]);
            }

            return $conversation;
        });

        return response()->json(
            $this->formatConversationSummary($conversation->load(['participants.user:id,name,role']), $request->user()),
            201
        );
    }

    public function show(Request $request, string $conversationId): JsonResponse
    {
        $conversation = ChatConversation::query()
            ->with(['participants.user:id,name,role'])
            ->find($conversationId);

        if (! $conversation) {
            return response()->json([
                'error' => 'Conversation not found.',
            ], 404);
        }

        if (! $this->canAccessConversation($request->user(), $conversation)) {
            return response()->json([
                'error' => 'Forbidden.',
            ], 403);
        }

        return response()->json($this->formatConversationSummary($conversation, $request->user()));
    }

    public function requestIntervention(Request $request, string $conversationId): JsonResponse
    {
        $conversation = ChatConversation::query()->find($conversationId);

        if (! $conversation) {
            return response()->json([
                'error' => 'Conversation not found.',
            ], 404);
        }

        $user = $request->user();

        if (! $this->isParticipant($user, $conversation)) {
            return response()->json([
                'error' => 'Only participants can request intervention.',
            ], 403);
        }

        $conversation->update([
            'requires_admin_intervention' => true,
            'intervention_requested_at' => now(),
            'intervention_requested_by' => $user->id,
        ]);

        $admins = User::query()->where('role', 'admin')->get();

        foreach ($admins as $admin) {
            $this->notifications->dispatchToUser($admin, NotificationTypes::CHAT_INTERVENTION_REQUESTED, [
                'channels' => ['database'],
                'title' => 'Intervencion solicitada en chat',
                'body' => $user->name.' solicito intervencion en una conversacion de chat.',
                'entity' => ['type' => 'chat_conversation', 'id' => (string) $conversation->id],
                'ctaUrl' => '/',
                'dedupeKey' => NotificationTypes::CHAT_INTERVENTION_REQUESTED.':'.$conversation->id.':'.$admin->id,
            ]);
        }

        return response()->json([
            'id' => (string) $conversation->id,
            'requiresAdminIntervention' => true,
            'interventionRequestedAt' => optional($conversation->intervention_requested_at)?->toISOString(),
            'interventionRequestedBy' => $conversation->intervention_requested_by ? (string) $conversation->intervention_requested_by : null,
        ]);
    }

    private function resolveParticipants(User $actor, ?string $bookingId, ?int $serviceId, array $validated): array
    {
        if ($bookingId) {
            $booking = Booking::query()->find($bookingId);

            if (! $booking) {
                return ['error' => 'Booking not found.', 'status' => 404];
            }

            $clientUserId = $this->toIntOrNull($booking->user_id);
            $providerUserId = $this->toIntOrNull($booking->artist_user_id);

            if (! $providerUserId) {
                $artistServiceId = $this->toIntOrNull($booking->artist_id);
                if ($artistServiceId) {
                    $service = Service::query()->find($artistServiceId);
                    $providerUserId = $service ? $this->toIntOrNull($service->user_id) : null;
                }
            }

            if (! $clientUserId || ! $providerUserId) {
                return ['error' => 'Booking is missing client/provider linkage.', 'status' => 422];
            }

            if (! $this->isAdmin($actor) && ! in_array((int) $actor->id, [$clientUserId, $providerUserId], true)) {
                return ['error' => 'Forbidden.', 'status' => 403];
            }

            return [
                'client_user_id' => $clientUserId,
                'provider_user_id' => $providerUserId,
                'expires_at' => $booking->date ? Carbon::parse($booking->date)->endOfDay()->addDays(30) : null,
            ];
        }

        $clientUserId = (int) ($validated['clientUserId'] ?? $validated['client_user_id'] ?? 0);
        $providerUserId = (int) ($validated['providerUserId'] ?? $validated['provider_user_id'] ?? 0);

        if ($clientUserId <= 0 || $providerUserId <= 0) {
            return ['error' => 'clientUserId and providerUserId are required when bookingId is not provided.', 'status' => 422];
        }

        if (! $this->isAdmin($actor) && ! in_array((int) $actor->id, [$clientUserId, $providerUserId], true)) {
            return ['error' => 'Forbidden.', 'status' => 403];
        }

        return [
            'client_user_id' => $clientUserId,
            'provider_user_id' => $providerUserId,
        ];
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

    private function formatConversationSummary(ChatConversation $conversation, User $viewer): array
    {
        $lastMessage = ChatMessage::query()
            ->where('conversation_id', $conversation->id)
            ->latest('created_at')
            ->with(['author:id,name', 'attachments'])
            ->first();

        $unreadCount = ChatMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('author_user_id', '!=', $viewer->id)
            ->whereNotExists(function ($query) use ($viewer) {
                $query->select(DB::raw(1))
                    ->from('chat_message_reads')
                    ->whereColumn('chat_message_reads.message_id', 'chat_messages.id')
                    ->where('chat_message_reads.user_id', $viewer->id);
            })
            ->count();

        return [
            'id' => (string) $conversation->id,
            'bookingId' => $conversation->booking_id,
            'serviceId' => $conversation->service_id ? (string) $conversation->service_id : null,
            'clientUserId' => (string) $conversation->client_user_id,
            'providerUserId' => (string) $conversation->provider_user_id,
            'requiresAdminIntervention' => (bool) $conversation->requires_admin_intervention,
            'interventionRequestedAt' => optional($conversation->intervention_requested_at)?->toISOString(),
            'interventionRequestedBy' => $conversation->intervention_requested_by ? (string) $conversation->intervention_requested_by : null,
            'lastMessageAt' => optional($conversation->last_message_at)?->toISOString(),
            'updatedAt' => optional($conversation->updated_at)?->toISOString(),
            'expiresAt' => optional($conversation->expires_at)?->toISOString(),
            'participants' => $conversation->participants->map(function (ChatParticipant $participant) {
                return [
                    'userId' => (string) $participant->user_id,
                    'role' => $participant->role,
                    'name' => $participant->user?->name,
                    'joinedAt' => optional($participant->joined_at)?->toISOString(),
                ];
            })->values(),
            'lastMessage' => $lastMessage ? [
                'id' => (string) $lastMessage->id,
                'authorUserId' => (string) $lastMessage->author_user_id,
                'authorName' => $lastMessage->author?->name,
                'body' => $lastMessage->body !== '' ? $lastMessage->body : ($lastMessage->attachments->isNotEmpty() ? 'Imagen compartida' : ''),
                'createdAt' => optional($lastMessage->created_at)?->toISOString(),
                'attachments' => $lastMessage->attachments->map(fn (ChatMessageAttachment $attachment) => [
                    'id' => (string) $attachment->id,
                    'fileName' => $attachment->file_name,
                    'mimeType' => $attachment->mime_type,
                    'sizeBytes' => $attachment->size_bytes,
                    'url' => $attachment->public_url,
                ])->values(),
            ] : null,
            'unreadCount' => $unreadCount,
        ];
    }

    private function formatConversationListItem(ChatConversation $conversation, int $unreadCount): array
    {
        $lastMessage = $conversation->latestMessage;

        return [
            'id' => (string) $conversation->id,
            'bookingId' => $conversation->booking_id,
            'serviceId' => $conversation->service_id ? (string) $conversation->service_id : null,
            'clientUserId' => (string) $conversation->client_user_id,
            'providerUserId' => (string) $conversation->provider_user_id,
            'requiresAdminIntervention' => (bool) $conversation->requires_admin_intervention,
            'interventionRequestedAt' => optional($conversation->intervention_requested_at)?->toISOString(),
            'interventionRequestedBy' => $conversation->intervention_requested_by ? (string) $conversation->intervention_requested_by : null,
            'lastMessageAt' => optional($conversation->last_message_at)?->toISOString(),
            'updatedAt' => optional($conversation->updated_at)?->toISOString(),
            'expiresAt' => optional($conversation->expires_at)?->toISOString(),
            'participants' => $conversation->participants->map(function (ChatParticipant $participant) {
                return [
                    'userId' => (string) $participant->user_id,
                    'role' => $participant->role,
                    'name' => $participant->user?->name,
                    'joinedAt' => optional($participant->joined_at)?->toISOString(),
                ];
            })->values(),
            'lastMessage' => $lastMessage ? [
                'id' => (string) $lastMessage->id,
                'authorUserId' => (string) $lastMessage->author_user_id,
                'authorName' => $lastMessage->author?->name,
                'body' => $lastMessage->body !== '' ? $lastMessage->body : ($lastMessage->attachments->isNotEmpty() ? 'Imagen compartida' : ''),
                'createdAt' => optional($lastMessage->created_at)?->toISOString(),
                'attachments' => $lastMessage->attachments->map(fn (ChatMessageAttachment $attachment) => [
                    'id' => (string) $attachment->id,
                    'fileName' => $attachment->file_name,
                    'mimeType' => $attachment->mime_type,
                    'sizeBytes' => $attachment->size_bytes,
                    'url' => $attachment->public_url,
                ])->values(),
            ] : null,
            'unreadCount' => $unreadCount,
        ];
    }

    private function isAdmin(User $user): bool
    {
        return (string) $user->role === 'admin';
    }

    private function toIntOrNull($value): ?int
    {
        if ($value === null) {
            return null;
        }

        $string = (string) $value;

        if (! ctype_digit($string)) {
            return null;
        }

        return (int) $string;
    }
}
