<?php

namespace Tests\Feature;

use App\Models\Provider;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MarketplaceCityAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_enabled_cities_and_public_config_exposes_them(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_provider' => false,
        ]);

        Sanctum::actingAs($admin);

        $this->patchJson('/api/admin/marketplace-config', [
            'enabledCities' => ['Valencia', 'Maracay'],
        ])
            ->assertOk()
            ->assertJsonPath('enabledCities.0', 'Maracay')
            ->assertJsonPath('enabledCities.1', 'Valencia');

        $this->getJson('/api/marketplace/config')
            ->assertOk()
            ->assertJsonPath('enabledCities.0', 'Maracay')
            ->assertJsonPath('enabledCities.1', 'Valencia');
    }

    public function test_public_marketplace_only_returns_enabled_city_services_for_active_listing(): void
    {
        $user = User::factory()->create([
            'role' => 'provider',
            'is_provider' => true,
            'provider_request_status' => 'approved',
            'provider_approved_at' => now(),
        ]);

        $provider = Provider::query()->create([
            'user_id' => $user->id,
            'business_name' => 'Eventos Valencia',
            'category' => 'music',
            'description' => 'Proveedor de prueba',
            'verified' => true,
        ]);

        Service::query()->create([
            'user_id' => $user->id,
            'provider_id' => $provider->id,
            'title' => 'Show en Valencia',
            'category' => 'music',
            'city' => 'Valencia',
            'price' => 100,
            'is_active' => true,
        ]);

        Service::query()->create([
            'user_id' => $user->id,
            'provider_id' => $provider->id,
            'title' => 'Show en Caracas',
            'category' => 'music',
            'city' => 'Caracas',
            'price' => 120,
            'is_active' => true,
        ]);

        $admin = User::factory()->create([
            'role' => 'admin',
            'is_provider' => false,
        ]);

        Sanctum::actingAs($admin);
        $this->patchJson('/api/admin/marketplace-config', [
            'enabledCities' => ['Valencia'],
        ])->assertOk();

        $this->getJson('/api/services?is_active=1&public_only=1')
            ->assertOk()
            ->assertJsonFragment(['title' => 'Show en Valencia'])
            ->assertJsonMissing(['title' => 'Show en Caracas']);

        $this->getJson('/api/services')
            ->assertOk()
            ->assertJsonFragment(['title' => 'Show en Valencia'])
            ->assertJsonFragment(['title' => 'Show en Caracas']);
    }
}
