<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('billing_invoices', function (Blueprint $table) {
            $table->date('period_start')->nullable()->after('month');
            $table->date('period_end')->nullable()->after('period_start');
            $table->unsignedInteger('contract_count')->default(0)->after('commission_rate');
            $table->decimal('total_sales', 10, 2)->default(0)->after('contract_count');
            $table->timestamp('due_date')->nullable()->after('status');
            $table->timestamp('grace_period_end')->nullable()->after('due_date');
            $table->timestamp('payment_submitted_at')->nullable()->after('payment_reference');
            $table->timestamp('payment_reviewed_at')->nullable()->after('payment_submitted_at');
            $table->foreignId('payment_reviewed_by')->nullable()->after('payment_reviewed_at')->constrained('users')->nullOnDelete();
            $table->text('payment_rejection_reason')->nullable()->after('payment_reviewed_by');
            $table->json('billing_snapshot')->nullable()->after('payment_rejection_reason');
        });
    }

    public function down(): void
    {
        Schema::table('billing_invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('payment_reviewed_by');
            $table->dropColumn([
                'period_start',
                'period_end',
                'contract_count',
                'total_sales',
                'due_date',
                'grace_period_end',
                'payment_submitted_at',
                'payment_reviewed_at',
                'payment_rejection_reason',
                'billing_snapshot',
            ]);
        });
    }
};
