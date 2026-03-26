<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Provider;
use App\Models\Service;
use App\Models\User;
use App\Support\NotificationTypes;
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
}
