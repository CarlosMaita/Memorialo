<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Service;
use App\Models\User;
use App\Services\NotificationDispatchService;
use App\Support\NotificationTypes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function __construct(private NotificationDispatchService $notifications)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Booking::query()->latest();
        $includeArchived = $request->boolean('include_archived');
        $archiveScope = $this->resolveArchiveScope($request);

        if (! $includeArchived) {
            if ($archiveScope === 'client') {
                $query->where(function (Builder $builder) {
                    $builder->where('archived_by_client', false)->orWhereNull('archived_by_client');
                });
            } elseif ($archiveScope === 'provider') {
                $query->where(function (Builder $builder) {
                    $builder->where('archived_by_provider', false)->orWhereNull('archived_by_provider');
                });
            } else {
                $query->where(function (Builder $builder) {
                    $builder->where('archived', false)->orWhereNull('archived');
                });
            }
        }

        $scopeResponse = $this->applyScope($query, $request);

        if ($scopeResponse instanceof JsonResponse) {
            return $scopeResponse;
        }

        $perPage = $this->resolvePerPage($request);

        if ($perPage) {
            $paginator = $query->paginate($perPage)->appends($request->query());

            return response()->json([
                'data' => collect($paginator->items())
                    ->map(fn (Booking $booking) => $this->formatBooking($booking, $archiveScope))
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

        $bookings = $query->get()->map(fn (Booking $booking) => $this->formatBooking($booking, $archiveScope));

        return response()->json($bookings);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateBookingPayload($request, false);
        $payload = $this->normalizePayload($validated);

        $bookingId = $payload['id'] ?? ('booking-'.now()->timestamp);

        $authUser = $request->user('sanctum') ?? $request->user();
        if ($authUser && ! array_key_exists('user_id', $payload)) {
            $payload['user_id'] = (string) $authUser->id;
        }

        $booking = Booking::create([
            'id' => $bookingId,
            ...collect($payload)->except('id')->all(),
        ]);

        $providerUser = $this->resolveProviderUser($payload);

        if ($providerUser) {
            $clientName = $payload['client_name'] ?? $payload['clientName'] ?? ($authUser?->name ?? 'Un usuario');
            $serviceName = $payload['artist_name'] ?? $payload['artistName'] ?? 'tu servicio';

            $negotiationPath = $booking->contract_id
                ? '/mi-negocio/negociacion/'.rawurlencode((string) $booking->contract_id)
                : '/mi-negocio/negociaciones';

            $this->notifications->dispatchToUser($providerUser, NotificationTypes::SERVICE_REQUEST_CREATED, [
                'channels' => ['database', 'mail'],
                'title' => 'Nueva solicitud de servicio',
                'body' => $clientName.' solicito '.$serviceName.' para el '.$booking->date.'.',
                'mailSubject' => 'Nueva solicitud de servicio',
                'mailBody' => "Has recibido una nueva solicitud de servicio.\n\nCliente: {$clientName}\nServicio: {$serviceName}\nFecha: {$booking->date}\nUbicacion: ".($booking->location ?? 'No definida')."\n",
                'ctaUrl' => $negotiationPath,
                'entity' => ['type' => 'booking', 'id' => (string) $booking->id],
                'dedupeKey' => NotificationTypes::SERVICE_REQUEST_CREATED.':'.$booking->id,
            ]);
        }

        return response()->json($this->formatBooking($booking, $this->resolveArchiveScope($request)), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $booking = Booking::find($id);

        if (! $booking) {
            return response()->json(['error' => 'Booking not found'], 404);
        }

        $validated = $this->validateBookingPayload($request, true);
        $payload = $this->normalizePayload($validated);
        $archiveContext = $this->resolveArchiveContext($request, $booking);

        if (array_key_exists('archived', $payload) && in_array($archiveContext, ['client', 'provider'], true)) {
            $archived = (bool) $payload['archived'];
            $archiveAt = $payload['archived_at'] ?? ($archived ? now() : null);

            if ($archiveContext === 'client') {
                $payload['archived_by_client'] = $archived;
                $payload['archived_at_client'] = $archiveAt;
            } else {
                $payload['archived_by_provider'] = $archived;
                $payload['archived_at_provider'] = $archiveAt;
            }

            $nextArchivedByClient = array_key_exists('archived_by_client', $payload)
                ? (bool) $payload['archived_by_client']
                : (bool) $booking->archived_by_client;
            $nextArchivedByProvider = array_key_exists('archived_by_provider', $payload)
                ? (bool) $payload['archived_by_provider']
                : (bool) $booking->archived_by_provider;
            $nextArchivedAtClient = $payload['archived_at_client'] ?? $booking->archived_at_client;
            $nextArchivedAtProvider = $payload['archived_at_provider'] ?? $booking->archived_at_provider;

            $payload['archived'] = $nextArchivedByClient || $nextArchivedByProvider;
            if ($nextArchivedByClient) {
                $payload['archived_at'] = $nextArchivedAtClient;
            } elseif ($nextArchivedByProvider) {
                $payload['archived_at'] = $nextArchivedAtProvider;
            } else {
                $payload['archived_at'] = null;
            }
        }

        $booking->update($payload);

        $freshBooking = $booking->fresh();
        return response()->json($this->formatBooking($freshBooking, $this->resolveArchiveContext($request, $freshBooking)));
    }

    private function validateBookingPayload(Request $request, bool $partial): array
    {
        $presence = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artistId' => [$presence, 'nullable', 'string', 'max:255'],
            'artist_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artistUserId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artist_user_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artistName' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artist_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'userId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'user_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'clientName' => ['sometimes', 'nullable', 'string', 'max:255'],
            'client_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'clientEmail' => ['sometimes', 'nullable', 'string', 'max:255'],
            'client_email' => ['sometimes', 'nullable', 'string', 'max:255'],
            'clientPhone' => ['sometimes', 'nullable', 'string', 'max:255'],
            'client_phone' => ['sometimes', 'nullable', 'string', 'max:255'],
            'date' => ['sometimes', 'nullable', 'string', 'max:255'],
            'startTime' => ['sometimes', 'nullable', 'string', 'max:255'],
            'start_time' => ['sometimes', 'nullable', 'string', 'max:255'],
            'duration' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'eventType' => ['sometimes', 'nullable', 'string', 'max:255'],
            'event_type' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'specialRequests' => ['sometimes', 'nullable', 'string'],
            'special_requests' => ['sometimes', 'nullable', 'string'],
            'totalPrice' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'total_price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'status' => ['sometimes', 'nullable', 'string', 'max:50'],
            'archived' => ['sometimes', 'nullable', 'boolean'],
            'archivedAt' => ['sometimes', 'nullable', 'date'],
            'archived_at' => ['sometimes', 'nullable', 'date'],
            'archivedByClient' => ['sometimes', 'nullable', 'boolean'],
            'archived_by_client' => ['sometimes', 'nullable', 'boolean'],
            'archivedAtClient' => ['sometimes', 'nullable', 'date'],
            'archived_at_client' => ['sometimes', 'nullable', 'date'],
            'archivedByProvider' => ['sometimes', 'nullable', 'boolean'],
            'archived_by_provider' => ['sometimes', 'nullable', 'boolean'],
            'archivedAtProvider' => ['sometimes', 'nullable', 'date'],
            'archived_at_provider' => ['sometimes', 'nullable', 'date'],
            'planId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'plan_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'planName' => ['sometimes', 'nullable', 'string', 'max:255'],
            'plan_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contractId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contract_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ]);
    }

    private function normalizePayload(array $validated): array
    {
        $payload = $validated;

        $keyMap = [
            'artistId' => 'artist_id',
            'artistUserId' => 'artist_user_id',
            'artistName' => 'artist_name',
            'userId' => 'user_id',
            'clientName' => 'client_name',
            'clientEmail' => 'client_email',
            'clientPhone' => 'client_phone',
            'startTime' => 'start_time',
            'eventType' => 'event_type',
            'specialRequests' => 'special_requests',
            'totalPrice' => 'total_price',
            'archivedAt' => 'archived_at',
            'archivedByClient' => 'archived_by_client',
            'archivedAtClient' => 'archived_at_client',
            'archivedByProvider' => 'archived_by_provider',
            'archivedAtProvider' => 'archived_at_provider',
            'planId' => 'plan_id',
            'planName' => 'plan_name',
            'contractId' => 'contract_id',
        ];

        foreach ($keyMap as $camelKey => $snakeKey) {
            if (array_key_exists($camelKey, $payload)) {
                $payload[$snakeKey] = $payload[$camelKey];
                unset($payload[$camelKey]);
            }
        }

        if (array_key_exists('archived', $payload) && ! array_key_exists('archived_at', $payload)) {
            $payload['archived_at'] = $payload['archived'] ? now() : null;
        }

        return $payload;
    }

    private function formatBooking(Booking $booking, ?string $archiveScope = null): array
    {
        $archived = (bool) $booking->archived;
        $archivedAt = optional($booking->archived_at)?->toISOString();

        if ($archiveScope === 'client') {
            $archived = (bool) $booking->archived_by_client;
            $archivedAt = optional($booking->archived_at_client)?->toISOString();
        } elseif ($archiveScope === 'provider') {
            $archived = (bool) $booking->archived_by_provider;
            $archivedAt = optional($booking->archived_at_provider)?->toISOString();
        }

        return [
            'id' => (string) $booking->id,
            'artistId' => $booking->artist_id,
            'artistUserId' => $booking->artist_user_id,
            'artistName' => $booking->artist_name,
            'userId' => $booking->user_id,
            'clientName' => $booking->client_name,
            'clientEmail' => $booking->client_email,
            'clientPhone' => $booking->client_phone,
            'date' => $booking->date,
            'startTime' => $booking->start_time,
            'duration' => $booking->duration,
            'eventType' => $booking->event_type,
            'location' => $booking->location,
            'specialRequests' => $booking->special_requests,
            'totalPrice' => (float) $booking->total_price,
            'status' => $booking->status,
            'archived' => $archived,
            'archivedAt' => $archivedAt,
            'planId' => $booking->plan_id,
            'planName' => $booking->plan_name,
            'contractId' => $booking->contract_id,
            'metadata' => $booking->metadata,
            'createdAt' => optional($booking->created_at)?->toISOString(),
        ];
    }

    private function resolveProviderUser(array $payload): ?User
    {
        $artistUserId = $payload['artist_user_id'] ?? null;

        if ($artistUserId && ctype_digit((string) $artistUserId)) {
            return User::find((int) $artistUserId);
        }

        $artistId = $payload['artist_id'] ?? null;
        if ($artistId && ctype_digit((string) $artistId)) {
            $service = Service::find((int) $artistId);
            if ($service && $service->user_id) {
                return User::find((int) $service->user_id);
            }
        }

        return null;
    }

    private function resolveArchiveScope(Request $request): ?string
    {
        $scope = strtolower((string) $request->query('scope', ''));

        if ($scope === 'mine') {
            $authUser = $request->user('sanctum') ?? $request->user();
            if (! $authUser) {
                return null;
            }

            return $authUser->is_provider ? 'provider' : 'client';
        }

        return in_array($scope, ['client', 'provider'], true) ? $scope : null;
    }

    private function resolveArchiveContext(Request $request, Booking $booking): ?string
    {
        $scope = $this->resolveArchiveScope($request);
        if (in_array($scope, ['client', 'provider'], true)) {
            return $scope;
        }

        $authUser = $request->user('sanctum') ?? $request->user();
        if (! $authUser) {
            return null;
        }

        if ((string) $booking->user_id === (string) $authUser->id) {
            return 'client';
        }

        if ((string) $booking->artist_user_id === (string) $authUser->id) {
            return 'provider';
        }

        if ($booking->artist_id && Service::query()
            ->where('id', (string) $booking->artist_id)
            ->where('user_id', (string) $authUser->id)
            ->exists()) {
            return 'provider';
        }

        return null;
    }

    private function applyScope(Builder $query, Request $request): ?JsonResponse
    {
        $scope = strtolower((string) $request->query('scope', ''));

        if ($request->filled('user_id')) {
            $query->where('user_id', (string) $request->query('user_id'));
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
            $query->where('user_id', (string) $authUser->id);
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
