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
        $scopeResponse = $this->applyScope($query, $request);

        if ($scopeResponse instanceof JsonResponse) {
            return $scopeResponse;
        }

        $perPage = $this->resolvePerPage($request);

        if ($perPage) {
            $paginator = $query->paginate($perPage)->appends($request->query());

            return response()->json([
                'data' => collect($paginator->items())
                    ->map(fn (Booking $booking) => $this->formatBooking($booking))
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

        $bookings = $query->get()->map(fn (Booking $booking) => $this->formatBooking($booking));

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

            $this->notifications->dispatchToUser($providerUser, NotificationTypes::SERVICE_REQUEST_CREATED, [
                'channels' => ['database', 'mail'],
                'title' => 'Nueva solicitud de servicio',
                'body' => $clientName.' solicito '.$serviceName.' para el '.$booking->date.'.',
                'mailSubject' => 'Nueva solicitud de servicio',
                'mailBody' => "Has recibido una nueva solicitud de servicio.\n\nCliente: {$clientName}\nServicio: {$serviceName}\nFecha: {$booking->date}\nUbicacion: ".($booking->location ?? 'No definida')."\n",
                'ctaUrl' => '/',
                'entity' => ['type' => 'booking', 'id' => (string) $booking->id],
                'dedupeKey' => NotificationTypes::SERVICE_REQUEST_CREATED.':'.$booking->id,
            ]);
        }

        return response()->json($this->formatBooking($booking), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $booking = Booking::find($id);

        if (! $booking) {
            return response()->json(['error' => 'Booking not found'], 404);
        }

        $validated = $this->validateBookingPayload($request, true);
        $payload = $this->normalizePayload($validated);

        $booking->update($payload);

        return response()->json($this->formatBooking($booking->fresh()));
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

        return $payload;
    }

    private function formatBooking(Booking $booking): array
    {
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
