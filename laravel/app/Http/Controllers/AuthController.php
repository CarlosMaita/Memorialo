<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\NotificationDispatchService;
use App\Support\NotificationTypes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Throwable;

class AuthController extends Controller
{
    public function __construct(private NotificationDispatchService $notifications)
    {
    }

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

        $this->notifications->dispatchToUser($user, NotificationTypes::WELCOME, [
            'channels' => ['mail'],
            'title' => 'Bienvenido a Memorialo',
            'body' => 'Tu cuenta fue creada correctamente. Ya puedes explorar servicios y gestionar tus reservas.',
            'mailSubject' => 'Bienvenido a Memorialo',
            'mailBody' => "Hola {$user->name},\n\nTu cuenta fue creada correctamente en Memorialo.\n\nYa puedes explorar servicios, reservar y administrar tu perfil.\n",
            'dedupeKey' => NotificationTypes::WELCOME.':'.$user->id,
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

    public function googleRedirect(): RedirectResponse
    {
        return $this->googleProvider()->redirect();
    }

    public function googleCallback(): RedirectResponse
    {
        try {
            $googleUser = $this->googleProvider()->user();
        } catch (Throwable $exception) {
            report($exception);

            return redirect()->away($this->buildFrontendRedirectUrl([
                'auth_error' => 'No se pudo completar el inicio de sesion con Google.',
            ]));
        }

        $email = $googleUser->getEmail();

        if (! $email) {
            return redirect()->away($this->buildFrontendRedirectUrl([
                'auth_error' => 'Google no devolvio un correo electronico valido.',
            ]));
        }

        $user = User::query()
            ->where('google_id', $googleUser->getId())
            ->orWhere('email', $email)
            ->first();

        $isNewUser = false;

        if (! $user) {
            $isNewUser = true;

            $user = User::create([
                'name' => $googleUser->getName() ?: 'Usuario Google',
                'email' => $email,
                'google_id' => $googleUser->getId(),
                'password' => Hash::make(Str::random(40)),
                'avatar' => $googleUser->getAvatar(),
                'role' => 'user',
                'is_provider' => false,
                'email_verified_at' => now(),
            ]);
        } else {
            $user->forceFill([
                'google_id' => $googleUser->getId(),
                'avatar' => $user->avatar ?: $googleUser->getAvatar(),
                'email_verified_at' => $user->email_verified_at ?: now(),
                'name' => $user->name ?: ($googleUser->getName() ?: $user->name),
            ])->save();
        }

        if ($user->banned) {
            return redirect()->away($this->buildFrontendRedirectUrl([
                'auth_error' => 'Tu cuenta esta suspendida. Contacta al administrador.',
            ]));
        }

        if ($user->archived) {
            return redirect()->away($this->buildFrontendRedirectUrl([
                'auth_error' => 'Tu cuenta esta archivada. Contacta al administrador.',
            ]));
        }

        if ($isNewUser) {
            $this->notifications->dispatchToUser($user, NotificationTypes::WELCOME, [
                'channels' => ['mail'],
                'title' => 'Bienvenido a Memorialo',
                'body' => 'Tu cuenta con Google fue creada correctamente. Ya puedes explorar servicios y gestionar tus reservas.',
                'mailSubject' => 'Bienvenido a Memorialo',
                'mailBody' => "Hola {$user->name},\n\nTu cuenta con Google fue creada correctamente en Memorialo.\n\nYa puedes explorar servicios, reservar y administrar tu perfil.\n",
                'dedupeKey' => NotificationTypes::WELCOME.':google:'.$user->id,
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return redirect()->away($this->buildFrontendRedirectUrl([
            'auth_token' => $token,
        ]));
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

    private function buildFrontendRedirectUrl(array $query = []): string
    {
        $baseUrl = rtrim(env('FRONTEND_URL', 'http://127.0.0.1:5173'), '/');

        if ($query === []) {
            return $baseUrl;
        }

        return $baseUrl.'?'.http_build_query($query);
    }

    private function googleProvider()
    {
        /** @var \Laravel\Socialite\Two\GoogleProvider $driver */
        $driver = Socialite::driver('google');

        return $driver->stateless();
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
