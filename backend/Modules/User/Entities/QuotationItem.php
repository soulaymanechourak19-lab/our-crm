<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationItem extends Model
{
    protected $fillable = [
        'quotation_id',
        'product_id',
        'description',
        'quantity',
        'unit_price',
        'total',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'float',
        'total' => 'float',
    ];

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(\Modules\Sales\Entities\Product::class);
    }

    // Auto-calculate total on save
    protected static function booted(): void
    {
        static::saving(function (QuotationItem $item) {
            $item->total = $item->quantity * $item->unit_price;
        });
    }
}
