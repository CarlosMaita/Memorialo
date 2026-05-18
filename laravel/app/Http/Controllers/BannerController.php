<?php

namespace App\Http\Controllers;

use App\Models\Banner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    /**
     * Public endpoint: returns all visible banners ordered by their order field.
     */
    public function publicIndex(): JsonResponse
    {
        $banners = Banner::query()
            ->where('visible', true)
            ->orderBy('order')
            ->orderBy('id')
            ->get()
            ->map(fn (Banner $banner) => $this->formatBanner($banner));

        return response()->json($banners);
    }

    /**
     * Admin endpoint: returns all banners (visible and hidden).
     */
    public function index(Request $request): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $banners = Banner::query()
            ->orderBy('order')
            ->orderBy('id')
            ->get()
            ->map(fn (Banner $banner) => $this->formatBanner($banner));

        return response()->json($banners);
    }

    /**
     * Admin endpoint: create a new banner.
     */
    public function store(Request $request): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'imageUrl' => ['required', 'string', 'max:2048'],
            'link' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'visible' => ['sometimes', 'boolean'],
            'order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $banner = Banner::create([
            'title' => $validated['title'],
            'image_url' => $validated['imageUrl'],
            'link' => $validated['link'] ?? null,
            'visible' => $validated['visible'] ?? true,
            'order' => $validated['order'] ?? 0,
        ]);

        return response()->json($this->formatBanner($banner), 201);
    }

    /**
     * Admin endpoint: update an existing banner.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $banner = Banner::find($id);
        if (! $banner) {
            return response()->json(['error' => 'Banner not found'], 404);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'imageUrl' => ['sometimes', 'string', 'max:2048'],
            'link' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'visible' => ['sometimes', 'boolean'],
            'order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $fillable = [];
        if (isset($validated['title'])) {
            $fillable['title'] = $validated['title'];
        }
        if (isset($validated['imageUrl'])) {
            $fillable['image_url'] = $validated['imageUrl'];
        }
        if (array_key_exists('link', $validated)) {
            $fillable['link'] = $validated['link'];
        }
        if (isset($validated['visible'])) {
            $fillable['visible'] = $validated['visible'];
        }
        if (isset($validated['order'])) {
            $fillable['order'] = $validated['order'];
        }

        $banner->update($fillable);

        return response()->json($this->formatBanner($banner->fresh()));
    }

    /**
     * Admin endpoint: delete a banner.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $banner = Banner::find($id);
        if (! $banner) {
            return response()->json(['error' => 'Banner not found'], 404);
        }

        $banner->delete();

        return response()->json(['success' => true]);
    }

    private function formatBanner(Banner $banner): array
    {
        return [
            'id' => (string) $banner->id,
            'title' => $banner->title,
            'imageUrl' => $banner->image_url,
            'link' => $banner->link,
            'visible' => (bool) $banner->visible,
            'order' => (int) $banner->order,
            'createdAt' => optional($banner->created_at)?->toISOString(),
            'updatedAt' => optional($banner->updated_at)?->toISOString(),
        ];
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
}
