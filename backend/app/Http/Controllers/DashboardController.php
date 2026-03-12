<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
        // Total counts
        $totalLeads = DB::table('leads')->whereNull('deleted_at')->count();
        $totalCustomers = DB::table('customers')->whereNull('deleted_at')->count();
        $totalProducts = DB::table('products')->count();
        $lowStockCount = DB::table('products')->where('stock', '<', 5)->count();

        // Leads over time (last 6 months)
        $leadsOverTime = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $count = DB::table('leads')
                ->whereNull('deleted_at')
                ->whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->count();
            
            $leadsOverTime[] = [
                'month' => $month->format('M'),
                'leads' => $count
            ];
        }

        // Lead Status Distribution
        $statusCounts = DB::table('leads')
            ->select('status', DB::raw('count(*) as count'))
            ->whereNull('deleted_at')
            ->groupBy('status')
            ->get();
            
        $colors = [
            'new' => '#818cf8',
            'contacted' => '#6366f1',
            'qualified' => '#22c55e',
            'lost' => '#ef4444',
            'converted' => '#f59e0b'
        ];

        $leadStatusData = $statusCounts->map(function($item) use ($colors) {
            $name = ucfirst($item->status);
            return [
                'name' => $name,
                'value' => $item->count,
                'color' => $colors[$item->status] ?? '#94a3b8'
            ];
        });

        // Recent Activity (combine leads, customers, products)
        // For simplicity, we'll fetch the latest from each and sort them
        $activities = collect();

        $recentLeads = DB::table('leads')
            ->whereNull('deleted_at')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();
        foreach ($recentLeads as $lead) {
            $activities->push([
                'id' => 'l' . $lead->id,
                'action' => 'New lead created',
                'detail' => $lead->contact_name ?? ($lead->first_name ?? '') . ' ' . ($lead->last_name ?? ''),
                'time_raw' => $lead->created_at,
                'time' => Carbon::parse($lead->created_at)->diffForHumans(),
                'icon' => '🎯'
            ]);
        }

        $recentCustomers = DB::table('customers')
            ->whereNull('deleted_at')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();
        foreach ($recentCustomers as $customer) {
            $activities->push([
                'id' => 'c' . $customer->id,
                'action' => 'Customer registered',
                'detail' => $customer->name ?? ($customer->first_name ?? '') . ' ' . ($customer->last_name ?? ''),
                'time_raw' => $customer->created_at,
                'time' => Carbon::parse($customer->created_at)->diffForHumans(),
                'icon' => '👤'
            ]);
        }

        $recentProducts = DB::table('products')
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get();
        foreach ($recentProducts as $product) {
            $activities->push([
                'id' => 'p' . $product->id,
                'action' => 'Product added',
                'detail' => $product->name,
                'time_raw' => $product->created_at,
                'time' => Carbon::parse($product->created_at)->diffForHumans(),
                'icon' => '🛒'
            ]);
        }

        $recentActivity = $activities->sortByDesc('time_raw')->take(5)->values()->map(function($item, $key) {
            $item['id'] = $key + 1;
            unset($item['time_raw']);
            return $item;
        });

        return response()->json([
            'stats' => [
                'totalProducts' => $totalProducts,
                'lowStockCount' => $lowStockCount,
                'totalLeads' => $totalLeads,
                'totalCustomers' => $totalCustomers,
            ],
            'leadsOverTime' => $leadsOverTime,
            'leadStatusData' => $leadStatusData,
            'recentActivity' => $recentActivity
        ]);
    }
}
