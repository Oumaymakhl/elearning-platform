<?php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TeacherApprovalResultMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public $teacher,
        public bool $approved,
        public ?string $reason = null
    ) {}

    public function build()
    {
        if ($this->approved) {
            $subject = 'Votre compte enseignant a été approuvé';
            $body = "
                <h2>Félicitations {$this->teacher->name} !</h2>
                <p>Votre compte enseignant sur la plateforme E-Learning a été <strong>approuvé</strong> par l'administrateur.</p>
                <p>Vous pouvez dès maintenant vous connecter et commencer à créer vos cours.</p>
                <a href='http://localhost:4200/login'
                   style='background:#1E3A5F;color:white;padding:12px 24px;
                          text-decoration:none;border-radius:5px;display:inline-block;'>
                    Se connecter
                </a>
            ";
        } else {
            $subject = 'Votre demande de compte enseignant a été refusée';
            $reasonText = $this->reason ? "<p><strong>Raison :</strong> {$this->reason}</p>" : '';
            $body = "
                <h2>Bonjour {$this->teacher->name},</h2>
                <p>Nous vous informons que votre demande de compte enseignant a été <strong>refusée</strong>.</p>
                {$reasonText}
                <p>Pour toute question, veuillez contacter l'administrateur de la plateforme.</p>
            ";
        }

        return $this->subject($subject)->html($body);
    }
}
