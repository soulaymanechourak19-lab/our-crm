<?php

namespace App\Http\Controllers;

use Modules\User\Entities\Customer;
use Modules\User\Entities\Interaction;
use Modules\User\Entities\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $user = (Auth::user() ?? User::first()) ?? User::first();
        $query = Customer::query();

        if ($user->role === User::ROLE_AGENT_COMMERCIAL) {
            // Show customers converted from leads created by this agent
            $query->whereHas('lead', function ($q) use ($user) {
                $q->where('created_by', $user->id);
            });
        }
        // Agent SAV and Admin see all customers

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('tier') && $request->tier) {
            $tier = $request->tier;
            $query->where(function ($q) use ($tier) {
                if ($tier === 'Gold') {
                    $q->where('loyalty_score', '>=', 71);
                } elseif ($tier === 'Silver') {
                    $q->where('loyalty_score', '>=', 31)->where('loyalty_score', '<=', 70);
                } else {
                    $q->where('loyalty_score', '<=', 30);
                }
            });
        }

        $perPage = $request->input('per_page', 15);
        $customers = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Append tier and churn risk to each customer
        $aiUrl = env('AI_SERVICE_URL', 'http://ml-service:8001');
        $customers->getCollection()->transform(function ($customer) use ($aiUrl) {
            $customer->tier = $customer->getLoyaltyTier();

            // Compute churn risk via ML service (same as CustomerDetail)
            try {
                $lastInteraction = DB::table('interactions')
                    ->where('customer_id', $customer->id)
                    ->max('date');

                $recency = $lastInteraction
                    ? Carbon::parse($lastInteraction)->diffInDays(now())
                    : 999;

                $frequency = DB::table('interactions')
                    ->where('customer_id', $customer->id)
                    ->count();

                $transactionCount = DB::table('transactions')->where('client_id', $customer->id)->count();
                $feedbackCount = DB::table('feedback')->where('client_id', $customer->id)->count();
                $engagementRate = $frequency + $transactionCount + $feedbackCount;

                $response = Http::timeout(3)->post("{$aiUrl}/predict/churn", [
                    'recency' => $recency,
                    'frequency' => $frequency,
                    'monetary' => (float) ($customer->loyalty_score ?? 0),
                    'loyalty_score' => (int) ($customer->loyalty_score ?? 0),
                    'age' => (int) ($customer->age ?? 30),
                    'gender' => $customer->gender ?? 'M',
                    'segment' => $customer->segment ?? 'Standard',
                    'engagement_rate' => $engagementRate,
                ]);

                $data = $response->json();
                if (isset($data['probability'])) {
                    $customer->churn_risk = round($data['probability'] * 100);
                } elseif (isset($data['churn_risk_score'])) {
                    $customer->churn_risk = round($data['churn_risk_score']);
                } else {
                    $customer->churn_risk = null;
                }
            } catch (\Exception $e) {
                $customer->churn_risk = null;
            }

            return $customer;
        });

        return $customers;
    }

    public function store(Request $request)
    {
        $user = (Auth::user() ?? User::first()) ?? User::first();

        // Only Admin can manually create customers
        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden - Admin only'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255', // Removed unique here to catch it in try-catch for custom message
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ], [
            'email.unique' => 'This email address is already registered. Please use a different email or login to your existing account.'
        ]);

        try {
            $customer = Customer::create($validated);
            $customer->tier = $customer->getLoyaltyTier();

            return response()->json($customer, 201);
        } catch (QueryException $e) {
            if ($e->getCode() == '23000' && str_contains($e->getMessage(), 'customers_email_unique')) {
                return response()->json([
                    'message' => 'This email address is already registered. Please use a different email or login to your existing account.'
                ], 422);
            }
            Log::error('Customer creation failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function show(Customer $customer)
    {
        $user = (Auth::user() ?? User::first()) ?? User::first();

        if ($user->role === User::ROLE_AGENT_COMMERCIAL) {
            if (!$customer->lead || $customer->lead->created_by !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $customer->load('interactions', 'lead');
        $customer->tier = $customer->getLoyaltyTier();

        return response()->json($customer);
    }

    public function update(Request $request, Customer $customer)
    {
        // Only Admin can edit customer details
        if ((Auth::user() ?? User::first())->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden - Admin only'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255', // Removed unique here as well
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ], [
            'email.unique' => 'This email address is already registered. Please use a different email or login to your existing account.'
        ]);

        try {
            $customer->update($validated);
            $customer->tier = $customer->getLoyaltyTier();

            return response()->json($customer);
        } catch (QueryException $e) {
            if ($e->getCode() == '23000' && str_contains($e->getMessage(), 'customers_email_unique')) {
                return response()->json([
                    'message' => 'This email address is already registered. Please use a different email or login to your existing account.'
                ], 422);
            }
            Log::error('Customer update failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function destroy(Customer $customer)
    {
        if ((Auth::user() ?? User::first())->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden - Admin only'], 403);
        }

        $customer->delete();

        return response()->json(['message' => 'Customer deleted successfully']);
    }

    public function addInteraction(Request $request, Customer $customer)
    {
        $user = (Auth::user() ?? User::first()) ?? User::first();

        // Agent Commercial can only add interactions to customers from their leads
        if ($user->role === User::ROLE_AGENT_COMMERCIAL) {
            if (!$customer->lead || $customer->lead->created_by !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }
        // Admin and Agent SAV can add interactions to any customer

        $validated = $request->validate([
            'type' => 'required|in:call,email,meeting',
            'notes' => 'required|string',
            'date' => 'required|date',
        ]);

        $interaction = $customer->interactions()->create($validated);

        // Update loyalty score
        $customer->updateLoyaltyScore();

        $interaction->load('customer');

        return response()->json($interaction, 201);
    }

    public function interactions(Customer $customer)
    {
        $user = (Auth::user() ?? User::first()) ?? User::first();

        if ($user->role === User::ROLE_AGENT_COMMERCIAL) {
            if (!$customer->lead || $customer->lead->created_by !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        return $customer->interactions()->orderBy('date', 'desc')->paginate(10);
    }
}
