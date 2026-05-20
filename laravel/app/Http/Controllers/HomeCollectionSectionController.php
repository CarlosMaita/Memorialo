<?php

namespace App\Http\Controllers;

use App\Models\HomeCollectionSection;
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
        $collection->loadMissing('services');
        $services = $collection->services->values();

        return [
            'id' => (string) $collection->id,
            'title' => $collection->title,
            'subtitle' => $collection->subtitle,
            'slug' => $collection->slug,
            'serviceIds' => $services->pluck('id')->map(fn (mixed $id) => (string) $id)->values()->all(),
        ];
    }
}
