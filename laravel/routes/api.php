<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\ChatConversationController;
use App\Http\Controllers\ChatMessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProviderController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\UploadController;
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
    Route::get('/google/redirect', [AuthController::class, 'googleRedirect']);
    Route::get('/google/callback', [AuthController::class, 'googleCallback']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::post('/users/{id}/provider-request', [UserController::class, 'requestProviderAccess']);

    Route::post('/providers', [ProviderController::class, 'store']);
    Route::put('/providers/{id}', [ProviderController::class, 'update']);

    Route::post('/services', [ServiceController::class, 'store']);
    Route::put('/services/{id}', [ServiceController::class, 'update']);
    Route::delete('/services/{id}', [ServiceController::class, 'destroy']);

    Route::post('/contracts', [ContractController::class, 'store']);
    Route::get('/contracts', [ContractController::class, 'index']);
    Route::put('/contracts/{id}', [ContractController::class, 'update']);

    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::put('/bookings/{id}', [BookingController::class, 'update']);
    Route::put('/events/{id}', [EventController::class, 'update']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);
    Route::post('/events', [EventController::class, 'store']);

    Route::get('/billing/provider/{providerId}', [BillingController::class, 'providerBilling']);
    Route::post('/billing/provider/{providerId}/pay', [BillingController::class, 'pay']);
    Route::get('/billing/admin/overview', [BillingController::class, 'adminOverview']);
    Route::patch('/billing/admin/config', [BillingController::class, 'updateConfig']);
    Route::post('/billing/admin/invoices/{invoiceId}/approve', [BillingController::class, 'approvePayment']);
    Route::post('/billing/admin/invoices/{invoiceId}/reject', [BillingController::class, 'rejectPayment']);

    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::get('/admin/interested-providers', [AdminController::class, 'interestedProviders']);
    Route::patch('/admin/marketplace-config', [AdminController::class, 'updateMarketplaceConfig']);
    Route::post('/admin/providers/{id}/verify', [AdminController::class, 'verifyProvider']);
    Route::post('/admin/providers/{id}/ban', [AdminController::class, 'banProvider']);
    Route::post('/admin/providers/{id}/unban', [AdminController::class, 'unbanProvider']);
    Route::post('/admin/users/{id}/ban', [AdminController::class, 'banUser']);
    Route::post('/admin/users/{id}/unban', [AdminController::class, 'unbanUser']);
    Route::post('/admin/users/{id}/archive', [AdminController::class, 'archiveUser']);
    Route::post('/admin/users/{id}/unarchive', [AdminController::class, 'unarchiveUser']);
    Route::post('/admin/users/{id}/provider-access/approve', [AdminController::class, 'approveProviderAccess']);
    Route::post('/admin/users/{id}/provider-access/revoke', [AdminController::class, 'revokeProviderAccess']);
    Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser']);

    Route::post('/upload-image', [UploadController::class, 'image']);

    Route::post('/reviews', [ReviewController::class, 'store']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{serviceId}', [FavoriteController::class, 'destroy']);

    Route::get('/chat/conversations', [ChatConversationController::class, 'index']);
    Route::post('/chat/conversations', [ChatConversationController::class, 'store']);
    Route::get('/chat/conversations/{id}', [ChatConversationController::class, 'show']);
    Route::patch('/chat/conversations/{id}/intervention', [ChatConversationController::class, 'requestIntervention']);

    Route::get('/chat/conversations/{conversationId}/messages', [ChatMessageController::class, 'index']);
    Route::post('/chat/conversations/{conversationId}/messages', [ChatMessageController::class, 'store']);
    Route::patch('/chat/conversations/{conversationId}/read', [ChatMessageController::class, 'markRead']);
});

Route::get('/users/{id}', [UserController::class, 'show']);
Route::get('/providers', [ProviderController::class, 'index']);
Route::get('/providers/user/{userId}', [ProviderController::class, 'showByUser']);
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{id}', [ServiceController::class, 'show']);
Route::get('/marketplace/config', [AdminController::class, 'marketplaceConfig']);
Route::get('/events', [EventController::class, 'index']);
Route::get('/billing/config', [BillingController::class, 'config']);
Route::get('/reviews', [ReviewController::class, 'index']);
