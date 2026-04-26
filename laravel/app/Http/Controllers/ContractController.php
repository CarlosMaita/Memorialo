<?php

namespace App\Http\Controllers;

use App\Models\Agreement;
use App\Models\Contract;
use App\Models\Provider;
use App\Models\Service;
use App\Models\User;
use App\Services\NotificationDispatchService;
use App\Support\NotificationTypes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    public function __construct(private NotificationDispatchService $notifications) {}

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

    public function sendContract(Request $request, string $id): JsonResponse
    {
        $authUser = $request->user('sanctum') ?? $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $contract = Contract::find($id);

        if (! $contract) {
            return response()->json(['error' => 'Contract not found'], 404);
        }

        $validated = $request->validate([
            'agreements' => ['sometimes', 'array'],
            'agreements.*.description' => ['required_with:agreements', 'string', 'max:2000'],
            'terms' => ['sometimes', 'nullable', 'array'],
        ]);

        // Register provider signature
        $contract->artist_signature = [
            'signedBy' => $authUser->name ?? 'Proveedor',
            'signedAt' => now()->toISOString(),
        ];
        $contract->provider_signed_at = now();
        $contract->status = 'pending_client';

        if (! empty($validated['terms'])) {
            $contract->terms = array_merge(is_array($contract->terms) ? $contract->terms : [], $validated['terms']);
        }

        $contract->save();

        // Store agreements
        if (! empty($validated['agreements'])) {
            foreach ($validated['agreements'] as $agreementData) {
                Agreement::create([
                    'contract_id' => $contract->id,
                    'description' => $agreementData['description'],
                ]);
            }
        }

        $freshContract = $contract->fresh();

        // Notify client
        $clientUser = $this->resolveUserById($freshContract->client_id);
        if ($clientUser) {
            $this->notifications->dispatchToUser($clientUser, NotificationTypes::CONTRACT_SENT_TO_CLIENT, [
                'channels' => ['database', 'mail'],
                'title' => 'El proveedor te envió el contrato',
                'body' => $freshContract->artist_name.' ha enviado el contrato para tu revisión y firma.',
                'mailSubject' => 'Contrato listo para firmar',
                'mailBody' => "El proveedor {$freshContract->artist_name} ha firmado el contrato y lo ha enviado para tu revisión.\n\nRevisa los acuerdos y firma para continuar con el pago.\n",
                'ctaUrl' => '/',
                'entity' => ['type' => 'contract', 'id' => (string) $freshContract->id],
                'dedupeKey' => NotificationTypes::CONTRACT_SENT_TO_CLIENT.':'.$freshContract->id,
            ]);
        }

        return response()->json($this->formatContract($freshContract));
    }

    public function rejectContract(Request $request, string $id): JsonResponse
    {
        $authUser = $request->user('sanctum') ?? $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $contract = Contract::find($id);

        if (! $contract) {
            return response()->json(['error' => 'Contract not found'], 404);
        }

        $validated = $request->validate([
            'reason' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        $contract->status = 'en_negociacion';
        $contract->rejection_reason = $validated['reason'] ?? null;
        $contract->client_signature = null;
        $contract->provider_signed_at = null;
        $contract->artist_signature = null;
        $contract->save();

        // Notify provider
        $providerUser = $this->resolveUserById($contract->artist_user_id);
        if ($providerUser) {
            $this->notifications->dispatchToUser($providerUser, NotificationTypes::CONTRACT_REJECTED_BY_CLIENT, [
                'channels' => ['database', 'mail'],
                'title' => 'El cliente rechazó el contrato',
                'body' => ($contract->client_name ?? 'El cliente').' rechazó el contrato y propone cambios.',
                'mailSubject' => 'Contrato rechazado por el cliente',
                'mailBody' => "El cliente {$contract->client_name} rechazó el contrato.\n\nMotivo: ".($validated['reason'] ?? 'No especificado')."\n\nRevisa la mesa de negociación para ajustar los términos.\n",
                'ctaUrl' => '/',
                'entity' => ['type' => 'contract', 'id' => (string) $contract->id],
                'dedupeKey' => NotificationTypes::CONTRACT_REJECTED_BY_CLIENT.':'.$contract->id.':'.now()->timestamp,
            ]);
        }

        return response()->json($this->formatContract($contract->fresh()));
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

        if (($payload['status'] ?? null) === 'esperando_pago' && $previousStatus !== 'esperando_pago') {
            // Client signed — record client signature timestamp if not already set
            if (! empty($payload['client_signature']) && is_array($freshContract->client_signature)) {
                // Already set by the update above
            }
        }

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
        $metadata = is_array($contract->metadata) ? $contract->metadata : [];
        $service = $this->resolveServiceForContract($contract);
        $provider = $service?->provider ?: ($service ? Provider::query()->with('user')->where('user_id', $service->user_id)->first() : null);

        if ($provider) {
            $representative = $this->resolveProviderRepresentative($provider, $contract->artist_name);

            $metadata['providerBusinessName'] = $provider->business_name ?: ($metadata['providerBusinessName'] ?? $contract->artist_name);
            $metadata['providerRepresentative'] = $representative;
            $metadata['providerRepresentativeName'] = $representative['name'];
            $metadata['providerLegalEntityType'] = $representative['type'];
            $metadata['providerIdentificationNumber'] = $representative['documentNumber'];
        }

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
            'providerSignedAt' => optional($contract->provider_signed_at)?->toISOString(),
            'clientSignature' => $contract->client_signature,
            'rejectionReason' => $contract->rejection_reason,
            'metadata' => $metadata,
            'completedAt' => optional($contract->completed_at)?->toISOString(),
            'createdAt' => optional($contract->created_at)?->toISOString(),
        ];
    }

    private function resolveServiceForContract(Contract $contract): ?Service
    {
        if (! $contract->artist_id || ! ctype_digit((string) $contract->artist_id)) {
            return null;
        }

        return Service::query()->with(['provider.user'])->find((int) $contract->artist_id);
    }

    private function resolveProviderRepresentative(Provider $provider, ?string $fallbackName = null): array
    {
        $provider->loadMissing('user');
        $representative = is_array($provider->representative) ? $provider->representative : [];
        $type = data_get($representative, 'type', $provider->legal_entity_type === 'company' ? 'company' : 'person');
        $type = $type === 'company' ? 'company' : 'person';

        return [
            'type' => $type,
            'name' => data_get(
                $representative,
                'name',
                $type === 'company'
                    ? ($provider->business_name ?: $provider->user?->name ?: $fallbackName ?: 'Representante')
                    : ($provider->user?->name ?: $provider->business_name ?: $fallbackName ?: 'Representante')
            ),
            'documentType' => data_get($representative, 'documentType', $type === 'company' ? 'RIF' : 'CI'),
            'documentNumber' => data_get($representative, 'documentNumber', $provider->identification_number),
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

        $authUser = $request->user('sanctum') ?? $request->user();

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
            $ownedServiceIds = Service::query()
                ->where('user_id', (string) $authUser->id)
                ->pluck('id')
                ->map(fn ($id) => (string) $id)
                ->filter()
                ->values();

            $query->where(function (Builder $providerQuery) use ($authUser, $ownedServiceIds) {
                $providerQuery->where('artist_user_id', (string) $authUser->id);

                if ($ownedServiceIds->isNotEmpty()) {
                    $providerQuery->orWhereIn('artist_id', $ownedServiceIds->all());
                }
            });
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
