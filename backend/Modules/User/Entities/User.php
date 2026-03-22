<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    // Role constants
    const ROLE_ADMIN = 'admin';
    const ROLE_AGENT_COMMERCIAL = 'agent_commercial';
    const ROLE_AGENT_SAV = 'agent_sav';

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'role' => 'string',
        ];
    }

    /**
     * Check if user has admin role.
     */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * Check if user has agent commercial role.
     */
    public function isAgentCommercial(): bool
    {
        return $this->role === self::ROLE_AGENT_COMMERCIAL;
    }

    /**
     * Check if user has agent SAV role.
     */
    public function isAgentSav(): bool
    {
        return $this->role === self::ROLE_AGENT_SAV;
    }

    /**
     * Tickets assigned to this user (agent).
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(\Modules\Ticketing\Entities\Ticket::class, 'assigned_to');
    }
}
