<?php

namespace Modules\User\Entities;

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
        'loyalty_score',
        'converted_from_lead_id',
        'age',
        'gender',
        'segment',
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

    public function transactions(): HasMany
    {
        return $this->hasMany(\App\Models\Transaction::class, 'client_id');
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(\App\Models\Feedback::class, 'client_id');
    }

    public function campaigns(): HasMany
    {
        return $this->hasMany(\App\Models\Campaign::class, 'client_id');
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

    public function getRFMScore(): array
    {
        // Recency: Days since last transaction
        $latestTx = $this->transactions()->latest('date')->first();
        $recency = $latestTx ? now()->diffInDays($latestTx->date) : 999;

        // Frequency: Total count of transactions
        $frequency = $this->transactions()->count();

        // Monetary: Total sum of transactions
        $monetary = (float) $this->transactions()->sum('price');

        return [
            'recency' => $recency,
            'frequency' => $frequency,
            'monetary' => $monetary,
        ];
    }

    public function getEngagementRate(): float
    {
        $campaigns = $this->campaigns();
        $total = $campaigns->count();
        if ($total === 0) return 0;

        // Clicks or Opened are engagement positive responses
        $engaged = $this->campaigns()->whereIn('response', ['Cliqué', 'Ouvert'])->count();
        
        return round($engaged / $total, 2);
    }
}
