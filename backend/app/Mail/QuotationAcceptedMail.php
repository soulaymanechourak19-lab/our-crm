<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Modules\User\Entities\Quotation;

class QuotationAcceptedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Quotation $quotation) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your Quotation has been accepted ({$this->quotation->number})",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.quotation_accepted',
        );
    }
}
