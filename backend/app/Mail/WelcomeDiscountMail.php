<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Modules\User\Entities\Customer;

class WelcomeDiscountMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Customer $customer) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to Our CRM! Enjoy your exclusive discount',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.welcome_discount',
        );
    }
}
