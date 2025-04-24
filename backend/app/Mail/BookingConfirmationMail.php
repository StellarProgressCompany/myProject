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
     * Build the message (no Blade view, inline HTML).
     */
    public function build()
    {
        $meal = $this->booking->tableAvailability->meal_type === 'lunch'
            ? 'Comida'
            : 'Cena';

        return $this
            ->subject('Reserva confirmada – ¡gracias por elegirnos!')
            ->html("
                <style>
                    body{font-family:Arial,Helvetica,sans-serif;color:#222;margin:0;padding:0}
                    .box{max-width:600px;margin:0 auto;padding:24px}
                    h1{margin-top:0;color:#d97706;font-size:22px}
                    ul{padding-left:18px}
                    li{margin:4px 0}
                </style>

                <div class='box'>
                    <h1>Estimado/a {$this->booking->full_name},</h1>

                    <p>
                        Nos complace confirmar su reserva. A continuación encontrará
                        los detalles:
                    </p>

                    <ul>
                        <li><strong>Fecha:</strong> {$this->booking->tableAvailability->date}</li>
                        <li><strong>Servicio:</strong> {$meal}</li>
                        <li><strong>Hora:</strong> {$this->booking->reserved_time}</li>
                        <li><strong>N.º de comensales:</strong> " .
                ($this->booking->total_adults + $this->booking->total_kids) . "</li>
                    </ul>

                    <p>
                        Le rogamos que llegue con puntualidad. Si necesita modificar o
                        cancelar la reserva, responda a este correo o llámenos al teléfono
                        del restaurante.
                    </p>

                    <p>¡Le esperamos!</p>

                    <p style='margin-top:32px;font-size:14px;color:#555'>
                        — Equipo de Atención al Cliente
                    </p>
                </div>
            ");
    }
}
