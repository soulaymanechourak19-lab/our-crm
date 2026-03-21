<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class Task extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title', 'description', 'type', 'priority', 'status',
        'due_date', 'completed_at',
        'lead_id', 'customer_id', 'assigned_to', 'created_by',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // ── Relationships ────────────────────────────────────────

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scopes ───────────────────────────────────────────────

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('due_date', '<', now())
                     ->whereNotIn('status', ['completed', 'cancelled']);
    }

    public function scopeDueToday(Builder $query): Builder
    {
        return $query->whereDate('due_date', today())
                     ->whereNotIn('status', ['completed', 'cancelled']);
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('due_date', '>', now())
                     ->where('due_date', '<=', now()->addDays(7))
                     ->whereNotIn('status', ['completed', 'cancelled']);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('assigned_to', $userId);
    }

    // ── Helpers ──────────────────────────────────────────────

    public function isOverdue(): bool
    {
        return $this->due_date
            && $this->due_date->isPast()
            && !in_array($this->status, ['completed', 'cancelled']);
    }

    public function markComplete(): void
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
    }
}
