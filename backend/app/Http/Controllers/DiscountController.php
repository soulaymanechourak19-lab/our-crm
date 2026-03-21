<?php

namespace App\Http\Controllers;

use App\Services\DiscountService;
use Modules\User\Entities\Discount;
use Modules\User\Entities\CustomerDiscount;
use Modules\User\Entities\Customer;
use Modules\User\Entities\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DiscountController extends Controller
{
    protected DiscountService $discountService;

    public function __construct(DiscountService $discountService)
    {
        $this->discountService = $discountService;
    }

    /**
     * List all discounts (admin).
     */
    public function index(Request $request)
    {
        $query = Discount::query();

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate(15);
    }

    /**
     * Create a new discount (admin).
     */
    public function store(Request $request)
    {
        $user = Auth::user() ?? User::first();
        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden - Admin only'], 403);
        }

        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:discounts,code',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:starts_at',
            'max_uses' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        $discount = Discount::create($validated);

        return response()->json($discount, 201);
    }

    /**
     * Show a single discount.
     */
    public function show(Discount $discount)
    {
        $discount->load('customerDiscounts');
        return response()->json($discount);
    }

    /**
     * Update a discount (admin).
     */
    public function update(Request $request, Discount $discount)
    {
        $user = Auth::user() ?? User::first();
        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden - Admin only'], 403);
        }

        $validated = $request->validate([
            'code' => 'sometimes|string|max:50|unique:discounts,code,' . $discount->id,
            'type' => 'sometimes|in:percentage,fixed',
            'value' => 'sometimes|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date',
            'max_uses' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        $discount->update($validated);

        return response()->json($discount);
    }

    /**
     * Delete a discount (admin).
     */
    public function destroy(Discount $discount)
    {
        $user = Auth::user() ?? User::first();
        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Forbidden - Admin only'], 403);
        }

        $discount->delete();
        return response()->json(['message' => 'Discount deleted successfully']);
    }

    /**
     * Validate a discount code.
     */
    public function validateCode(Request $request)
    {
        $request->validate(['code' => 'required|string']);

        $result = $this->discountService->validateDiscount($request->code);

        return response()->json($result);
    }

    /**
     * Get discounts for a specific customer.
     */
    public function customerDiscounts(Customer $customer)
    {
        $discounts = CustomerDiscount::where('customer_id', $customer->id)
            ->with('discount')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($discounts);
    }
}
