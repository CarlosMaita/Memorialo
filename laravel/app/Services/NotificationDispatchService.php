<?php

namespace App\Services;

use App\Models\NotificationDelivery;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class NotificationDispatchService
{
    public function dispatchToUser(User $recipient, string $type, array $payload): void
    {
        $channels = $payload['channels'] ?? ['database'];
        $dedupeKey = (string) ($payload['dedupeKey'] ?? ($type.':'.$recipient->id.':'.Str::uuid()));
        $recipientKey = 'user:'.$recipient->id;
        $notificationId = null;

        if (in_array('database', $channels, true)) {
            $notificationId = $this->sendDatabaseNotification($recipient, $type, $payload, $dedupeKey, $recipientKey);
        }

        if (in_array('mail', $channels, true)) {
            $this->sendMailNotification($recipient, $type, $payload, $dedupeKey, $recipientKey, $notificationId);
        }
    }

    private function sendDatabaseNotification(User $recipient, string $type, array $payload, string $dedupeKey, string $recipientKey): ?string
    {
        if ($this->deliveryExists($dedupeKey, 'database', $recipientKey)) {
            return NotificationDelivery::query()
                ->where('dedupe_key', $dedupeKey)
                ->where('channel', 'database')
                ->where('recipient_key', $recipientKey)
                ->value('notification_id');
        }

        $notificationId = (string) Str::uuid();

        $recipient->notifications()->create([
            'id' => $notificationId,
            'type' => $type,
            'data' => [
                'notificationType' => $type,
                'title' => $payload['title'] ?? '',
                'body' => $payload['body'] ?? '',
                'priority' => $payload['priority'] ?? 'normal',
                'actor' => $payload['actor'] ?? null,
                'entity' => $payload['entity'] ?? null,
                'ctaUrl' => $payload['ctaUrl'] ?? null,
                'channels' => $payload['channels'] ?? ['database'],
                'dedupeKey' => $dedupeKey,
                'meta' => $payload['meta'] ?? null,
            ],
        ]);

        NotificationDelivery::create([
            'notification_id' => $notificationId,
            'notification_type' => $type,
            'recipient_user_id' => $recipient->id,
            'recipient_email' => $recipient->email,
            'recipient_key' => $recipientKey,
            'channel' => 'database',
            'status' => 'sent',
            'dedupe_key' => $dedupeKey,
            'provider' => 'database',
            'sent_at' => now(),
        ]);

        return $notificationId;
    }

    private function sendMailNotification(User $recipient, string $type, array $payload, string $dedupeKey, string $recipientKey, ?string $notificationId): void
    {
        if ($this->deliveryExists($dedupeKey, 'mail', $recipientKey)) {
            return;
        }

        if (! (bool) env('NOTIFICATIONS_MAIL_ENABLED', true)) {
            $this->recordSkippedDelivery($notificationId, $type, $recipient, $recipientKey, $dedupeKey, 'mail', 'disabled');
            return;
        }

        if (! $recipient->email) {
            $this->recordSkippedDelivery($notificationId, $type, $recipient, $recipientKey, $dedupeKey, 'mail', 'missing_email');
            return;
        }

        try {
            Mail::raw($payload['mailBody'] ?? $payload['body'] ?? '', function ($message) use ($recipient, $payload): void {
                $message
                    ->to($recipient->email, $recipient->name)
                    ->subject($payload['mailSubject'] ?? $payload['title'] ?? 'Nueva notificacion');
            });

            NotificationDelivery::create([
                'notification_id' => $notificationId,
                'notification_type' => $type,
                'recipient_user_id' => $recipient->id,
                'recipient_email' => $recipient->email,
                'recipient_key' => $recipientKey,
                'channel' => 'mail',
                'status' => 'sent',
                'dedupe_key' => $dedupeKey,
                'provider' => (string) config('mail.default', 'smtp'),
                'sent_at' => now(),
            ]);
        } catch (Throwable $exception) {
            NotificationDelivery::create([
                'notification_id' => $notificationId,
                'notification_type' => $type,
                'recipient_user_id' => $recipient->id,
                'recipient_email' => $recipient->email,
                'recipient_key' => $recipientKey,
                'channel' => 'mail',
                'status' => 'failed',
                'dedupe_key' => $dedupeKey,
                'provider' => (string) config('mail.default', 'smtp'),
                'failed_at' => now(),
                'error_message' => Str::limit($exception->getMessage(), 65535, ''),
            ]);

            Log::error('Notification mail delivery failed', [
                'type' => $type,
                'recipient_user_id' => $recipient->id,
                'recipient_email' => $recipient->email,
                'dedupe_key' => $dedupeKey,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function deliveryExists(string $dedupeKey, string $channel, string $recipientKey): bool
    {
        return NotificationDelivery::query()
            ->where('dedupe_key', $dedupeKey)
            ->where('channel', $channel)
            ->where('recipient_key', $recipientKey)
            ->exists();
    }

    private function recordSkippedDelivery(?string $notificationId, string $type, User $recipient, string $recipientKey, string $dedupeKey, string $channel, string $reason): void
    {
        NotificationDelivery::firstOrCreate([
            'dedupe_key' => $dedupeKey,
            'channel' => $channel,
            'recipient_key' => $recipientKey,
        ], [
            'notification_id' => $notificationId,
            'notification_type' => $type,
            'recipient_user_id' => $recipient->id,
            'recipient_email' => $recipient->email,
            'status' => 'skipped',
            'provider' => (string) config('mail.default', 'smtp'),
            'error_message' => $reason,
        ]);
    }
}
