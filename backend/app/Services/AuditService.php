<?php

namespace App\Services;

use Modules\User\Entities\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    /**
     * Log an audit event.
     */
    public static function log(string $action, Model $model, ?array $oldValues = null, ?array $newValues = null): AuditLog
    {
        // Filter out timestamps and internal fields
        $exclude = ['created_at', 'updated_at', 'deleted_at', 'remember_token'];
        if ($oldValues) {
            $oldValues = array_diff_key($oldValues, array_flip($exclude));
        }
        if ($newValues) {
            $newValues = array_diff_key($newValues, array_flip($exclude));
        }

        return AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'auditable_type' => get_class($model),
            'auditable_id' => $model->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    /**
     * Log a "created" event.
     */
    public static function logCreated(Model $model): AuditLog
    {
        return static::log('created', $model, null, $model->getAttributes());
    }

    /**
     * Log an "updated" event (only changed fields).
     */
    public static function logUpdated(Model $model): AuditLog
    {
        $dirty = $model->getDirty();
        $original = array_intersect_key($model->getOriginal(), $dirty);
        return static::log('updated', $model, $original, $dirty);
    }

    /**
     * Log a "deleted" event.
     */
    public static function logDeleted(Model $model): AuditLog
    {
        return static::log('deleted', $model, $model->getAttributes(), null);
    }
}
