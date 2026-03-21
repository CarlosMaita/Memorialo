<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProviderController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'laravel-api',
    ]);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('/auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::put('/users/{id}', [UserController::class, 'update']);

    Route::post('/providers', [ProviderController::class, 'store']);
    Route::put('/providers/{id}', [ProviderController::class, 'update']);

    Route::post('/services', [ServiceController::class, 'store']);
    Route::put('/services/{id}', [ServiceController::class, 'update']);
    Route::delete('/services/{id}', [ServiceController::class, 'destroy']);
});

Route::get('/users/{id}', [UserController::class, 'show']);
Route::get('/providers', [ProviderController::class, 'index']);
Route::get('/providers/user/{userId}', [ProviderController::class, 'showByUser']);
Route::get('/services', [ServiceController::class, 'index']);
