<?php

namespace App\Services;

use Modules\User\Entities\Customer;
use Modules\User\Entities\CustomerDiscount;
use Modules\User\Entities\Discount;
use Illuminate\Support\Str;

class DiscountService
{
    /**
     * Generate a welcome discount for a newly converted customer.
     * 10% off first purchase, valid for 30 days, one-time use.
     */
    public function generateWelcomeDiscount(Customer $customer): Discount
    {
        $code = 'WELCOME-' . $customer->id . '-' . strtoupper(Str::random(6));

        $discount = Discount::create([
            'code' => $code,
            'type' => 'percentage',
            'value' => 10,
            'description' => 'Welcome discount - 10% off first purchase',
            'starts_at' => now(),
            'expires_at' => now()->addDays(30),
            'max_uses' => 1,
            'used_count' => 0,
            'is_active' => true,
        ]);

        // Link discount to customer
        CustomerDiscount::create([
            'customer_id' => $customer->id,
            'discount_id' => $discount->id,
        ]);

        return $discount;
    }

    /**
     * Validate a discount code.
     * Returns the discount if valid, null otherwise.
     */
    public function validateDiscount(string $code): ?array
    {
        $discount = Discount::where('code', $code)->first();

        if (!$discount) {
            return ['valid' => false, 'message' => 'Discount code not found'];
        }

        if (!$discount->isValid()) {
            $reason = 'Discount code is no longer valid';
            if (!$discount->is_active) $reason = 'Discount code has been deactivated';
            if ($discount->expires_at?->isPast()) $reason = 'Discount code has expired';
            if ($discount->max_uses && $discount->used_count >= $discount->max_uses) $reason = 'Discount code has reached maximum usage';

            return ['valid' => false, 'message' => $reason];
        }

        return [
            'valid' => true,
            'discount' => $discount,
            'message' => "Discount valid: {$discount->description}",
        ];
    }

    /**
     * Apply a discount to a transaction amount.
     * Returns the discount amount.
     */
    public function applyDiscount(Discount $discount, float $amount, int $customerId, ?int $orderId = null): float
    {
        $discountAmount = $discount->calculateDiscount($amount);

        // Increment usage
        $discount->increment('used_count');

        // Record usage for the customer
        CustomerDiscount::updateOrCreate(
            ['customer_id' => $customerId, 'discount_id' => $discount->id],
            ['applied_at' => now(), 'order_id' => $orderId]
        );

        return $discountAmount;
    }
}
