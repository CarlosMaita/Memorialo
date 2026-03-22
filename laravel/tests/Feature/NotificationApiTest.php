<?php

namespace Tests\Feature;

use App\Support\NotificationTypes;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Tests\TestCase;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifications_endpoints_require_authentication(): void
    {
        $this->getJson('/api/notifications')->assertUnauthorized();
        $this->getJson('/api/notifications/unread-count')->assertUnauthorized();
        $this->patchJson('/api/notifications/read-all')->assertUnauthorized();
    }

    public function test_user_can_list_unread_count_and_mark_notifications_as_read(): void
    {
        $user = User::factory()->create();

        $first = $this->createNotification($user, NotificationTypes::SERVICE_REQUEST_CREATED, 'Nueva solicitud');
        $second = $this->createNotification($user, NotificationTypes::CONTRACT_APPROVED, 'Contrato aprobado');
        $read = $this->createNotification($user, NotificationTypes::REVIEW_RECEIVED, 'Nueva reseña');
        $read->markAsRead();

        Sanctum::actingAs($user);

        $this->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('count', 2);

        $list = $this->getJson('/api/notifications?limit=2');

        $list
            ->assertOk()
            ->assertJsonPath('unreadCount', 2)
            ->assertJsonStructure([
                'items' => [
                    '*' => ['id', 'type', 'title', 'body', 'priority', 'entity', 'ctaUrl', 'createdAt', 'readAt', 'isRead'],
                ],
                'pageInfo' => ['nextCursor', 'hasMore', 'limit'],
                'unreadCount',
            ]);

        $this->assertCount(2, $list->json('items'));

        $this->patchJson('/api/notifications/'.$first->id.'/read')
            ->assertOk()
            ->assertJsonPath('id', (string) $first->id)
            ->assertJsonPath('unreadCount', 1);

        $this->patchJson('/api/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('updated', 1)
            ->assertJsonPath('unreadCount', 0);

        $this->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('count', 0);
    }

    public function test_user_cannot_mark_other_users_notification_as_read(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();

        $notification = $this->createNotification($other, NotificationTypes::WELCOME, 'Bienvenida');

        Sanctum::actingAs($owner);

        $this
            ->patchJson('/api/notifications/'.$notification->id.'/read')
            ->assertNotFound();
    }

    private function createNotification(User $user, string $type, string $title): DatabaseNotification
    {
        return $user->notifications()->create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => $type,
            'data' => [
                'notificationType' => $type,
                'title' => $title,
                'body' => 'Detalle de prueba',
                'priority' => 'normal',
                'entity' => [
                    'type' => 'booking',
                    'id' => 'booking-test',
                ],
                'ctaUrl' => '/dashboard',
            ],
        ]);
    }
}
