<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Review::query()->latest();

        $artistId = $request->query('artistId', $request->query('artist_id'));
        $userId = $request->query('userId', $request->query('user_id'));

        if ($artistId) {
            $query->where('artist_id', $artistId);
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $reviews = $query->get()->map(fn (Review $review) => $this->formatReview($review));

        return response()->json($reviews);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json([
                'error' => 'Unauthorized. You must be logged in to create a review.',
            ], 401);
        }

        $validated = $request->validate([
            'contractId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contract_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'bookingId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'booking_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'artistId' => ['required', 'exists:services,id'],
            'artist_id' => ['sometimes', 'exists:services,id'],
            'userName' => ['sometimes', 'nullable', 'string', 'max:255'],
            'user_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'userAvatar' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'user_avatar' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['required', 'string', 'min:10'],
        ]);

        if (array_key_exists('contractId', $validated)) {
            $validated['contract_id'] = $validated['contractId'];
            unset($validated['contractId']);
        }

        if (array_key_exists('bookingId', $validated)) {
            $validated['booking_id'] = $validated['bookingId'];
            unset($validated['bookingId']);
        }

        if (array_key_exists('artistId', $validated)) {
            $validated['artist_id'] = $validated['artistId'];
            unset($validated['artistId']);
        }

        if (array_key_exists('userName', $validated)) {
            $validated['user_name'] = $validated['userName'];
            unset($validated['userName']);
        }

        if (array_key_exists('userAvatar', $validated)) {
            $validated['user_avatar'] = $validated['userAvatar'];
            unset($validated['userAvatar']);
        }

        $review = Review::create([
            'contract_id' => $validated['contract_id'] ?? null,
            'booking_id' => $validated['booking_id'] ?? null,
            'artist_id' => $validated['artist_id'],
            'user_id' => $authUser->id,
            'user_name' => $validated['user_name'] ?? $authUser->name,
            'user_avatar' => $validated['user_avatar'] ?? $authUser->avatar,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
        ]);

        $this->syncServiceRating($review->artist_id);

        return response()->json($this->formatReview($review->fresh()), 201);
    }

    private function syncServiceRating(int $serviceId): void
    {
        $stats = Review::query()
            ->where('artist_id', $serviceId)
            ->selectRaw('COUNT(*) as reviews_count, AVG(rating) as average_rating')
            ->first();

        Service::query()
            ->where('id', $serviceId)
            ->update([
                'reviews_count' => (int) ($stats?->reviews_count ?? 0),
                'rating' => (float) round((float) ($stats?->average_rating ?? 5), 2),
            ]);
    }

    private function formatReview(Review $review): array
    {
        return [
            'id' => (string) $review->id,
            'contractId' => $review->contract_id,
            'bookingId' => $review->booking_id,
            'artistId' => (string) $review->artist_id,
            'userId' => (string) $review->user_id,
            'userName' => $review->user_name,
            'userAvatar' => $review->user_avatar,
            'rating' => (int) $review->rating,
            'comment' => $review->comment,
            'createdAt' => optional($review->created_at)?->toISOString(),
        ];
    }
}
