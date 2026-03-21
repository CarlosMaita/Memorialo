<?php

namespace App\Http\Controllers;

use App\Models\BillingInvoice;
use App\Models\Contract;
use App\Models\Provider;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    private const COMMISSION_RATE = 0.08;

    public function config(): JsonResponse
    {
        return response()->json([
            'commissionRate' => self::COMMISSION_RATE,
        ]);
    }

    public function providerBilling(Request $request, string $providerId): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $provider = Provider::find($providerId);

        if (! $provider) {
            return response()->json(['error' => 'Provider not found'], 404);
        }

        if ((string) $provider->user_id !== (string) $authUser->id && $authUser->role !== 'admin') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $currentMonth = now()->format('Y-m');
        $monthStart = now()->startOfMonth();
        $monthEnd = now()->copy()->startOfMonth()->addMonth();
        $serviceIds = Service::query()
            ->where('user_id', $provider->user_id)
            ->pluck('id')
            ->map(fn ($id) => (string) $id)
            ->all();

        $completedContracts = Contract::query()
            ->whereIn('artist_id', $serviceIds)
            ->where('status', 'completed')
            ->where(function ($query) use ($monthStart, $monthEnd) {
                $query
                    ->whereBetween('completed_at', [$monthStart, $monthEnd])
                    ->orWhere(function ($sub) use ($monthStart, $monthEnd) {
                        $sub->whereNull('completed_at')
                            ->whereBetween('created_at', [$monthStart, $monthEnd]);
                    });
            })
            ->get();

        $totalSales = $completedContracts->sum(function (Contract $contract): float {
            return (float) data_get($contract->terms, 'price', 0);
        });

        $storedInvoice = BillingInvoice::query()
            ->where('provider_id', $provider->id)
            ->where('month', $currentMonth)
            ->first();

        $currentInvoice = [
            'id' => "billing:invoice:{$provider->id}:{$currentMonth}",
            'providerId' => (string) $provider->id,
            'month' => $currentMonth,
            'commissionRate' => self::COMMISSION_RATE,
            'completedContracts' => $completedContracts->map(fn (Contract $contract) => [
                'contractId' => (string) $contract->id,
                'clientName' => $contract->client_name,
                'serviceName' => $contract->artist_name,
                'price' => (float) data_get($contract->terms, 'price', 0),
                'completedAt' => optional($contract->completed_at ?? $contract->created_at)?->toISOString(),
            ])->values()->all(),
            'totalSales' => (float) $totalSales,
            'commissionAmount' => (float) ($totalSales * self::COMMISSION_RATE),
            'status' => $storedInvoice?->status ?? ($totalSales > 0 ? 'pending' : 'empty'),
            'dueDate' => now()->startOfMonth()->addMonth()->setDay(15)->toISOString(),
            'gracePeriodEnd' => now()->startOfMonth()->addMonth()->setDay(20)->toISOString(),
            'paidAt' => optional($storedInvoice?->paid_at)?->toISOString(),
            'paymentReference' => $storedInvoice?->payment_reference,
            'generatedAt' => optional($storedInvoice?->generated_at ?? now())?->toISOString(),
        ];

        $history = BillingInvoice::query()
            ->where('provider_id', $provider->id)
            ->where('month', '!=', $currentMonth)
            ->orderByDesc('month')
            ->get()
            ->map(fn (BillingInvoice $invoice) => [
                'id' => "billing:invoice:{$invoice->provider_id}:{$invoice->month}",
                'providerId' => (string) $invoice->provider_id,
                'month' => $invoice->month,
                'commissionRate' => (float) $invoice->commission_rate,
                'completedContracts' => [],
                'totalSales' => 0,
                'commissionAmount' => (float) $invoice->amount,
                'status' => $invoice->status,
                'dueDate' => now()->startOfMonth()->setDate((int) substr($invoice->month, 0, 4), (int) substr($invoice->month, 5, 2), 15)->toISOString(),
                'paidAt' => optional($invoice->paid_at)?->toISOString(),
                'paymentReference' => $invoice->payment_reference,
                'generatedAt' => optional($invoice->generated_at ?? $invoice->created_at)?->toISOString(),
                'amount' => (float) $invoice->amount,
            ])
            ->values();

        return response()->json([
            'currentInvoice' => $currentInvoice,
            'history' => $history,
            'commissionRate' => self::COMMISSION_RATE,
        ]);
    }

    public function pay(Request $request, string $providerId): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $provider = Provider::find($providerId);

        if (! $provider) {
            return response()->json(['error' => 'Provider not found'], 404);
        }

        if ((string) $provider->user_id !== (string) $authUser->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'month' => ['required', 'regex:/^\d{4}-\d{2}$/'],
            'paymentReference' => ['sometimes', 'nullable', 'string', 'max:255'],
            'payment_reference' => ['sometimes', 'nullable', 'string', 'max:255'],
            'amount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ]);

        $paymentReference = $validated['paymentReference'] ?? $validated['payment_reference'] ?? ('PAY-'.now()->timestamp);

        $invoice = BillingInvoice::query()->updateOrCreate(
            [
                'provider_id' => $provider->id,
                'month' => $validated['month'],
            ],
            [
                'commission_rate' => self::COMMISSION_RATE,
                'amount' => $validated['amount'] ?? 0,
                'status' => 'paid',
                'paid_at' => now(),
                'payment_reference' => $paymentReference,
                'generated_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'invoice' => [
                'id' => "billing:invoice:{$invoice->provider_id}:{$invoice->month}",
                'providerId' => (string) $invoice->provider_id,
                'month' => $invoice->month,
                'commissionRate' => (float) $invoice->commission_rate,
                'amount' => (float) $invoice->amount,
                'status' => $invoice->status,
                'paidAt' => optional($invoice->paid_at)?->toISOString(),
                'paymentReference' => $invoice->payment_reference,
                'generatedAt' => optional($invoice->generated_at ?? $invoice->created_at)?->toISOString(),
            ],
        ]);
    }

    public function adminOverview(Request $request): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if ($authUser->role !== 'admin') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $currentMonth = now()->format('Y-m');

        $invoices = BillingInvoice::query()
            ->where('month', $currentMonth)
            ->get()
            ->map(fn (BillingInvoice $invoice) => [
                'id' => "billing:invoice:{$invoice->provider_id}:{$invoice->month}",
                'providerId' => (string) $invoice->provider_id,
                'month' => $invoice->month,
                'commissionRate' => (float) $invoice->commission_rate,
                'amount' => (float) $invoice->amount,
                'status' => $invoice->status,
                'paidAt' => optional($invoice->paid_at)?->toISOString(),
                'paymentReference' => $invoice->payment_reference,
                'generatedAt' => optional($invoice->generated_at ?? $invoice->created_at)?->toISOString(),
            ])
            ->values();

        $totalPending = $invoices->where('status', 'pending')->sum('amount');
        $totalCollected = $invoices->where('status', 'paid')->sum('amount');

        return response()->json([
            'currentMonth' => $currentMonth,
            'invoices' => $invoices,
            'totalPending' => (float) $totalPending,
            'totalCollected' => (float) $totalCollected,
        ]);
    }
}
