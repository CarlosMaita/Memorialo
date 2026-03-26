<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\ChatConversation;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PurgeExpiredChatsCommand extends Command
{
    protected $signature = 'chat:purge-expired';

    protected $description = 'Delete expired chat conversations and their stored images 30 days after the event date';

    public function handle(): int
    {
        $deletedCount = 0;

        ChatConversation::query()
            ->with(['messages.attachments'])
            ->get()
            ->each(function (ChatConversation $conversation) use (&$deletedCount): void {
                $expiresAt = $conversation->expires_at ?? $this->resolveExpirationFromBooking($conversation->booking_id);

                if (! $expiresAt || $expiresAt->isFuture()) {
                    return;
                }

                DB::transaction(function () use ($conversation): void {
                    foreach ($conversation->messages as $message) {
                        foreach ($message->attachments as $attachment) {
                            if ($attachment->storage_path !== '') {
                                Storage::disk('public')->delete($attachment->storage_path);
                            }
                        }
                    }

                    $conversation->delete();
                });

                $deletedCount++;
            });

        $this->info("Expired chats purged: {$deletedCount}");

        return self::SUCCESS;
    }

    private function resolveExpirationFromBooking(?string $bookingId): ?Carbon
    {
        if (! $bookingId) {
            return null;
        }

        $booking = Booking::query()->find($bookingId);

        if (! $booking || ! $booking->date) {
            return null;
        }

        return Carbon::parse($booking->date)->endOfDay()->addDays(30);
    }
}
