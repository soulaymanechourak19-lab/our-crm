<?php

namespace Modules\Ticketing\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\User\Entities\User;
use Modules\User\Entities\Customer;

class Ticket extends Model
{
    protected $fillable = [
        'ticket_number',
        'title',
        'description',
        'status',
        'priority',
        'customer_id',
        'assigned_to',
        'created_by',
        'source',
        'category',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    // ── Statuts possibles ─────────────────────────────────────────────
    const STATUS_OPEN        = 'open';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_RESOLVED    = 'resolved';
    const STATUS_CLOSED      = 'closed';

    // ── Priorités possibles ───────────────────────────────────────────
    const PRIORITY_LOW      = 'low';
    const PRIORITY_MEDIUM   = 'medium';
    const PRIORITY_HIGH     = 'high';
    const PRIORITY_CRITICAL = 'critical';

    // ── Relations ─────────────────────────────────────────────────────

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function assignedAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class)->orderBy('created_at', 'asc');
    }

    public function history(): HasMany
    {
        return $this->hasMany(TicketHistory::class)->orderBy('created_at', 'desc');
    }

    // ── Helpers ───────────────────────────────────────────────────────

    /**
     * Génère un numéro de ticket unique (TK-000001).
     */
    public static function generateTicketNumber(): string
    {
        $last = self::orderByDesc('id')->first();
        $nextId = $last ? $last->id + 1 : 1;
        return 'TK-' . str_pad($nextId, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Vérifie si le ticket est ouvert (non résolu/fermé).
     */
    public function isOpen(): bool
    {
        return in_array($this->status, [self::STATUS_OPEN, self::STATUS_IN_PROGRESS]);
    }

    /**
     * Scope : filtrer par statut.
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope : filtrer par priorité.
     */
    public function scopePriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope : filtrer par agent assigné.
     */
    public function scopeAssignedTo($query, int $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    /**
     * Tickets ouverts uniquement.
     */
    public function scopeOpen($query)
    {
        return $query->whereIn('status', [self::STATUS_OPEN, self::STATUS_IN_PROGRESS]);
    }
}
