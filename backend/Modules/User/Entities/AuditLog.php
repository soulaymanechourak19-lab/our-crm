<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'action', 'auditable_type', 'auditable_id',
        'old_values', 'new_values', 'ip_address', 'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ── Scopes ───────────────────────────────────────────────

    public function scopeForModel(Builder $query, string $type, ?int $id = null): Builder
    {
        $query->where('auditable_type', $type);
        if ($id) {
            $query->where('auditable_id', $id);
        }
        return $query;
    }

    public function scopeByUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeRecent(Builder $query, int $days = 30): Builder
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // ── Helpers ──────────────────────────────────────────────

    public function getChangedFieldsAttribute(): array
    {
        $old = $this->old_values ?? [];
        $new = $this->new_values ?? [];
        $changed = [];

        foreach ($new as $key => $value) {
            if (!array_key_exists($key, $old) || $old[$key] !== $value) {
                $changed[$key] = [
                    'old' => $old[$key] ?? null,
                    'new' => $value,
                ];
            }
        }
        return $changed;
    }

    /**
     * Get a human-readable label for the auditable type.
     */
    public function getEntityLabelAttribute(): string
    {
        $map = [
            'Modules\\User\\Entities\\Lead' => 'Lead',
            'Modules\\User\\Entities\\Customer' => 'Customer',
            'Modules\\User\\Entities\\Task' => 'Task',
            'Modules\\User\\Entities\\User' => 'User',
            'Modules\\User\\Entities\\Quotation' => 'Quotation',
            'Modules\\User\\Entities\\Discount' => 'Discount',
            'Modules\\User\\Entities\\EmailTemplate' => 'Email Template',
        ];
        return $map[$this->auditable_type] ?? class_basename($this->auditable_type);
    }
}
