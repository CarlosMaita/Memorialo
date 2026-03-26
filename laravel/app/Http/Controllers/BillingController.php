<?php

namespace App\Http\Controllers;

use App\Models\BillingInvoice;
use App\Models\BillingSetting;
use App\Models\Provider;
use App\Services\BillingCycleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    public function __construct(private BillingCycleService $billingCycles)
    {
    }

    public function config(): JsonResponse
    {
        $settings = $this->billingCycles->getSettings();

        return response()->json($this->formatSettings($settings));
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

        $settings = $this->billingCycles->getSettings();
        $latestInvoice = BillingInvoice::query()
            ->where('provider_id', $provider->id)
            ->orderByDesc('month')
            ->first();

        $history = BillingInvoice::query()
            ->where('provider_id', $provider->id)
            ->when($latestInvoice, fn ($query) => $query->where('id', '!=', $latestInvoice->id))
            ->orderByDesc('month')
            ->get()
            ->map(fn (BillingInvoice $invoice) => $this->billingCycles->formatInvoice($invoice))
            ->values();

        return response()->json([
            'settings' => $this->formatSettings($settings),
            'currentInvoice' => $latestInvoice ? $this->billingCycles->formatInvoice($latestInvoice) : null,
            'history' => $history,
            'preview' => $this->billingCycles->buildOpenPeriodPreview($provider),
            'commissionRate' => (float) $settings->commission_rate,
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
        ]);

        $invoice = BillingInvoice::query()
            ->where('provider_id', $provider->id)
            ->where('month', $validated['month'])
            ->first();

        if (! $invoice) {
            return response()->json(['error' => 'Invoice not found for the requested month'], 404);
        }

        if (in_array($invoice->status, ['approved', 'submitted', 'empty'], true)) {
            return response()->json(['error' => 'Invoice cannot accept a new payment at this stage'], 422);
        }

        $paymentReference = $validated['paymentReference'] ?? $validated['payment_reference'] ?? null;
        $invoice = $this->billingCycles->submitInvoicePayment($invoice, $paymentReference);

        return response()->json([
            'success' => true,
            'invoice' => $this->billingCycles->formatInvoice($invoice),
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

        $settings = $this->billingCycles->getSettings();
        $selectedMonth = $request->query('month');
        $invoicesQuery = BillingInvoice::query()
            ->with('provider')
            ->orderByDesc('month')
            ->orderByDesc('generated_at');

        if (is_string($selectedMonth) && preg_match('/^\d{4}-\d{2}$/', $selectedMonth)) {
            $invoicesQuery->where('month', $selectedMonth);
        }

        $invoices = $invoicesQuery
            ->get()
            ->map(fn (BillingInvoice $invoice) => $this->billingCycles->formatInvoice($invoice))
            ->values();

        $months = BillingInvoice::query()
            ->select('month')
            ->distinct()
            ->orderByDesc('month')
            ->pluck('month')
            ->values();

        return response()->json([
            'settings' => $this->formatSettings($settings),
            'currentMonth' => now()->format('Y-m'),
            'selectedMonth' => $selectedMonth,
            'months' => $months,
            'invoices' => $invoices,
            'paymentQueue' => $invoices->where('status', 'submitted')->values(),
            'totalOutstanding' => (float) $invoices->whereIn('status', ['pending', 'rejected', 'overdue'])->sum('amount'),
            'totalPendingApproval' => (float) $invoices->where('status', 'submitted')->sum('amount'),
            'totalCollected' => (float) $invoices->where('status', 'approved')->sum('amount'),
        ]);
    }

    public function updateConfig(Request $request): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if ($authUser->role !== 'admin') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'closureDay' => ['required', 'integer', 'min:1', 'max:28'],
        ]);

        $settings = $this->billingCycles->getSettings();
        $settings->closure_day = (int) $validated['closureDay'];
        $settings->save();

        return response()->json([
            'settings' => $this->formatSettings($settings),
        ]);
    }

    public function approvePayment(Request $request, string $invoiceId): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if ($authUser->role !== 'admin') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $invoice = BillingInvoice::find($invoiceId);

        if (! $invoice) {
            return response()->json(['error' => 'Invoice not found'], 404);
        }

        if ($invoice->status !== 'submitted') {
            return response()->json(['error' => 'Only submitted payments can be approved'], 422);
        }

        $invoice = $this->billingCycles->approveInvoice($invoice, $authUser);

        return response()->json([
            'success' => true,
            'invoice' => $this->billingCycles->formatInvoice($invoice),
        ]);
    }

    public function rejectPayment(Request $request, string $invoiceId): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if ($authUser->role !== 'admin') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:2000'],
        ]);

        $invoice = BillingInvoice::find($invoiceId);

        if (! $invoice) {
            return response()->json(['error' => 'Invoice not found'], 404);
        }

        if ($invoice->status !== 'submitted') {
            return response()->json(['error' => 'Only submitted payments can be rejected'], 422);
        }

        $invoice = $this->billingCycles->rejectInvoice($invoice, $authUser, $validated['reason']);

        return response()->json([
            'success' => true,
            'invoice' => $this->billingCycles->formatInvoice($invoice),
        ]);
    }

    private function formatSettings(BillingSetting $settings): array
    {
        return [
            'commissionRate' => (float) $settings->commission_rate,
            'closureDay' => (int) $settings->closure_day,
            'paymentGraceDays' => (int) $settings->payment_grace_days,
            'nextClosureDate' => $this->billingCycles->resolveNextClosureDate()->toISOString(),
            'lastClosedMonth' => $settings->last_closed_month,
        ];
    }
}
