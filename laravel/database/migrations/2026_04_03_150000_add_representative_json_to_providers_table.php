<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('providers', function (Blueprint $table) {
            $table->json('representative')->nullable()->after('identification_number');
        });

        DB::table('providers')
            ->leftJoin('users', 'users.id', '=', 'providers.user_id')
            ->select([
                'providers.id',
                'providers.business_name',
                'providers.legal_entity_type',
                'providers.identification_number',
                'users.name as user_name',
            ])
            ->get()
            ->each(function ($provider): void {
                $type = $provider->legal_entity_type === 'company' ? 'company' : 'person';
                $defaultName = $type === 'company'
                    ? ($provider->business_name ?: $provider->user_name ?: 'Representante')
                    : ($provider->user_name ?: $provider->business_name ?: 'Representante');

                DB::table('providers')
                    ->where('id', $provider->id)
                    ->update([
                        'representative' => json_encode([
                            'type' => $type,
                            'name' => $defaultName,
                            'documentType' => $type === 'company' ? 'RIF' : 'CI',
                            'documentNumber' => $provider->identification_number,
                        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('providers', function (Blueprint $table) {
            $table->dropColumn('representative');
        });
    }
};
