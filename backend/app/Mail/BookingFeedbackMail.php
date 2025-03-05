<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BookingFeedbackMail extends Mailable
{
    use Queueable, SerializesModels;

    public Booking $booking;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }

    public function build()
    {
        return $this
            ->subject('We Value Your Feedback!')
            ->html("
                <h1>We hope you enjoyed your meal, {$this->booking->full_name}!</h1>
                <p>We would appreciate any feedback you have about your experience.</p>
                <p>Please click the link below to let us know how we did:</p>
                <p><a href='#'>Give Feedback</a></p>
            ");
    }
}
