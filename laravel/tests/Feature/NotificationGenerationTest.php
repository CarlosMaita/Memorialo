<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Booking;
use App\Models\ChatConversation;
use App\Models\MarketplaceSetting;
use App\Models\Provider;
use App\Models\Service;
use App\Models\User;
use App\Services\NotificationDispatchService;
use App\Support\NotificationTypes;
use Carbon\Carbon;
use Closure;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_booking_creation_generates_provider_notification_records(): void
    {
        Mail::fake();

        $providerUser = User::factory()->create([
            'role' => 'provider',
            'is_provider' => true,
        ]);

        $provider = Provider::create([
            'user_id' => $providerUser->id,
            'business_name' => 'Provider Test',
            'category' => 'music',
            'description' => 'Provider description',
            'services' => [],
        ]);

        $service = Service::create([
            'user_id' => $providerUser->id,
            'provider_id' => $provider->id,
            'title' => 'Mariachi',
            'description' => 'Show',
            'category' => 'music',
            'city' => 'CDMX',
            'price' => 2000,
            'is_active' => true,
        ]);

        $client = User::factory()->create();
        Sanctum::actingAs($client);

        $this->postJson('/api/bookings', [
            'id' => 'booking-notif-1',
            'artistId' => (string) $service->id,
            'artistUserId' => (string) $providerUser->id,
            'artistName' => 'Mariachi',
            'clientName' => 'Cliente Test',
            'clientEmail' => 'cliente@example.com',
            'date' => '2026-06-10',
            'location' => 'CDMX',
            'status' => 'pending',
            'contractId' => 'contract-notif-1',
        ])->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $providerUser->id,
        ]);

        $this->assertDatabaseHas('notification_deliveries', [
            'recipient_user_id' => $providerUser->id,
            'notification_type' => NotificationTypes::SERVICE_REQUEST_CREATED,
            'channel' => 'database',
            'status' => 'sent',
        ]);

        $this->assertDatabaseHas('notification_deliveries', [
            'recipient_user_id' => $providerUser->id,
            'notification_type' => NotificationTypes::SERVICE_REQUEST_CREATED,
            'channel' => 'mail',
            'status' => 'sent',
        ]);

        $providerNotification = $providerUser->notifications()
            ->where('type', NotificationTypes::SERVICE_REQUEST_CREATED)
            ->first();

        $this->assertSame('/mi-negocio/negociacion/contract-notif-1', $providerNotification?->data['ctaUrl'] ?? null);
    }

    public function test_contract_active_and_completed_generate_client_notifications(): void
    {
        Mail::fake();

        $providerUser = User::factory()->create([
            'role' => 'provider',
            'is_provider' => true,
        ]);
        $client = User::factory()->create();

        $contract = Contract::create([
            'id' => 'contract-notif-1',
            'artist_id' => '1',
            'artist_user_id' => (string) $providerUser->id,
            'artist_name' => 'Proveedor Test',
            'client_id' => (string) $client->id,
            'client_name' => $client->name,
            'client_email' => $client->email,
            'status' => 'pending_client',
            'terms' => ['price' => 5000],
        ]);

        Sanctum::actingAs($providerUser);

        $this->putJson('/api/contracts/'.$contract->id, [
            'status' => 'active',
        ])->assertOk();

        $this->assertDatabaseHas('notification_deliveries', [
            'recipient_user_id' => $client->id,
            'notification_type' => NotificationTypes::CONTRACT_APPROVED,
            'channel' => 'database',
            'status' => 'sent',
        ]);

        $clientContractApprovedNotification = $client->notifications()
            ->where('type', NotificationTypes::CONTRACT_APPROVED)
            ->first();

        $this->assertSame('/me/reservas?contractId=contract-notif-1', $clientContractApprovedNotification?->data['ctaUrl'] ?? null);

        $this->putJson('/api/contracts/'.$contract->id, [
            'status' => 'completed',
        ])->assertOk();

        $this->assertDatabaseHas('notification_deliveries', [
            'recipient_user_id' => $client->id,
            'notification_type' => NotificationTypes::REVIEW_REQUESTED,
            'channel' => 'database',
            'status' => 'sent',
        ]);
    }

    public function test_client_signing_contract_generates_provider_notification(): void
    {
        Mail::fake();

        $providerUser = User::factory()->create([
            'role' => 'provider',
            'is_provider' => true,
        ]);
        $client = User::factory()->create();

        $contract = Contract::create([
            'id' => 'contract-client-signed-1',
            'artist_id' => '1',
            'artist_user_id' => (string) $providerUser->id,
            'artist_name' => 'Proveedor Test',
            'client_id' => (string) $client->id,
            'client_name' => $client->name,
            'client_email' => $client->email,
            'status' => 'pending_client',
            'terms' => ['price' => 5000],
        ]);

        Sanctum::actingAs($client);

        $this->putJson('/api/contracts/'.$contract->id, [
            'status' => 'active',
            'clientSignature' => [
                'signedBy' => $client->name,
                'signedAt' => now()->toISOString(),
            ],
        ])->assertOk();

        $this->assertDatabaseHas('notification_deliveries', [
            'recipient_user_id' => $providerUser->id,
            'notification_type' => NotificationTypes::CONTRACT_CLIENT_SIGNED,
            'channel' => 'database',
            'status' => 'sent',
        ]);

        $providerNotification = $providerUser->notifications()
            ->where('type', NotificationTypes::CONTRACT_CLIENT_SIGNED)
            ->first();

        $this->assertNotNull($providerNotification);
        $this->assertStringContainsString($contract->id, $providerNotification->data['body'] ?? '');
        $this->assertSame('/mi-negocio/negociaciones', $providerNotification->data['ctaUrl'] ?? null);
    }

    public function test_contract_signing_and_payment_status_changes_are_recorded_in_chat(): void
    {
        Mail::fake();

        $providerUser = User::factory()->create([
            'role' => 'provider',
            'is_provider' => true,
        ]);
        $client = User::factory()->create();

        $provider = Provider::create([
            'user_id' => $providerUser->id,
            'business_name' => 'Provider Test',
            'category' => 'music',
            'description' => 'Provider description',
            'services' => [],
        ]);

        $service = Service::create([
            'user_id' => $providerUser->id,
            'provider_id' => $provider->id,
            'title' => 'Mariachi',
            'description' => 'Show',
            'category' => 'music',
            'city' => 'CDMX',
            'price' => 2000,
            'is_active' => true,
            'metadata' => ['requiresDeposit' => true],
        ]);

        Booking::create([
            'id' => 'booking-chat-audit-1',
            'user_id' => (string) $client->id,
            'artist_user_id' => (string) $providerUser->id,
            'artist_id' => (string) $service->id,
            'artist_name' => 'Proveedor Test',
            'client_name' => $client->name,
            'status' => 'pending',
            'date' => now()->addDays(10)->toDateString(),
        ]);

        $contract = Contract::create([
            'id' => 'contract-chat-audit-1',
            'booking_id' => 'booking-chat-audit-1',
            'artist_id' => (string) $service->id,
            'artist_user_id' => (string) $providerUser->id,
            'artist_name' => 'Proveedor Test',
            'client_id' => (string) $client->id,
            'client_name' => $client->name,
            'client_email' => $client->email,
            'status' => 'pending_client',
            'artist_signature' => [
                'signedBy' => 'Proveedor Test',
                'signedAt' => now()->subHour()->toISOString(),
            ],
            'terms' => ['price' => 5000],
        ]);

        Sanctum::actingAs($client);
        $this->putJson('/api/contracts/'.$contract->id, [
            'status' => 'active',
            'clientSignature' => [
                'signedBy' => $client->name,
                'signedAt' => now()->toISOString(),
            ],
        ])->assertOk();

        $this->putJson('/api/contracts/'.$contract->id, [
            'status' => 'pagado',
            'paymentProofUrl' => 'https://example.test/proof.png',
        ])->assertOk();

        Sanctum::actingAs($providerUser);
        $this->putJson('/api/contracts/'.$contract->id, [
            'status' => 'reservado',
        ])->assertOk();

        $conversation = ChatConversation::query()
            ->where('booking_id', 'booking-chat-audit-1')
            ->first();

        $this->assertNotNull($conversation);

        $messages = \App\Models\ChatMessage::query()
            ->where('conversation_id', $conversation->id)
            ->orderBy('created_at')
            ->pluck('body')
            ->all();

        $this->assertContains('El cliente ha firmado el contrato [CONTRACT:contract-chat-audit-1].', $messages);
        $this->assertContains('El cliente ha pagado el depósito del contrato [CONTRACT:contract-chat-audit-1].', $messages);
        $this->assertContains('El proveedor ha confirmado el pago del contrato [CONTRACT:contract-chat-audit-1].', $messages);
    }

    public function test_review_creation_generates_provider_in_app_notification(): void
    {
        $providerUser = User::factory()->create([
            'role' => 'provider',
            'is_provider' => true,
        ]);

        $provider = Provider::create([
            'user_id' => $providerUser->id,
            'business_name' => 'Provider Test',
            'category' => 'music',
            'description' => 'Provider description',
            'services' => [],
        ]);

        $service = Service::create([
            'user_id' => $providerUser->id,
            'provider_id' => $provider->id,
            'title' => 'Mariachi',
            'description' => 'Show',
            'category' => 'music',
            'city' => 'CDMX',
            'price' => 2000,
            'is_active' => true,
        ]);

        $client = User::factory()->create();
        Sanctum::actingAs($client);

        $this->postJson('/api/reviews', [
            'bookingId' => 'booking-review-1',
            'contractId' => 'contract-review-1',
            'artistId' => $service->id,
            'rating' => 5,
            'comment' => 'Excelente servicio y puntualidad total.',
        ])->assertCreated();

        $this->assertDatabaseHas('notification_deliveries', [
            'recipient_user_id' => $providerUser->id,
            'notification_type' => NotificationTypes::REVIEW_RECEIVED,
            'channel' => 'database',
            'status' => 'sent',
        ]);
    }

    public function test_mail_without_cta_uses_frontend_url(): void
    {
        Mail::spy();
        config(['app.frontend_url' => 'https://frontend.test']);

        $user = User::factory()->create([
            'name' => 'Usuario Front',
            'email' => 'front@example.com',
        ]);

        app(NotificationDispatchService::class)->dispatchToUser($user, NotificationTypes::WELCOME, [
            'channels' => ['mail'],
            'title' => 'Bienvenido a Memorialo',
            'body' => 'Tu cuenta fue creada correctamente.',
            'dedupeKey' => NotificationTypes::WELCOME.':mail-front:'.$user->id,
        ]);

        Mail::shouldHaveReceived('send')->once()->with(
            'emails.notification',
            \Mockery::on(fn (array $data): bool => ($data['ctaUrl'] ?? null) === 'https://frontend.test'),
            \Mockery::type(Closure::class)
        );
    }

    public function test_provider_event_reminder_command_sends_48h_notification_and_avoids_duplicates(): void
    {
        Mail::fake();
        Carbon::setTestNow(Carbon::create(2026, 6, 8, 12, 0, 0));

        try {
            $providerUser = User::factory()->create([
                'role' => 'provider',
                'is_provider' => true,
            ]);

            Booking::create([
                'id' => 'booking-reminder-48h',
                'artist_user_id' => (string) $providerUser->id,
                'artist_name' => 'Mariachi',
                'client_name' => 'Cliente Test',
                'date' => now()->addHours(48)->format('Y-m-d'),
                'start_time' => now()->addHours(48)->format('H:i:s'),
                'location' => 'CDMX',
                'status' => 'confirmed',
            ]);

            $this->artisan('notifications:send-provider-event-reminders')->assertExitCode(0);

            $this->assertDatabaseHas('notification_deliveries', [
                'recipient_user_id' => $providerUser->id,
                'notification_type' => NotificationTypes::PROVIDER_EVENT_REMINDER,
                'channel' => 'database',
                'status' => 'sent',
            ]);

            $this->assertDatabaseHas('notification_deliveries', [
                'recipient_user_id' => $providerUser->id,
                'notification_type' => NotificationTypes::PROVIDER_EVENT_REMINDER,
                'channel' => 'mail',
                'status' => 'sent',
            ]);

            $this->artisan('notifications:send-provider-event-reminders')->assertExitCode(0);

            $this->assertSame(1, $providerUser->notifications()->where('type', NotificationTypes::PROVIDER_EVENT_REMINDER)->count());
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_provider_event_reminder_command_uses_admin_configured_hours(): void
    {
        Mail::fake();
        Carbon::setTestNow(Carbon::create(2026, 6, 8, 12, 0, 0));

        try {
            MarketplaceSetting::query()->create([
                'enabled_cities' => ['Caracas'],
                'provider_event_reminder_hours' => 24,
            ]);

            $providerUser = User::factory()->create([
                'role' => 'provider',
                'is_provider' => true,
            ]);

            Booking::create([
                'id' => 'booking-reminder-24h',
                'artist_user_id' => (string) $providerUser->id,
                'artist_name' => 'DJ',
                'client_name' => 'Cliente Config',
                'date' => now()->addHours(24)->format('Y-m-d'),
                'start_time' => now()->addHours(24)->format('H:i:s'),
                'status' => 'confirmed',
            ]);

            $this->artisan('notifications:send-provider-event-reminders')->assertExitCode(0);

            $this->assertDatabaseHas('notification_deliveries', [
                'recipient_user_id' => $providerUser->id,
                'notification_type' => NotificationTypes::PROVIDER_EVENT_REMINDER,
                'channel' => 'database',
                'status' => 'sent',
            ]);
        } finally {
            Carbon::setTestNow();
        }
    }
}
