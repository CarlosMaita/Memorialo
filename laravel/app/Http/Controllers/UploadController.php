<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function image(Request $request): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'imageData' => ['required', 'string'],
            'fileName' => ['required', 'string', 'max:255'],
            'contentType' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        $rawData = $validated['imageData'];

        if (str_contains($rawData, ',')) {
            [, $rawData] = explode(',', $rawData, 2);
        }

        $binary = base64_decode($rawData, true);

        if ($binary === false) {
            return response()->json(['error' => 'Invalid image data'], 400);
        }

        $sizeInBytes = strlen($binary);
        $maxSize = 5 * 1024 * 1024;

        if ($sizeInBytes > $maxSize) {
            return response()->json(['error' => 'Image size exceeds 5MB'], 400);
        }

        $contentType = strtolower((string) ($validated['contentType'] ?? ''));
        $extension = $this->resolveExtension($validated['fileName'], $contentType);

        if (! in_array($extension, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) {
            return response()->json(['error' => 'Unsupported image type'], 400);
        }

        $relativePath = sprintf(
            'service-images/%s/%s.%s',
            $authUser->id,
            Str::uuid()->toString(),
            $extension
        );

        Storage::disk('public')->put($relativePath, $binary, ['visibility' => 'public']);

        return response()->json([
            'url' => asset('storage/'.$relativePath),
            'path' => $relativePath,
        ]);
    }

    private function resolveExtension(string $fileName, string $contentType): string
    {
        $fromName = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        if ($fromName !== '') {
            return $fromName;
        }

        return match ($contentType) {
            'image/jpeg', 'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => 'jpg',
        };
    }
}
