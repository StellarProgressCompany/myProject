<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BookingConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public Booking $booking;

    /**
     * Create a new message instance.
     */
    public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }

    /**
     * Build the message (No Blade, using inline HTML).
     */
    public function build()
    {
        return $this
            ->subject('Your Booking is Confirmed!')
            ->html("
                <h1>Thank you for your booking, {$this->booking->full_name}!</h1>
                <p>Your reservation details:</p>
                <ul>
                    <li>Date: {$this->booking->tableAvailability->date}</li>
                    <li>Meal Type: {$this->booking->tableAvailability->meal_type}</li>
                    <li>Time: {$this->booking->reserved_time}</li>
                    <li>Guests: " . ($this->booking->total_adults + $this->booking->total_kids) . "</li>
                </ul>
                <p>We look forward to seeing you!</p>
            ");
    }
}
