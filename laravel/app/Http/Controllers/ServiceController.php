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
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'subcategory' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'metadata' => ['nullable', 'array'],
        ]);

        if (array_key_exists('providerId', $validated)) {
            $validated['provider_id'] = $validated['providerId'];
            unset($validated['providerId']);
        }

        $service = Service::create([
            'user_id' => $authUser->id,
            'provider_id' => $validated['provider_id'] ?? $authUser->provider_id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'] ?? null,
            'subcategory' => $validated['subcategory'] ?? null,
            'city' => $validated['city'] ?? null,
            'price' => $validated['price'] ?? 0,
            'metadata' => $validated['metadata'] ?? null,
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
            'description' => ['sometimes', 'nullable', 'string'],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
            'subcategory' => ['sometimes', 'nullable', 'string', 'max:100'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'rating' => ['sometimes', 'numeric', 'between:0,5'],
            'reviews' => ['sometimes', 'integer', 'min:0'],
            'reviews_count' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
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
        return [
            'id' => (string) $service->id,
            'userId' => (string) $service->user_id,
            'providerId' => $service->provider_id ? (string) $service->provider_id : null,
            'title' => $service->title,
            'description' => $service->description,
            'category' => $service->category,
            'subcategory' => $service->subcategory,
            'city' => $service->city,
            'price' => (float) $service->price,
            'rating' => (float) $service->rating,
            'reviews' => (int) $service->reviews_count,
            'isActive' => (bool) $service->is_active,
            'metadata' => $service->metadata,
            'createdAt' => optional($service->created_at)?->toISOString(),
        ];
    }
}
