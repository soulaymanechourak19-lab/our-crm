<?php

namespace App\Http\Controllers;

use Modules\User\Entities\Customer;
use Modules\User\Entities\Lead;
use Modules\User\Entities\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user() ?? User::first();

        // Agent SAV cannot see leads
        if ($user->role === User::ROLE_AGENT_SAV) {
            return response()->json(['message' => 'Forbidden - Agent SAV cannot access leads'], 403);
        }

        $query = Lead::with('creator');

        if ($user->role === User::ROLE_AGENT_COMMERCIAL) {
            $query->where('created_by', $user->id);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate(15);
    }

    public function store(Request $request)
    {
        $user = Auth::user() ?? User::first();

        if ($user->role === User::ROLE_AGENT_SAV) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
        ]);

        $lead = Lead::create([
            ...$validated,
            'created_by' => Auth::id() ?? 1,
            'status' => 'new',
        ]);

        return response()->json($lead->load('creator'), 201);
    }

    public function show(Lead $lead)
    {
        $user = Auth::user() ?? User::first();

        if ($user->role === User::ROLE_AGENT_SAV) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($user->role === User::ROLE_AGENT_COMMERCIAL && $lead->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($lead->load('creator'));
    }

    public function update(Request $request, Lead $lead)
    {
        $user = Auth::user() ?? User::first();

        if ($user->role === User::ROLE_AGENT_SAV) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($user->role === User::ROLE_AGENT_COMMERCIAL && $lead->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
        ]);

        $lead->update($validated);

        return response()->json($lead->load('creator'));
    }

    public function destroy(Lead $lead)
    {
        $user = Auth::user() ?? User::first();

        if ($user->role !== User::ROLE_ADMIN && $lead->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $lead->delete();

        return response()->json(['message' => 'Lead deleted successfully']);
    }

    public function updateStatus(Request $request, Lead $lead)
    {
        $user = Auth::user() ?? User::first();

        if ($user->role === User::ROLE_AGENT_SAV) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($user->role === User::ROLE_AGENT_COMMERCIAL && $lead->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:new,contacted,qualified,converted',
        ]);

        $lead->update(['status' => $validated['status']]);

        return response()->json($lead->load('creator'));
    }

    public function convert(Lead $lead)
    {
        $user = Auth::user() ?? User::first();

        if ($user->role === User::ROLE_AGENT_SAV) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($user->role === User::ROLE_AGENT_COMMERCIAL && $lead->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($lead->isConverted()) {
            return response()->json(['message' => 'Lead already converted'], 400);
        }

        if (!$lead->canBeConverted()) {
            return response()->json(['message' => 'Lead must be qualified before conversion'], 400);
        }

        try {
            $customer = Customer::create([
                'name' => $lead->contact_name,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'converted_from_lead_id' => $lead->id,
                'loyalty_score' => 0,
            ]);

            $lead->update(['status' => 'converted']);

            $customer->tier = $customer->getLoyaltyTier();

            return response()->json($customer, 201);
        } catch (QueryException $e) {
            if ($e->getCode() == '23000' && str_contains($e->getMessage(), 'customers_email_unique')) {
                return response()->json([
                    'message' => 'This email address is already registered. Please use a different email or login to your existing account.'
                ], 422);
            }
            Log::error('Lead conversion failed: ' . $e->getMessage());
            throw $e;
        }
    }
}
