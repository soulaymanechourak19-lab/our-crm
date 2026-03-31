<?php

namespace Modules\Sales\Entities;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'description',
        'price',
        'stock',
        'category',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'float',
            'stock' => 'integer',
        ];
    }

    /**
     * Boot the model — enforce business rules on save.
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($product) {
            // Stock cannot go negative
            if ($product->stock < 0) {
                throw new \RuntimeException("Stock cannot be negative for product '{$product->name}'. Attempted value: {$product->stock}");
            }
        });
    }

    /**
     * Check if the product is in stock.
     */
    public function isInStock(): bool
    {
        return $this->stock > 0;
    }

    /**
     * Check if there is enough stock for a given quantity.
     */
    public function hasEnoughStock(int $quantity): bool
    {
        return $this->stock >= $quantity;
    }

    /**
     * Check if the product stock is critically low (< 5 units).
     */
    public function isLowStock(): bool
    {
        return $this->stock < 5;
    }

    /**
     * Decrease stock by given quantity.
     * Throws exception if insufficient stock.
     */
    public function decreaseStock(int $quantity): void
    {
        if (!$this->hasEnoughStock($quantity)) {
            throw new \RuntimeException("Insufficient stock. Available: {$this->stock}, Requested: {$quantity}");
        }
        $this->stock -= $quantity;
        $this->save();
    }

    /**
     * Increase stock by given quantity.
     */
    public function increaseStock(int $quantity): void
    {
        $this->stock += $quantity;
        $this->save();
    }
}
