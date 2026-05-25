<?php

namespace Tests\Feature;

use App\Models\SearchTerm;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SearchTermApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_service_search_tracks_terms_case_insensitive_per_month(): void
    {
        SearchTerm::query()->create([
            'term' => 'mariachi',
            'term_normalized' => 'mariachi',
            'month_start' => now()->subMonth()->startOfMonth()->toDateString(),
            'search_count' => 4,
        ]);

        $this->getJson('/api/services?q=Mariachi')->assertOk();
        $this->getJson('/api/services?q=MARIACHI')->assertOk();

        $this->assertSame(
            2,
            SearchTerm::query()
                ->where('term_normalized', 'mariachi')
                ->whereDate('month_start', now()->startOfMonth()->toDateString())
                ->value('search_count')
        );

        $this->assertSame(
            4,
            SearchTerm::query()
                ->where('term_normalized', 'mariachi')
                ->whereDate('month_start', now()->subMonth()->startOfMonth()->toDateString())
                ->value('search_count')
        );
    }

    public function test_service_search_tracks_only_first_page_requests(): void
    {
        $this->getJson('/api/services?q=Mariachi&page=2')->assertOk();
        $this->getJson('/api/services?q=Mariachi')->assertOk();

        $this->assertSame(
            1,
            SearchTerm::query()
                ->where('term_normalized', 'mariachi')
                ->whereDate('month_start', now()->startOfMonth()->toDateString())
                ->value('search_count')
        );
    }

    public function test_suggestions_prioritize_popular_search_terms(): void
    {
        $user = User::factory()->create();

        Service::query()->create([
            'user_id' => $user->id,
            'title' => 'Mariachi Caracas Premium',
            'category' => 'Música',
            'price' => 300,
            'is_active' => true,
        ]);

        SearchTerm::query()->create([
            'term' => 'Mariachi',
            'term_normalized' => 'mariachi',
            'month_start' => now()->startOfMonth()->toDateString(),
            'search_count' => 20,
        ]);

        $response = $this->getJson('/api/services/suggestions?q=mar');

        $response
            ->assertOk()
            ->assertJsonPath('0.name', 'Mariachi')
            ->assertJsonPath('0.category', 'Término buscado');
    }

    public function test_admin_can_crud_and_filter_search_terms(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $create = $this->postJson('/api/admin/search-terms', [
            'term' => 'Decoración',
            'month' => now()->format('Y-m'),
            'searchCount' => 7,
            'isManual' => true,
        ]);

        $create
            ->assertCreated()
            ->assertJsonPath('term', 'Decoración')
            ->assertJsonPath('searchCount', 7)
            ->assertJsonPath('month', now()->format('Y-m'));

        $termId = $create->json('id');

        $this->putJson("/api/admin/search-terms/{$termId}", [
            'term' => 'Decoración y ambientación',
            'searchCount' => 10,
        ])->assertOk()
            ->assertJsonPath('term', 'Decoración y ambientación')
            ->assertJsonPath('searchCount', 10);

        $this->getJson('/api/admin/search-terms?min_count=10')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.term', 'Decoración y ambientación');

        $this->deleteJson("/api/admin/search-terms/{$termId}")
            ->assertOk()
            ->assertJsonPath('success', true);
    }
}
