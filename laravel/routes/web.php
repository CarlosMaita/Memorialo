<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

use App\Http\Controllers\InterestedProviderController;
Route::post('/interested-providers', [InterestedProviderController::class, 'store'])->name('interested-providers.store');
