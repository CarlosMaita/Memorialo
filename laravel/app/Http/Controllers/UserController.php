<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\NotificationDispatchService;
use App\Support\NotificationTypes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(private NotificationDispatchService $notifications)
    {
    }

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

        if (array_key_exists('is_provider', $validated) && $validated['is_provider'] && $authUser->role !== 'admin') {
            unset($validated['is_provider'], $validated['provider_id']);
        }

        $wasProvider = (bool) $user->is_provider;

        $user->update($validated);

        if (! $wasProvider && (bool) $user->fresh()->is_provider) {
            $freshUser = $user->fresh();
            $this->notifications->dispatchToUser($freshUser, NotificationTypes::PROVIDER_ROLE_ACTIVATED, [
                'channels' => ['database'],
                'title' => 'Ahora eres proveedor',
                'body' => 'Tu perfil ya puede publicar servicios y gestionar solicitudes desde Mi Negocio.',
                'ctaUrl' => '/',
                'entity' => ['type' => 'user', 'id' => (string) $freshUser->id],
                'dedupeKey' => NotificationTypes::PROVIDER_ROLE_ACTIVATED.':'.$freshUser->id,
            ]);
        }

        return response()->json($this->formatUser($user->fresh()));
    }

    public function requestProviderAccess(Request $request, string $id): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser || (string) $authUser->id !== $id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $user = User::find($id);

        if (! $user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        if ($user->is_provider) {
            return response()->json([
                'message' => 'El usuario ya tiene acceso como proveedor.',
                'status' => 'approved',
            ]);
        }

        if ($user->provider_request_status === 'pending') {
            return response()->json([
                'message' => 'Ya tienes una solicitud pendiente de aprobacion.',
                'status' => 'pending',
            ]);
        }

        $user->forceFill([
            'provider_request_status' => 'pending',
            'provider_requested_at' => now(),
        ])->save();

        return response()->json([
            'message' => 'Solicitud enviada. Un administrador debe aprobar tu acceso como proveedor.',
            'status' => 'pending',
            'user' => $this->formatUser($user->fresh()),
        ]);
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
            'providerRequestStatus' => $user->provider_request_status ?? 'none',
            'providerRequestedAt' => optional($user->provider_requested_at)?->toISOString(),
            'providerApprovedAt' => optional($user->provider_approved_at)?->toISOString(),
            'providerApprovedBy' => $user->provider_approved_by ? (string) $user->provider_approved_by : null,
            'role' => $user->role,
            'banned' => (bool) $user->banned,
            'bannedAt' => optional($user->banned_at)?->toISOString(),
            'bannedReason' => $user->banned_reason,
            'archived' => (bool) $user->archived,
            'archivedAt' => optional($user->archived_at)?->toISOString(),
        ];
    }
}
