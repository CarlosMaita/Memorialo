<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Contracts\User as SocialiteUserContract;
use Laravel\Socialite\Facades\Socialite;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_callback_creates_a_user_and_redirects_with_token(): void
    {
        $socialiteUser = $this->mockGoogleUser('google-123', 'google-user@example.com', 'Google User', 'https://example.com/avatar.jpg');

        $response = $this->get('/api/auth/google/callback');

        $response->assertRedirect();
        $this->assertStringContainsString('auth_token=', (string) $response->headers->get('Location'));
        $this->assertDatabaseHas('users', [
            'email' => 'google-user@example.com',
            'google_id' => 'google-123',
        ]);
    }

    public function test_google_callback_links_existing_user_by_email(): void
    {
        User::factory()->create([
            'email' => 'existing@example.com',
            'google_id' => null,
        ]);

        $this->mockGoogleUser('google-456', 'existing@example.com', 'Existing User', 'https://example.com/avatar.jpg');

        $response = $this->get('/api/auth/google/callback');

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'email' => 'existing@example.com',
            'google_id' => 'google-456',
        ]);
    }

    private function mockGoogleUser(string $id, string $email, string $name, string $avatar): SocialiteUserContract
    {
        $socialiteUser = $this->createMock(SocialiteUserContract::class);
        $socialiteUser->method('getId')->willReturn($id);
        $socialiteUser->method('getEmail')->willReturn($email);
        $socialiteUser->method('getName')->willReturn($name);
        $socialiteUser->method('getAvatar')->willReturn($avatar);

        $provider = new class($socialiteUser) {
            public function __construct(private readonly SocialiteUserContract $socialiteUser)
            {
            }

            public function stateless(): self
            {
                return $this;
            }

            public function user(): SocialiteUserContract
            {
                return $this->socialiteUser;
            }
        };

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        return $socialiteUser;
    }
}
