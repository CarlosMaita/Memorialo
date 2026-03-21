<?php

namespace Tests\Feature;

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
            ->assertJsonPath('user.isProvider', true)
            ->assertJsonPath('user.role', 'provider');

        $token = $register->json('token');

        $this->assertIsString($token);
        $this->assertNotSame('', $token);

        $me = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me');

        $me
            ->assertOk()
            ->assertJsonPath('user.email', 'carlo@example.com')
            ->assertJsonPath('user.isProvider', true)
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

    public function test_provider_and_service_endpoints_accept_camel_case_payloads(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
            'is_provider' => false,
        ]);

        Sanctum::actingAs($user);

        $provider = $this->postJson('/api/providers', [
            'businessName' => 'Studio Carlo',
            'category' => 'music',
            'description' => 'Live band services',
        ]);

        $provider
            ->assertCreated()
            ->assertJsonPath('userId', (string) $user->id)
            ->assertJsonPath('businessName', 'Studio Carlo');

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
            ->assertJsonPath('userId', (string) $user->id);

        $providerUpdate = $this->putJson('/api/providers/'.$providerId, [
            'businessName' => 'Studio Carlo Prime',
            'category' => 'wedding-music',
            'description' => 'Live band and DJ services',
            'totalBookings' => 12,
        ]);

        $providerUpdate
            ->assertOk()
            ->assertJsonPath('businessName', 'Studio Carlo Prime')
            ->assertJsonPath('category', 'wedding-music')
            ->assertJsonPath('description', 'Live band and DJ services')
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
            ->assertJsonPath('reviews', 0)
            ->assertJsonPath('isActive', true);

        $serviceId = $service->json('id');

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
