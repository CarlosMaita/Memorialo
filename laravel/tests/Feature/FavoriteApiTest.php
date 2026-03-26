<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FavoriteApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_favorites_endpoints_require_authentication(): void
    {
        $this->getJson('/api/favorites')->assertUnauthorized();
        $this->postJson('/api/favorites', ['serviceId' => 1])->assertUnauthorized();
        $this->deleteJson('/api/favorites/1')->assertUnauthorized();
    }

    public function test_user_can_add_list_and_remove_favorites(): void
    {
        $user = User::factory()->create();
        $owner = User::factory()->create();
        $service = $this->createService($owner);

        Sanctum::actingAs($user);

        $this->postJson('/api/favorites', [
            'serviceId' => $service->id,
        ])
            ->assertCreated()
            ->assertJsonPath('serviceId', (string) $service->id);

        $this->getJson('/api/favorites')
            ->assertOk()
            ->assertJsonPath('serviceIds.0', (string) $service->id)
            ->assertJsonStructure([
                'serviceIds',
                'items' => [
                    '*' => ['id', 'serviceId', 'createdAt'],
                ],
            ]);

        $this->postJson('/api/favorites', [
            'serviceId' => $service->id,
        ])
            ->assertOk()
            ->assertJsonPath('created', false);

        $this->deleteJson('/api/favorites/'.$service->id)
            ->assertOk()
            ->assertJsonPath('removed', true);

        $this->getJson('/api/favorites')
            ->assertOk()
            ->assertJsonPath('serviceIds', []);
    }

    public function test_user_cannot_delete_other_user_favorite(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $service = $this->createService($owner);

        Sanctum::actingAs($owner);
        $this->postJson('/api/favorites', ['serviceId' => $service->id])->assertCreated();

        Sanctum::actingAs($other);
        $this->deleteJson('/api/favorites/'.$service->id)
            ->assertOk()
            ->assertJsonPath('removed', false);

        Sanctum::actingAs($owner);
        $this->getJson('/api/favorites')
            ->assertOk()
            ->assertJsonPath('serviceIds.0', (string) $service->id);
    }

    private function createService(User $owner): Service
    {
        return Service::create([
            'user_id' => $owner->id,
            'provider_id' => null,
            'title' => 'Servicio de prueba',
            'description' => 'Descripcion',
            'category' => 'Musica',
            'subcategory' => 'DJ',
            'city' => 'Valencia',
            'price' => 100,
            'rating' => 5,
            'reviews_count' => 0,
            'bookings_completed' => 0,
            'is_active' => true,
            'metadata' => [],
        ]);
    }
}
