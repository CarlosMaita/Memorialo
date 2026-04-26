<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->query('user_id');

        if (! $userId) {
            $authUser = $request->user('sanctum') ?? $request->user();
            $userId = $authUser?->id;
        }

        if (! $userId) {
            return response()->json(['error' => 'user_id is required'], 422);
        }

        $methods = PaymentMethod::query()
            ->where('user_id', (int) $userId)
            ->orderBy('created_at')
            ->get()
            ->map(fn (PaymentMethod $m) => $this->format($m));

        return response()->json($methods);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = $request->user('sanctum') ?? $request->user();

        $validated = $request->validate([
            'type' => ['required', 'string', 'max:100'],
            'instructions' => ['required', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $isActive = $validated['is_active'] ?? $validated['isActive'] ?? true;

        $method = PaymentMethod::create([
            'user_id' => $authUser->id,
            'type' => $validated['type'],
            'instructions' => $validated['instructions'],
            'is_active' => $isActive,
        ]);

        return response()->json($this->format($method), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $authUser = $request->user('sanctum') ?? $request->user();
        $method = PaymentMethod::find($id);

        if (! $method) {
            return response()->json(['error' => 'Payment method not found'], 404);
        }

        if ($method->user_id !== $authUser->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'type' => ['sometimes', 'string', 'max:100'],
            'instructions' => ['sometimes', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $payload = [];
        if (isset($validated['type'])) {
            $payload['type'] = $validated['type'];
        }
        if (isset($validated['instructions'])) {
            $payload['instructions'] = $validated['instructions'];
        }
        if (isset($validated['is_active'])) {
            $payload['is_active'] = $validated['is_active'];
        } elseif (isset($validated['isActive'])) {
            $payload['is_active'] = $validated['isActive'];
        }

        $method->update($payload);

        return response()->json($this->format($method->fresh()));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $authUser = $request->user('sanctum') ?? $request->user();
        $method = PaymentMethod::find($id);

        if (! $method) {
            return response()->json(['error' => 'Payment method not found'], 404);
        }

        if ($method->user_id !== $authUser->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $method->delete();

        return response()->json(['deleted' => true]);
    }

    private function format(PaymentMethod $method): array
    {
        return [
            'id' => $method->id,
            'userId' => (string) $method->user_id,
            'type' => $method->type,
            'instructions' => $method->instructions,
            'isActive' => (bool) $method->is_active,
            'createdAt' => optional($method->created_at)?->toISOString(),
        ];
    }
}
