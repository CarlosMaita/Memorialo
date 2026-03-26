<?php

namespace App\Services;

use App\Models\BillingInvoice;
use App\Models\BillingSetting;
use App\Models\Booking;
use App\Models\Contract;
use App\Models\Provider;
use App\Models\Service;
use App\Models\User;
use App\Support\NotificationTypes;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class BillingCycleService
{
    public const DEFAULT_COMMISSION_RATE = 0.08;

    public const DEFAULT_CLOSURE_DAY = 1;

    public const DEFAULT_PAYMENT_GRACE_DAYS = 5;

    public function __construct(private NotificationDispatchService $notifications)
    {
    }

    public function getSettings(): BillingSetting
    {
        return BillingSetting::query()->firstOrCreate([], [
            'closure_day' => self::DEFAULT_CLOSURE_DAY,
            'payment_grace_days' => self::DEFAULT_PAYMENT_GRACE_DAYS,
            'commission_rate' => self::DEFAULT_COMMISSION_RATE,
        ]);
    }

    public function syncExpiredBookingsAndContracts(?CarbonInterface $asOf = null): array
    {
        $referenceTime = ($asOf ? Carbon::instance($asOf) : now())->copy();
        $completedBookings = 0;
        $completedContracts = 0;

        $bookings = Booking::query()
            ->where('status', 'confirmed')
            ->get();

        foreach ($bookings as $booking) {
            if (! $this->bookingDatePassed($booking, $referenceTime)) {
                continue;
            }

            $completedAt = $this->resolveBookingCompletionTimestamp($booking, $referenceTime);

            $booking->status = 'completed';
            $booking->save();
            $completedBookings++;

            if (! $booking->contract_id) {
                continue;
            }

            $contract = Contract::find($booking->contract_id);

            if (! $contract || in_array($contract->status, ['completed', 'cancelled'], true)) {
                continue;
            }

            $contract->status = 'completed';
            $contract->completed_at = $contract->completed_at ?? $completedAt;
            $contract->save();

            $this->incrementServiceBookings($contract->artist_id);
            $this->dispatchReviewRequest($contract);
            $completedContracts++;
        }

        return [
            'completedBookings' => $completedBookings,
            'completedContracts' => $completedContracts,
        ];
    }

    public function closeBillingCycles(?CarbonInterface $asOf = null): array
    {
        $referenceTime = ($asOf ? Carbon::instance($asOf) : now())->copy();
        $settings = $this->getSettings();
        $targetMonth = $this->resolveLatestClosableMonth($settings, $referenceTime);

        if (! $targetMonth || $settings->last_closed_month === $targetMonth) {
            return [
                'month' => $targetMonth,
                'created' => 0,
            ];
        }

        $created = 0;
        $providers = Provider::query()->get();

        foreach ($providers as $provider) {
            $result = $this->ensureInvoiceGenerated($provider, $targetMonth, $settings, $referenceTime);
            if ($result['created']) {
                $created++;
            }
        }

        $settings->last_closed_month = $targetMonth;
        $settings->save();

        return [
            'month' => $targetMonth,
            'created' => $created,
        ];
    }

    public function markOverdueInvoicesAndSuspendProviders(?CarbonInterface $asOf = null): array
    {
        $referenceTime = ($asOf ? Carbon::instance($asOf) : now())->copy();
        $overdueInvoices = BillingInvoice::query()
            ->whereIn('status', ['pending', 'rejected'])
            ->whereNotNull('due_date')
            ->where('due_date', '<', $referenceTime->copy()->startOfDay())
            ->get();

        $updatedInvoices = 0;
        $suspendedUsers = 0;

        foreach ($overdueInvoices as $invoice) {
            if ($invoice->status !== 'overdue') {
                $invoice->status = 'overdue';
                $invoice->save();
                $updatedInvoices++;
            }

            if ($this->suspendProviderForInvoice($invoice, $referenceTime)) {
                $suspendedUsers++;
            }
        }

        return [
            'overdueInvoices' => $updatedInvoices,
            'suspendedUsers' => $suspendedUsers,
        ];
    }

    public function buildOpenPeriodPreview(Provider $provider, ?CarbonInterface $asOf = null): array
    {
        $referenceTime = ($asOf ? Carbon::instance($asOf) : now())->copy();
        $settings = $this->getSettings();
        $previewMonth = $referenceTime->day < $settings->closure_day
            ? $referenceTime->copy()->subMonthNoOverflow()->format('Y-m')
            : $referenceTime->format('Y-m');

        return [
            'providerId' => (string) $provider->id,
            'providerName' => $provider->business_name,
            'commissionRate' => (float) $settings->commission_rate,
            ...$this->buildMonthSnapshot($provider, $previewMonth, (float) $settings->commission_rate),
        ];
    }

    public function submitInvoicePayment(BillingInvoice $invoice, ?string $paymentReference = null): BillingInvoice
    {
        $invoice->status = 'submitted';
        $invoice->payment_reference = $paymentReference ?: ('PAY-'.now()->timestamp);
        $invoice->payment_submitted_at = now();
        $invoice->payment_reviewed_at = null;
        $invoice->payment_reviewed_by = null;
        $invoice->payment_rejection_reason = null;
        $invoice->save();

        $providerUser = $this->resolveProviderUser($invoice->provider_id);
        if ($providerUser) {
            $this->notifications->dispatchToUser($providerUser, NotificationTypes::BILLING_PAYMENT_SUBMITTED, [
                'channels' => ['database'],
                'title' => 'Pago enviado para revisión',
                'body' => 'Tu comprobante de pago para la factura '.$invoice->month.' fue enviado al administrador.',
                'ctaUrl' => '/',
                'entity' => ['type' => 'billing_invoice', 'id' => (string) $invoice->id],
                'dedupeKey' => NotificationTypes::BILLING_PAYMENT_SUBMITTED.':'.$invoice->id.':'.$invoice->payment_reference,
            ]);
        }

        return $invoice->fresh();
    }

    public function approveInvoice(BillingInvoice $invoice, User $reviewer): BillingInvoice
    {
        $invoice->status = 'approved';
        $invoice->paid_at = now();
        $invoice->payment_reviewed_at = now();
        $invoice->payment_reviewed_by = $reviewer->id;
        $invoice->payment_rejection_reason = null;
        $invoice->save();

        $providerUser = $this->resolveProviderUser($invoice->provider_id);
        if ($providerUser && ! $this->providerHasOpenDelinquency($invoice->provider_id, $invoice->id)) {
            $providerUser->forceFill([
                'billing_suspended_at' => null,
                'billing_suspension_reason' => null,
            ])->save();

            $this->notifications->dispatchToUser($providerUser, NotificationTypes::BILLING_PAYMENT_APPROVED, [
                'channels' => ['database', 'mail'],
                'title' => 'Pago aprobado',
                'body' => 'Tu pago de la factura '.$invoice->month.' fue aprobado. Tu cuenta está solvente.',
                'mailSubject' => 'Pago aprobado en Memorialo',
                'mailBody' => "Tu pago de la factura {$invoice->month} fue aprobado correctamente. Si tu cuenta estaba suspendida por mora, ya fue reactivada.\n",
                'ctaUrl' => '/',
                'entity' => ['type' => 'billing_invoice', 'id' => (string) $invoice->id],
                'dedupeKey' => NotificationTypes::BILLING_PAYMENT_APPROVED.':'.$invoice->id,
            ]);
        }

        return $invoice->fresh();
    }

    public function rejectInvoice(BillingInvoice $invoice, User $reviewer, string $reason): BillingInvoice
    {
        $invoice->status = 'rejected';
        $invoice->payment_reviewed_at = now();
        $invoice->payment_reviewed_by = $reviewer->id;
        $invoice->payment_rejection_reason = $reason;
        $invoice->save();

        $providerUser = $this->resolveProviderUser($invoice->provider_id);
        if ($providerUser) {
            $this->notifications->dispatchToUser($providerUser, NotificationTypes::BILLING_PAYMENT_REJECTED, [
                'channels' => ['database', 'mail'],
                'title' => 'Pago rechazado',
                'body' => 'El administrador rechazó tu pago de la factura '.$invoice->month.'. Puedes registrar un nuevo pago.',
                'mailSubject' => 'Pago rechazado en Memorialo',
                'mailBody' => "Tu pago de la factura {$invoice->month} fue rechazado. Motivo: {$reason}\n\nPuedes volver a registrar un comprobante desde la sección de facturación.\n",
                'ctaUrl' => '/',
                'entity' => ['type' => 'billing_invoice', 'id' => (string) $invoice->id],
                'dedupeKey' => NotificationTypes::BILLING_PAYMENT_REJECTED.':'.$invoice->id.':'.md5($reason),
            ]);
        }

        return $invoice->fresh();
    }

    public function formatInvoice(BillingInvoice $invoice): array
    {
        $snapshot = is_array($invoice->billing_snapshot) ? $invoice->billing_snapshot : [];
        $provider = $invoice->relationLoaded('provider') ? $invoice->provider : $invoice->provider()->first();
        $providerUser = $provider?->user_id ? User::find($provider->user_id) : null;

        return [
            'id' => (string) $invoice->id,
            'providerId' => (string) $invoice->provider_id,
            'providerName' => $provider?->business_name,
            'providerUserId' => $provider?->user_id ? (string) $provider->user_id : null,
            'providerUserName' => $providerUser?->name,
            'month' => $invoice->month,
            'periodStart' => optional($invoice->period_start)?->toDateString(),
            'periodEnd' => optional($invoice->period_end)?->toDateString(),
            'commissionRate' => (float) $invoice->commission_rate,
            'completedContracts' => array_values($snapshot['completedContracts'] ?? []),
            'contractCount' => (int) ($invoice->contract_count ?? ($snapshot['contractCount'] ?? 0)),
            'totalSales' => (float) ($invoice->total_sales ?? ($snapshot['totalSales'] ?? 0)),
            'commissionAmount' => (float) $invoice->amount,
            'amount' => (float) $invoice->amount,
            'status' => $invoice->status,
            'dueDate' => optional($invoice->due_date)?->toISOString(),
            'gracePeriodEnd' => optional($invoice->grace_period_end)?->toISOString(),
            'paymentReference' => $invoice->payment_reference,
            'paymentSubmittedAt' => optional($invoice->payment_submitted_at)?->toISOString(),
            'paidAt' => optional($invoice->paid_at)?->toISOString(),
            'paymentReviewedAt' => optional($invoice->payment_reviewed_at)?->toISOString(),
            'paymentReviewedBy' => $invoice->payment_reviewed_by ? (string) $invoice->payment_reviewed_by : null,
            'paymentRejectionReason' => $invoice->payment_rejection_reason,
            'generatedAt' => optional($invoice->generated_at ?? $invoice->created_at)?->toISOString(),
        ];
    }

    public function resolveNextClosureDate(?CarbonInterface $asOf = null): Carbon
    {
        $referenceTime = ($asOf ? Carbon::instance($asOf) : now())->copy();
        $settings = $this->getSettings();
        $closureDay = max(1, min(28, (int) $settings->closure_day));

        if ($referenceTime->day < $closureDay) {
            return $referenceTime->copy()->startOfMonth()->day($closureDay);
        }

        $nextMonth = $referenceTime->copy()->startOfMonth()->addMonth();

        return $nextMonth->day(min($closureDay, $nextMonth->daysInMonth));
    }

    private function ensureInvoiceGenerated(Provider $provider, string $month, BillingSetting $settings, CarbonInterface $generatedAt): array
    {
        $existingInvoice = BillingInvoice::query()
            ->where('provider_id', $provider->id)
            ->where('month', $month)
            ->first();

        if ($existingInvoice) {
            return [
                'invoice' => $existingInvoice,
                'created' => false,
            ];
        }

        $snapshot = $this->buildMonthSnapshot($provider, $month, (float) $settings->commission_rate);
        $periodStart = Carbon::createFromFormat('Y-m-d', $month.'-01')->startOfMonth();
        $periodEnd = $periodStart->copy()->endOfMonth();
        $dueDate = $generatedAt->copy()->addDays((int) $settings->payment_grace_days);

        $invoice = BillingInvoice::create([
            'provider_id' => $provider->id,
            'month' => $month,
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'commission_rate' => (float) $settings->commission_rate,
            'contract_count' => $snapshot['contractCount'],
            'total_sales' => $snapshot['totalSales'],
            'amount' => $snapshot['commissionAmount'],
            'status' => $snapshot['commissionAmount'] > 0 ? 'pending' : 'empty',
            'due_date' => $dueDate,
            'grace_period_end' => $dueDate,
            'generated_at' => $generatedAt,
            'billing_snapshot' => $snapshot,
        ]);

        $providerUser = $this->resolveProviderUser($provider->id);
        if ($providerUser && $snapshot['commissionAmount'] > 0) {
            $this->notifications->dispatchToUser($providerUser, NotificationTypes::BILLING_INVOICE_GENERATED, [
                'channels' => ['database', 'mail'],
                'title' => 'Nueva factura mensual disponible',
                'body' => 'Ya está disponible tu factura del periodo '.$month.'. Tienes '.$settings->payment_grace_days.' días para registrar el pago.',
                'mailSubject' => 'Nueva factura mensual en Memorialo',
                'mailBody' => "Se generó tu factura mensual correspondiente al periodo {$month}.\n\nMonto: {$snapshot['commissionAmount']} USD\nFecha límite: {$dueDate->toDateString()}\n",
                'ctaUrl' => '/',
                'entity' => ['type' => 'billing_invoice', 'id' => (string) $invoice->id],
                'dedupeKey' => NotificationTypes::BILLING_INVOICE_GENERATED.':'.$invoice->id,
            ]);
        }

        return [
            'invoice' => $invoice,
            'created' => true,
        ];
    }

    private function buildMonthSnapshot(Provider $provider, string $month, float $commissionRate): array
    {
        $periodStart = Carbon::createFromFormat('Y-m-d', $month.'-01')->startOfMonth();
        $periodEnd = $periodStart->copy()->addMonth();
        $serviceIds = Service::query()
            ->where('user_id', $provider->user_id)
            ->pluck('id')
            ->map(fn ($id) => (string) $id)
            ->all();

        $completedContracts = Contract::query()
            ->whereIn('artist_id', $serviceIds)
            ->where('status', 'completed')
            ->where(function ($query) use ($periodStart, $periodEnd) {
                $query
                    ->whereBetween('completed_at', [$periodStart, $periodEnd])
                    ->orWhere(function ($sub) use ($periodStart, $periodEnd) {
                        $sub->whereNull('completed_at')
                            ->whereBetween('created_at', [$periodStart, $periodEnd]);
                    });
            })
            ->get();

        $entries = $completedContracts->map(fn (Contract $contract) => [
            'contractId' => (string) $contract->id,
            'clientName' => $contract->client_name,
            'serviceName' => $contract->artist_name,
            'price' => (float) data_get($contract->terms, 'price', 0),
            'completedAt' => optional($contract->completed_at ?? $contract->created_at)?->toISOString(),
        ])->values()->all();

        $totalSales = (float) $completedContracts->sum(fn (Contract $contract) => (float) data_get($contract->terms, 'price', 0));

        return [
            'month' => $month,
            'completedContracts' => $entries,
            'contractCount' => count($entries),
            'totalSales' => $totalSales,
            'commissionAmount' => round($totalSales * $commissionRate, 2),
        ];
    }

    private function resolveLatestClosableMonth(BillingSetting $settings, CarbonInterface $asOf): ?string
    {
        $closureDay = max(1, min(28, (int) $settings->closure_day));

        return $asOf->day >= $closureDay
            ? $asOf->copy()->subMonthNoOverflow()->format('Y-m')
            : $asOf->copy()->subMonthsNoOverflow(2)->format('Y-m');
    }

    private function bookingDatePassed(Booking $booking, CarbonInterface $asOf): bool
    {
        if (! $booking->date) {
            return false;
        }

        try {
            return Carbon::parse($booking->date)->endOfDay()->lt($asOf);
        } catch (\Throwable) {
            return false;
        }
    }

    private function resolveBookingCompletionTimestamp(Booking $booking, CarbonInterface $fallback): Carbon
    {
        try {
            $bookingDate = Carbon::parse($booking->date);

            if ($booking->start_time) {
                $dateTime = Carbon::parse($booking->date.' '.$booking->start_time);

                if ($booking->duration) {
                    return $dateTime->addHours((int) $booking->duration);
                }

                return $dateTime;
            }

            return $bookingDate->endOfDay();
        } catch (\Throwable) {
            return Carbon::instance($fallback);
        }
    }

    private function dispatchReviewRequest(Contract $contract): void
    {
        $clientUser = $this->resolveUserById($contract->client_id);

        if (! $clientUser) {
            return;
        }

        $this->notifications->dispatchToUser($clientUser, NotificationTypes::REVIEW_REQUESTED, [
            'channels' => ['database'],
            'title' => 'Deja tu reseña del servicio',
            'body' => 'Tu servicio con '.$contract->artist_name.' fue marcado como completado. Comparte tu experiencia.',
            'ctaUrl' => '/',
            'entity' => ['type' => 'contract', 'id' => (string) $contract->id],
            'dedupeKey' => NotificationTypes::REVIEW_REQUESTED.':'.$contract->id,
        ]);
    }

    private function incrementServiceBookings(?string $artistId): void
    {
        if (! $artistId || ! ctype_digit($artistId)) {
            return;
        }

        Service::query()->where('id', (int) $artistId)->increment('bookings_completed');
    }

    private function suspendProviderForInvoice(BillingInvoice $invoice, CarbonInterface $referenceTime): bool
    {
        $providerUser = $this->resolveProviderUser($invoice->provider_id);

        if (! $providerUser || $providerUser->billing_suspended_at) {
            return false;
        }

        $reason = 'Suspensión temporal por mora en la factura '.$invoice->month.'.';

        $providerUser->forceFill([
            'billing_suspended_at' => $referenceTime,
            'billing_suspension_reason' => $reason,
        ])->save();

        $this->notifications->dispatchToUser($providerUser, NotificationTypes::BILLING_ACCOUNT_SUSPENDED, [
            'channels' => ['database', 'mail'],
            'title' => 'Cuenta suspendida por mora',
            'body' => 'Tu cuenta fue suspendida temporalmente por falta de pago de la factura '.$invoice->month.'.',
            'mailSubject' => 'Cuenta suspendida por mora',
            'mailBody' => "Tu cuenta fue suspendida temporalmente porque la factura {$invoice->month} venció sin pago aprobado.\n\nLa cuenta se reactivará cuando el administrador confirme tu pago.\n",
            'ctaUrl' => '/',
            'entity' => ['type' => 'billing_invoice', 'id' => (string) $invoice->id],
            'dedupeKey' => NotificationTypes::BILLING_ACCOUNT_SUSPENDED.':'.$invoice->id,
        ]);

        return true;
    }

    private function providerHasOpenDelinquency(int|string $providerId, int|string|null $exceptInvoiceId = null): bool
    {
        return BillingInvoice::query()
            ->where('provider_id', $providerId)
            ->when($exceptInvoiceId, fn ($query) => $query->where('id', '!=', $exceptInvoiceId))
            ->whereIn('status', ['overdue'])
            ->exists();
    }

    private function resolveProviderUser(int|string $providerId): ?User
    {
        $provider = Provider::find($providerId);

        if (! $provider) {
            return null;
        }

        return User::find($provider->user_id);
    }

    private function resolveUserById(?string $userId): ?User
    {
        if (! $userId || ! ctype_digit($userId)) {
            return null;
        }

        return User::find((int) $userId);
    }
}
