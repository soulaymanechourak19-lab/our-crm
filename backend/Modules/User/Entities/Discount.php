<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Modules\Sales\Entities\Product;

class Discount extends Model
{
    protected $fillable = [
        'code',
        'type',
        'value',
        'description',
        'starts_at',
        'expires_at',
        'max_uses',
        'used_count',
        'is_active',
        'product_id',
        'customer_id',
    ];

    protected $casts = [
        'value' => 'float',
        'max_uses' => 'integer',
        'used_count' => 'integer',
        'is_active' => 'boolean',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function customerDiscounts(): HasMany
    {
        return $this->hasMany(CustomerDiscount::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function isValid(): bool
    {
        if (!$this->is_active) return false;
        if ($this->starts_at && $this->starts_at->isFuture()) return false;
        if ($this->expires_at && $this->expires_at->isPast()) return false;
        if ($this->max_uses && $this->used_count >= $this->max_uses) return false;
        return true;
    }

    public function calculateDiscount(float $amount): float
    {
        if ($this->type === 'percentage') {
            return round($amount * ($this->value / 100), 2);
        }
        return min($this->value, $amount);
    }

    /**
     * Return suggested discount percentage based on loyalty tier.
     */
    public static function loyaltyDiscountPercent(string $tier): float
    {
        return match ($tier) {
            'Gold'   => 15,
            'Silver' => 10,
            default  => 5, // Bronze
        };
    }
}

