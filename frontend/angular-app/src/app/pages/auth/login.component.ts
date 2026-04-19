import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
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
              <rect x="90" y="70" width="150" height="110" rx="12" fill="white" opacity=".9"/>
              <rect x="90" y="70" width="150" height="28" rx="12" fill="#1E3A5F" opacity=".85"/>
              <rect x="90" y="84" width="150" height="14" rx="0" fill="#1E3A5F" opacity=".85"/>
              <circle cx="103" cy="84" r="4" fill="#ef4444" opacity=".8"/>
              <circle cx="116" cy="84" r="4" fill="#f59e0b" opacity=".8"/>
              <circle cx="129" cy="84" r="4" fill="#10b981" opacity=".8"/>
              <rect x="105" y="110" width="120" height="8" rx="4" fill="#4A90D9" opacity=".5"/>
              <rect x="105" y="126" width="90" height="6" rx="3" fill="#e2e8f0"/>
              <rect x="105" y="140" width="100" height="6" rx="3" fill="#e2e8f0"/>
              <rect x="105" y="154" width="70" height="14" rx="7" fill="#4A90D9" opacity=".85"/>
              <circle cx="265" cy="110" r="30" fill="#4A90D9" opacity=".15"/>
              <circle cx="265" cy="104" r="12" fill="#FFD7B5"/>
              <rect x="253" y="116" width="24" height="30" rx="6" fill="#4A90D9" opacity=".7"/>
              <rect x="245" y="120" width="12" height="20" rx="5" fill="#4A90D9" opacity=".5"/>
              <rect x="277" y="120" width="12" height="20" rx="5" fill="#4A90D9" opacity=".5"/>
              <circle cx="95" cy="210" r="22" fill="#4A90D9" opacity=".12"/>
              <circle cx="95" cy="204" r="9" fill="#FFD7B5"/>
              <rect x="86" y="213" width="18" height="22" rx="5" fill="#1E3A5F" opacity=".5"/>
              <path d="M200 180 Q230 160 250 185" stroke="#4A90D9" stroke-width="2" fill="none" opacity=".4" stroke-dasharray="4,3"/>
              <text x="280" y="75" font-size="14" fill="#4A90D9" opacity=".5">✦</text>
              <text x="65" y="160" font-size="10" fill="#1E3A5F" opacity=".3">✦</text>
              <text x="220" y="240" font-size="12" fill="#4A90D9" opacity=".4">✦</text>
            </svg>
            <h2>Bon retour parmi nous !</h2>
            <p>Connectez-vous pour accéder à vos cours et continuer votre apprentissage.</p>
          </div>
        </div>
        <div class="form-side">
          <div class="form-card">
            <div class="brand">🎓 <span>E-Learning</span></div>
            <h3>Connexion</h3>
            <p class="sub">Bienvenue ! Entrez vos identifiants.</p>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="field">
                <label>Email</label>
                <div class="input-wrap">
                  <svg class="ico" viewBox="0 0 20 20" fill="none"><path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 0l7 5 7-5" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <input type="email" formControlName="email" placeholder="votre@email.com">
                </div>
              </div>
              <div class="field">
                <label>Mot de passe</label>
                <div class="input-wrap">
                  <svg class="ico" viewBox="0 0 20 20" fill="none"><rect x="5" y="9" width="10" height="8" rx="2" stroke="#94a3b8" stroke-width="1.5"/><path d="M7 9V7a3 3 0 016 0v2" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <input [type]="showPw ? 'text' : 'password'" formControlName="password" placeholder="••••••••">
                  <button type="button" class="eye" (click)="showPw=!showPw">
                    <svg viewBox="0 0 20 20" fill="none" width="18"><path d="M1 10s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z" stroke="#94a3b8" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="#94a3b8" stroke-width="1.5"/></svg>
                  </button>
                </div>
              </div>
              <div class="row-forgot">
                <a routerLink="/forgot-password" class="forgot">Mot de passe oublié ?</a>
              </div>
              <div class="error-box" *ngIf="error">
                <svg viewBox="0 0 20 20" width="16" fill="none"><circle cx="10" cy="10" r="8" stroke="#ef4444" stroke-width="1.5"/><path d="M10 6v4M10 14h.01" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/></svg>
                {{ error }}
              </div>
              <button type="submit" [disabled]="loading" class="btn-submit">
                <span *ngIf="!loading">Se connecter</span>
                <span *ngIf="loading" class="spinner"></span>
              </button>
            </form>
            <p class="switch">Pas encore inscrit ? <a routerLink="/register">S'inscrire</a></p>
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
    .sub { text-align:center; color:#64748b; font-size:.88rem; margin-bottom:1.75rem; }
    .field { margin-bottom:1.1rem; }
    label { display:block; font-size:.82rem; font-weight:600; color:#374151; margin-bottom:.4rem; }
    .input-wrap { position:relative; display:flex; align-items:center; }
    .ico { position:absolute; left:.85rem; width:17px; height:17px; }
    .input-wrap input { width:100%; padding:.78rem .78rem .78rem 2.6rem; border:1.5px solid #e2e8f0; border-radius:10px; font-size:.92rem; outline:none; transition:border-color .2s,box-shadow .2s; background:#f8fafc; color:#1e293b; }
    .input-wrap input:focus { border-color:#4A90D9; box-shadow:0 0 0 3px rgba(74,144,217,.12); background:white; }
    .eye { position:absolute; right:.75rem; background:none; border:none; cursor:pointer; padding:0; display:flex; }
    .row-forgot { display:flex; justify-content:flex-end; margin:.2rem 0 1rem; }
    .forgot { font-size:.82rem; color:#4A90D9; text-decoration:none; font-weight:500; }
    .forgot:hover { color:#1E3A5F; text-decoration:underline; }
    .error-box { display:flex; align-items:center; gap:.5rem; background:#fef2f2; border:1px solid #fecaca; color:#ef4444; padding:.65rem .85rem; border-radius:8px; font-size:.85rem; margin-bottom:1rem; }
    .btn-submit { width:100%; padding:.9rem; background:#4A90D9; color:white; border:none; border-radius:10px; font-size:1rem; font-weight:600; cursor:pointer; transition:background .2s,transform .1s; display:flex; align-items:center; justify-content:center; min-height:48px; }
    .btn-submit:hover:not(:disabled) { background:#1E3A5F; transform:translateY(-1px); }
    .btn-submit:disabled { opacity:.6; cursor:not-allowed; }
    .spinner { width:20px; height:20px; border:2px solid rgba(255,255,255,.4); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .switch { text-align:center; margin-top:1.25rem; color:#64748b; font-size:.88rem; }
    .switch a { color:#4A90D9; font-weight:600; text-decoration:none; }
    .switch a:hover { color:#1E3A5F; }
    @media(max-width:768px) { .illus-side { display:none; } .form-side { flex:1; } }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';
  showPw = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.get('email')?.invalid) this.error = 'Veuillez entrer un email valide';
      else if (this.form.get('password')?.invalid) this.error = 'Le mot de passe est obligatoire';
      return;
    }
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        const status = e.status;
        if (status === 401) this.error = e.error?.message || 'Email ou mot de passe incorrect';
        else if (status === 404) this.error = 'Aucun compte trouvé avec cet email';
        else this.error = e.error?.message || 'Une erreur est survenue';
        this.loading = false;
      }
    });
  }
}
