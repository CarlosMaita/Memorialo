<?php

namespace Tests\Feature;

use App\Models\Provider;
use App\Models\Service;
use App\Models\ServiceCollection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HomeCollectionSectionApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeCollection(string $title, string $slug): ServiceCollection
    {
        return ServiceCollection::query()->create([
            'title' => $title,
            'slug' => $slug,
        ]);
    }

    public function test_admin_can_create_update_and_delete_home_collection_sections(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $collection = $this->makeCollection('Colección de bodas', 'coleccion-de-bodas');

        Sanctum::actingAs($admin);

        $createResponse = $this->postJson('/api/admin/home-collection-sections', [
            'title' => 'Las mejores bodas',
            'subtitle' => 'Servicios curados para tu boda.',
            'collectionId' => $collection->id,
            'sortOrder' => 1,
            'visible' => true,
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('title', 'Las mejores bodas')
            ->assertJsonPath('subtitle', 'Servicios curados para tu boda.')
            ->assertJsonPath('collectionId', (string) $collection->id)
            ->assertJsonPath('sortOrder', 1)
            ->assertJsonPath('visible', true);

        $sectionId = $createResponse->json('id');

        $this->putJson("/api/admin/home-collection-sections/{$sectionId}", [
            'title' => 'Las mejores bodas (actualizado)',
            'subtitle' => 'Subtítulo actualizado.',
            'collectionId' => $collection->id,
            'sortOrder' => 2,
            'visible' => false,
        ])
            ->assertOk()
            ->assertJsonPath('title', 'Las mejores bodas (actualizado)')
            ->assertJsonPath('sortOrder', 2)
            ->assertJsonPath('visible', false);

        $this->deleteJson("/api/admin/home-collection-sections/{$sectionId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->getJson('/api/home-collection-sections')
            ->assertOk()
            ->assertJsonCount(0);
    }

    public function test_public_endpoint_returns_only_visible_sections_ordered_by_sort_order(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $collectionA = $this->makeCollection('Colección A', 'coleccion-a');
        $collectionB = $this->makeCollection('Colección B', 'coleccion-b');
        $collectionC = $this->makeCollection('Colección C', 'coleccion-c');

        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/home-collection-sections', [
            'title' => 'Sección Oculta',
            'collectionId' => $collectionC->id,
            'sortOrder' => 0,
            'visible' => false,
        ])->assertCreated();

        $this->postJson('/api/admin/home-collection-sections', [
            'title' => 'Sección B',
            'collectionId' => $collectionB->id,
            'sortOrder' => 2,
            'visible' => true,
        ])->assertCreated();

        $this->postJson('/api/admin/home-collection-sections', [
            'title' => 'Sección A',
            'collectionId' => $collectionA->id,
            'sortOrder' => 1,
            'visible' => true,
        ])->assertCreated();

        // Public endpoint only returns visible sections, ordered by sort_order
        $response = $this->getJson('/api/home-collection-sections');
        $response->assertOk()->assertJsonCount(2);
        $response->assertJsonPath('0.title', 'Sección A');
        $response->assertJsonPath('1.title', 'Sección B');
    }

    public function test_admin_index_returns_all_sections(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $collection = $this->makeCollection('Colección Test', 'coleccion-test');

        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/home-collection-sections', [
            'title' => 'Visible',
            'collectionId' => $collection->id,
            'sortOrder' => 0,
            'visible' => true,
        ])->assertCreated();

        $this->postJson('/api/admin/home-collection-sections', [
            'title' => 'Oculta',
            'collectionId' => $collection->id,
            'sortOrder' => 1,
            'visible' => false,
        ])->assertCreated();

        $this->getJson('/api/admin/home-collection-sections')
            ->assertOk()
            ->assertJsonCount(2);
    }

    public function test_non_admin_cannot_manage_home_collection_sections(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $collection = $this->makeCollection('Colección Test', 'coleccion-test');

        Sanctum::actingAs($user);

        $this->postJson('/api/admin/home-collection-sections', [
            'title' => 'Sección',
            'collectionId' => $collection->id,
            'sortOrder' => 0,
            'visible' => true,
        ])->assertForbidden();
    }

    public function test_section_is_deleted_when_collection_is_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $collection = $this->makeCollection('Colección cascada', 'coleccion-cascada');

        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/home-collection-sections', [
            'title' => 'Sección con colección',
            'collectionId' => $collection->id,
            'sortOrder' => 0,
            'visible' => true,
        ])->assertCreated();

        $this->getJson('/api/home-collection-sections')
            ->assertOk()
            ->assertJsonCount(1);

        // Delete the collection (should cascade to section)
        $this->deleteJson("/api/admin/collections/{$collection->id}")
            ->assertOk();

        $this->getJson('/api/home-collection-sections')
            ->assertOk()
            ->assertJsonCount(0);
    }
}
