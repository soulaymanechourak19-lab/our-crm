<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadTracking extends Model
{
    protected $table = 'lead_tracking';

    protected $fillable = [
        'lead_id',
        'session_id',
        'pages_viewed',
        'time_on_site',
        'entry_page',
        'exit_page',
        'device_type',
        'location',
        'score',
        'ip_address',
        'user_agent',
        'last_activity',
    ];

    protected $casts = [
        'pages_viewed' => 'array',
        'time_on_site' => 'integer',
        'score' => 'integer',
        'last_activity' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
