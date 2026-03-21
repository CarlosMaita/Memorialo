<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    public function index(): JsonResponse
    {
        $contracts = Contract::query()->latest()->get()->map(fn (Contract $contract) => $this->formatContract($contract));

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

        if (($payload['status'] ?? null) === 'completed' && $previousStatus !== 'completed') {
            $contract->completed_at = now();
            $contract->save();
            $this->incrementServiceBookings($contract->artist_id);
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
}
