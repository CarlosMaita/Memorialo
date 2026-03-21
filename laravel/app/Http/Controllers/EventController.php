<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(): JsonResponse
    {
        $events = Event::query()->latest('updated_at')->get()->map(fn (Event $event) => $this->formatEvent($event));

        return response()->json($events);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'eventDate' => ['sometimes', 'nullable', 'string', 'max:255'],
            'event_date' => ['sometimes', 'nullable', 'string', 'max:255'],
            'eventType' => ['sometimes', 'nullable', 'string', 'max:255'],
            'event_type' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'budget' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'status' => ['sometimes', 'nullable', 'string', 'max:50'],
            'contractIds' => ['sometimes', 'nullable', 'array'],
            'contract_ids' => ['sometimes', 'nullable', 'array'],
            'archived' => ['sometimes', 'boolean'],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ]);

        $payload = $this->normalizePayload($validated);

        $event = Event::create([
            'id' => $payload['id'] ?? ('event-'.now()->timestamp),
            'user_id' => (string) $authUser->id,
            'name' => $payload['name'],
            'description' => $payload['description'] ?? null,
            'event_date' => $payload['event_date'] ?? null,
            'event_type' => $payload['event_type'] ?? null,
            'location' => $payload['location'] ?? null,
            'budget' => $payload['budget'] ?? null,
            'status' => $payload['status'] ?? 'planning',
            'contract_ids' => $payload['contract_ids'] ?? [],
            'archived' => $payload['archived'] ?? false,
            'metadata' => $payload['metadata'] ?? null,
        ]);

        return response()->json($this->formatEvent($event), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $event = Event::find($id);

        if (! $event) {
            return response()->json(['error' => 'Event not found'], 404);
        }

        if ($event->user_id !== (string) $authUser->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'eventDate' => ['sometimes', 'nullable', 'string', 'max:255'],
            'event_date' => ['sometimes', 'nullable', 'string', 'max:255'],
            'eventType' => ['sometimes', 'nullable', 'string', 'max:255'],
            'event_type' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'budget' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'status' => ['sometimes', 'nullable', 'string', 'max:50'],
            'contractIds' => ['sometimes', 'nullable', 'array'],
            'contract_ids' => ['sometimes', 'nullable', 'array'],
            'archived' => ['sometimes', 'boolean'],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ]);

        $event->update($this->normalizePayload($validated));

        return response()->json($this->formatEvent($event->fresh()));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $event = Event::find($id);

        if (! $event) {
            return response()->json(['error' => 'Event not found'], 404);
        }

        if ($event->user_id !== (string) $authUser->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $event->delete();

        return response()->json(['message' => 'Event deleted']);
    }

    private function normalizePayload(array $payload): array
    {
        if (array_key_exists('eventDate', $payload)) {
            $payload['event_date'] = $payload['eventDate'];
            unset($payload['eventDate']);
        }

        if (array_key_exists('eventType', $payload)) {
            $payload['event_type'] = $payload['eventType'];
            unset($payload['eventType']);
        }

        if (array_key_exists('contractIds', $payload)) {
            $payload['contract_ids'] = $payload['contractIds'];
            unset($payload['contractIds']);
        }

        return $payload;
    }

    private function formatEvent(Event $event): array
    {
        return [
            'id' => (string) $event->id,
            'userId' => $event->user_id,
            'name' => $event->name,
            'description' => $event->description,
            'eventDate' => $event->event_date,
            'eventType' => $event->event_type,
            'location' => $event->location,
            'budget' => $event->budget !== null ? (float) $event->budget : null,
            'status' => $event->status,
            'contractIds' => $event->contract_ids ?? [],
            'archived' => (bool) $event->archived,
            'metadata' => $event->metadata,
            'createdAt' => optional($event->created_at)?->toISOString(),
            'updatedAt' => optional($event->updated_at)?->toISOString(),
        ];
    }
}