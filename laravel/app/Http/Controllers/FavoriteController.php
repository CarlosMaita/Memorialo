<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $favorites = Favorite::query()
            ->where('user_id', $authUser->id)
            ->latest()
            ->get();

        return response()->json([
            'serviceIds' => $favorites->pluck('service_id')->map(fn ($id) => (string) $id)->values(),
            'items' => $favorites->map(fn (Favorite $favorite) => [
                'id' => (string) $favorite->id,
                'serviceId' => (string) $favorite->service_id,
                'createdAt' => optional($favorite->created_at)?->toISOString(),
            ])->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'serviceId' => ['required_without:service_id', 'exists:services,id'],
            'service_id' => ['required_without:serviceId', 'exists:services,id'],
        ]);

        $serviceId = $validated['service_id'] ?? $validated['serviceId'];

        $favorite = Favorite::firstOrCreate([
            'user_id' => $authUser->id,
            'service_id' => $serviceId,
        ]);

        return response()->json([
            'id' => (string) $favorite->id,
            'serviceId' => (string) $favorite->service_id,
            'createdAt' => optional($favorite->created_at)?->toISOString(),
            'created' => $favorite->wasRecentlyCreated,
        ], $favorite->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Request $request, string $serviceId): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $removed = Favorite::query()
            ->where('user_id', $authUser->id)
            ->where('service_id', $serviceId)
            ->delete();

        return response()->json([
            'removed' => $removed > 0,
        ]);
    }
}
