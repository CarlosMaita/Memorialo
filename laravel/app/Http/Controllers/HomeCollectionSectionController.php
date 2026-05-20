<?php

namespace App\Http\Controllers;

use App\Models\HomeCollectionSection;
use App\Models\Provider;
use App\Models\Service;
use App\Models\ServiceCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomeCollectionSectionController extends Controller
{
    /**
     * Public endpoint: returns visible sections ordered by sort_order,
     * with their associated collection and services.
     */
    public function index(): JsonResponse
    {
        $sections = HomeCollectionSection::query()
            ->with(['collection.services.provider.user'])
            ->where('visible', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (HomeCollectionSection $section) => $this->formatSection($section))
            ->values();

        return response()->json($sections);
    }

    /**
     * Admin endpoint: returns all sections (visible + hidden) ordered by sort_order.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $sections = HomeCollectionSection::query()
            ->with(['collection'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (HomeCollectionSection $section) => $this->formatSection($section))
            ->values();

        return response()->json($sections);
    }

    public function store(Request $request): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'subtitle' => ['sometimes', 'nullable', 'string', 'max:320'],
            'collectionId' => ['required', 'integer', 'exists:collections,id'],
            'sortOrder' => ['sometimes', 'integer', 'min:0', 'max:9999'],
            'visible' => ['sometimes', 'boolean'],
        ]);

        $section = HomeCollectionSection::query()->create([
            'title' => trim((string) $validated['title']),
            'subtitle' => $this->normalizeNullableString($validated['subtitle'] ?? null),
            'collection_id' => (int) $validated['collectionId'],
            'sort_order' => (int) ($validated['sortOrder'] ?? 0),
            'visible' => (bool) ($validated['visible'] ?? true),
        ]);

        return response()->json(
            $this->formatSection($section->load('collection.services.provider.user')),
            201
        );
    }

    public function update(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $section = HomeCollectionSection::query()->find($id);

        if (! $section) {
            return response()->json(['error' => 'Section not found'], 404);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'subtitle' => ['sometimes', 'nullable', 'string', 'max:320'],
            'collectionId' => ['required', 'integer', 'exists:collections,id'],
            'sortOrder' => ['sometimes', 'integer', 'min:0', 'max:9999'],
            'visible' => ['sometimes', 'boolean'],
        ]);

        $section->fill([
            'title' => trim((string) $validated['title']),
            'subtitle' => $this->normalizeNullableString($validated['subtitle'] ?? null),
            'collection_id' => (int) $validated['collectionId'],
            'sort_order' => (int) ($validated['sortOrder'] ?? $section->sort_order),
            'visible' => isset($validated['visible']) ? (bool) $validated['visible'] : $section->visible,
        ]);
        $section->save();

        return response()->json($this->formatSection($section->load('collection.services.provider.user')));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $section = HomeCollectionSection::query()->find($id);

        if (! $section) {
            return response()->json(['error' => 'Section not found'], 404);
        }

        $section->delete();

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

    private function normalizeNullableString(mixed $value): ?string
    {
        $normalized = trim((string) $value);

        return $normalized === '' ? null : $normalized;
    }

    private function formatSection(HomeCollectionSection $section): array
    {
        $collection = $section->relationLoaded('collection') ? $section->collection : null;

        return [
            'id' => (string) $section->id,
            'title' => $section->title,
            'subtitle' => $section->subtitle,
            'collectionId' => (string) $section->collection_id,
            'sortOrder' => $section->sort_order,
            'visible' => $section->visible,
            'collection' => $collection ? $this->formatCollectionSummary($collection) : null,
            'createdAt' => optional($section->created_at)?->toISOString(),
            'updatedAt' => optional($section->updated_at)?->toISOString(),
        ];
    }

    private function formatCollectionSummary(ServiceCollection $collection): array
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
