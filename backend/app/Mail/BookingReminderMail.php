<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BookingReminderMail extends Mailable
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
            ->subject('Reminder: Your BookingWizard is Tomorrow')
            ->html("
                <h1>Don't forget your reservation!</h1>
                <p>Dear {$this->booking->full_name}, this is a friendly reminder that you have a reservation tomorrow.</p>
                <ul>
                    <li>Date: {$this->booking->tableAvailability->date}</li>
                    <li>Meal Type: {$this->booking->tableAvailability->meal_type}</li>
                    <li>Time: {$this->booking->reserved_time}</li>
                </ul>
                <p>We look forward to serving you!</p>
            ");
    }
}
