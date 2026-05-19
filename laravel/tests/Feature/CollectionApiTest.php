<?php

namespace Tests\Feature;

use App\Models\Provider;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CollectionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_and_delete_collections(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_provider' => false,
        ]);

        $providerUser = User::factory()->create([
            'role' => 'provider',
            'is_provider' => true,
            'provider_request_status' => 'approved',
            'provider_approved_at' => now(),
        ]);

        $provider = Provider::query()->create([
            'user_id' => $providerUser->id,
            'business_name' => 'Eventos Bodas',
            'category' => 'decoracion',
            'description' => 'Proveedor de bodas',
            'verified' => true,
        ]);

        $firstService = Service::query()->create([
            'user_id' => $providerUser->id,
            'provider_id' => $provider->id,
            'title' => 'Decoración floral',
            'category' => 'Decoración',
            'city' => 'Caracas',
            'price' => 300,
            'is_active' => true,
        ]);

        $secondService = Service::query()->create([
            'user_id' => $providerUser->id,
            'provider_id' => $provider->id,
            'title' => 'Fotografía premium',
            'category' => 'Fotografía',
            'city' => 'Caracas',
            'price' => 500,
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $createResponse = $this->postJson('/api/admin/collections', [
            'title' => 'Servicios para bodas 2026',
            'subtitle' => 'Selección ideal para celebraciones memorables.',
            'slug' => 'servicios-para-bodas-2026',
            'serviceIds' => [(string) $secondService->id, (string) $firstService->id],
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('title', 'Servicios para bodas 2026')
            ->assertJsonPath('slug', 'servicios-para-bodas-2026')
            ->assertJsonPath('serviceIds.0', (string) $secondService->id)
            ->assertJsonPath('serviceIds.1', (string) $firstService->id)
            ->assertJsonPath('services.0.id', (string) $secondService->id)
            ->assertJsonPath('services.1.id', (string) $firstService->id);

        $collectionId = $createResponse->json('id');

        $this->putJson("/api/admin/collections/{$collectionId}", [
            'title' => 'Servicios para bodas 2027',
            'subtitle' => 'Colección actualizada.',
            'slug' => 'servicios-para-bodas-2027',
            'serviceIds' => [(string) $firstService->id],
        ])
            ->assertOk()
            ->assertJsonPath('title', 'Servicios para bodas 2027')
            ->assertJsonPath('slug', 'servicios-para-bodas-2027')
            ->assertJsonCount(1, 'services')
            ->assertJsonPath('services.0.id', (string) $firstService->id);

        $this->deleteJson("/api/admin/collections/{$collectionId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->getJson('/api/collections')
            ->assertOk()
            ->assertJsonCount(0);
    }

    public function test_public_can_view_collection_by_slug(): void
    {
        $providerUser = User::factory()->create([
            'role' => 'provider',
            'is_provider' => true,
            'provider_request_status' => 'approved',
            'provider_approved_at' => now(),
        ]);

        $provider = Provider::query()->create([
            'user_id' => $providerUser->id,
            'business_name' => 'Proveedor Premium',
            'category' => 'music',
            'description' => 'Proveedor de prueba',
            'verified' => true,
        ]);

        $service = Service::query()->create([
            'user_id' => $providerUser->id,
            'provider_id' => $provider->id,
            'title' => 'DJ para bodas',
            'category' => 'DJ',
            'city' => 'Valencia',
            'price' => 450,
            'is_active' => true,
            'metadata' => [
                'image' => 'https://example.com/dj.jpg',
                'publicCode' => 'MEM-1234567',
            ],
        ]);

        $admin = User::factory()->create([
            'role' => 'admin',
            'is_provider' => false,
        ]);

        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/collections', [
            'title' => 'Colección de bodas',
            'subtitle' => 'Los mejores servicios para bodas.',
            'slug' => 'coleccion-de-bodas',
            'serviceIds' => [$service->id],
        ])->assertCreated();

        $this->getJson('/api/collections/coleccion-de-bodas')
            ->assertOk()
            ->assertJsonPath('title', 'Colección de bodas')
            ->assertJsonPath('subtitle', 'Los mejores servicios para bodas.')
            ->assertJsonPath('slug', 'coleccion-de-bodas')
            ->assertJsonPath('services.0.id', (string) $service->id)
            ->assertJsonPath('services.0.name', 'DJ para bodas');
    }
}
