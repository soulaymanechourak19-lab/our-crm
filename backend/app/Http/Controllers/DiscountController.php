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
     * List all discounts.
     */
    public function index(Request $request)
    {
        $query = Discount::with(['product', 'customer']);

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
     * Create a new discount.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:discounts,code',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0' . ($request->type === 'percentage' ? '|max:100' : ''),
            'description' => 'nullable|string|max:255',
            'starts_at' => 'nullable|date|after_or_equal:today',
            'expires_at' => 'nullable|date|after_or_equal:today|after:starts_at',
            'max_uses' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'product_id' => 'nullable|integer|exists:products,id',
            'customer_id' => 'nullable|integer|exists:customers,id',
        ], [
            'value.max' => 'Discount percentage cannot exceed 100%.',
            'starts_at.after_or_equal' => 'Start date cannot be in the past.',
            'expires_at.after_or_equal' => 'End date cannot be in the past.',
            'expires_at.after' => 'End date must be after the start date.',
        ]);

        // For fixed discounts, validate that value doesn't exceed product price
        if ($request->type === 'fixed' && $request->product_id) {
            $product = \Modules\Sales\Entities\Product::find($request->product_id);
            if ($product && $request->value > $product->price) {
                return response()->json([
                    'message' => 'Fixed discount value cannot exceed the product price (' . $product->price . ').'
                ], 422);
            }
        }

        $discount = Discount::create($validated);
        $discount->load(['product', 'customer']);

        // If customer is set, also link via customer_discounts pivot
        if ($discount->customer_id) {
            CustomerDiscount::updateOrCreate(
                ['customer_id' => $discount->customer_id, 'discount_id' => $discount->id],
                []
            );
        }

        return response()->json($discount, 201);
    }

    /**
     * Show a single discount.
     */
    public function show(Discount $discount)
    {
        $discount->load(['customerDiscounts', 'product', 'customer']);
        return response()->json($discount);
    }

    /**
     * Update a discount.
     */
    public function update(Request $request, Discount $discount)
    {
        $validated = $request->validate([
            'code' => 'sometimes|string|max:50|unique:discounts,code,' . $discount->id,
            'type' => 'sometimes|in:percentage,fixed',
            'value' => 'sometimes|numeric|min:0' . (($request->type ?? $discount->type) === 'percentage' ? '|max:100' : ''),
            'description' => 'nullable|string|max:255',
            'starts_at' => 'nullable|date|after_or_equal:today',
            'expires_at' => 'nullable|date|after_or_equal:today|after:starts_at',
            'max_uses' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'product_id' => 'nullable|integer|exists:products,id',
            'customer_id' => 'nullable|integer|exists:customers,id',
        ], [
            'value.max' => 'Discount percentage cannot exceed 100%.',
            'starts_at.after_or_equal' => 'Start date cannot be in the past.',
            'expires_at.after_or_equal' => 'End date cannot be in the past.',
        ]);

        // For fixed discounts, validate that value doesn't exceed product price
        $type = $request->type ?? $discount->type;
        $productId = $request->product_id ?? $discount->product_id;
        if ($type === 'fixed' && $productId && isset($validated['value'])) {
            $product = \Modules\Sales\Entities\Product::find($productId);
            if ($product && $validated['value'] > $product->price) {
                return response()->json([
                    'message' => 'Fixed discount value cannot exceed the product price (' . $product->price . ').'
                ], 422);
            }
        }

        $discount->update($validated);
        $discount->load(['product', 'customer']);

        return response()->json($discount);
    }

    /**
     * Delete a discount.
     */
    public function destroy(Discount $discount)
    {
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

    /**
     * Search customers for the discount picker (no role filtering).
     */
    public function searchCustomers(Request $request)
    {
        $query = Customer::query();

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query->select('id', 'name', 'email', 'loyalty_score')
            ->orderBy('name')
            ->limit(20)
            ->get();
    }

    /**
     * Return suggested discount percentage based on customer loyalty tier.
     */
    public function loyaltySuggestion(Request $request)
    {
        $request->validate(['customer_id' => 'required|integer|exists:customers,id']);

        $customer = Customer::findOrFail($request->customer_id);
        $tier = $customer->getLoyaltyTier();
        $suggestedPercent = Discount::loyaltyDiscountPercent($tier);

        return response()->json([
            'customer_id' => $customer->id,
            'loyalty_score' => $customer->loyalty_score,
            'tier' => $tier,
            'suggested_percent' => $suggestedPercent,
        ]);
    }
}

