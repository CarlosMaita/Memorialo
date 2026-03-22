<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProviderAccessWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_request_provider_access(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
            'is_provider' => false,
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/users/'.$user->id.'/provider-request')
            ->assertOk()
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('user.providerRequestStatus', 'pending');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'provider_request_status' => 'pending',
            'is_provider' => false,
        ]);
    }

    public function test_admin_can_approve_and_revoke_provider_access(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_provider' => false,
        ]);

        $user = User::factory()->create([
            'role' => 'user',
            'is_provider' => false,
            'provider_request_status' => 'pending',
            'provider_requested_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/users/'.$user->id.'/provider-access/approve')
            ->assertOk()
            ->assertJsonPath('isProvider', true)
            ->assertJsonPath('providerRequestStatus', 'approved');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_provider' => true,
            'role' => 'provider',
            'provider_request_status' => 'approved',
        ]);

        $this->postJson('/api/admin/users/'.$user->id.'/provider-access/revoke')
            ->assertOk()
            ->assertJsonPath('isProvider', false)
            ->assertJsonPath('providerRequestStatus', 'rejected');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_provider' => false,
            'role' => 'user',
            'provider_request_status' => 'rejected',
        ]);
    }
}
