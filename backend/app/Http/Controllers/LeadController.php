<?php

namespace App\Http\Controllers;

use Modules\User\Entities\Customer;
use Modules\User\Entities\Lead;
use Modules\User\Entities\User;
use App\Services\DiscountService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user() ?? User::first();

        // Agent SAV cannot see leads
        if ($user->role === User::ROLE_AGENT_SAV) {
            return response()->json(['message' => 'Forbidden - Agent SAV cannot access leads'], 403);
        }

        $query = Lead::with(['creator', 'location', 'trackingEvents']);

        if ($user->role === User::ROLE_AGENT_COMMERCIAL) {
            $query->where('created_by', $user->id);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('source') && $request->source) {
            $query->where('source', $request->source);
        }

        if ($request->has('expired')) {
            $query->where('expired', $request->boolean('expired'));
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = $request->input('per_page', 15);
        return $query->orderBy('created_at', 'desc')->paginate($perPage);
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
            'email' => 'required|email:rfc|max:255|unique:leads,email',
            'phone' => ['nullable', 'regex:/^0[5-7]\d{8}$/'],
            'source' => 'nullable|string|in:website,referral,event,manual,nearby',
        ], [
            'phone.regex' => 'Phone number must be 10 digits in Moroccan format (e.g., 0612345678).',
            'email.unique' => 'A lead with this email already exists.',
        ]);

        $lead = Lead::create([
            ...$validated,
            'source' => $validated['source'] ?? 'manual',
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

        return response()->json($lead->load('creator', 'location', 'trackingEvents', 'quotations'));
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
            'email' => 'required|email:rfc|max:255|unique:leads,email,' . $lead->id,
            'phone' => ['nullable', 'regex:/^0[5-7]\d{8}$/'],
            'source' => 'nullable|string|in:website,referral,event,manual,nearby',
        ], [
            'phone.regex' => 'Phone number must be 10 digits in Moroccan format (e.g., 0612345678).',
            'email.unique' => 'A lead with this email already exists.',
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

        if ($lead->isExpired()) {
            return response()->json(['message' => 'Cannot update status of an expired lead'], 400);
        }

        $validated = $request->validate([
            'status' => 'required|in:new,contacted,qualified,converted,hot,expired',
        ]);

        if (!$lead->canTransitionTo($validated['status'])) {
            return response()->json([
                'message' => "Cannot transition from '{$lead->status}' to '{$validated['status']}'. Invalid status progression."
            ], 422);
        }

        $lead->update(['status' => $validated['status']]);

        return response()->json($lead->load('creator'));
    }

    public function convert(Lead $lead, DiscountService $discountService)
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

        if ($lead->isExpired()) {
            return response()->json(['message' => 'Lead expired, please requalify before converting'], 400);
        }

        if (!$lead->canBeConverted()) {
            return response()->json(['message' => 'Lead must be qualified or hot before conversion'], 400);
        }

        try {
            DB::beginTransaction();

            $customer = Customer::create([
                'name' => $lead->contact_name,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'converted_from_lead_id' => $lead->id,
                'loyalty_score' => 20, // Conversion bonus
            ]);

            $lead->update(['status' => 'converted']);
            $customer->tier = $customer->getLoyaltyTier();

            // Generate welcome discount automatically
            $discount = $discountService->generateWelcomeDiscount($customer);

            DB::commit();

            return response()->json([
                'customer' => $customer,
                'welcome_discount' => $discount,
            ], 201);
        } catch (QueryException $e) {
            DB::rollBack();
            if ($e->getCode() == '23000' && str_contains($e->getMessage(), 'customers_email_unique')) {
                return response()->json([
                    'message' => 'This email address is already registered. Please use a different email or login to your existing account.'
                ], 422);
            }
            Log::error('Lead conversion failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function extendExpiration(Request $request, Lead $lead)
    {
        $user = Auth::user() ?? User::first();
        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden - Admin only'], 403);
        }

        $validated = $request->validate([
            'days' => 'required|integer|min:1|max:365',
        ]);

        $lead->update([
            'expires_at' => now()->addDays($validated['days']),
            'expired' => false,
            'status' => $lead->status === 'expired' ? 'new' : $lead->status, // Reset status if it was expired
        ]);

        return response()->json([
            'message' => "Lead expiration extended by {$validated['days']} days.",
            'lead' => $lead
        ]);
    }

    public function nearby(Request $request)
    {
        $validated = $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'radius' => 'nullable|numeric|min:1', // defaults to 10km
        ]);

        $lat = $validated['lat'];
        $lng = $validated['lng'];
        $radius = $validated['radius'] ?? 10;

        // Haversine formula to calculate distance in km
        $haversine = "(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))))";

        $locations = \Modules\User\Entities\LeadLocation::select('lead_locations.*')
            ->selectRaw("{$haversine} AS distance", [$lat, $lng, $lat])
            ->having('distance', '<=', $radius)
            ->orderBy('distance')
            ->with(['lead' => function ($q) {
                // Eager load only active leads
                $q->whereNotIn('status', ['converted', 'expired'])->where('expired', false);
            }])
            ->get();

        // Filter out locations whose leads were filtered out above and maps structure
        $results = $locations->filter(fn($loc) => $loc->lead !== null)->values()->map(function($loc) {
            $lead = $loc->lead;
            $lead->distance = round($loc->distance, 2);
            $lead->location = $loc;
            return $lead;
        });

        // Score closer leads higher: distance / radius -> lower is better. We'll invert it for score (0-100)
        foreach ($results as $lead) {
            $lead->nearby_score = max(1, 100 - (int) (($lead->distance / $radius) * 100));
        }

        // Sort by nearby_score desc
        $results = $results->sortByDesc('nearby_score')->values();

        return response()->json($results);
    }
}
