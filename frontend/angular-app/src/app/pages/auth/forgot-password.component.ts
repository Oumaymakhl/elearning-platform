import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="circle c1"></div>
      <div class="circle c2"></div>
      <div class="circle c3"></div>
      <div class="split">
        <div class="illus-side">
          <div class="illus-card">
            <svg viewBox="0 0 340 280" xmlns="http://www.w3.org/2000/svg" class="illus-svg">
              <circle cx="170" cy="140" r="110" fill="#4A90D9" opacity=".12"/>
              <circle cx="170" cy="140" r="75" fill="#4A90D9" opacity=".1"/>
              <rect x="110" y="100" width="120" height="90" rx="14" fill="white" opacity=".9"/>
              <path d="M135 100 v-25 a35 35 0 0 1 70 0 v25" fill="none" stroke="#4A90D9" stroke-width="12" stroke-linecap="round" opacity=".4"/>
              <circle cx="170" cy="143" r="14" fill="#4A90D9" opacity=".7"/>
              <rect x="166" y="143" width="8" height="20" rx="4" fill="#1E3A5F" opacity=".6"/>
              <circle cx="85" cy="185" r="38" fill="none" stroke="#f59e0b" stroke-width="10" opacity=".35"/>
              <circle cx="85" cy="185" r="20" fill="none" stroke="#f59e0b" stroke-width="7" opacity=".3"/>
              <rect x="118" y="181" width="65" height="10" rx="4" fill="#f59e0b" opacity=".45"/>
              <rect x="169" y="191" width="12" height="15" rx="3" fill="#f59e0b" opacity=".45"/>
              <rect x="150" y="191" width="10" height="12" rx="3" fill="#f59e0b" opacity=".35"/>
              <circle cx="270" cy="155" r="22" fill="#4A90D9" opacity=".1"/>
              <circle cx="270" cy="149" r="9" fill="#FFD7B5"/>
              <rect x="261" y="158" width="18" height="26" rx="5" fill="#4A90D9" opacity=".45"/>
              <text x="290" y="75" font-size="14" fill="#4A90D9" opacity=".5">✦</text>
              <text x="55" y="120" font-size="10" fill="#1E3A5F" opacity=".3">✦</text>
              <text x="210" y="255" font-size="12" fill="#4A90D9" opacity=".4">✦</text>
            </svg>
            <h2>Mot de passe oublié ?</h2>
            <p>Pas de panique ! Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.</p>
          </div>
        </div>
        <div class="form-side">
          <div class="form-card">
            <div class="brand">🎓 <span>E-Learning</span></div>
            <h3>Réinitialiser</h3>
            <p class="sub">Entrez votre adresse email pour recevoir le lien.</p>
            <div class="success-box" *ngIf="sent">
              <div class="success-icon">📧</div>
              <h4>Email envoyé !</h4>
              <p>Vérifiez votre boîte mail à <strong>{{ form.value.email }}</strong> et suivez le lien pour réinitialiser votre mot de passe.</p>
              <a routerLink="/login" class="btn-back">← Retour à la connexion</a>
            </div>
            <form [formGroup]="form" (ngSubmit)="submit()" *ngIf="!sent">
              <div class="field">
                <label>Adresse email</label>
                <div class="input-wrap">
                  <svg class="ico" viewBox="0 0 20 20" fill="none"><path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 0l7 5 7-5" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <input type="email" formControlName="email" placeholder="votre@email.com">
                </div>
              </div>
              <div class="error-box" *ngIf="error">
                <svg viewBox="0 0 20 20" width="16" fill="none"><circle cx="10" cy="10" r="8" stroke="#ef4444" stroke-width="1.5"/><path d="M10 6v4M10 14h.01" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/></svg>
                {{ error }}
              </div>
              <button type="submit" [disabled]="loading" class="btn-submit">
                <span *ngIf="!loading">Envoyer le lien</span>
                <span *ngIf="loading" class="spinner"></span>
              </button>
            </form>
            <p class="switch" *ngIf="!sent">← <a routerLink="/login">Retour à la connexion</a></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; margin:0; padding:0; }
    .page { min-height:100vh; background:#e8f0fb; position:relative; overflow:hidden; display:flex; align-items:stretch; }
    .circle { position:absolute; border-radius:50%; background:#4A90D9; opacity:.13; }
    .c1 { width:500px; height:500px; top:-180px; left:-150px; }
    .c2 { width:350px; height:350px; bottom:-120px; right:-80px; }
    .c3 { width:200px; height:200px; top:55%; left:38%; opacity:.08; }
    .split { display:flex; width:100%; min-height:100vh; position:relative; z-index:1; }
    .illus-side { flex:1; display:flex; align-items:center; justify-content:center; padding:3rem 2rem; }
    .illus-card { text-align:center; max-width:340px; }
    .illus-svg { width:100%; max-width:300px; margin-bottom:1.75rem; filter:drop-shadow(0 8px 24px rgba(74,144,217,.18)); }
    .illus-card h2 { color:#1E3A5F; font-size:1.5rem; font-weight:700; margin-bottom:.75rem; }
    .illus-card p { color:#64748b; font-size:.95rem; line-height:1.7; }
    .form-side { flex:0 0 480px; display:flex; align-items:center; justify-content:center; padding:2rem; }
    .form-card { background:white; border-radius:20px; box-shadow:0 8px 40px rgba(30,58,95,.10); padding:2.75rem; width:100%; max-width:420px; }
    .brand { text-align:center; font-size:1.25rem; font-weight:800; color:#1E3A5F; margin-bottom:.4rem; }
    .brand span { color:#4A90D9; }
    h3 { text-align:center; font-size:1.6rem; color:#1E3A5F; font-weight:700; margin-bottom:.2rem; }
    .sub { text-align:center; color:#64748b; font-size:.88rem; margin-bottom:1.75rem; line-height:1.5; }
    .field { margin-bottom:1.25rem; }
    label { display:block; font-size:.82rem; font-weight:600; color:#374151; margin-bottom:.4rem; }
    .input-wrap { position:relative; display:flex; align-items:center; }
    .ico { position:absolute; left:.85rem; width:17px; height:17px; }
    .input-wrap input { width:100%; padding:.78rem .78rem .78rem 2.6rem; border:1.5px solid #e2e8f0; border-radius:10px; font-size:.92rem; outline:none; transition:border-color .2s,box-shadow .2s; background:#f8fafc; color:#1e293b; }
    .input-wrap input:focus { border-color:#4A90D9; box-shadow:0 0 0 3px rgba(74,144,217,.12); background:white; }
    .error-box { display:flex; align-items:center; gap:.5rem; background:#fef2f2; border:1px solid #fecaca; color:#ef4444; padding:.65rem .85rem; border-radius:8px; font-size:.85rem; margin-bottom:1rem; }
    .btn-submit { width:100%; padding:.9rem; background:#4A90D9; color:white; border:none; border-radius:10px; font-size:1rem; font-weight:600; cursor:pointer; transition:background .2s,transform .1s; display:flex; align-items:center; justify-content:center; min-height:48px; }
    .btn-submit:hover:not(:disabled) { background:#1E3A5F; transform:translateY(-1px); }
    .btn-submit:disabled { opacity:.6; cursor:not-allowed; }
    .spinner { width:20px; height:20px; border:2px solid rgba(255,255,255,.4); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .switch { text-align:center; margin-top:1.25rem; color:#64748b; font-size:.88rem; }
    .switch a { color:#4A90D9; font-weight:600; text-decoration:none; }
    .switch a:hover { color:#1E3A5F; }
    .success-box { text-align:center; padding:1rem 0; }
    .success-icon { font-size:3.5rem; margin-bottom:1rem; }
    .success-box h4 { color:#1E3A5F; font-size:1.2rem; margin-bottom:.75rem; }
    .success-box p { color:#64748b; font-size:.9rem; line-height:1.6; margin-bottom:1.5rem; }
    .btn-back { display:inline-block; background:#4A90D9; color:white; padding:.75rem 1.75rem; border-radius:10px; text-decoration:none; font-weight:600; font-size:.9rem; }
    .btn-back:hover { background:#1E3A5F; }
    @media(max-width:768px) { .illus-side { display:none; } .form-side { flex:1; } }
  `]
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = false;
  error = '';
  sent = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  }

  submit() {
    if (this.form.invalid) { this.error = 'Veuillez entrer un email valide'; return; }
    this.loading = true;
    this.error = '';
    this.http.post('/api/auth/forgot-password', { email: this.form.value.email }).subscribe({
      next: () => { this.sent = true; this.loading = false; },
      error: (e) => { this.error = e.error?.message || 'Email introuvable'; this.loading = false; }
    });
  }
}
