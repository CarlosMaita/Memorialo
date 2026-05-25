<?php

namespace App\Http\Controllers;

use App\Models\SearchTerm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SearchTermController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
            'min_count' => ['nullable', 'integer', 'min:0'],
            'sort' => ['nullable', 'in:frequency_desc,frequency_asc,recent'],
        ]);

        $query = SearchTerm::query();

        if (! empty($validated['month'])) {
            $query->where('month_start', Carbon::createFromFormat('Y-m', $validated['month'])->startOfMonth()->toDateString());
        }

        if (array_key_exists('min_count', $validated)) {
            $query->where('search_count', '>=', (int) $validated['min_count']);
        }

        $sort = $validated['sort'] ?? 'frequency_desc';
        if ($sort === 'frequency_asc') {
            $query->orderBy('search_count');
        } elseif ($sort === 'recent') {
            $query->orderByDesc('month_start')->orderByDesc('search_count');
        } else {
            $query->orderByDesc('search_count')->orderByDesc('updated_at');
        }

        return response()->json(
            $query->get()->map(fn (SearchTerm $term) => $this->formatTerm($term))->values()
        );
    }

    public function store(Request $request): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'term' => ['required', 'string', 'max:160'],
            'month' => ['nullable', 'date_format:Y-m'],
            'searchCount' => ['nullable', 'integer', 'min:0'],
            'isManual' => ['nullable', 'boolean'],
        ]);

        $monthStart = $this->resolveMonthStart($validated['month'] ?? null);
        $normalized = $this->normalizeTerm($validated['term']);

        if ($normalized === '') {
            return response()->json(['message' => 'The term field is required.'], 422);
        }

        $searchTerm = SearchTerm::query()->firstOrNew([
            'term_normalized' => $normalized,
            'month_start' => $monthStart,
        ]);

        $wasRecentlyCreated = ! $searchTerm->exists;

        $searchTerm->term = trim($validated['term']);
        $searchTerm->search_count = array_key_exists('searchCount', $validated)
            ? (int) $validated['searchCount']
            : ($searchTerm->search_count ?? 0);
        $searchTerm->is_manual = array_key_exists('isManual', $validated)
            ? (bool) $validated['isManual']
            : true;
        $searchTerm->save();

        return response()->json($this->formatTerm($searchTerm), $wasRecentlyCreated ? 201 : 200);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $searchTerm = SearchTerm::query()->find($id);
        if (! $searchTerm) {
            return response()->json(['error' => 'Search term not found'], 404);
        }

        $validated = $request->validate([
            'term' => ['sometimes', 'string', 'max:160'],
            'month' => ['sometimes', 'nullable', 'date_format:Y-m'],
            'searchCount' => ['sometimes', 'integer', 'min:0'],
            'isManual' => ['sometimes', 'boolean'],
        ]);

        $nextTerm = array_key_exists('term', $validated) ? trim($validated['term']) : $searchTerm->term;
        $normalized = $this->normalizeTerm($nextTerm);

        if ($normalized === '') {
            return response()->json(['message' => 'The term field is required.'], 422);
        }

        $nextMonthStart = array_key_exists('month', $validated)
            ? $this->resolveMonthStart($validated['month'])
            : Carbon::parse($searchTerm->month_start)->startOfMonth()->toDateString();

        $conflict = SearchTerm::query()
            ->where('id', '!=', $searchTerm->id)
            ->where('term_normalized', $normalized)
            ->where('month_start', $nextMonthStart)
            ->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'Ya existe ese término para el mes seleccionado.',
            ], 422);
        }

        $searchTerm->term = $nextTerm;
        $searchTerm->term_normalized = $normalized;
        $searchTerm->month_start = $nextMonthStart;

        if (array_key_exists('searchCount', $validated)) {
            $searchTerm->search_count = (int) $validated['searchCount'];
        }

        if (array_key_exists('isManual', $validated)) {
            $searchTerm->is_manual = (bool) $validated['isManual'];
        }

        $searchTerm->save();

        return response()->json($this->formatTerm($searchTerm));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        if ($error = $this->authorizeAdmin($request)) {
            return $error;
        }

        $searchTerm = SearchTerm::query()->find($id);
        if (! $searchTerm) {
            return response()->json(['error' => 'Search term not found'], 404);
        }

        $searchTerm->delete();

        return response()->json(['success' => true]);
    }

    private function authorizeAdmin(Request $request): ?JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return null;
    }

    private function formatTerm(SearchTerm $term): array
    {
        return [
            'id' => (string) $term->id,
            'term' => $term->term,
            'month' => optional($term->month_start)?->format('Y-m'),
            'searchCount' => (int) $term->search_count,
            'isManual' => (bool) $term->is_manual,
            'createdAt' => optional($term->created_at)?->toISOString(),
            'updatedAt' => optional($term->updated_at)?->toISOString(),
        ];
    }

    private function resolveMonthStart(?string $month): string
    {
        if ($month) {
            return Carbon::createFromFormat('Y-m', $month)->startOfMonth()->toDateString();
        }

        return now()->startOfMonth()->toDateString();
    }

    private function normalizeTerm(?string $value): string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }

        return (string) preg_replace('/\s+/u', ' ', mb_strtolower($value));
    }
}
