<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\Service;
use App\Models\User;
use App\Services\NotificationDispatchService;
use App\Support\NotificationTypes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    public function __construct(private NotificationDispatchService $notifications)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Contract::query()->latest();
        $scopeResponse = $this->applyScope($query, $request);

        if ($scopeResponse instanceof JsonResponse) {
            return $scopeResponse;
        }

        $perPage = $this->resolvePerPage($request);

        if ($perPage) {
            $paginator = $query->paginate($perPage)->appends($request->query());

            return response()->json([
                'data' => collect($paginator->items())
                    ->map(fn (Contract $contract) => $this->formatContract($contract))
                    ->values(),
                'meta' => [
                    'currentPage' => $paginator->currentPage(),
                    'perPage' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'lastPage' => $paginator->lastPage(),
                    'hasMorePages' => $paginator->hasMorePages(),
                ],
            ]);
        }

        $contracts = $query->get()->map(fn (Contract $contract) => $this->formatContract($contract));

        return response()->json($contracts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'bookingId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'booking_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artistId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artist_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artistUserId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artist_user_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artistName' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artist_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artistEmail' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artist_email' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artistWhatsapp' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artist_whatsapp' => ['sometimes', 'nullable', 'string', 'max:255'],
            'clientId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'client_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'clientName' => ['sometimes', 'nullable', 'string', 'max:255'],
            'client_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'clientEmail' => ['sometimes', 'nullable', 'string', 'max:255'],
            'client_email' => ['sometimes', 'nullable', 'string', 'max:255'],
            'clientWhatsapp' => ['sometimes', 'nullable', 'string', 'max:255'],
            'client_whatsapp' => ['sometimes', 'nullable', 'string', 'max:255'],
            'eventId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'event_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'nullable', 'string', 'max:50'],
            'terms' => ['sometimes', 'nullable', 'array'],
            'artistSignature' => ['sometimes', 'nullable', 'array'],
            'artist_signature' => ['sometimes', 'nullable', 'array'],
            'clientSignature' => ['sometimes', 'nullable', 'array'],
            'client_signature' => ['sometimes', 'nullable', 'array'],
            'metadata' => ['sometimes', 'nullable', 'array'],
            'completedAt' => ['sometimes', 'nullable', 'date'],
            'completed_at' => ['sometimes', 'nullable', 'date'],
        ]);

        $payload = $this->normalizePayload($validated);

        $contractId = $payload['id'] ?? ('contract-'.now()->timestamp);

        $contract = Contract::create([
            'id' => $contractId,
            ...collect($payload)->except('id')->all(),
        ]);

        return response()->json($this->formatContract($contract), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $contract = Contract::find($id);

        if (! $contract) {
            return response()->json(['error' => 'Contract not found'], 404);
        }

        $validated = $request->validate([
            'bookingId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'booking_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artistId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artist_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artistUserId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artist_user_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artistName' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artist_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artistEmail' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artist_email' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artistWhatsapp' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artist_whatsapp' => ['sometimes', 'nullable', 'string', 'max:255'],
            'clientId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'client_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'clientName' => ['sometimes', 'nullable', 'string', 'max:255'],
            'client_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'clientEmail' => ['sometimes', 'nullable', 'string', 'max:255'],
            'client_email' => ['sometimes', 'nullable', 'string', 'max:255'],
            'clientWhatsapp' => ['sometimes', 'nullable', 'string', 'max:255'],
            'client_whatsapp' => ['sometimes', 'nullable', 'string', 'max:255'],
            'eventId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'event_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'nullable', 'string', 'max:50'],
            'terms' => ['sometimes', 'nullable', 'array'],
            'artistSignature' => ['sometimes', 'nullable', 'array'],
            'artist_signature' => ['sometimes', 'nullable', 'array'],
            'clientSignature' => ['sometimes', 'nullable', 'array'],
            'client_signature' => ['sometimes', 'nullable', 'array'],
            'metadata' => ['sometimes', 'nullable', 'array'],
            'completedAt' => ['sometimes', 'nullable', 'date'],
            'completed_at' => ['sometimes', 'nullable', 'date'],
        ]);

        $previousStatus = $contract->status;
        $payload = $this->normalizePayload($validated);

        $contract->update($payload);

        $freshContract = $contract->fresh();

        if (($payload['status'] ?? null) === 'active' && $previousStatus !== 'active') {
            $clientUser = $this->resolveUserById($freshContract->client_id);

            if ($clientUser) {
                $this->notifications->dispatchToUser($clientUser, NotificationTypes::CONTRACT_APPROVED, [
                    'channels' => ['database', 'mail'],
                    'title' => 'Tu contrato fue aprobado',
                    'body' => 'El proveedor '.$freshContract->artist_name.' aprobo tu contrato y el servicio ya esta activo.',
                    'mailSubject' => 'Tu contrato fue aprobado',
                    'mailBody' => "Tu contrato para {$freshContract->artist_name} ya fue aprobado y se encuentra activo.\n\nContrato: {$freshContract->id}\n",
                    'ctaUrl' => '/',
                    'entity' => ['type' => 'contract', 'id' => (string) $freshContract->id],
                    'dedupeKey' => NotificationTypes::CONTRACT_APPROVED.':'.$freshContract->id,
                ]);
            }
        }

        if (($payload['status'] ?? null) === 'completed' && $previousStatus !== 'completed') {
            $contract->completed_at = now();
            $contract->save();
            $this->incrementServiceBookings($contract->artist_id);

            $clientUser = $this->resolveUserById($contract->client_id);
            if ($clientUser) {
                $this->notifications->dispatchToUser($clientUser, NotificationTypes::REVIEW_REQUESTED, [
                    'channels' => ['database'],
                    'title' => 'Deja tu reseña del servicio',
                    'body' => 'Tu servicio con '.$contract->artist_name.' fue marcado como completado. Comparte tu experiencia.',
                    'ctaUrl' => '/',
                    'entity' => ['type' => 'contract', 'id' => (string) $contract->id],
                    'dedupeKey' => NotificationTypes::REVIEW_REQUESTED.':'.$contract->id,
                ]);
            }
        }

        return response()->json($this->formatContract($contract->fresh()));
    }

    private function normalizePayload(array $validated): array
    {
        $payload = $validated;

        $keyMap = [
            'bookingId' => 'booking_id',
            'artistId' => 'artist_id',
            'artistUserId' => 'artist_user_id',
            'artistName' => 'artist_name',
            'artistEmail' => 'artist_email',
            'artistWhatsapp' => 'artist_whatsapp',
            'clientId' => 'client_id',
            'clientName' => 'client_name',
            'clientEmail' => 'client_email',
            'clientWhatsapp' => 'client_whatsapp',
            'eventId' => 'event_id',
            'artistSignature' => 'artist_signature',
            'clientSignature' => 'client_signature',
            'completedAt' => 'completed_at',
        ];

        foreach ($keyMap as $camelKey => $snakeKey) {
            if (array_key_exists($camelKey, $payload)) {
                $payload[$snakeKey] = $payload[$camelKey];
                unset($payload[$camelKey]);
            }
        }

        return $payload;
    }

    private function incrementServiceBookings(?string $artistId): void
    {
        if (! $artistId || ! ctype_digit($artistId)) {
            return;
        }

        Service::query()->where('id', (int) $artistId)->increment('bookings_completed');
    }

    private function formatContract(Contract $contract): array
    {
        return [
            'id' => (string) $contract->id,
            'bookingId' => $contract->booking_id,
            'artistId' => $contract->artist_id,
            'artistUserId' => $contract->artist_user_id,
            'artistName' => $contract->artist_name,
            'artistEmail' => $contract->artist_email,
            'artistWhatsapp' => $contract->artist_whatsapp,
            'clientId' => $contract->client_id,
            'clientName' => $contract->client_name,
            'clientEmail' => $contract->client_email,
            'clientWhatsapp' => $contract->client_whatsapp,
            'eventId' => $contract->event_id,
            'status' => $contract->status,
            'terms' => $contract->terms,
            'artistSignature' => $contract->artist_signature,
            'clientSignature' => $contract->client_signature,
            'metadata' => $contract->metadata,
            'completedAt' => optional($contract->completed_at)?->toISOString(),
            'createdAt' => optional($contract->created_at)?->toISOString(),
        ];
    }

    private function resolveUserById(?string $userId): ?User
    {
        if (! $userId || ! ctype_digit($userId)) {
            return null;
        }

        return User::find((int) $userId);
    }

    private function applyScope(Builder $query, Request $request): ?JsonResponse
    {
        $scope = strtolower((string) $request->query('scope', ''));

        if ($request->filled('client_id')) {
            $query->where('client_id', (string) $request->query('client_id'));
        }

        if ($request->filled('artist_user_id')) {
            $query->where('artist_user_id', (string) $request->query('artist_user_id'));
        }

        if ($scope === '') {
            return null;
        }

        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if ($scope === 'mine') {
            $scope = $authUser->is_provider ? 'provider' : 'client';
        }

        if ($scope === 'client') {
            $query->where('client_id', (string) $authUser->id);
        }

        if ($scope === 'provider') {
            $query->where('artist_user_id', (string) $authUser->id);
        }

        return null;
    }

    private function resolvePerPage(Request $request): ?int
    {
        $perPage = (int) $request->query('per_page', 0);

        if ($perPage <= 0) {
            return null;
        }

        return min($perPage, 100);
    }
}
