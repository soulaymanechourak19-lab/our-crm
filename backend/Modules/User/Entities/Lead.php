<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_name',
        'contact_name',
        'email',
        'phone',
        'status',
        'source',
        'expires_at',
        'expired',
        'created_by',
    ];

    protected $casts = [
        'status' => 'string',
        'source' => 'string',
        'expires_at' => 'datetime',
        'expired' => 'boolean',
    ];

    // ── Relationships ────────────────────────────────────────────────

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function customer(): HasOne
    {
        return $this->hasOne(Customer::class, 'converted_from_lead_id');
    }

    public function trackingEvents(): HasMany
    {
        return $this->hasMany(LeadTracking::class);
    }

    public function location(): HasOne
    {
        return $this->hasOne(LeadLocation::class);
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    // ── Status helpers ───────────────────────────────────────────────

    public function isNew(): bool
    {
        return $this->status === 'new';
    }

    public function isContacted(): bool
    {
        return $this->status === 'contacted';
    }

    public function isQualified(): bool
    {
        return $this->status === 'qualified';
    }

    public function isConverted(): bool
    {
        return $this->status === 'converted';
    }

    public function isHot(): bool
    {
        return $this->status === 'hot';
    }

    public function isExpired(): bool
    {
        return $this->expired || ($this->expires_at && $this->expires_at->isPast());
    }

    public function canBeConverted(): bool
    {
        if ($this->isConverted()) return false;
        if ($this->isExpired()) return false;
        return in_array($this->status, ['qualified', 'hot']);
    }

    public function daysUntilExpiration(): ?int
    {
        if (!$this->expires_at) return null;
        $days = now()->diffInDays($this->expires_at, false);
        return max(0, (int) $days);
    }

    // ── Expiration defaults by source ────────────────────────────────

    public static function getExpirationDays(string $source): int
    {
        return match ($source) {
            'website' => 30,
            'referral' => 60,
            'event' => 14,
            'nearby' => 90,
            'manual' => 90,
            default => 90,
        };
    }
}
