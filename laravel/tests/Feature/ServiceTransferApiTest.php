<?php

namespace Tests\Feature;

use App\Models\Provider;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServiceTransferApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_transfer_services_between_providers(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_provider' => false,
        ]);

        $sourceUser = User::factory()->create([
            'role' => 'provider',
            'is_provider' => true,
            'provider_request_status' => 'approved',
            'provider_approved_at' => now(),
        ]);

        $destinationUser = User::factory()->create([
            'role' => 'provider',
            'is_provider' => true,
            'provider_request_status' => 'approved',
            'provider_approved_at' => now(),
        ]);

        $sourceProvider = Provider::query()->create([
            'user_id' => $sourceUser->id,
            'business_name' => 'Proveedor origen',
            'category' => 'decoracion',
            'description' => 'Origen',
            'verified' => true,
        ]);

        $destinationProvider = Provider::query()->create([
            'user_id' => $destinationUser->id,
            'business_name' => 'Proveedor destino',
            'category' => 'musica',
            'description' => 'Destino',
            'verified' => true,
        ]);

        $service = Service::query()->create([
            'user_id' => $sourceUser->id,
            'provider_id' => $sourceProvider->id,
            'title' => 'Servicio transferible',
            'category' => 'Decoración',
            'city' => 'Caracas',
            'price' => 300,
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/services/transfer', [
            'sourceProviderId' => (string) $sourceProvider->id,
            'destinationProviderId' => (string) $destinationProvider->id,
            'serviceIds' => [(string) $service->id],
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('transferredCount', 1)
            ->assertJsonPath('services.0.id', (string) $service->id)
            ->assertJsonPath('services.0.providerId', (string) $destinationProvider->id)
            ->assertJsonPath('services.0.userId', (string) $destinationUser->id);

        $this->assertDatabaseHas('services', [
            'id' => $service->id,
            'provider_id' => $destinationProvider->id,
            'user_id' => $destinationUser->id,
        ]);
    }
}
