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
    }
}
