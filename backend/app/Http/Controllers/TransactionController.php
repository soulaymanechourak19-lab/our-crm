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
            'email' => 'required|email',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'discount_code' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
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
                    // Lead exists but not qualified/hot, treat as new customer anyway, or convert them.
                    // Business rule says: "If lead doesn't exist, create customer directly"
                    // If lead exists but not qualified, let's just create customer and convert lead
                    $customer = Customer::create([
                        'name' => $lead->contact_name,
                        'email' => $lead->email,
                        'phone' => $lead->phone,
                        'converted_from_lead_id' => $lead->id,
                        'loyalty_score' => 20,
                    ]);
                    $lead->update(['status' => 'converted']);
                } else {
                    // Create customer directly from email (using first part of email as name)
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
            $totalPrice = tap($validated['quantity'] * $validated['price'], function($val) { return $val; }); // Base price

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

            return response()->json([
                'message' => 'Transaction created successfully',
                'transaction' => $transaction,
                'customer' => $customer,
                'lead_converted' => $lead ? true : false,
            ], 201);
        });
    }
}
