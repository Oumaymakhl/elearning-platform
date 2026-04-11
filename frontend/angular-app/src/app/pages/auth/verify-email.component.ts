import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="card">
        <div class="logo">🎓 E-Learning</div>



        <!-- Loading -->
        <div class="state" *ngIf="status === 'loading'">
          <div class="spinner"></div>
          <h2>Vérification en cours...</h2>
          <p>Veuillez patienter</p>
        </div>

        <!-- Succès -->
        <div class="state" *ngIf="status === 'success'">
          <div class="icon success-icon">✅</div>
          <h2>Email vérifié !</h2>
          <p>Votre compte est activé. Vous pouvez maintenant vous connecter.</p>
          <a routerLink="/login" class="btn-primary">Se connecter →</a>
        </div>

        <!-- Erreur -->
        <div class="state" *ngIf="status === 'error'">
          <div class="icon error-icon">❌</div>
          <h2>Lien invalide</h2>
          <p>Ce lien de vérification est invalide ou a déjà été utilisé.</p>
          <a routerLink="/login" class="btn-secondary">Retour à la connexion</a>
        </div>

        <!-- Pas de token -->
        <div class="state" *ngIf="status === 'no-token'">
          <div class="icon info-icon">📧</div>
          <h2>Vérifiez votre email</h2>
          <p>Un email de confirmation a été envoyé à votre adresse. Cliquez sur le lien dans l'email pour activer votre compte.</p>
          <a routerLink="/login" class="btn-secondary">Retour à la connexion</a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#0f2544,#1E3A5F); padding:1rem; }
    .card { background:white; border-radius:16px; padding:2.5rem 2rem; width:100%; max-width:420px; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,.2); }
    .logo { font-size:1.4rem; font-weight:800; color:#1E3A5F; margin-bottom:2rem; }
    .state { display:flex; flex-direction:column; align-items:center; gap:1rem; }
    .spinner { width:48px; height:48px; border:4px solid #e2e8f0; border-top-color:#1E3A5F; border-radius:50%; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .icon { font-size:3rem; }
    h2 { color:#1E3A5F; margin:0; font-size:1.4rem; }
    p { color:#64748b; margin:0; font-size:.9rem; line-height:1.6; }
    .btn-primary { background:#1E3A5F; color:white; padding:.75rem 2rem; border-radius:8px; text-decoration:none; font-weight:600; font-size:.9rem; margin-top:.5rem; display:inline-block; }
    .btn-primary:hover { background:#0f2544; }
    .btn-secondary { background:#f1f5f9; color:#1E3A5F; padding:.75rem 2rem; border-radius:8px; text-decoration:none; font-weight:600; font-size:.9rem; margin-top:.5rem; display:inline-block; }
    .btn-secondary:hover { background:#e2e8f0; }
  `]
})
export class VerifyEmailComponent implements OnInit {
  status: 'confirm' | 'loading' | 'success' | 'error' | 'no-token' = 'loading';
  token: string = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) { this.status = 'no-token'; return; }
    this.token = token;
    this.status = 'loading';
    // Vérifier et activer directement au chargement — un seul usage possible
    this.http.post('/auth-api/verify-email', { token: this.token }).subscribe({
      next: () => { this.status = 'success'; },
      error: () => { this.status = 'error'; }
    });
  }

  confirm() {} // gardé pour compatibilité template
}
