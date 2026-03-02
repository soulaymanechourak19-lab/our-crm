<?php

namespace Modules\CRM\Http\Controllers;

use Modules\CRM\Entities\Customer;
use Modules\CRM\Entities\Interaction;
use Modules\User\Entities\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

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

        $customers = $query->orderBy('created_at', 'desc')->paginate(15);

        // Append tier to each customer
        $customers->getCollection()->transform(function ($customer) {
            $customer->tier = $customer->getLoyaltyTier();
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
