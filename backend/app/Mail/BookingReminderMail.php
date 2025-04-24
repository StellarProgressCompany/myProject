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
        $meal = $this->booking->tableAvailability->meal_type === 'lunch'
            ? 'Comida'
            : 'Cena';

        return $this
            ->subject('Recordatorio: su reserva es mañana')
            ->html("
                <style>
                    body{font-family:Arial,Helvetica,sans-serif;color:#222;margin:0;padding:0}
                    .box{max-width:600px;margin:0 auto;padding:24px}
                    h1{margin-top:0;color:#0f766e;font-size:22px}
                    ul{padding-left:18px}
                    li{margin:4px 0}
                </style>

                <div class='box'>
                    <h1>¡Mañana es el gran día!</h1>

                    <p>
                        {$this->booking->full_name}, le recordamos su reserva confirmada:
                    </p>

                    <ul>
                        <li><strong>Fecha:</strong> {$this->booking->tableAvailability->date}</li>
                        <li><strong>Servicio:</strong> {$meal}</li>
                        <li><strong>Hora:</strong> {$this->booking->reserved_time}</li>
                    </ul>

                    <p>
                        Si necesita realizar cambios, por favor conteste a este correo
                        o llámenos. ¡Hasta pronto!
                    </p>

                    <p style='margin-top:32px;font-size:14px;color:#555'>
                        — Equipo de Atención al Cliente
                    </p>
                </div>
            ");
    }
}
