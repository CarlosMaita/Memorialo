<?php

namespace App\Http\Controllers;

use App\Models\Agreement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgreementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $contractId = $request->query('contract_id');

        if (! $contractId) {
            return response()->json(['error' => 'contract_id is required'], 422);
        }

        $agreements = Agreement::query()
            ->where('contract_id', $contractId)
            ->orderBy('created_at')
            ->get()
            ->map(fn (Agreement $a) => $this->format($a));

        return response()->json($agreements);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'contractId' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contract_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:2000'],
        ]);

        $contractId = $validated['contract_id'] ?? $validated['contractId'] ?? null;

        if (! $contractId) {
            return response()->json(['error' => 'contract_id is required'], 422);
        }

        $agreement = Agreement::create([
            'contract_id' => $contractId,
            'description' => $validated['description'],
        ]);

        return response()->json($this->format($agreement), 201);
    }

    public function destroy(string $id): JsonResponse
    {
        $agreement = Agreement::find($id);

        if (! $agreement) {
            return response()->json(['error' => 'Agreement not found'], 404);
        }

        $agreement->delete();

        return response()->json(['deleted' => true]);
    }

    private function format(Agreement $agreement): array
    {
        return [
            'id' => $agreement->id,
            'contractId' => $agreement->contract_id,
            'description' => $agreement->description,
            'createdAt' => optional($agreement->created_at)?->toISOString(),
        ];
    }
}
