<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(): JsonResponse
    {
        $services = Service::query()->latest()->get()->map(fn (Service $service) => $this->formatService($service));

        return response()->json($services);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
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
            'provider_id' => $validated['provider_id'] ?? $authUser->provider_id,
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

    private function formatService(Service $service): array
    {
        $metadata = is_array($service->metadata) ? $service->metadata : [];

        return [
            'id' => (string) $service->id,
            'userId' => (string) $service->user_id,
            'providerId' => $service->provider_id ? (string) $service->provider_id : null,
            'title' => $service->title,
            'name' => $service->title,
            'description' => $service->description,
            'bio' => $service->description,
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
            'availability' => $metadata['availability'] ?? null,
            'servicePlans' => $metadata['servicePlans'] ?? [],
            'allowCustomHourly' => (bool) ($metadata['allowCustomHourly'] ?? true),
            'image' => $metadata['image'] ?? null,
            'portfolio' => $metadata['portfolio'] ?? [],
            'whatsappNumber' => $metadata['whatsappNumber'] ?? null,
            'email' => $metadata['email'] ?? null,
            'customTerms' => $metadata['customTerms'] ?? null,
            'isArchived' => (bool) ($metadata['isArchived'] ?? false),
            'publicCode' => $metadata['publicCode'] ?? null,
            'metadata' => $metadata,
            'createdAt' => optional($service->created_at)?->toISOString(),
        ];
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
