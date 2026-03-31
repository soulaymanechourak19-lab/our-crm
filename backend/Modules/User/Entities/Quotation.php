<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quotation extends Model
{
    protected $fillable = [
        'lead_id',
        'customer_id',
        'number',
        'title',
        'description',
        'subtotal',
        'tax_rate',
        'tax',
        'total',
        'status',
        'valid_until',
        'created_by',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'tax_rate' => 'float',
        'tax' => 'float',
        'total' => 'float',
        'valid_until' => 'date',
    ];

    // ── Relationships ────────────────────────────────────────────────

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class);
    }

    // ── Status helpers ───────────────────────────────────────────────

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSent(): bool
    {
        return $this->status === 'sent';
    }

    public function isAccepted(): bool
    {
        return $this->status === 'accepted';
    }

    public function isExpired(): bool
    {
        return $this->valid_until && $this->valid_until->isPast() && !in_array($this->status, ['accepted', 'converted']);
    }

    public function canBeSent(): bool
    {
        return in_array($this->status, ['draft']);
    }

    public function canBeAccepted(): bool
    {
        return in_array($this->status, ['sent', 'viewed']) && !$this->isExpired();
    }

    public function canBeConverted(): bool
    {
        return $this->status === 'accepted';
    }

    /**
     * Check if the quotation can transition to a new status.
     * Enforces the workflow: draft → sent → viewed → accepted → converted
     * Rejected is allowed from sent or viewed.
     */
    public function canTransitionTo(string $newStatus): bool
    {
        $allowed = [
            'draft'    => ['sent'],
            'sent'     => ['viewed', 'accepted', 'rejected'],
            'viewed'   => ['accepted', 'rejected'],
            'accepted' => ['converted'],
            'converted' => [],
            'rejected' => [],
        ];

        return in_array($newStatus, $allowed[$this->status] ?? []);
    }

    // ── Totals calculation ───────────────────────────────────────────

    public function recalculateTotals(): void
    {
        $subtotal = $this->items()->sum('total');
        $tax = round($subtotal * ($this->tax_rate / 100), 2);
        $this->update([
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $subtotal + $tax,
        ]);
    }
}
