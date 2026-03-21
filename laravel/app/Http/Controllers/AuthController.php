<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'isProvider' => ['sometimes', 'boolean'],
            'is_provider' => ['sometimes', 'boolean'],
        ]);

        $isProvider = (bool) ($validated['isProvider'] ?? $validated['is_provider'] ?? false);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'is_provider' => $isProvider,
            'role' => $isProvider ? 'provider' : 'user',
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $this->formatUser($user),
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales no son validas.'],
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $this->formatUser($user),
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user() ? $this->formatUser($request->user()) : null,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Sesion cerrada correctamente.',
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
            'role' => $user->role,
            'banned' => (bool) $user->banned,
            'bannedAt' => optional($user->banned_at)?->toISOString(),
            'bannedReason' => $user->banned_reason,
            'archived' => (bool) $user->archived,
            'archivedAt' => optional($user->archived_at)?->toISOString(),
        ];
    }
}
