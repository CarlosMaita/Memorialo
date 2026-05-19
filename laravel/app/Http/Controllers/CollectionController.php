<?php

namespace App\Http\Controllers;

use App\Models\Provider;
use App\Models\Service;
use App\Models\ServiceCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CollectionController extends Controller
{
    public function index(): JsonResponse
    {
        $collections = ServiceCollection::query()
            ->with(['services.provider.user'])
            ->latest()
            ->get()
            ->map(fn (ServiceCollection $collection) => $this->formatCollection($collection))
            ->values();

        return response()->json($collections);
    }

    public function show(string $slug): JsonResponse
    {
        $collection = ServiceCollection::query()
            ->with(['services.provider.user'])
            ->where('slug', Str::slug(trim((string) $slug)))
            ->first();

        if (! $collection) {
            return response()->json(['error' => 'Collection not found'], 404);
        }

        return response()->json($this->formatCollection($collection));
    }

    public function store(Request $request): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $validated = $this->validatePayload($request);
        $slug = $this->resolveSlug($validated['slug'] ?? null, $validated['title']);
        $this->ensureSlugIsUnique($slug);

        $collection = ServiceCollection::query()->create([
            'title' => trim((string) $validated['title']),
            'subtitle' => $this->normalizeNullableString($validated['subtitle'] ?? null),
            'slug' => $slug,
        ]);

        $this->syncServices($collection, $validated['serviceIds'] ?? []);

        return response()->json(
            $this->formatCollection($collection->load(['services.provider.user'])),
            201
        );
    }

    public function update(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $collection = ServiceCollection::query()->find($id);

        if (! $collection) {
            return response()->json(['error' => 'Collection not found'], 404);
        }

        $validated = $this->validatePayload($request, $collection->id);
        $slug = $this->resolveSlug($validated['slug'] ?? null, $validated['title']);
        $this->ensureSlugIsUnique($slug, $collection->id);

        $collection->fill([
            'title' => trim((string) $validated['title']),
            'subtitle' => $this->normalizeNullableString($validated['subtitle'] ?? null),
            'slug' => $slug,
        ]);
        $collection->save();

        $this->syncServices($collection, $validated['serviceIds'] ?? []);

        return response()->json($this->formatCollection($collection->load(['services.provider.user'])));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $collection = ServiceCollection::query()->find($id);

        if (! $collection) {
            return response()->json(['error' => 'Collection not found'], 404);
        }

        $collection->delete();

        return response()->json(['success' => true]);
    }

    private function authorizeAdmin(Request $request): ?JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if ($authUser->role !== 'admin') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return null;
    }

    private function validatePayload(Request $request, ?int $collectionId = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'subtitle' => ['sometimes', 'nullable', 'string', 'max:320'],
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:180',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('collections', 'slug')->ignore($collectionId),
            ],
            'serviceIds' => ['sometimes', 'array'],
            'serviceIds.*' => ['integer', 'distinct', 'exists:services,id'],
        ]);
    }

    private function resolveSlug(mixed $slug, mixed $title): string
    {
        $resolved = Str::slug(trim((string) ($slug ?: $title)));

        if ($resolved === '') {
            throw ValidationException::withMessages([
                'slug' => 'The slug field format is invalid.',
            ]);
        }

        return $resolved;
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        $normalized = trim((string) $value);

        return $normalized === '' ? null : $normalized;
    }

    private function ensureSlugIsUnique(string $slug, ?int $ignoreCollectionId = null): void
    {
        $query = ServiceCollection::query()->where('slug', $slug);

        if ($ignoreCollectionId) {
            $query->where('id', '!=', $ignoreCollectionId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'slug' => 'The slug has already been taken.',
            ]);
        }
    }

    private function syncServices(ServiceCollection $collection, array $serviceIds): void
    {
        $syncData = collect($serviceIds)
            ->map(fn (mixed $serviceId) => (int) $serviceId)
            ->filter(fn (int $serviceId) => $serviceId > 0)
            ->unique()
            ->values()
            ->mapWithKeys(fn (int $serviceId, int $index) => [
                $serviceId => ['position' => $index],
            ])
            ->all();

        $collection->services()->sync($syncData);
    }

    private function formatCollection(ServiceCollection $collection): array
    {
        $collection->loadMissing(['services.provider.user']);
        $services = $collection->services->values();

        return [
            'id' => (string) $collection->id,
            'title' => $collection->title,
            'subtitle' => $collection->subtitle,
            'slug' => $collection->slug,
            'serviceIds' => $services->pluck('id')->map(fn (mixed $id) => (string) $id)->values()->all(),
            'services' => $services->map(fn (Service $service) => $this->formatServiceSummary($service))->values()->all(),
            'createdAt' => optional($collection->created_at)?->toISOString(),
            'updatedAt' => optional($collection->updated_at)?->toISOString(),
        ];
    }

    private function formatServiceSummary(Service $service): array
    {
        $service->loadMissing(['provider.user']);

        $metadata = is_array($service->metadata) ? $service->metadata : [];
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
            'description' => null,
            'bio' => '',
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
            'availability' => [],
            'servicePlans' => $metadata['servicePlans'] ?? [],
            'allowCustomHourly' => (bool) ($metadata['allowCustomHourly'] ?? true),
            'image' => $metadata['image'] ?? null,
            'portfolio' => [],
            'whatsappNumber' => $metadata['whatsappNumber'] ?? null,
            'email' => $metadata['email'] ?? null,
            'customTerms' => null,
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
            'metadata' => null,
            'detailLoaded' => false,
            'createdAt' => optional($service->created_at)?->toISOString(),
        ];
    }
}
