<?php

namespace App\Http\Controllers;

use Modules\User\Entities\Lead;
use Modules\User\Entities\Customer;
use Modules\User\Entities\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * KPI Overview snapshot.
     */
    public function overview(): JsonResponse
    {
        $data = Cache::remember('analytics.overview', 300, function () {
            $totalRevenue = DB::table('quotations')->where('status', 'accepted')->sum('total');
            $totalDeals = DB::table('quotations')->where('status', 'accepted')->count();
            $avgDealSize = $totalDeals > 0 ? round($totalRevenue / $totalDeals, 2) : 0;

            $totalLeads = DB::table('leads')->whereNull('deleted_at')->count();
            $convertedLeads = DB::table('leads')->whereNull('deleted_at')->where('status', 'converted')->count();
            $conversionRate = $totalLeads > 0 ? round(($convertedLeads / $totalLeads) * 100, 1) : 0;

            $totalCustomers = DB::table('customers')->whereNull('deleted_at')->count();
            $totalTransactions = DB::table('transactions')->count();
            $transactionRevenue = DB::table('transactions')->sum(DB::raw('quantity * price'));

            // Growth vs previous month
            $thisMonth = Carbon::now()->startOfMonth();
            $lastMonth = Carbon::now()->subMonth()->startOfMonth();
            $leadsThisMonth = DB::table('leads')->whereNull('deleted_at')->where('created_at', '>=', $thisMonth)->count();
            $leadsLastMonth = DB::table('leads')->whereNull('deleted_at')->whereBetween('created_at', [$lastMonth, $thisMonth])->count();
            $leadGrowth = $leadsLastMonth > 0 ? round((($leadsThisMonth - $leadsLastMonth) / $leadsLastMonth) * 100, 1) : 0;

            $revenueThisMonth = DB::table('quotations')->where('status', 'accepted')->where('created_at', '>=', $thisMonth)->sum('total');
            $revenueLastMonth = DB::table('quotations')->where('status', 'accepted')->whereBetween('created_at', [$lastMonth, $thisMonth])->sum('total');
            $revenueGrowth = $revenueLastMonth > 0 ? round((($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth) * 100, 1) : 0;

            // Active pipeline value
            $pipelineValue = DB::table('quotations')->whereIn('status', ['draft', 'sent', 'viewed'])->sum('total');

            // Sparkline: last 7 days lead count
            $sparkline = [];
            for ($i = 6; $i >= 0; $i--) {
                $day = Carbon::now()->subDays($i);
                $sparkline[] = DB::table('leads')
                    ->whereNull('deleted_at')
                    ->whereDate('created_at', $day->toDateString())
                    ->count();
            }

            return [
                'total_revenue' => round($totalRevenue + $transactionRevenue, 2),
                'quotation_revenue' => round($totalRevenue, 2),
                'transaction_revenue' => round($transactionRevenue, 2),
                'total_deals' => $totalDeals,
                'avg_deal_size' => $avgDealSize,
                'conversion_rate' => $conversionRate,
                'total_leads' => $totalLeads,
                'active_leads' => $totalLeads - $convertedLeads,
                'total_customers' => $totalCustomers,
                'total_transactions' => $totalTransactions,
                'pipeline_value' => round($pipelineValue, 2),
                'lead_growth' => $leadGrowth,
                'revenue_growth' => $revenueGrowth,
                'leads_this_month' => $leadsThisMonth,
                'revenue_this_month' => round($revenueThisMonth, 2),
                'sparkline' => $sparkline,
            ];
        });

        return response()->json($data);
    }

    /**
     * Sales funnel with velocity and drop-off.
     */
    public function funnel(): JsonResponse
    {
        $data = Cache::remember('analytics.funnel', 300, function () {
            $statuses = ['new', 'contacted', 'qualified', 'hot', 'converted'];
            $counts = Lead::select('status', DB::raw('COUNT(*) as count'))
                ->whereIn('status', $statuses)
                ->groupBy('status')
                ->pluck('count', 'status');

            $total = $counts->sum();
            $funnel = [];

            foreach ($statuses as $status) {
                $count = $counts[$status] ?? 0;
                $avgDays = Lead::where('status', $status)
                    ->selectRaw('AVG(DATEDIFF(updated_at, created_at)) as avg_days')
                    ->value('avg_days');

                $funnel[] = [
                    'stage' => ucfirst($status),
                    'count' => $count,
                    'percentage' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
                    'avg_days' => round($avgDays ?? 0, 1),
                ];
            }

            $conversions = [];
            for ($i = 0; $i < count($funnel) - 1; $i++) {
                $from = $funnel[$i];
                $to = $funnel[$i + 1];
                $rate = $from['count'] > 0 ? round(($to['count'] / $from['count']) * 100, 1) : 0;
                $dropOff = $from['count'] > 0 ? round((($from['count'] - $to['count']) / $from['count']) * 100, 1) : 0;
                $conversions[] = [
                    'from' => $from['stage'],
                    'to' => $to['stage'],
                    'rate' => $rate,
                    'drop_off' => $dropOff,
                ];
            }

            return [
                'funnel' => $funnel,
                'conversions' => $conversions,
                'total_leads' => $total,
            ];
        });

        return response()->json($data);
    }

    /**
     * Revenue breakdown by product.
     */
    public function revenueByProduct(): JsonResponse
    {
        $data = Cache::remember('analytics.revenue_by_product', 300, function () {
            // From quotation items
            $quotationProducts = DB::table('quotation_items')
                ->join('quotations', 'quotations.id', '=', 'quotation_items.quotation_id')
                ->join('products', 'products.id', '=', 'quotation_items.product_id')
                ->where('quotations.status', 'accepted')
                ->select(
                    'products.name',
                    'products.category',
                    DB::raw('SUM(quotation_items.total) as revenue'),
                    DB::raw('SUM(quotation_items.quantity) as quantity_sold')
                )
                ->groupBy('products.id', 'products.name', 'products.category')
                ->orderByDesc('revenue')
                ->limit(15)
                ->get();

            // From transactions
            $transactionProducts = DB::table('transactions')
                ->join('products', 'products.id', '=', 'transactions.product_id')
                ->select(
                    'products.name',
                    'products.category',
                    DB::raw('SUM(transactions.quantity * transactions.price) as revenue'),
                    DB::raw('SUM(transactions.quantity) as quantity_sold')
                )
                ->groupBy('products.id', 'products.name', 'products.category')
                ->orderByDesc('revenue')
                ->limit(15)
                ->get();

            return [
                'by_quotation' => $quotationProducts,
                'by_transaction' => $transactionProducts,
            ];
        });

        return response()->json($data);
    }

    /**
     * Revenue breakdown by sales rep.
     */
    public function revenueByRep(): JsonResponse
    {
        $data = Cache::remember('analytics.revenue_by_rep', 300, function () {
            return User::select('users.id', 'users.name', 'users.role')
                ->leftJoin('quotations', function ($join) {
                    $join->on('users.id', '=', 'quotations.created_by')
                        ->where('quotations.status', '=', 'accepted');
                })
                ->leftJoin('leads', function ($join) {
                    $join->on('users.id', '=', 'leads.created_by');
                })
                ->selectRaw('COUNT(DISTINCT quotations.id) as deals')
                ->selectRaw('COALESCE(SUM(DISTINCT quotations.total), 0) as revenue')
                ->selectRaw('COUNT(DISTINCT leads.id) as total_leads')
                ->selectRaw("COUNT(DISTINCT CASE WHEN leads.status = 'converted' THEN leads.id END) as conversions")
                ->whereIn('users.role', ['admin', 'agent_commercial'])
                ->groupBy('users.id', 'users.name', 'users.role')
                ->orderByDesc('revenue')
                ->get()
                ->map(function ($rep) {
                    $rep->win_rate = $rep->total_leads > 0
                        ? round(($rep->conversions / $rep->total_leads) * 100, 1)
                        : 0;
                    return $rep;
                });
        });

        return response()->json($data);
    }

    /**
     * Monthly revenue trend with running total.
     */
    public function revenueTrend(): JsonResponse
    {
        $data = Cache::remember('analytics.revenue_trend', 300, function () {
            $months = [];
            $runningTotal = 0;

            for ($i = 11; $i >= 0; $i--) {
                $month = Carbon::now()->subMonths($i);
                $startOfMonth = $month->copy()->startOfMonth();
                $endOfMonth = $month->copy()->endOfMonth();

                $quotationRev = DB::table('quotations')
                    ->where('status', 'accepted')
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->sum('total');

                $transactionRev = DB::table('transactions')
                    ->whereBetween('date', [$startOfMonth, $endOfMonth])
                    ->sum(DB::raw('quantity * price'));

                $monthRevenue = round($quotationRev + $transactionRev, 2);
                $runningTotal += $monthRevenue;

                $newLeads = DB::table('leads')
                    ->whereNull('deleted_at')
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->count();

                $newCustomers = DB::table('customers')
                    ->whereNull('deleted_at')
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->count();

                $dealsClosed = DB::table('quotations')
                    ->where('status', 'accepted')
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->count();

                $months[] = [
                    'month' => $month->format('M Y'),
                    'month_short' => $month->format('M'),
                    'revenue' => $monthRevenue,
                    'running_total' => round($runningTotal, 2),
                    'deals' => $dealsClosed,
                    'new_leads' => $newLeads,
                    'new_customers' => $newCustomers,
                ];
            }

            return $months;
        });

        return response()->json($data);
    }

    /**
     * Customer growth over time.
     */
    public function customerGrowth(): JsonResponse
    {
        $data = Cache::remember('analytics.customer_growth', 300, function () {
            $months = [];
            $cumulative = 0;

            for ($i = 11; $i >= 0; $i--) {
                $month = Carbon::now()->subMonths($i);
                $count = DB::table('customers')
                    ->whereNull('deleted_at')
                    ->whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();

                $cumulative += $count;
                $months[] = [
                    'month' => $month->format('M'),
                    'new' => $count,
                    'total' => $cumulative,
                ];
            }

            return $months;
        });

        return response()->json($data);
    }

    /**
     * Top performing products.
     */
    public function topProducts(): JsonResponse
    {
        $data = Cache::remember('analytics.top_products', 300, function () {
            return DB::table('quotation_items')
                ->join('quotations', 'quotations.id', '=', 'quotation_items.quotation_id')
                ->join('products', 'products.id', '=', 'quotation_items.product_id')
                ->where('quotations.status', 'accepted')
                ->select(
                    'products.id', 'products.name', 'products.category', 'products.price as unit_price',
                    DB::raw('SUM(quotation_items.total) as total_revenue'),
                    DB::raw('SUM(quotation_items.quantity) as total_sold'),
                    DB::raw('COUNT(DISTINCT quotations.id) as in_deals')
                )
                ->groupBy('products.id', 'products.name', 'products.category', 'products.price')
                ->orderByDesc('total_revenue')
                ->limit(10)
                ->get();
        });

        return response()->json($data);
    }

    /**
     * Activity summary per user.
     */
    public function activitySummary(): JsonResponse
    {
        $data = Cache::remember('analytics.activity_summary', 300, function () {
            return User::select('users.id', 'users.name', 'users.role')
                ->leftJoin('tasks', function ($join) {
                    $join->on('users.id', '=', 'tasks.assigned_to')
                        ->where('tasks.status', '=', 'completed');
                })
                ->leftJoin('leads', 'users.id', '=', 'leads.created_by')
                ->leftJoin('quotations', 'users.id', '=', 'quotations.created_by')
                ->selectRaw('COUNT(DISTINCT tasks.id) as tasks_completed')
                ->selectRaw('COUNT(DISTINCT leads.id) as leads_created')
                ->selectRaw('COUNT(DISTINCT quotations.id) as quotes_sent')
                ->whereIn('users.role', ['admin', 'agent_commercial'])
                ->groupBy('users.id', 'users.name', 'users.role')
                ->orderByDesc('tasks_completed')
                ->get();
        });

        return response()->json($data);
    }

    /**
     * Lead source performance (kept from previous).
     */
    public function sourcePerformance(): JsonResponse
    {
        $data = Cache::remember('analytics.source_performance', 300, function () {
            return Lead::select(
                    'source',
                    DB::raw('COUNT(*) as total'),
                    DB::raw("SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted")
                )
                ->whereNotNull('source')
                ->groupBy('source')
                ->get()
                ->map(function ($row) {
                    return [
                        'source' => ucfirst($row->source ?? 'unknown'),
                        'total' => $row->total,
                        'converted' => $row->converted,
                        'conversion_rate' => $row->total > 0 ? round(($row->converted / $row->total) * 100, 1) : 0,
                    ];
                });
        });

        return response()->json($data);
    }

    /**
     * Top sales reps leaderboard (kept from previous, enhanced).
     */
    public function topPerformers(): JsonResponse
    {
        $data = Cache::remember('analytics.top_performers', 300, function () {
            return User::select('users.id', 'users.name')
                ->leftJoin('leads', function ($join) {
                    $join->on('users.id', '=', 'leads.created_by')
                        ->where('leads.status', '=', 'converted');
                })
                ->leftJoin('quotations', function ($join) {
                    $join->on('users.id', '=', 'quotations.created_by')
                        ->where('quotations.status', '=', 'accepted');
                })
                ->selectRaw('COUNT(DISTINCT leads.id) as conversions')
                ->selectRaw('COUNT(DISTINCT quotations.id) as deals')
                ->selectRaw('COALESCE(SUM(quotations.total), 0) as revenue')
                ->where('users.role', 'agent_commercial')
                ->groupBy('users.id', 'users.name')
                ->orderByDesc('conversions')
                ->limit(10)
                ->get();
        });

        return response()->json($data);
    }
}
