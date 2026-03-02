<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'loyalty_score',
        'converted_from_lead_id',
    ];

    protected $casts = [
        'loyalty_score' => 'integer',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'converted_from_lead_id');
    }

    public function interactions(): HasMany
    {
        return $this->hasMany(Interaction::class);
    }

    public function updateLoyaltyScore(): void
    {
        // Simple logic: +1 per interaction.
        // In a real app, you might sum interaction types or transaction values.
        $this->loyalty_score = $this->interactions()->count();
        $this->save();
    }

    public function getLoyaltyTier(): string
    {
        if ($this->loyalty_score >= 71) {
            return 'Gold';
        }

        if ($this->loyalty_score >= 31) {
            return 'Silver';
        }

        return 'Bronze';
    }
}
