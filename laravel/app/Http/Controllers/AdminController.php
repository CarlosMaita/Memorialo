<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Contract;
use App\Models\Provider;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function users(Request $request): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $users = User::query()->latest()->get()->map(fn (User $user) => [
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
        ]);

        return response()->json($users);
    }

    public function verifyProvider(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $provider = Provider::find($id);
        if (! $provider) {
            return response()->json(['error' => 'Provider not found'], 404);
        }

        $provider->update([
            'verified' => true,
            'verified_at' => now(),
            'verified_by' => (string) $request->user()->id,
        ]);

        return response()->json($this->formatProvider($provider->fresh()));
    }

    public function banProvider(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $provider = Provider::find($id);
        if (! $provider) {
            return response()->json(['error' => 'Provider not found'], 404);
        }

        $provider->update([
            'banned' => true,
            'banned_at' => now(),
            'banned_by' => (string) $request->user()->id,
            'banned_reason' => $validated['reason'],
        ]);

        return response()->json($this->formatProvider($provider->fresh()));
    }

    public function unbanProvider(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $provider = Provider::find($id);
        if (! $provider) {
            return response()->json(['error' => 'Provider not found'], 404);
        }

        $provider->update([
            'banned' => false,
            'banned_at' => null,
            'banned_by' => null,
            'banned_reason' => null,
            'unbanned_at' => now(),
            'unbanned_by' => (string) $request->user()->id,
        ]);

        return response()->json($this->formatProvider($provider->fresh()));
    }

    public function banUser(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $user = User::find($id);
        if (! $user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $user->update([
            'banned' => true,
            'banned_at' => now(),
            'banned_reason' => $validated['reason'],
        ]);

        return response()->json($this->formatUser($user->fresh()));
    }

    public function unbanUser(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $user = User::find($id);
        if (! $user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $user->update([
            'banned' => false,
            'banned_at' => null,
            'banned_reason' => null,
        ]);

        return response()->json($this->formatUser($user->fresh()));
    }

    public function archiveUser(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $user = User::find($id);
        if (! $user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        if ($user->role === 'admin') {
            return response()->json(['error' => 'Cannot archive admin users'], 400);
        }

        $user->update([
            'archived' => true,
            'archived_at' => now(),
        ]);

        return response()->json($this->formatUser($user->fresh()));
    }

    public function unarchiveUser(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $user = User::find($id);
        if (! $user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $user->update([
            'archived' => false,
            'archived_at' => null,
        ]);

        return response()->json($this->formatUser($user->fresh()));
    }

    public function deleteUser(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $user = User::find($id);
        if (! $user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        if ($user->role === 'admin') {
            return response()->json(['error' => 'Cannot delete admin users'], 400);
        }

        Service::query()->where('user_id', $user->id)->delete();
        Provider::query()->where('user_id', $user->id)->delete();

        Contract::query()->where('client_id', (string) $user->id)->delete();
        Booking::query()->where('user_id', (string) $user->id)->delete();

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted',
        ]);
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