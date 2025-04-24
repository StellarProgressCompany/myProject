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
            ->subject('¿Cómo fue su experiencia con nosotros?')
            ->html("
                <style>
                    body{font-family:Arial,Helvetica,sans-serif;color:#222;margin:0;padding:0}
                    .box{max-width:600px;margin:0 auto;padding:24px}
                    h1{margin-top:0;color:#2563eb;font-size:22px}
                </style>

                <div class='box'>
                    <h1>Gracias por su visita, {$this->booking->full_name}.</h1>

                    <p>
                        Su opinión es muy valiosa para nosotros. Le agradeceríamos que
                        dedicara un minuto a contarnos cómo fue todo.
                    </p>

                    <p>
                        <a href='#' style='background:#2563eb;color:#fff;padding:10px 18px;border-radius:4px;text-decoration:none'>
                            Enviar valoración
                        </a>
                    </p>

                    <p style='margin-top:32px;font-size:14px;color:#555'>
                        — Equipo de Atención al Cliente
                    </p>
                </div>
            ");
    }
}
