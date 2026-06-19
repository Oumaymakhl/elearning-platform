<?php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TeacherPendingApprovalMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public $teacher) {}

    public function build()
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');
        $cvUrl = $this->teacher->cv_path
            ? $frontendUrl . '/storage/' . $this->teacher->cv_path
            : null;

        $cvSection = $cvUrl
            ? "<p><a href='{$cvUrl}' style='color:#1E3A5F;'>📄 Consulter le CV de {$this->teacher->name}</a></p>"
            : "<p>Aucun CV soumis.</p>";

        $adminUrl = $frontendUrl . '/teacher-approvals';

        return $this->subject('Nouvel enseignant en attente d\'approbation')
            ->html("
                <h2>Nouvel enseignant en attente de validation</h2>
                <p><strong>Nom :</strong> {$this->teacher->name}</p>
                <p><strong>Email :</strong> {$this->teacher->email}</p>
                {$cvSection}
                <p>
                    <a href='{$adminUrl}'
                       style='background:#1E3A5F;color:white;padding:12px 24px;
                              text-decoration:none;border-radius:5px;display:inline-block;'>
                        Gérer les enseignants
                    </a>
                </p>
            ");
    }
}
