<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Modules\User\Entities\Customer;

class MLDataExportController extends Controller
{
    /**
     * Export all customers with engineered features for ML model training.
     * This endpoint is PUBLIC (no auth) — intended for internal ml-service calls.
     */
    public function exportCustomerFeatures(Request $request)
    {
        $limit = $request->query('limit', 0);
        
        $query = Customer::with(['transactions', 'campaigns']);
        
        if ($limit > 0) {
            $query->limit((int)$limit);
        }

        $customers = $query->get();

        $dataset = $customers->map(function ($customer) {
            $rfm = $customer->getRFMScore();
            $engagement = $customer->getEngagementRate();
            
            // Churn label: customer is "churned" if they haven't purchased in 90+ days
            // AND have low engagement
            $isChurned = ($rfm['recency'] > 90 && $rfm['frequency'] < 3) ? 1 : 0;
            
            return [
                'client_id' => $customer->id,
                'age' => $customer->age ?? 30,
                'gender' => $customer->gender ?? 'M',
                'segment' => $customer->segment ?? 'Standard',
                'recency' => $rfm['recency'],
                'frequency' => $rfm['frequency'],
                'monetary' => $rfm['monetary'],
                'engagement_rate' => $engagement,
                'loyalty_score' => $customer->loyalty_score ?? 0,
                'churned' => $isChurned,
            ];
        });

        return response()->json([
            'status' => 'success',
            'count' => $dataset->count(),
            'data' => $dataset
        ]);
    }

    /**
     * Export all transaction and feedback data for Collaborative Filtering (Recommender System).
     */
    public function exportTransactions(Request $request)
    {
        $limit = $request->query('limit', 0);
        
        // We need customer_id, product_id, and an implicit or explicit validation
        $query = \Illuminate\Support\Facades\DB::table('transactions')
            ->select('client_id as customer_id', 'product_id', \Illuminate\Support\Facades\DB::raw('5 as rating'));
            
        if ($limit > 0) {
            $query->limit((int)$limit);
        }

        $transactions = $query->get();

        return response()->json([
            'status' => 'success',
            'count' => $transactions->count(),
            'data' => $transactions
        ]);
    }
}
