<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChatApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_and_provider_can_exchange_messages_with_read_state(): void
    {
        Storage::fake('public');

        $client = User::factory()->create(['role' => 'user']);
        $provider = User::factory()->create(['role' => 'provider', 'is_provider' => true]);

        Booking::create([
            'id' => 'booking-chat-001',
            'user_id' => (string) $client->id,
            'artist_user_id' => (string) $provider->id,
            'artist_name' => 'Proveedor Demo',
            'client_name' => 'Cliente Demo',
            'status' => 'confirmed',
            'date' => now()->addDay()->toDateString(),
        ]);

        Sanctum::actingAs($client);

        $conversation = $this->postJson('/api/chat/conversations', [
            'bookingId' => 'booking-chat-001',
        ])->assertCreated();

        $conversationId = $conversation->json('id');

        $this->postJson('/api/chat/conversations/'.$conversationId.'/messages', [
            'body' => 'Hola, confirmo mi reserva para el viernes.',
            'attachments' => [[
                'imageData' => 'data:image/png;base64,'.base64_encode('fake-image-binary'),
                'fileName' => 'comprobante.png',
                'contentType' => 'image/png',
            ]],
        ])
            ->assertCreated()
            ->assertJsonPath('attachments.0.fileName', 'comprobante.png');

        Sanctum::actingAs($provider);

        $this->getJson('/api/chat/conversations')
            ->assertOk()
            ->assertJsonPath('items.0.id', $conversationId)
            ->assertJsonPath('items.0.unreadCount', 1)
            ->assertJsonPath('items.0.lastMessage.body', 'Hola, confirmo mi reserva para el viernes.');

        $this->patchJson('/api/chat/conversations/'.$conversationId.'/read')
            ->assertOk()
            ->assertJsonPath('conversationId', $conversationId)
            ->assertJsonPath('unreadCount', 0)
            ->assertJsonPath('readCount', 1);
    }

    public function test_admin_can_only_participate_after_intervention_is_requested(): void
    {
        $client = User::factory()->create(['role' => 'user']);
        $provider = User::factory()->create(['role' => 'provider', 'is_provider' => true]);
        $admin = User::factory()->create(['role' => 'admin']);

        Booking::create([
            'id' => 'booking-chat-002',
            'user_id' => (string) $client->id,
            'artist_user_id' => (string) $provider->id,
            'artist_name' => 'Proveedor Demo',
            'client_name' => 'Cliente Demo',
            'status' => 'confirmed',
            'date' => now()->addDay()->toDateString(),
        ]);

        Sanctum::actingAs($client);

        $conversation = $this->postJson('/api/chat/conversations', [
            'bookingId' => 'booking-chat-002',
        ])->assertCreated();

        $conversationId = $conversation->json('id');

        Sanctum::actingAs($admin);

        $this->postJson('/api/chat/conversations/'.$conversationId.'/messages', [
            'body' => 'Intento intervenir sin solicitud previa.',
        ])->assertForbidden();

        Sanctum::actingAs($client);

        $this->patchJson('/api/chat/conversations/'.$conversationId.'/intervention')
            ->assertOk()
            ->assertJsonPath('requiresAdminIntervention', true);

        Sanctum::actingAs($admin);

        $this->postJson('/api/chat/conversations/'.$conversationId.'/messages', [
            'body' => 'Admin aqui, voy a revisar este conflicto.',
        ])->assertCreated();
    }

    public function test_expired_chat_purge_removes_conversation_and_images(): void
    {
        Storage::fake('public');

        $client = User::factory()->create(['role' => 'user']);
        $provider = User::factory()->create(['role' => 'provider', 'is_provider' => true]);

        Booking::create([
            'id' => 'booking-chat-003',
            'user_id' => (string) $client->id,
            'artist_user_id' => (string) $provider->id,
            'artist_name' => 'Proveedor Demo',
            'client_name' => 'Cliente Demo',
            'status' => 'confirmed',
            'date' => now()->subDays(31)->toDateString(),
        ]);

        Sanctum::actingAs($client);

        $conversationId = $this->postJson('/api/chat/conversations', [
            'bookingId' => 'booking-chat-003',
        ])->assertCreated()->json('id');

        $messageResponse = $this->postJson('/api/chat/conversations/'.$conversationId.'/messages', [
            'attachments' => [[
                'imageData' => 'data:image/png;base64,'.base64_encode('expired-chat-image'),
                'fileName' => 'producto.png',
                'contentType' => 'image/png',
            ]],
        ])->assertCreated();

        $attachmentUrl = (string) $messageResponse->json('attachments.0.url');
        $storagePath = str_replace(url('/storage/'), '', $attachmentUrl);

        $this->assertTrue(Storage::disk('public')->exists($storagePath));

        Artisan::call('chat:purge-expired');

        $this->assertDatabaseMissing('chat_conversations', ['id' => $conversationId]);
        $this->assertFalse(Storage::disk('public')->exists($storagePath));
    }
}
