<?php

namespace App\Http\Controllers;

use Modules\User\Entities\Customer;
use Modules\User\Entities\Lead;
use App\Models\Transaction;
use App\Services\DiscountService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Mail\WelcomeDiscountMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class TransactionController extends Controller
{
    protected DiscountService $discountService;

    public function __construct(DiscountService $discountService)
    {
        $this->discountService = $discountService;
    }

    /**
     * Store a new transaction (simulating a purchase).
     * Automatically converts a lead if matching email is found and qualified/hot.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email:rfc',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0.01',
            'discount_code' => 'nullable|string',
        ], [
            'price.min' => 'Price must be greater than zero.',
            'quantity.min' => 'Quantity must be at least 1.',
        ]);

        // Check stock availability before proceeding
        $product = \Modules\Sales\Entities\Product::findOrFail($validated['product_id']);
        if (!$product->hasEnoughStock($validated['quantity'])) {
            return response()->json([
                'message' => "Insufficient stock. Only {$product->stock} units available for '{$product->name}'."
            ], 422);
        }

        return DB::transaction(function () use ($validated, $product) {
            $email = $validated['email'];
            $customer = Customer::where('email', $email)->first();
            $lead = null;

            // If customer doesn't exist, check leads
            if (!$customer) {
                $lead = Lead::where('email', $email)->first();
                
                if ($lead && in_array($lead->status, ['hot', 'qualified']) && !$lead->isExpired()) {
                    // Convert lead
                    $customer = Customer::create([
                        'name' => $lead->contact_name,
                        'email' => $lead->email,
                        'phone' => $lead->phone,
                        'converted_from_lead_id' => $lead->id,
                        'loyalty_score' => 20, // +20 points for conversion
                    ]);
                    $lead->update(['status' => 'converted']);
                    $customer->tier = $customer->getLoyaltyTier();

                    // Generate welcome discount for next purchase
                    $this->discountService->generateWelcomeDiscount($customer);

                    try {
                        Mail::to($customer->email)->send(new WelcomeDiscountMail($customer));
                    } catch (\Exception $e) {
                        \Log::warning("Could not send welcome discount email: {$e->getMessage()}");
                    }
                } else if ($lead) {
                    $customer = Customer::create([
                        'name' => $lead->contact_name,
                        'email' => $lead->email,
                        'phone' => $lead->phone,
                        'converted_from_lead_id' => $lead->id,
                        'loyalty_score' => 20,
                    ]);
                    $lead->update(['status' => 'converted']);
                } else {
                    // Create customer directly from email
                    $customer = Customer::create([
                        'name' => explode('@', $email)[0],
                        'email' => $email,
                        'loyalty_score' => 0,
                    ]);
                }
            }

            // Handle applied discount code for THIS purchase
            $discountId = null;
            $discountAmount = 0;
            $totalPrice = $validated['quantity'] * $validated['price'];

            if (!empty($validated['discount_code'])) {
                $discountCheck = $this->discountService->validateDiscount($validated['discount_code']);
                if ($discountCheck['valid']) {
                    $discount = $discountCheck['discount'];
                    $discountId = $discount->id;
                    $discountAmount = $this->discountService->applyDiscount($discount, $totalPrice, $customer->id);
                } else {
                    return response()->json(['message' => $discountCheck['message']], 400);
                }
            }

            // Decrease stock
            $product->decreaseStock($validated['quantity']);

            // Create the transaction
            $transaction = Transaction::create([
                'client_id' => $customer->id,
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
                'price' => max(0, $totalPrice - $discountAmount),
                'date' => now(),
                'discount_id' => $discountId,
                'discount_amount' => $discountAmount,
                'converted_from_lead_id' => $lead ? $lead->id : null,
            ]);

            $response = [
                'message' => 'Transaction created successfully',
                'transaction' => $transaction,
                'customer' => $customer,
                'lead_converted' => $lead ? true : false,
            ];

            // Add stock warning if low
            if ($product->isLowStock()) {
                $response['stock_warning'] = true;
                $response['stock_message'] = "Warning: '{$product->name}' stock is low ({$product->stock} remaining).";
            }

            return response()->json($response, 201);
        });
    }
}
