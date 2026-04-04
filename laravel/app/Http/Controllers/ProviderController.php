<?php

namespace App\Http\Controllers;

use App\Models\Provider;
use App\Models\User;
use App\Services\NotificationDispatchService;
use App\Support\NotificationTypes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProviderController extends Controller
{
    public function __construct(private NotificationDispatchService $notifications)
    {
    }

    public function index(): JsonResponse
    {
        $providers = Provider::query()->latest()->get()->map(fn (Provider $provider) => $this->formatProvider($provider));

        return response()->json($providers);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if (! $authUser->is_provider || $authUser->provider_request_status !== 'approved') {
            return response()->json([
                'error' => 'Provider access not approved',
                'message' => 'Un administrador debe aprobar tu solicitud antes de crear un perfil de proveedor.',
            ], 403);
        }

        if (Provider::where('user_id', $authUser->id)->exists()) {
            return response()->json(['error' => 'Provider already exists for user'], 409);
        }

        $validated = $request->validate([
            'businessName' => ['nullable', 'string', 'max:255'],
            'business_name' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'representative' => ['nullable', 'array'],
            'representative.type' => ['nullable', 'in:person,company'],
            'representative.name' => ['nullable', 'string', 'max:255'],
            'representative.documentType' => ['nullable', 'in:CI,RIF'],
            'representative.documentNumber' => ['nullable', 'string', 'max:50'],
            'representativeName' => ['nullable', 'string', 'max:255'],
            'representative_name' => ['nullable', 'string', 'max:255'],
            'legalEntityType' => ['nullable', 'in:person,company'],
            'legal_entity_type' => ['nullable', 'in:person,company'],
            'identificationNumber' => ['nullable', 'string', 'max:50'],
            'identification_number' => ['nullable', 'string', 'max:50'],
        ]);

        $businessName = $validated['businessName'] ?? $validated['business_name'] ?? $authUser->name;
        $representative = $this->buildRepresentativeData($validated, $authUser->name, $businessName);

        $provider = Provider::create([
            'user_id' => $authUser->id,
            'business_name' => $businessName,
            'category' => $validated['category'] ?? 'general',
            'description' => $validated['description'] ?? '',
            'representative' => $representative,
            'legal_entity_type' => $representative['type'],
            'identification_number' => $representative['documentNumber'] ?: null,
            'verified' => false,
            'services' => [],
        ]);

        $authUser->update([
            'is_provider' => true,
            'provider_id' => $provider->id,
            'provider_request_status' => 'approved',
            'role' => $authUser->role === 'admin' ? 'admin' : 'provider',
        ]);

        $this->notifications->dispatchToUser($authUser->fresh(), NotificationTypes::PROVIDER_ROLE_ACTIVATED, [
            'channels' => ['database'],
            'title' => 'Perfil de proveedor activado',
            'body' => 'Tu perfil de proveedor fue creado correctamente. Ya puedes gestionar tu negocio.',
            'ctaUrl' => '/',
            'entity' => ['type' => 'provider', 'id' => (string) $provider->id],
            'dedupeKey' => NotificationTypes::PROVIDER_ROLE_ACTIVATED.':provider:'.$provider->id,
        ]);

        return response()->json($this->formatProvider($provider), 201);
    }

    public function showByUser(string $userId): JsonResponse
    {
        $provider = Provider::query()->where('user_id', $userId)->first();

        if ($provider) {
            $user = User::find($userId);

            if ($user && (int) ($user->provider_id ?? 0) !== (int) $provider->id) {
                $user->forceFill([
                    'provider_id' => $provider->id,
                    'is_provider' => true,
                    'provider_request_status' => 'approved',
                    'role' => $user->role === 'admin' ? 'admin' : 'provider',
                ])->save();
            }

            return response()->json($this->formatProvider($provider));
        }

        return response()->json(null);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $provider = Provider::find($id);

        if (! $provider) {
            return response()->json(['error' => 'Provider not found'], 404);
        }

        if ((int) $provider->user_id !== (int) $authUser->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'businessName' => ['sometimes', 'nullable', 'string', 'max:255'],
            'business_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
            'description' => ['sometimes', 'nullable', 'string'],
            'representative' => ['sometimes', 'nullable', 'array'],
            'representative.type' => ['nullable', 'in:person,company'],
            'representative.name' => ['nullable', 'string', 'max:255'],
            'representative.documentType' => ['nullable', 'in:CI,RIF'],
            'representative.documentNumber' => ['nullable', 'string', 'max:50'],
            'representativeName' => ['sometimes', 'nullable', 'string', 'max:255'],
            'representative_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'legalEntityType' => ['sometimes', 'nullable', 'in:person,company'],
            'legal_entity_type' => ['sometimes', 'nullable', 'in:person,company'],
            'identificationNumber' => ['sometimes', 'nullable', 'string', 'max:50'],
            'identification_number' => ['sometimes', 'nullable', 'string', 'max:50'],
            'services' => ['sometimes', 'array'],
            'verified' => ['sometimes', 'boolean'],
            'rating' => ['sometimes', 'numeric', 'between:0,5'],
            'totalBookings' => ['sometimes', 'integer', 'min:0'],
            'total_bookings' => ['sometimes', 'integer', 'min:0'],
        ]);

        if (array_key_exists('businessName', $validated)) {
            $validated['business_name'] = $validated['businessName'];
            unset($validated['businessName']);
        }

        if (array_key_exists('totalBookings', $validated)) {
            $validated['total_bookings'] = $validated['totalBookings'];
            unset($validated['totalBookings']);
        }

        if (array_key_exists('legalEntityType', $validated)) {
            $validated['legal_entity_type'] = $validated['legalEntityType'];
            unset($validated['legalEntityType']);
        }

        if (array_key_exists('identificationNumber', $validated)) {
            $validated['identification_number'] = $validated['identificationNumber'];
            unset($validated['identificationNumber']);
        }

        $businessName = $validated['business_name'] ?? $provider->business_name;
        $representative = $this->buildRepresentativeData($validated, $authUser->name, $businessName, $provider);
        $validated['representative'] = $representative;
        $validated['legal_entity_type'] = $representative['type'];
        $validated['identification_number'] = $representative['documentNumber'] ?: null;

        unset($validated['representativeName'], $validated['representative_name']);

        $provider->update($validated);

        return response()->json($this->formatProvider($provider->fresh()));
    }

    private function buildRepresentativeData(array $validated, ?string $fallbackUserName = null, ?string $fallbackBusinessName = null, ?Provider $provider = null): array
    {
        $currentRepresentative = is_array($provider?->representative) ? $provider->representative : [];

        $type = data_get($validated, 'representative.type')
            ?? ($validated['legal_entity_type'] ?? null)
            ?? ($validated['legalEntityType'] ?? null)
            ?? data_get($currentRepresentative, 'type')
            ?? $provider?->legal_entity_type
            ?? 'person';

        $type = $type === 'company' ? 'company' : 'person';

        $defaultName = $type === 'company'
            ? ($fallbackBusinessName ?: $fallbackUserName ?: 'Representante')
            : ($fallbackUserName ?: $fallbackBusinessName ?: 'Representante');

        $name = trim((string) (
            data_get($validated, 'representative.name')
            ?? ($validated['representative_name'] ?? null)
            ?? ($validated['representativeName'] ?? null)
            ?? data_get($currentRepresentative, 'name')
            ?? $defaultName
        ));

        $documentType = strtoupper((string) (
            data_get($validated, 'representative.documentType')
            ?? data_get($currentRepresentative, 'documentType')
            ?? ($type === 'company' ? 'RIF' : 'CI')
        ));

        $documentNumber = trim((string) (
            data_get($validated, 'representative.documentNumber')
            ?? ($validated['identification_number'] ?? null)
            ?? ($validated['identificationNumber'] ?? null)
            ?? data_get($currentRepresentative, 'documentNumber')
            ?? $provider?->identification_number
            ?? ''
        ));

        return [
            'type' => $type,
            'name' => $name !== '' ? $name : $defaultName,
            'documentType' => $documentType === 'RIF' ? 'RIF' : 'CI',
            'documentNumber' => $documentNumber,
        ];
    }

    private function normalizeRepresentativeFromProvider(Provider $provider): array
    {
        $provider->loadMissing('user');

        $storedRepresentative = is_array($provider->representative) ? $provider->representative : [];
        $type = data_get($storedRepresentative, 'type', $provider->legal_entity_type === 'company' ? 'company' : 'person');
        $type = $type === 'company' ? 'company' : 'person';

        return [
            'type' => $type,
            'name' => data_get(
                $storedRepresentative,
                'name',
                $type === 'company'
                    ? ($provider->business_name ?: $provider->user?->name ?: 'Representante')
                    : ($provider->user?->name ?: $provider->business_name ?: 'Representante')
            ),
            'documentType' => data_get($storedRepresentative, 'documentType', $type === 'company' ? 'RIF' : 'CI'),
            'documentNumber' => data_get($storedRepresentative, 'documentNumber', $provider->identification_number),
        ];
    }

    private function formatProvider(Provider $provider): array
    {
        $representative = $this->normalizeRepresentativeFromProvider($provider);

        return [
            'id' => (string) $provider->id,
            'userId' => (string) $provider->user_id,
            'businessName' => $provider->business_name,
            'category' => $provider->category,
            'description' => $provider->description,
            'representative' => $representative,
            'representativeName' => $representative['name'],
            'legalEntityType' => $representative['type'],
            'identificationNumber' => $representative['documentNumber'],
            'verified' => (bool) $provider->verified,
            'verifiedAt' => optional($provider->verified_at)?->toISOString(),
            'verifiedBy' => $provider->verified_by,
            'banned' => (bool) $provider->banned,
            'bannedAt' => optional($provider->banned_at)?->toISOString(),
            'bannedBy' => $provider->banned_by,
            'bannedReason' => $provider->banned_reason,
            'unbannedAt' => optional($provider->unbanned_at)?->toISOString(),
            'unbannedBy' => $provider->unbanned_by,
            'createdAt' => optional($provider->created_at)?->toISOString(),
            'services' => $provider->services ?? [],
            'totalBookings' => (int) $provider->total_bookings,
            'rating' => (float) $provider->rating,
        ];
    }
}
