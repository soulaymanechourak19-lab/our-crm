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
use App\Http\Controllers\LeadTrackingController;
use App\Http\Controllers\DiscountController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\EmailTemplateController;
use App\Http\Controllers\ReportController;
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

// ── Lead Website Tracking (Public) ──────────────────────────────────
Route::post('/tracking/event', [LeadTrackingController::class, 'track']);
Route::get('/tracking/script', [LeadTrackingController::class, 'generateScript']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ── Internal ML Data Export (no auth — used by ml-service container) ─────
Route::get('/ml/export-features', [MLDataExportController::class, 'exportCustomerFeatures']);
Route::get('/ml/export-transactions', [MLDataExportController::class, 'exportTransactions']);

// ── Public Support Chatbot (no auth — client-facing) ────────────────────
Route::post('/support/chat', [\App\Http\Controllers\SupportChatController::class, 'handle']);
Route::post('/support/ticket', [\App\Http\Controllers\SupportChatController::class, 'createTicket']);

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
    Route::get('/leads/nearby', [LeadController::class, 'nearby']);
    Route::put('/leads/{lead}/extend-expiration', [LeadController::class, 'extendExpiration']);
    Route::get('/leads/{lead}/tracking', [LeadTrackingController::class, 'getTrackingHistory']);
    
    Route::apiResource('leads', LeadController::class);
    Route::put('/leads/{lead}/status', [LeadController::class, 'updateStatus']);
    Route::post('/leads/{lead}/convert', [LeadController::class, 'convert']);

    // ── Dashboard ───────────────────────────────────────────────────────
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);


    // ── CRM: Customers ──────────────────────────────────────────────────
    Route::apiResource('customers', CustomerController::class);
    Route::post('/customers/{customer}/interactions', [CustomerController::class, 'addInteraction']);
    Route::get('/customers/{customer}/interactions', [CustomerController::class, 'interactions']);
    Route::get('/customers/{customer}/discounts', [DiscountController::class, 'customerDiscounts']);

    // ── CRM: Transactions (Simulated purchases) ─────────────────────────
    Route::post('/transactions', [TransactionController::class, 'store']);

    // ── CRM: Quotations ─────────────────────────────────────────────────
    Route::get('/quotations/stats', [QuotationController::class, 'stats']);
    Route::apiResource('quotations', QuotationController::class);
    Route::post('/quotations/{quotation}/send', [QuotationController::class, 'send']);
    Route::put('/quotations/{quotation}/status', [QuotationController::class, 'updateStatus']);
    Route::post('/quotations/{quotation}/convert', [QuotationController::class, 'convert']);
    Route::get('/quotations/{quotation}/pdf', [QuotationController::class, 'downloadPdf']);

    // ── CRM: Discounts ──────────────────────────────────────────────────
    Route::post('/discounts/validate', [DiscountController::class, 'validateCode']);
    Route::apiResource('discounts', DiscountController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

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

    // ── Tasks ────────────────────────────────────────────────────────
    Route::get('/tasks/my', [TaskController::class, 'myTasks']);
    Route::post('/tasks/{task}/complete', [TaskController::class, 'complete']);
    Route::apiResource('tasks', TaskController::class);

    // ── Analytics (BI Dashboard) ─────────────────────────────────────
    Route::prefix('analytics')->group(function () {
        Route::get('/overview', [AnalyticsController::class, 'overview']);
        Route::get('/funnel', [AnalyticsController::class, 'funnel']);
        Route::get('/revenue-by-product', [AnalyticsController::class, 'revenueByProduct']);
        Route::get('/revenue-by-rep', [AnalyticsController::class, 'revenueByRep']);
        Route::get('/revenue-trend', [AnalyticsController::class, 'revenueTrend']);
        Route::get('/customer-growth', [AnalyticsController::class, 'customerGrowth']);
        Route::get('/top-products', [AnalyticsController::class, 'topProducts']);
        Route::get('/activity-summary', [AnalyticsController::class, 'activitySummary']);
        Route::get('/source-performance', [AnalyticsController::class, 'sourcePerformance']);
        Route::get('/top-performers', [AnalyticsController::class, 'topPerformers']);
    });

    // ── Custom Reports ───────────────────────────────────────────────
    Route::post('/reports/generate', [ReportController::class, 'generate']);
    Route::get('/reports/export', [ReportController::class, 'export']);
    Route::apiResource('reports', ReportController::class)->only(['index', 'store', 'destroy']);

    // ── Email Templates ─────────────────────────────────────────────
    Route::get('/email-templates/merge-tags', [EmailTemplateController::class, 'mergeTags']);
    Route::post('/email-templates/{emailTemplate}/preview', [EmailTemplateController::class, 'preview']);
    Route::post('/email-templates/{emailTemplate}/send', [EmailTemplateController::class, 'send']);
    Route::apiResource('email-templates', EmailTemplateController::class);

    // ── Admin-only routes ───────────────────────────────────────────────
    Route::middleware('admin')->group(function () {
        Route::apiResource('users', UserController::class);

        // Audit logs
        Route::get('/audit-logs/export', [AuditController::class, 'export']);
        Route::get('/audit-logs', [AuditController::class, 'index']);
        Route::get('/audit-logs/{auditLog}', [AuditController::class, 'show']);
    });
});

Route::fallback(function () {
    return response()->json(['message' => 'Route not found'], 404);
});

