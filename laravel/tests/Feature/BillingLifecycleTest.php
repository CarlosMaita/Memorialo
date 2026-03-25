<?php

namespace Tests\Feature;

use App\Models\BillingInvoice;
use App\Models\BillingSetting;
use App\Models\Booking;
use App\Models\Contract;
use App\Models\Provider;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BillingLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_billing_cycle_command_completes_past_bookings_and_generates_previous_month_invoice(): void
    {
        Carbon::setTestNow('2026-04-02 03:00:00');

        $providerUser = User::factory()->create([
            'role' => 'provider',
            'is_provider' => true,
            'provider_request_status' => 'approved',
        ]);

        $provider = Provider::create([
            'user_id' => $providerUser->id,
            'business_name' => 'Estudio Andino',
            'category' => 'musica',
            'description' => 'Proveedor demo',
            'services' => [],
        ]);

        $providerUser->forceFill(['provider_id' => $provider->id])->save();

        $service = Service::create([
            'user_id' => $providerUser->id,
            'title' => 'Mariachi Real',
            'description' => 'Servicio musical',
            'category' => 'musica',
            'city' => 'Caracas',
            'price' => 5000,
            'duration' => 2,
            'is_active' => true,
            'bookings_completed' => 0,
        ]);

        $client = User::factory()->create([
            'role' => 'user',
            'is_provider' => false,
        ]);

        Contract::create([
            'id' => 'contract-billing-001',
            'booking_id' => 'booking-billing-001',
            'artist_id' => (string) $service->id,
            'artist_user_id' => (string) $providerUser->id,
            'artist_name' => 'Mariachi Real',
            'client_id' => (string) $client->id,
            'client_name' => 'Cliente Demo',
            'client_email' => 'cliente@example.com',
            'status' => 'active',
            'terms' => [
                'price' => 5000,
            ],
            'created_at' => Carbon::parse('2026-03-25 10:00:00'),
            'updated_at' => Carbon::parse('2026-03-25 10:00:00'),
        ]);

        Booking::create([
            'id' => 'booking-billing-001',
            'artist_id' => (string) $service->id,
            'artist_user_id' => (string) $providerUser->id,
            'artist_name' => 'Mariachi Real',
            'user_id' => (string) $client->id,
            'client_name' => 'Cliente Demo',
            'client_email' => 'cliente@example.com',
            'date' => '2026-03-25',
            'start_time' => '18:00',
            'duration' => 2,
            'event_type' => 'Boda',
            'location' => 'Caracas',
            'total_price' => 5000,
            'status' => 'confirmed',
            'contract_id' => 'contract-billing-001',
            'created_at' => Carbon::parse('2026-03-20 09:00:00'),
            'updated_at' => Carbon::parse('2026-03-20 09:00:00'),
        ]);

        BillingSetting::create([
            'closure_day' => 1,
            'payment_grace_days' => 5,
            'commission_rate' => 0.08,
        ]);

        $this->artisan('billing:run-cycle')
            ->assertExitCode(0);

        $this->assertDatabaseHas('bookings', [
            'id' => 'booking-billing-001',
            'status' => 'completed',
        ]);

        $this->assertDatabaseHas('contracts', [
            'id' => 'contract-billing-001',
            'status' => 'completed',
        ]);

        $this->assertDatabaseHas('billing_invoices', [
            'provider_id' => $provider->id,
            'month' => '2026-03',
            'status' => 'pending',
            'contract_count' => 1,
            'total_sales' => 5000,
            'amount' => 400,
        ]);
    }

    public function test_admin_can_approve_and_reject_submitted_payments(): void
    {
        $providerUser = User::factory()->create([
            'role' => 'provider',
            'is_provider' => true,
            'provider_request_status' => 'approved',
            'billing_suspended_at' => now(),
            'billing_suspension_reason' => 'Suspensión temporal por mora.',
        ]);

        $provider = Provider::create([
            'user_id' => $providerUser->id,
            'business_name' => 'Proveedor Suspendido',
            'category' => 'foto',
            'description' => 'Proveedor demo',
            'services' => [],
        ]);

        $providerUser->forceFill(['provider_id' => $provider->id])->save();

        $invoice = BillingInvoice::create([
            'provider_id' => $provider->id,
            'month' => '2026-03',
            'commission_rate' => 0.08,
            'contract_count' => 1,
            'total_sales' => 5000,
            'amount' => 400,
            'status' => 'submitted',
            'payment_reference' => 'PAY-001',
            'payment_submitted_at' => now(),
            'due_date' => now()->subDay(),
            'grace_period_end' => now()->subDay(),
            'generated_at' => now()->subDays(5),
        ]);

        $rejectedInvoice = BillingInvoice::create([
            'provider_id' => $provider->id,
            'month' => '2026-02',
            'commission_rate' => 0.08,
            'contract_count' => 1,
            'total_sales' => 2500,
            'amount' => 200,
            'status' => 'submitted',
            'payment_reference' => 'PAY-002',
            'payment_submitted_at' => now(),
            'due_date' => now()->subDays(15),
            'grace_period_end' => now()->subDays(15),
            'generated_at' => now()->subDays(20),
        ]);

        $admin = User::factory()->create([
            'role' => 'admin',
            'is_provider' => false,
        ]);

        Sanctum::actingAs($admin);

        $this->postJson('/api/billing/admin/invoices/'.$invoice->id.'/approve')
            ->assertOk()
            ->assertJsonPath('invoice.status', 'approved');

        $this->assertDatabaseHas('users', [
            'id' => $providerUser->id,
            'billing_suspended_at' => null,
        ]);

        $this->postJson('/api/billing/admin/invoices/'.$rejectedInvoice->id.'/reject', [
            'reason' => 'Comprobante ilegible',
        ])
            ->assertOk()
            ->assertJsonPath('invoice.status', 'rejected')
            ->assertJsonPath('invoice.paymentRejectionReason', 'Comprobante ilegible');
    }
}
