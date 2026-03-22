<?php

namespace Modules\Ticketing\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Entities\User;

class TicketHistory extends Model
{
    public $timestamps = false;

    protected $table = 'ticket_history';

    protected $fillable = [
        'ticket_id',
        'changed_by',
        'field',
        'old_value',
        'new_value',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    // ── Relations ─────────────────────────────────────────────────────

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
