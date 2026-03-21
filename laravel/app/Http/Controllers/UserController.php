<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function show(string $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        if ($user->banned) {
            return response()->json([
                'error' => 'User is banned',
                'reason' => $user->banned_reason,
            ], 403);
        }

        if ($user->archived) {
            return response()->json([
                'error' => 'User account is archived',
            ], 403);
        }

        return response()->json($this->formatUser($user));
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser || (string) $authUser->id !== $id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $user = User::find($id);

        if (! $user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'whatsappNumber' => ['sometimes', 'nullable', 'string', 'max:50'],
            'whatsapp_number' => ['sometimes', 'nullable', 'string', 'max:50'],
            'avatar' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'isProvider' => ['sometimes', 'boolean'],
            'is_provider' => ['sometimes', 'boolean'],
            'providerId' => ['sometimes', 'nullable', 'exists:providers,id'],
            'provider_id' => ['sometimes', 'nullable', 'exists:providers,id'],
        ]);

        if (array_key_exists('whatsappNumber', $validated)) {
            $validated['whatsapp_number'] = $validated['whatsappNumber'];
            unset($validated['whatsappNumber']);
        }

        if (array_key_exists('isProvider', $validated)) {
            $validated['is_provider'] = $validated['isProvider'];
            unset($validated['isProvider']);
        }

        if (array_key_exists('providerId', $validated)) {
            $validated['provider_id'] = $validated['providerId'];
            unset($validated['providerId']);
        }

        if (array_key_exists('is_provider', $validated) && ! $validated['is_provider']) {
            $validated['provider_id'] = null;
        }

        if (array_key_exists('is_provider', $validated) && $validated['is_provider']) {
            $validated['role'] = $user->role === 'admin' ? 'admin' : 'provider';
        }

        $user->update($validated);

        return response()->json($this->formatUser($user->fresh()));
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'phone' => $user->phone,
            'whatsappNumber' => $user->whatsapp_number,
            'createdAt' => optional($user->created_at)?->toISOString(),
            'avatar' => $user->avatar,
            'isProvider' => (bool) $user->is_provider,
            'providerId' => $user->provider_id ? (string) $user->provider_id : null,
            'role' => $user->role,
            'banned' => (bool) $user->banned,
            'bannedAt' => optional($user->banned_at)?->toISOString(),
            'bannedReason' => $user->banned_reason,
            'archived' => (bool) $user->archived,
            'archivedAt' => optional($user->archived_at)?->toISOString(),
        ];
    }
}
