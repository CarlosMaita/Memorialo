<?php

namespace Tests\Feature;

use App\Models\BillingInvoice;
use App\Models\Booking;
use App\Models\Contract;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiPhaseOneSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/api/health');

        $response
            ->assertOk()
            ->assertJson([
                'status' => 'ok',
                'service' => 'laravel-api',
            ]);
    }

    public function test_auth_register_and_me_return_expected_contract(): void
    {
        $register = $this->postJson('/api/auth/register', [
            'name' => 'Carlo Test',
            'email' => 'carlo@example.com',
            'password' => 'secret123',
            'phone' => '+525500000000',
            'isProvider' => true,
        ]);

        $register
            ->assertCreated()
            ->assertJsonPath('user.email', 'carlo@example.com')
            ->assertJsonPath('user.name', 'Carlo Test')
            ->assertJsonPath('user.isProvider', false)
            ->assertJsonPath('user.role', 'user')
            ->assertJsonPath('user.providerRequestStatus', 'pending');

        $token = $register->json('token');

        $this->assertIsString($token);
        $this->assertNotSame('', $token);

        $me = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me');

        $me
            ->assertOk()
            ->assertJsonPath('user.email', 'carlo@example.com')
            ->assertJsonPath('user.isProvider', false)
            ->assertJsonPath('user.providerRequestStatus', 'pending')
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'email',
                    'name',
                    'phone',
                    'whatsappNumber',
                    'createdAt',
                    'avatar',
                    'isProvider',
                    'providerId',
                    'providerRequestStatus',
                    'providerRequestedAt',
                    'providerApprovedAt',
                    'providerApprovedBy',
                    'role',
                    'banned',
                    'bannedAt',
                    'bannedReason',
                    'archived',
                    'archivedAt',
                ],
            ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'carlo@example.com',
            'password' => 'secret123',
        ]);

        $login
            ->assertOk()
            ->assertJsonPath('user.email', 'carlo@example.com')
            ->assertJsonPath('token_type', 'Bearer');

        $logoutToken = $login->json('token');

        $this->assertIsString($logoutToken);
        $this->assertNotSame($token, $logoutToken);

        $this->withHeader('Authorization', 'Bearer '.$logoutToken)
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Sesion cerrada correctamente.');
    }

    public function test_provider_scope_includes_legacy_bookings_linked_by_service_owner(): void
    {
        $provider = User::factory()->create([
            'role' => 'provider',
            'is_provider' => true,
            'provider_request_status' => 'approved',
            'provider_approved_at' => now(),
        ]);

        $client = User::factory()->create();

        $service = Service::create([
            'user_id' => $provider->id,
            'title' => 'Legacy service',
            'description' => 'Servicio legado',
            'category' => 'music',
            'city' => 'CDMX',
            'price' => 1500,
            'is_active' => true,
        ]);

        Booking::create([
            'id' => 'legacy-booking-001',
            'artist_id' => (string) $service->id,
            'artist_user_id' => null,
            'artist_name' => 'Legacy service',
            'user_id' => (string) $client->id,
            'client_name' => 'Cliente legado',
            'date' => '2026-07-10',
            'start_time' => '18:00',
            'duration' => 2,
            'event_type' => 'Boda',
            'location' => 'CDMX',
            'total_price' => 1500,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($provider);

        $this->getJson('/api/bookings?scope=provider')
            ->assertOk()
            ->assertJsonFragment([
                'id' => 'legacy-booking-001',
                'artistId' => (string) $service->id,
                'clientName' => 'Cliente legado',
            ]);
    }

    public function test_scoped_contracts_and_bookings_accept_bearer_tokens_on_public_routes(): void
    {
        $provider = User::factory()->create([
            'role' => 'provider',
            'is_provider' => true,
            'provider_request_status' => 'approved',
            'provider_approved_at' => now(),
        ]);

        $client = User::factory()->create();

        $service = Service::create([
            'user_id' => $provider->id,
            'title' => 'Mariachi premium',
            'description' => 'Show para eventos',
            'category' => 'music',
            'city' => 'CDMX',
            'price' => 3200,
            'is_active' => true,
        ]);

        Booking::create([
            'id' => 'token-booking-001',
            'artist_id' => (string) $service->id,
            'artist_user_id' => (string) $provider->id,
            'artist_name' => 'Mariachi premium',
            'user_id' => (string) $client->id,
            'client_name' => 'Cliente token',
            'client_email' => $client->email,
            'date' => '2026-08-15',
            'start_time' => '20:00',
            'duration' => 3,
            'event_type' => 'wedding',
            'location' => 'CDMX',
            'total_price' => 3200,
            'status' => 'confirmed',
            'contract_id' => 'token-contract-001',
        ]);

        Contract::create([
            'id' => 'token-contract-001',
            'booking_id' => 'token-booking-001',
            'artist_id' => (string) $service->id,
            'artist_user_id' => (string) $provider->id,
            'artist_name' => 'Mariachi premium',
            'client_id' => (string) $client->id,
            'client_name' => 'Cliente token',
            'client_email' => $client->email,
            'status' => 'pending',
        ]);

        $clientToken = $client->createToken('client-token')->plainTextToken;
        $providerToken = $provider->createToken('provider-token')->plainTextToken;

        $this->withToken($clientToken)
            ->getJson('/api/bookings?scope=client')
            ->assertOk()
            ->assertJsonFragment([
                'id' => 'token-booking-001',
                'clientName' => 'Cliente token',
            ]);

        $this->withToken($clientToken)
            ->getJson('/api/contracts?scope=client')
            ->assertOk()
            ->assertJsonFragment([
                'id' => 'token-contract-001',
                'clientName' => 'Cliente token',
            ]);

        $this->withToken($providerToken)
            ->getJson('/api/bookings?scope=provider')
            ->assertOk();

        $this->withToken($providerToken)
            ->getJson('/api/contracts?scope=provider')
            ->assertOk();
    }

    public function test_provider_and_service_endpoints_accept_camel_case_payloads(): void
    {
        $user = User::factory()->create([
            'role' => 'provider',
            'is_provider' => true,
            'provider_request_status' => 'approved',
            'provider_approved_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $provider = $this->postJson('/api/providers', [
            'businessName' => 'Studio Carlo',
            'category' => 'music',
            'description' => 'Live band services',
            'representative' => [
                'type' => 'person',
                'name' => 'Carlo Provider',
                'documentType' => 'CI',
                'documentNumber' => 'V-12345678',
            ],
        ]);

        $provider
            ->assertCreated()
            ->assertJsonPath('userId', (string) $user->id)
            ->assertJsonPath('businessName', 'Studio Carlo')
            ->assertJsonPath('representative.name', 'Carlo Provider')
            ->assertJsonPath('representative.documentType', 'CI')
            ->assertJsonPath('representative.documentNumber', 'V-12345678');

        $providerId = $provider->json('id');

        $userUpdate = $this->putJson('/api/users/'.$user->id, [
            'name' => 'Carlo Provider',
            'phone' => '+525511111111',
            'whatsappNumber' => '+525522222222',
            'isProvider' => true,
            'providerId' => $providerId,
        ]);

        $userUpdate
            ->assertOk()
            ->assertJsonPath('name', 'Carlo Provider')
            ->assertJsonPath('phone', '+525511111111')
            ->assertJsonPath('whatsappNumber', '+525522222222')
            ->assertJsonPath('isProvider', true)
            ->assertJsonPath('providerId', (string) $providerId)
            ->assertJsonPath('role', 'provider');

        $this->getJson('/api/users/'.$user->id)
            ->assertOk()
            ->assertJsonPath('name', 'Carlo Provider')
            ->assertJsonPath('providerId', (string) $providerId);

        $providerByUser = $this->getJson('/api/providers/user/'.$user->id);

        $providerByUser
            ->assertOk()
            ->assertJsonPath('id', (string) $providerId)
            ->assertJsonPath('userId', (string) $user->id)
            ->assertJsonPath('representative.name', 'Carlo Provider')
            ->assertJsonPath('representative.documentNumber', 'V-12345678');

        $providerUpdate = $this->putJson('/api/providers/'.$providerId, [
            'businessName' => 'Studio Carlo Prime',
            'category' => 'wedding-music',
            'description' => 'Live band and DJ services',
            'representative' => [
                'type' => 'company',
                'name' => 'Studio Carlo Prime, C.A.',
                'documentType' => 'RIF',
                'documentNumber' => 'J-12345678-9',
            ],
            'totalBookings' => 12,
        ]);

        $providerUpdate
            ->assertOk()
            ->assertJsonPath('businessName', 'Studio Carlo Prime')
            ->assertJsonPath('category', 'wedding-music')
            ->assertJsonPath('description', 'Live band and DJ services')
            ->assertJsonPath('representative.type', 'company')
            ->assertJsonPath('representative.name', 'Studio Carlo Prime, C.A.')
            ->assertJsonPath('representative.documentType', 'RIF')
            ->assertJsonPath('representative.documentNumber', 'J-12345678-9')
            ->assertJsonPath('totalBookings', 12);

        $this->getJson('/api/providers')
            ->assertOk()
            ->assertJsonFragment([
                'id' => (string) $providerId,
                'businessName' => 'Studio Carlo Prime',
            ]);

        $service = $this->postJson('/api/services', [
            'providerId' => $providerId,
            'title' => 'Banda para eventos',
            'description' => 'Show de 2 horas',
            'category' => 'music',
            'city' => 'CDMX',
            'price' => 4500,
        ]);

        $service
            ->assertCreated()
            ->assertJsonPath('userId', (string) $user->id)
            ->assertJsonPath('providerId', (string) $providerId)
            ->assertJsonPath('title', 'Banda para eventos')
            ->assertJsonPath('providerBusinessName', 'Studio Carlo Prime')
            ->assertJsonPath('providerRepresentative.name', 'Studio Carlo Prime, C.A.')
            ->assertJsonPath('providerRepresentative.documentType', 'RIF')
            ->assertJsonPath('providerRepresentative.documentNumber', 'J-12345678-9')
            ->assertJsonPath('reviews', 0)
            ->assertJsonPath('isActive', true);

        $serviceId = $service->json('id');

        $contract = $this->postJson('/api/contracts', [
            'id' => 'provider-contract-001',
            'artistId' => (string) $serviceId,
            'artistUserId' => (string) $user->id,
            'artistName' => 'Banda para eventos',
            'clientId' => 'client-001',
            'clientName' => 'Cliente Demo',
            'status' => 'pending',
            'terms' => [
                'serviceDescription' => 'Show de 2 horas',
                'price' => 4500,
                'duration' => 2,
                'date' => '2026-09-10',
                'location' => 'CDMX',
                'paymentTerms' => 'Contado',
                'cancellationPolicy' => '48 horas',
                'additionalTerms' => [],
            ],
        ]);

        $contract
            ->assertCreated()
            ->assertJsonPath('metadata.providerBusinessName', 'Studio Carlo Prime')
            ->assertJsonPath('metadata.providerRepresentative.name', 'Studio Carlo Prime, C.A.')
            ->assertJsonPath('metadata.providerRepresentative.documentType', 'RIF')
            ->assertJsonPath('metadata.providerRepresentative.documentNumber', 'J-12345678-9')
            ->assertJsonPath('metadata.providerRepresentativeName', 'Studio Carlo Prime, C.A.');

        $update = $this->putJson('/api/services/'.$serviceId, [
            'reviews' => 7,
            'price' => 5000,
            'category' => 'wedding-music',
            'isActive' => false,
        ]);

        $update
            ->assertOk()
            ->assertJsonPath('reviews', 7)
            ->assertJsonPath('price', 5000)
            ->assertJsonPath('category', 'wedding-music')
            ->assertJsonPath('isActive', false);

        $this->getJson('/api/services')
            ->assertOk()
            ->assertJsonFragment([
                'id' => (string) $serviceId,
                'title' => 'Banda para eventos',
            ]);

        $review = $this->postJson('/api/reviews', [
            'bookingId' => 'booking-001',
            'contractId' => 'contract-001',
            'artistId' => $serviceId,
            'userName' => 'Carlo Provider',
            'rating' => 5,
            'comment' => 'Servicio excelente y puntual, totalmente recomendado.',
        ]);

        $review
            ->assertCreated()
            ->assertJsonPath('artistId', (string) $serviceId)
            ->assertJsonPath('userId', (string) $user->id)
            ->assertJsonPath('rating', 5)
            ->assertJsonPath('bookingId', 'booking-001');

        $this->getJson('/api/reviews')
            ->assertOk()
            ->assertJsonFragment([
                'artistId' => (string) $serviceId,
                'userId' => (string) $user->id,
                'rating' => 5,
            ]);

        $this->getJson('/api/services')
            ->assertOk()
            ->assertJsonFragment([
                'id' => (string) $serviceId,
                'reviews' => 1,
                'rating' => 5,
            ]);

        $contract = $this->postJson('/api/contracts', [
            'id' => 'contract-001',
            'bookingId' => 'booking-001',
            'artistId' => $serviceId,
            'artistUserId' => (string) $user->id,
            'artistName' => 'Studio Carlo Prime',
            'clientId' => (string) $user->id,
            'clientName' => 'Carlo Client',
            'status' => 'pending_client',
            'terms' => [
                'serviceDescription' => 'Banda para eventos',
                'price' => 5000,
                'duration' => 2,
                'date' => '2026-06-10',
                'location' => 'CDMX',
                'paymentTerms' => '50% de anticipo',
                'cancellationPolicy' => 'Sin devolucion 48h antes',
                'additionalTerms' => ['Llegar 30 minutos antes'],
            ],
        ]);

        $contract
            ->assertCreated()
            ->assertJsonPath('id', 'contract-001')
            ->assertJsonPath('artistId', (string) $serviceId)
            ->assertJsonPath('status', 'pending_client')
            ->assertJsonPath('terms.price', 5000);

        $this->getJson('/api/contracts')
            ->assertOk()
            ->assertJsonFragment([
                'id' => 'contract-001',
                'artistId' => (string) $serviceId,
                'status' => 'pending_client',
            ]);

        $contractUpdate = $this->putJson('/api/contracts/contract-001', [
            'status' => 'completed',
        ]);

        $contractUpdate
            ->assertOk()
            ->assertJsonPath('id', 'contract-001')
            ->assertJsonPath('status', 'completed');

        $this->assertNotNull($contractUpdate->json('completedAt'));

        $this->getJson('/api/services')
            ->assertOk()
            ->assertJsonFragment([
                'id' => (string) $serviceId,
                'bookingsCompleted' => 1,
            ]);

        $booking = $this->postJson('/api/bookings', [
            'id' => 'booking-001',
            'artistId' => $serviceId,
            'artistUserId' => (string) $user->id,
            'artistName' => 'Studio Carlo Prime',
            'clientName' => 'Carlo Client',
            'clientEmail' => 'client@example.com',
            'clientPhone' => '+525500000111',
            'date' => '2026-06-10',
            'startTime' => '18:00',
            'duration' => 2,
            'eventType' => 'Boda',
            'location' => 'CDMX',
            'specialRequests' => 'Entrada especial',
            'totalPrice' => 5000,
            'status' => 'pending',
            'contractId' => 'contract-001',
        ]);

        $booking
            ->assertCreated()
            ->assertJsonPath('id', 'booking-001')
            ->assertJsonPath('artistId', (string) $serviceId)
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('totalPrice', 5000);

        $this->getJson('/api/bookings')
            ->assertOk()
            ->assertJsonFragment([
                'id' => 'booking-001',
                'artistId' => (string) $serviceId,
                'status' => 'pending',
            ]);

        $this->putJson('/api/bookings/booking-001', [
            'status' => 'confirmed',
            'startTime' => '19:00',
        ])
            ->assertOk()
            ->assertJsonPath('id', 'booking-001')
            ->assertJsonPath('status', 'confirmed')
            ->assertJsonPath('startTime', '19:00');

        $event = $this->postJson('/api/events', [
            'id' => 'event-001',
            'name' => 'Boda Carlo',
            'description' => 'Evento principal',
            'eventDate' => '2026-07-01',
            'eventType' => 'Boda',
            'location' => 'CDMX',
            'budget' => 15000,
            'status' => 'planning',
            'contractIds' => ['contract-001'],
        ]);

        $event
            ->assertCreated()
            ->assertJsonPath('id', 'event-001')
            ->assertJsonPath('name', 'Boda Carlo')
            ->assertJsonPath('status', 'planning')
            ->assertJsonPath('contractIds.0', 'contract-001');

        $this->getJson('/api/events')
            ->assertOk()
            ->assertJsonFragment([
                'id' => 'event-001',
                'name' => 'Boda Carlo',
            ]);

        $this->putJson('/api/events/event-001', [
            'status' => 'confirmed',
            'location' => 'Guadalajara',
        ])
            ->assertOk()
            ->assertJsonPath('id', 'event-001')
            ->assertJsonPath('status', 'confirmed')
            ->assertJsonPath('location', 'Guadalajara');

        $this->deleteJson('/api/events/event-001')
            ->assertOk()
            ->assertJsonPath('message', 'Event deleted');

        $this->getJson('/api/events')
            ->assertOk()
            ->assertJsonMissing([
                'id' => 'event-001',
            ]);

        $this->getJson('/api/billing/config')
            ->assertOk()
            ->assertJsonPath('commissionRate', 0.08);

        $this->getJson('/api/billing/provider/'.$providerId)
            ->assertOk()
            ->assertJsonPath('currentInvoice', null)
            ->assertJsonPath('preview.providerId', (string) $providerId)
            ->assertJsonPath('preview.commissionRate', 0.08)
            ->assertJsonPath('preview.completedContracts.0.contractId', 'contract-001');

        $month = now()->format('Y-m');

        BillingInvoice::create([
            'provider_id' => $providerId,
            'month' => $month,
            'commission_rate' => 0.08,
            'contract_count' => 1,
            'total_sales' => 5000,
            'amount' => 400,
            'status' => 'pending',
            'due_date' => now()->addDays(5),
            'grace_period_end' => now()->addDays(5),
            'generated_at' => now(),
            'billing_snapshot' => [
                'completedContracts' => [
                    [
                        'contractId' => 'contract-001',
                        'clientName' => 'Carlo Client',
                        'serviceName' => 'Mariachi Real',
                        'price' => 5000,
                        'completedAt' => now()->toISOString(),
                    ],
                ],
                'contractCount' => 1,
                'totalSales' => 5000,
                'commissionAmount' => 400,
            ],
        ]);

        $this->postJson('/api/billing/provider/'.$providerId.'/pay', [
            'month' => $month,
            'paymentReference' => 'PAY-TEST-001',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('invoice.providerId', (string) $providerId)
            ->assertJsonPath('invoice.month', $month)
            ->assertJsonPath('invoice.status', 'submitted');

        $adminUser = User::factory()->create([
            'role' => 'admin',
            'is_provider' => false,
        ]);

        $deletableUser = User::factory()->create([
            'role' => 'user',
            'is_provider' => false,
        ]);

        Sanctum::actingAs($adminUser);

        $this->getJson('/api/billing/admin/overview')
            ->assertOk()
            ->assertJsonPath('currentMonth', $month)
            ->assertJsonPath('invoices.0.providerId', (string) $providerId)
            ->assertJsonPath('invoices.0.status', 'submitted');

        $this->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonFragment([
                'id' => (string) $user->id,
                'email' => $user->email,
            ]);

        $this->postJson('/api/admin/providers/'.$providerId.'/verify', [])
            ->assertOk()
            ->assertJsonPath('id', (string) $providerId)
            ->assertJsonPath('verified', true);

        $this->postJson('/api/admin/providers/'.$providerId.'/ban', [
            'reason' => 'Incumplimiento de politicas',
        ])
            ->assertOk()
            ->assertJsonPath('id', (string) $providerId)
            ->assertJsonPath('banned', true)
            ->assertJsonPath('bannedReason', 'Incumplimiento de politicas');

        $this->postJson('/api/admin/providers/'.$providerId.'/unban', [])
            ->assertOk()
            ->assertJsonPath('id', (string) $providerId)
            ->assertJsonPath('banned', false);

        $this->postJson('/api/admin/users/'.$user->id.'/ban', [
            'reason' => 'Abuso en plataforma',
        ])
            ->assertOk()
            ->assertJsonPath('id', (string) $user->id)
            ->assertJsonPath('banned', true)
            ->assertJsonPath('bannedReason', 'Abuso en plataforma');

        $this->postJson('/api/admin/users/'.$user->id.'/unban', [])
            ->assertOk()
            ->assertJsonPath('id', (string) $user->id)
            ->assertJsonPath('banned', false);

        $this->postJson('/api/admin/users/'.$user->id.'/archive', [])
            ->assertOk()
            ->assertJsonPath('id', (string) $user->id)
            ->assertJsonPath('archived', true);

        $this->postJson('/api/admin/users/'.$user->id.'/unarchive', [])
            ->assertOk()
            ->assertJsonPath('id', (string) $user->id)
            ->assertJsonPath('archived', false);

        $this->deleteJson('/api/admin/users/'.$deletableUser->id)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'User deleted');

        Sanctum::actingAs($user);

        $this->deleteJson('/api/services/'.$serviceId)
            ->assertOk()
            ->assertJsonPath('message', 'Service deleted');

        $this->getJson('/api/services')
            ->assertOk()
            ->assertJsonMissing([
                'id' => (string) $serviceId,
            ]);
    }
}
