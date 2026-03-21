<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmailTemplate extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'subject', 'body', 'category', 'created_by', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Replace merge tags in the template with actual data.
     */
    public function render(array $data): array
    {
        $subject = $this->subject;
        $body = $this->body;

        foreach ($data as $key => $value) {
            $tag = '{{' . $key . '}}';
            $subject = str_replace($tag, (string) $value, $subject);
            $body = str_replace($tag, (string) $value, $body);
        }

        return ['subject' => $subject, 'body' => $body];
    }

    /**
     * Get available merge tags.
     */
    public static function mergeTags(): array
    {
        return [
            ['tag' => '{{contact_name}}', 'label' => 'Contact Name'],
            ['tag' => '{{company_name}}', 'label' => 'Company Name'],
            ['tag' => '{{email}}', 'label' => 'Email Address'],
            ['tag' => '{{phone}}', 'label' => 'Phone Number'],
            ['tag' => '{{status}}', 'label' => 'Lead/Customer Status'],
            ['tag' => '{{agent_name}}', 'label' => 'Your Name'],
            ['tag' => '{{today_date}}', 'label' => "Today's Date"],
            ['tag' => '{{company}}', 'label' => 'Your Company (OurCRM)'],
        ];
    }
}
