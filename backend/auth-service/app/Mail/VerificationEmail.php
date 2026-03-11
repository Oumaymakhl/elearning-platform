<?php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VerificationEmail extends Mailable
{
    use Queueable, SerializesModels;

    public string $verificationUrl;
    public string $userName;

    public function __construct(string $verificationUrl, string $userName)
    {
        $this->verificationUrl = $verificationUrl;
        $this->userName = $userName;
    }

    public function build()
    {
        return $this->subject('Vérifiez votre adresse e-mail - E-Learning Platform')
                    ->html("
                        <h2>Bonjour {$this->userName},</h2>
                        <p>Merci de vous être inscrit sur E-Learning Platform.</p>
                        <p>Cliquez sur le bouton ci-dessous pour activer votre compte :</p>
                        <a href='{$this->verificationUrl}'
                           style='background:#1E3A5F;color:white;padding:12px 24px;
                                  text-decoration:none;border-radius:5px;display:inline-block;'>
                            Vérifier mon email
                        </a>
                        <p>Ce lien expire dans 24h.</p>
                        <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
                    ");
    }
}
