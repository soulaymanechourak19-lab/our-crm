<?php

use Modules\User\Http\Controllers\AuthController;
use Modules\User\Http\Controllers\UserController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\ChatbotController;
use App\Http\Controllers\ChatbotTrainingController;
use App\Http\Controllers\MLController;
use App\Http\Controllers\MLDataExportController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Combined routes for User Module + CRM Module + ML/AI.
|
*/

// ── Public routes ────────────────────────────────────────────────────────

Route::get('/test', function () {
    return response()->json(['message' => 'API is working']);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ── Internal ML Data Export (no auth — used by ml-service container) ─────
Route::get('/ml/export-features', [MLDataExportController::class, 'exportCustomerFeatures']);
Route::get('/ml/export-transactions', [MLDataExportController::class, 'exportTransactions']);

// ── Protected routes (require valid Sanctum token) ──────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // ── AI Chatbot ──────────────────────────────────────────────────────
    Route::post('/chatbot', [ChatbotController::class, 'chat']);

    // ── ML Predictions ──────────────────────────────────────────────────
    Route::post('/ml/churn/{customerId}',    [MLController::class, 'predictChurn']);
    Route::post('/ml/lead-score/{leadId}',   [MLController::class, 'scoreLead']);
    Route::post('/ml/segment/{customerId}',  [MLController::class, 'segmentCustomer']);
    Route::post('/ml/sentiment',             [MLController::class, 'analyzeSentiment']);
    Route::post('/ml/recommend/{customerId}',[MLController::class, 'recommend']);

    // Train all models (admin only)
    Route::post('/ml/train', [MLController::class, 'trainAll'])
         ->middleware('admin');

    // ML Health check
    Route::get('/ml/health', [MLController::class, 'health']);

    // ── User / Auth ─────────────────────────────────────────────────────
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // ── CRM: Leads ──────────────────────────────────────────────────────
    Route::apiResource('leads', LeadController::class);
    Route::put('/leads/{lead}/status', [LeadController::class, 'updateStatus']);
    Route::post('/leads/{lead}/convert', [LeadController::class, 'convert']);

    // ── Dashboard ───────────────────────────────────────────────────────
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);


    // ── CRM: Customers ──────────────────────────────────────────────────
    Route::apiResource('customers', CustomerController::class);
    Route::post('/customers/{customer}/interactions', [CustomerController::class, 'addInteraction']);
    Route::get('/customers/{customer}/interactions', [CustomerController::class, 'interactions']);

    // ── Chatbot Training (admin) ────────────────────────────────────
    Route::prefix('chatbot-training')->group(function () {
        Route::get('/intents', [ChatbotTrainingController::class, 'listIntents']);
        Route::post('/intents', [ChatbotTrainingController::class, 'createIntent']);
        Route::delete('/intents/{id}', [ChatbotTrainingController::class, 'deleteIntent']);
        Route::get('/intents/{id}/examples', [ChatbotTrainingController::class, 'listExamples']);
        Route::post('/intents/{id}/examples', [ChatbotTrainingController::class, 'addExamples']);
        Route::delete('/examples/{id}', [ChatbotTrainingController::class, 'deleteExample']);
        Route::post('/train', [ChatbotTrainingController::class, 'trainModel']);
        Route::post('/seed', [ChatbotTrainingController::class, 'seed']);
        Route::get('/model-info', [ChatbotTrainingController::class, 'modelInfo']);
        Route::post('/rollback', [ChatbotTrainingController::class, 'rollbackModel']);
        Route::get('/logs', [ChatbotTrainingController::class, 'logs']);
    });

    // ── Admin-only routes ───────────────────────────────────────────────
    Route::middleware('admin')->group(function () {
        Route::apiResource('users', UserController::class);
    });
});

Route::fallback(function () {
    return response()->json(['message' => 'Route not found'], 404);
});

