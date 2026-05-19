<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\MarketplaceSetting;
use App\Models\Service;
use App\Models\User;
use App\Services\NotificationDispatchService;
use App\Support\NotificationTypes;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendProviderEventRemindersCommand extends Command
{
    protected $signature = 'notifications:send-provider-event-reminders {--hours=}';

    protected $description = 'Send configurable pre-event reminders to providers';

    public function __construct(private NotificationDispatchService $notifications)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $hours = $this->resolveReminderHours();
        $windowStart = now()->addHours($hours)->startOfMinute();
        $windowEnd = $windowStart->copy()->addHour();
        $scanned = 0;
        $sent = 0;

        Booking::query()
            ->where('status', 'confirmed')
            ->whereNotNull('date')
            ->get()
            ->each(function (Booking $booking) use ($hours, $windowStart, $windowEnd, &$scanned, &$sent): void {
                $scanned++;
                $eventAt = $this->resolveEventDateTime($booking);

                if (! $eventAt || $eventAt->lt($windowStart) || $eventAt->gte($windowEnd)) {
                    return;
                }

                $providerUser = $this->resolveProviderUser($booking);
                if (! $providerUser) {
                    return;
                }

                $hoursLabel = $hours.' '.($hours === 1 ? 'hora' : 'horas');
                $serviceName = $booking->artist_name ?: 'tu servicio';
                $clientName = $booking->client_name ?: 'tu cliente';

                $this->notifications->dispatchToUser($providerUser, NotificationTypes::PROVIDER_EVENT_REMINDER, [
                    'channels' => ['database', 'mail'],
                    'title' => 'Recordatorio de evento próximo',
                    'body' => "Tu evento \"{$serviceName}\" es en {$hoursLabel}.",
                    'mailSubject' => 'Recordatorio de evento en Memorialo',
                    'mailBody' => "Hola {$providerUser->name},\n\nTe recordamos que tu compromiso de servicio con {$clientName} es en {$hoursLabel}.\n\nEvento: {$serviceName}\nFecha: {$booking->date}\nHora: ".($booking->start_time ?: 'Por definir')."\nUbicación: ".($booking->location ?: 'No definida')."\n",
                    'ctaUrl' => '/mi-negocio/negociaciones',
                    'entity' => ['type' => 'booking', 'id' => (string) $booking->id],
                    'dedupeKey' => NotificationTypes::PROVIDER_EVENT_REMINDER.':'.$booking->id.':'.$hours,
                ]);
                $sent++;
            });

        $this->info("Bookings scanned: {$scanned}");
        $this->info("Provider reminders sent: {$sent}");

        return self::SUCCESS;
    }

    private function resolveReminderHours(): int
    {
        $fromOption = $this->option('hours');
        if (is_numeric($fromOption)) {
            $value = (int) $fromOption;
            if ($value > 0) {
                return $value;
            }
        }

        $configured = (int) (MarketplaceSetting::query()->value('provider_event_reminder_hours') ?? 48);

        return $configured > 0 ? $configured : 48;
    }

    private function resolveEventDateTime(Booking $booking): ?Carbon
    {
        if (! $booking->date) {
            return null;
        }

        $time = trim((string) ($booking->start_time ?? ''));

        try {
            return Carbon::parse(trim($booking->date.' '.($time !== '' ? $time : '00:00:00')));
        } catch (\Throwable) {
            try {
                return Carbon::parse($booking->date);
            } catch (\Throwable) {
                return null;
            }
        }
    }

    private function resolveProviderUser(Booking $booking): ?User
    {
        if ($booking->artist_user_id && ctype_digit((string) $booking->artist_user_id)) {
            return User::find((int) $booking->artist_user_id);
        }

        if ($booking->artist_id && ctype_digit((string) $booking->artist_id)) {
            $service = Service::find((int) $booking->artist_id);
            if ($service && $service->user_id) {
                return User::find((int) $service->user_id);
            }
        }

        return null;
    }
}
