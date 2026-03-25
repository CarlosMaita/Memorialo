<?php

namespace App\Console\Commands;

use App\Services\BillingCycleService;
use Illuminate\Console\Command;

class RunBillingCycleCommand extends Command
{
    protected $signature = 'billing:run-cycle';

    protected $description = 'Auto-complete past bookings, close monthly invoices, and suspend overdue providers';

    public function __construct(private BillingCycleService $billingCycles)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $completed = $this->billingCycles->syncExpiredBookingsAndContracts();
        $closed = $this->billingCycles->closeBillingCycles();
        $overdue = $this->billingCycles->markOverdueInvoicesAndSuspendProviders();

        $this->info('Billing cycle executed successfully.');
        $this->line('Bookings completed: '.$completed['completedBookings']);
        $this->line('Contracts completed: '.$completed['completedContracts']);
        $this->line('Invoices generated: '.$closed['created']);
        $this->line('Invoices marked overdue: '.$overdue['overdueInvoices']);
        $this->line('Users suspended: '.$overdue['suspendedUsers']);

        return self::SUCCESS;
    }
}
