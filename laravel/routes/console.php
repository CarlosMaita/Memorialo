<?php

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('app:ensure-admin', function () {
    $name = (string) env('ADMIN_DEFAULT_NAME', 'Administrador Memorialo');
    $email = (string) env('ADMIN_DEFAULT_EMAIL', 'admin@memorialo.local');
    $password = (string) env('ADMIN_DEFAULT_PASSWORD', 'Admin12345!');

    if (strlen($password) < 8) {
        $this->error('ADMIN_DEFAULT_PASSWORD debe tener al menos 8 caracteres.');
        return 1;
    }

    $user = User::query()->where('email', $email)->first();

    if (! $user) {
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'admin',
            'is_provider' => false,
            'banned' => false,
            'archived' => false,
        ]);

        $this->info("Administrador creado: {$email}");
        return 0;
    }

    $user->forceFill([
        'name' => $name,
        'password' => Hash::make($password),
        'role' => 'admin',
        'is_provider' => false,
        'banned' => false,
        'archived' => false,
    ])->save();

    $this->info("Administrador actualizado: {$email}");
    return 0;
})->purpose('Create or update the initial administrator account');

Schedule::command('chat:purge-expired')->dailyAt('02:30');
Schedule::command('billing:run-cycle')->dailyAt('03:00');
