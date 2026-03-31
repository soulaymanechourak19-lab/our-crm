<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'product_id',
        'quantity',
        'price',
        'date',
        'discount_id',
        'discount_amount',
        'converted_from_lead_id',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'price' => 'float',
        'discount_amount' => 'float',
        'date' => 'datetime',
    ];

    // ── Relationships ────────────────────────────────────────────────

    public function customer(): BelongsTo
    {
        return $this->belongsTo(\Modules\User\Entities\Customer::class, 'client_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(\Modules\Sales\Entities\Product::class);
    }

    public function discount(): BelongsTo
    {
        return $this->belongsTo(\Modules\User\Entities\Discount::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(\Modules\User\Entities\Lead::class, 'converted_from_lead_id');
    }
}
