<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Modules\User\Entities\Lead;

class LeadExpirationWarningMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Lead $lead) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Action Required: Lead {$this->lead->contact_name} is expiring soon",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.lead_expiration_warning',
        );
    }
}
