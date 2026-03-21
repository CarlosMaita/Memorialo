<?php

namespace App\Http\Controllers;

use App\Models\Provider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProviderController extends Controller
{
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

        if (Provider::where('user_id', $authUser->id)->exists()) {
            return response()->json(['error' => 'Provider already exists for user'], 409);
        }

        $validated = $request->validate([
            'businessName' => ['nullable', 'string', 'max:255'],
            'business_name' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
        ]);

        $businessName = $validated['businessName'] ?? $validated['business_name'] ?? $authUser->name;

        $provider = Provider::create([
            'user_id' => $authUser->id,
            'business_name' => $businessName,
            'category' => $validated['category'] ?? 'general',
            'description' => $validated['description'] ?? '',
            'verified' => false,
            'services' => [],
        ]);

        $authUser->update([
            'is_provider' => true,
            'provider_id' => $provider->id,
            'role' => $authUser->role === 'admin' ? 'admin' : 'provider',
        ]);

        return response()->json($this->formatProvider($provider), 201);
    }

    public function showByUser(string $userId): JsonResponse
    {
        $provider = Provider::query()->where('user_id', $userId)->first();

        if ($provider) {
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

        $provider->update($validated);

        return response()->json($this->formatProvider($provider->fresh()));
    }

    private function formatProvider(Provider $provider): array
    {
        return [
            'id' => (string) $provider->id,
            'userId' => (string) $provider->user_id,
            'businessName' => $provider->business_name,
            'category' => $provider->category,
            'description' => $provider->description,
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
