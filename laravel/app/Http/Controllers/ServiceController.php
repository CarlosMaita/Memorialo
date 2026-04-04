<?php

namespace App\Http\Controllers;

use App\Models\MarketplaceSetting;
use App\Models\Provider;
use App\Models\Service;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $view = $request->query('view', 'summary');
        $perPage = $this->resolvePerPage($request);
        $query = Service::query()->with(['provider.user'])->latest();

        $this->applyListFilters($query, $request);

        if ($perPage) {
            $paginator = $query->paginate($perPage)->appends($request->query());

            return response()->json([
                'data' => collect($paginator->items())
                    ->map(fn (Service $service) => $this->formatService($service, $view))
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

        $services = $query->get()->map(fn (Service $service) => $this->formatService($service, $view));

        return response()->json($services);
    }

    public function show(string $id): JsonResponse
    {
        $service = Service::query()->with(['provider.user'])->find($id);

        if (! $service) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        return response()->json($this->formatService($service, 'detail'));
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
                'message' => 'Debes tener acceso de proveedor aprobado para publicar servicios.',
            ], 403);
        }

        $provider = Provider::query()->where('user_id', $authUser->id)->first();

        if (! $provider) {
            return response()->json([
                'error' => 'Provider profile required',
                'message' => 'Debes completar tu cuenta de proveedor antes de publicar servicios.',
            ], 403);
        }

        if ((int) ($authUser->provider_id ?? 0) !== (int) $provider->id) {
            $authUser->forceFill([
                'provider_id' => $provider->id,
            ])->save();
        }

        $validated = $request->validate([
            'providerId' => ['nullable', 'exists:providers,id'],
            'provider_id' => ['nullable', 'exists:providers,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'bio' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'subcategory' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:100'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'pricePerHour' => ['nullable', 'numeric', 'min:0'],
            'isActive' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'isPublished' => ['sometimes', 'boolean'],
            'bookingsCompleted' => ['sometimes', 'integer', 'min:0'],
            'bookings_completed' => ['sometimes', 'integer', 'min:0'],
            'responseTime' => ['nullable', 'string', 'max:100'],
            'specialties' => ['nullable', 'array'],
            'availability' => ['nullable', 'array'],
            'servicePlans' => ['nullable', 'array'],
            'allowCustomHourly' => ['sometimes', 'boolean'],
            'image' => ['nullable', 'string'],
            'portfolio' => ['nullable', 'array'],
            'whatsappNumber' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'string', 'max:255'],
            'customTerms' => ['nullable', 'array'],
            'isArchived' => ['sometimes', 'boolean'],
            'metadata' => ['nullable', 'array'],
        ]);

        if (array_key_exists('providerId', $validated)) {
            $validated['provider_id'] = $validated['providerId'];
            unset($validated['providerId']);
        }

        if (array_key_exists('isActive', $validated)) {
            $validated['is_active'] = $validated['isActive'];
            unset($validated['isActive']);
        }

        if (array_key_exists('isPublished', $validated)) {
            $validated['is_active'] = $validated['isPublished'];
            unset($validated['isPublished']);
        }

        if (array_key_exists('bookingsCompleted', $validated)) {
            $validated['bookings_completed'] = $validated['bookingsCompleted'];
            unset($validated['bookingsCompleted']);
        }

        $title = trim((string) ($validated['title'] ?? $validated['name'] ?? ''));

        if ($title === '') {
            return response()->json(['message' => 'The title field is required.'], 422);
        }

        $metadata = is_array($validated['metadata'] ?? null) ? $validated['metadata'] : [];

        if (! array_key_exists('publicCode', $metadata) || ! is_string($metadata['publicCode']) || trim((string) $metadata['publicCode']) === '') {
            $metadata['publicCode'] = $this->buildPublicCode((string) $authUser->id);
        }

        foreach (['responseTime', 'specialties', 'availability', 'servicePlans', 'allowCustomHourly', 'image', 'portfolio', 'whatsappNumber', 'email', 'customTerms', 'isArchived'] as $metadataKey) {
            if (array_key_exists($metadataKey, $validated)) {
                $metadata[$metadataKey] = $validated[$metadataKey];
            }
        }

        $service = Service::create([
            'user_id' => $authUser->id,
            'provider_id' => $provider->id,
            'title' => $title,
            'description' => $validated['description'] ?? $validated['bio'] ?? null,
            'category' => $validated['category'] ?? null,
            'subcategory' => $validated['subcategory'] ?? null,
            'city' => $validated['city'] ?? $validated['location'] ?? null,
            'price' => $validated['price'] ?? $validated['pricePerHour'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'bookings_completed' => $validated['bookings_completed'] ?? 0,
            'metadata' => $metadata,
        ]);

        return response()->json($this->formatService($service), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $service = Service::find($id);

        if (! $service) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        if ((int) $service->user_id !== (int) $authUser->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'providerId' => ['sometimes', 'nullable', 'exists:providers,id'],
            'provider_id' => ['sometimes', 'nullable', 'exists:providers,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'bio' => ['sometimes', 'nullable', 'string'],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
            'subcategory' => ['sometimes', 'nullable', 'string', 'max:100'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'location' => ['sometimes', 'nullable', 'string', 'max:100'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'pricePerHour' => ['sometimes', 'numeric', 'min:0'],
            'rating' => ['sometimes', 'numeric', 'between:0,5'],
            'reviews' => ['sometimes', 'integer', 'min:0'],
            'reviews_count' => ['sometimes', 'integer', 'min:0'],
            'bookingsCompleted' => ['sometimes', 'integer', 'min:0'],
            'bookings_completed' => ['sometimes', 'integer', 'min:0'],
            'isActive' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'isPublished' => ['sometimes', 'boolean'],
            'responseTime' => ['sometimes', 'nullable', 'string', 'max:100'],
            'specialties' => ['sometimes', 'nullable', 'array'],
            'availability' => ['sometimes', 'nullable', 'array'],
            'servicePlans' => ['sometimes', 'nullable', 'array'],
            'allowCustomHourly' => ['sometimes', 'boolean'],
            'image' => ['sometimes', 'nullable', 'string'],
            'portfolio' => ['sometimes', 'nullable', 'array'],
            'whatsappNumber' => ['sometimes', 'nullable', 'string', 'max:50'],
            'email' => ['sometimes', 'nullable', 'string', 'max:255'],
            'customTerms' => ['sometimes', 'nullable', 'array'],
            'isArchived' => ['sometimes', 'boolean'],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ]);

        if (array_key_exists('providerId', $validated)) {
            $validated['provider_id'] = $validated['providerId'];
            unset($validated['providerId']);
        }

        if (array_key_exists('reviews', $validated)) {
            $validated['reviews_count'] = $validated['reviews'];
            unset($validated['reviews']);
        }

        if (array_key_exists('isActive', $validated)) {
            $validated['is_active'] = $validated['isActive'];
            unset($validated['isActive']);
        }

        if (array_key_exists('isPublished', $validated)) {
            $validated['is_active'] = $validated['isPublished'];
            unset($validated['isPublished']);
        }

        if (array_key_exists('bookingsCompleted', $validated)) {
            $validated['bookings_completed'] = $validated['bookingsCompleted'];
            unset($validated['bookingsCompleted']);
        }

        if (array_key_exists('name', $validated) && ! array_key_exists('title', $validated)) {
            $validated['title'] = $validated['name'];
        }

        if (array_key_exists('bio', $validated) && ! array_key_exists('description', $validated)) {
            $validated['description'] = $validated['bio'];
        }

        if (array_key_exists('location', $validated) && ! array_key_exists('city', $validated)) {
            $validated['city'] = $validated['location'];
        }

        if (array_key_exists('pricePerHour', $validated) && ! array_key_exists('price', $validated)) {
            $validated['price'] = $validated['pricePerHour'];
        }

        $metadata = is_array($service->metadata) ? $service->metadata : [];

        if (array_key_exists('metadata', $validated)) {
            $metadata = is_array($validated['metadata']) ? $validated['metadata'] : [];
            unset($validated['metadata']);
        }

        if (! array_key_exists('publicCode', $metadata) || ! is_string($metadata['publicCode']) || trim((string) $metadata['publicCode']) === '') {
            $metadata['publicCode'] = $this->buildPublicCode((string) $service->user_id);
        }

        foreach (['responseTime', 'specialties', 'availability', 'servicePlans', 'allowCustomHourly', 'image', 'portfolio', 'whatsappNumber', 'email', 'customTerms', 'isArchived'] as $metadataKey) {
            if (array_key_exists($metadataKey, $validated)) {
                $metadata[$metadataKey] = $validated[$metadataKey];
                unset($validated[$metadataKey]);
            }
        }

        $validated['metadata'] = $metadata;

        unset(
            $validated['name'],
            $validated['bio'],
            $validated['location'],
            $validated['pricePerHour']
        );

        $service->update($validated);

        return response()->json($this->formatService($service->fresh()));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $service = Service::find($id);

        if (! $service) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        if ((int) $service->user_id !== (int) $authUser->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $service->delete();

        return response()->json(['message' => 'Service deleted']);
    }

    private function formatService(Service $service, string $view = 'detail'): array
    {
        $service->loadMissing(['provider.user']);

        $metadata = is_array($service->metadata) ? $service->metadata : [];
        $isDetailed = $view !== 'summary';
        $provider = $service->provider ?: Provider::query()->with('user')->where('user_id', $service->user_id)->first();
        $providerRepresentative = is_array($provider?->representative) ? $provider->representative : [];
        $providerType = data_get($providerRepresentative, 'type', $provider?->legal_entity_type === 'company' ? 'company' : 'person');
        $providerType = $providerType === 'company' ? 'company' : 'person';
        $providerRepresentativeName = data_get(
            $providerRepresentative,
            'name',
            $providerType === 'company'
                ? ($provider?->business_name ?: $provider?->user?->name ?: $service->title)
                : ($provider?->user?->name ?: $provider?->business_name ?: $service->title)
        );
        $providerDocumentType = data_get($providerRepresentative, 'documentType', $providerType === 'company' ? 'RIF' : 'CI');
        $providerDocumentNumber = data_get($providerRepresentative, 'documentNumber', $provider?->identification_number);

        return [
            'id' => (string) $service->id,
            'userId' => (string) $service->user_id,
            'providerId' => $service->provider_id ? (string) $service->provider_id : null,
            'title' => $service->title,
            'name' => $service->title,
            'description' => $isDetailed ? $service->description : null,
            'bio' => $isDetailed ? $service->description : '',
            'category' => $service->category,
            'subcategory' => $service->subcategory,
            'city' => $service->city,
            'location' => $service->city,
            'price' => (float) $service->price,
            'pricePerHour' => (float) $service->price,
            'rating' => (float) $service->rating,
            'reviews' => (int) $service->reviews_count,
            'bookingsCompleted' => (int) $service->bookings_completed,
            'isActive' => (bool) $service->is_active,
            'isPublished' => (bool) $service->is_active,
            'responseTime' => $metadata['responseTime'] ?? null,
            'specialties' => $metadata['specialties'] ?? [],
            'availability' => $isDetailed ? ($metadata['availability'] ?? []) : [],
            'servicePlans' => $metadata['servicePlans'] ?? [],
            'allowCustomHourly' => (bool) ($metadata['allowCustomHourly'] ?? true),
            'image' => $metadata['image'] ?? null,
            'portfolio' => $isDetailed ? ($metadata['portfolio'] ?? []) : [],
            'whatsappNumber' => $metadata['whatsappNumber'] ?? null,
            'email' => $metadata['email'] ?? null,
            'customTerms' => $isDetailed ? ($metadata['customTerms'] ?? null) : null,
            'isArchived' => (bool) ($metadata['isArchived'] ?? false),
            'publicCode' => $metadata['publicCode'] ?? null,
            'providerBusinessName' => $provider?->business_name,
            'providerRepresentative' => [
                'type' => $providerType,
                'name' => $providerRepresentativeName,
                'documentType' => $providerDocumentType,
                'documentNumber' => $providerDocumentNumber,
            ],
            'providerRepresentativeName' => $providerRepresentativeName,
            'providerLegalEntityType' => $providerType,
            'providerIdentificationNumber' => $providerDocumentNumber,
            'metadata' => $isDetailed ? $metadata : null,
            'detailLoaded' => $isDetailed,
            'createdAt' => optional($service->created_at)?->toISOString(),
        ];
    }

    private function applyListFilters(Builder $query, Request $request): void
    {
        if ($request->filled('ids')) {
            $ids = collect(explode(',', (string) $request->query('ids')))
                ->map(fn (string $id) => trim($id))
                ->filter()
                ->values();

            if ($ids->isNotEmpty()) {
                $query->whereIn('id', $ids->all());
            }
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->query('user_id'));
        }

        if ($request->filled('provider_id')) {
            $query->where('provider_id', (int) $request->query('provider_id'));
        }

        if ($request->filled('public_code')) {
            $query->where('metadata', 'like', '%"publicCode":"'.str_replace('"', '', (string) $request->query('public_code')).'"%');
        }

        if ($request->filled('q')) {
            $search = trim((string) $request->query('q'));

            $query->where(function (Builder $builder) use ($search) {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('subcategory', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhere('metadata', 'like', "%{$search}%");
            });
        }

        if ($request->filled('city')) {
            $query->where('city', 'like', '%'.trim((string) $request->query('city')).'%');
        }

        if ($request->filled('category')) {
            $category = trim((string) $request->query('category'));
            $query->where(function (Builder $builder) use ($category) {
                $builder
                    ->where('category', 'like', "%{$category}%")
                    ->orWhere('metadata', 'like', "%{$category}%");
            });
        }

        if ($request->filled('subcategory')) {
            $subcategory = trim((string) $request->query('subcategory'));
            $query->where(function (Builder $builder) use ($subcategory) {
                $builder
                    ->where('subcategory', 'like', "%{$subcategory}%")
                    ->orWhere('category', 'like', "%{$subcategory}%")
                    ->orWhere('metadata', 'like', "%{$subcategory}%");
            });
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float) $request->query('min_price'));
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float) $request->query('max_price'));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOL));
        }

        if (filter_var($request->query('public_only', false), FILTER_VALIDATE_BOOL)) {
            $enabledCities = $this->resolveEnabledMarketplaceCities();

            if ($enabledCities === []) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn('city', $enabledCities);
            }
        }

        match ((string) $request->query('sort', 'latest')) {
            'rating' => $query->reorder()->orderByDesc('rating')->orderByDesc('reviews_count'),
            'price-low' => $query->reorder()->orderBy('price')->orderByDesc('rating'),
            'price-high' => $query->reorder()->orderByDesc('price')->orderByDesc('rating'),
            'reviews' => $query->reorder()->orderByDesc('reviews_count')->orderByDesc('rating'),
            default => $query->reorder()->latest(),
        };
    }

    private function resolveEnabledMarketplaceCities(): array
    {
        $allCities = collect(config('marketplace.all_cities', []))
            ->map(fn (mixed $city) => trim((string) $city))
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        $storedCities = MarketplaceSetting::query()->value('enabled_cities');

        $enabledCities = is_array($storedCities)
            ? collect($storedCities)
                ->map(fn (mixed $city) => trim((string) $city))
                ->filter()
                ->unique()
                ->values()
                ->all()
            : $allCities;

        if ($allCities === []) {
            return $enabledCities;
        }

        $allowedLookup = array_fill_keys($allCities, true);

        return collect($enabledCities)
            ->filter(fn (string $city) => isset($allowedLookup[$city]))
            ->values()
            ->all();
    }

    private function resolvePerPage(Request $request): ?int
    {
        $perPage = (int) $request->query('per_page', 0);

        if ($perPage <= 0) {
            return null;
        }

        return min($perPage, 100);
    }

    private function buildPublicCode(string $userId): string
    {
        $numeric = preg_replace('/\D+/', '', $userId) ?: '';

        if ($numeric !== '') {
            return 'MEM-'.str_pad(substr($numeric, -7), 7, '0', STR_PAD_LEFT);
        }

        $hash = 0;
        foreach (str_split($userId) as $char) {
            $hash = (($hash * 31) + ord($char)) % 10000000;
        }

        return 'MEM-'.str_pad((string) $hash, 7, '0', STR_PAD_LEFT);
    }
}
