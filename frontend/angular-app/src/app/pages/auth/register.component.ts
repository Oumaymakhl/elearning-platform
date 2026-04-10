import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
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
              <rect x="80" y="65" width="100" height="130" rx="10" fill="white" opacity=".9"/>
              <rect x="80" y="65" width="100" height="22" rx="10" fill="#1E3A5F" opacity=".85"/>
              <rect x="80" y="76" width="100" height="11" rx="0" fill="#1E3A5F" opacity=".85"/>
              <rect x="93" y="97" width="74" height="6" rx="3" fill="#e2e8f0"/>
              <rect x="93" y="110" width="60" height="6" rx="3" fill="#e2e8f0"/>
              <rect x="93" y="123" width="74" height="6" rx="3" fill="#e2e8f0"/>
              <rect x="93" y="136" width="50" height="6" rx="3" fill="#e2e8f0"/>
              <rect x="93" y="152" width="74" height="6" rx="3" fill="#e2e8f0"/>
              <rect x="93" y="167" width="55" height="14" rx="7" fill="#4A90D9" opacity=".85"/>
              <circle cx="260" cy="90" r="28" fill="#10b981" opacity=".15"/>
              <circle cx="260" cy="84" r="11" fill="#FFD7B5"/>
              <rect x="249" y="95" width="22" height="28" rx="6" fill="#10b981" opacity=".6"/>
              <circle cx="100" cy="220" r="26" fill="#4A90D9" opacity=".1"/>
              <circle cx="100" cy="214" r="10" fill="#FFD7B5"/>
              <rect x="90" y="224" width="20" height="26" rx="5" fill="#4A90D9" opacity=".5"/>
              <circle cx="240" cy="200" r="26" fill="#1E3A5F" opacity=".08"/>
              <circle cx="240" cy="194" r="10" fill="#FFD7B5"/>
              <rect x="230" y="204" width="20" height="26" rx="5" fill="#1E3A5F" opacity=".4"/>
              <path d="M122 210 Q170 190 218 204" stroke="#4A90D9" stroke-width="2" fill="none" opacity=".3" stroke-dasharray="4,3"/>
              <text x="290" y="65" font-size="14" fill="#4A90D9" opacity=".5">✦</text>
              <text x="55" y="170" font-size="10" fill="#1E3A5F" opacity=".3">✦</text>
              <text x="200" y="255" font-size="12" fill="#4A90D9" opacity=".4">✦</text>
            </svg>
            <h2>Rejoignez-nous !</h2>
            <p>Créez votre compte et accédez à des centaines de cours pour booster vos compétences.</p>
          </div>
        </div>
        <div class="form-side">
          <div class="form-card">
            <div class="brand">🎓 <span>E-Learning</span></div>
            <h3>Créer un compte</h3>
            <p class="sub">Remplissez le formulaire pour commencer.</p>

            <div class="success-box" *ngIf="success">
              <div class="success-icon">📧</div>
              <h4>Inscription réussie !</h4>
              <p>Un email de confirmation a été envoyé à <strong>{{ form.value.email }}</strong>.<br>Vérifiez votre boîte mail pour activer votre compte.</p>
              <a routerLink="/login" class="btn-back">Se connecter →</a>
            </div>

            <form [formGroup]="form" (ngSubmit)="submit()" *ngIf="!success">
              <div class="field" [class.valid]="isValid('name')" [class.invalid]="isInvalid('name')">
                <label>Nom complet</label>
                <div class="input-wrap">
                  <svg class="ico" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="#94a3b8" stroke-width="1.5"/><path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <input type="text" formControlName="name" placeholder="Jean Dupont">
                  <span class="check" *ngIf="isValid('name')">✓</span>
                </div>
                <div class="hint-err" *ngIf="isInvalid('name')">Le nom est requis</div>
              </div>
              <div class="field" [class.valid]="isValid('email')" [class.invalid]="isInvalid('email')">
                <label>Email</label>
                <div class="input-wrap">
                  <svg class="ico" viewBox="0 0 20 20" fill="none"><path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 0l7 5 7-5" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <input type="email" formControlName="email" placeholder="votre@email.com">
                  <span class="check" *ngIf="isValid('email')">✓</span>
                </div>
                <div class="hint-err" *ngIf="isInvalid('email')">Email invalide</div>
              </div>
              <div class="field">
                <label>Rôle</label>
                <div class="role-selector">
                  <div class="role-option" [class.selected]="form.value.role==='student'" (click)="form.patchValue({role:'student'})">
                    <span class="role-icon">🎓</span><span class="role-label">Étudiant</span>
                  </div>
                  <div class="role-option" [class.selected]="form.value.role==='teacher'" (click)="form.patchValue({role:'teacher'})">
                    <span class="role-icon">👨‍🏫</span><span class="role-label">Formateur</span>
                  </div>
                </div>
              </div>
              <div class="field" [class.valid]="isValid('password')" [class.invalid]="isInvalid('password')">
                <label>Mot de passe</label>
                <div class="input-wrap">
                  <svg class="ico" viewBox="0 0 20 20" fill="none"><rect x="5" y="9" width="10" height="8" rx="2" stroke="#94a3b8" stroke-width="1.5"/><path d="M7 9V7a3 3 0 016 0v2" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <input [type]="showPassword ? 'text' : 'password'" formControlName="password" placeholder="Minimum 6 caractères" (input)="checkPassword()">
                  <button type="button" class="eye" (click)="showPassword=!showPassword">
                    <svg viewBox="0 0 20 20" fill="none" width="18"><path d="M1 10s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z" stroke="#94a3b8" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="#94a3b8" stroke-width="1.5"/></svg>
                  </button>
                </div>
                <div class="pw-strength" *ngIf="form.value.password">
                  <div class="strength-bars">
                    <div class="bar" [class.active]="pwStrength>=1" [class.weak]="pwStrength===1" [class.medium]="pwStrength===2" [class.strong]="pwStrength>=3"></div>
                    <div class="bar" [class.active]="pwStrength>=2" [class.medium]="pwStrength===2" [class.strong]="pwStrength>=3"></div>
                    <div class="bar" [class.active]="pwStrength>=3" [class.strong]="pwStrength>=3"></div>
                  </div>
                  <span class="strength-label" [class.weak]="pwStrength===1" [class.medium]="pwStrength===2" [class.strong]="pwStrength>=3">{{ pwStrength===1 ? 'Faible' : pwStrength===2 ? 'Moyen' : 'Fort' }}</span>
                </div>
                <div class="pw-criteria" *ngIf="form.value.password">
                  <div class="criterion" [class.met]="form.value.password?.length >= 6"><span>{{ form.value.password?.length >= 6 ? '✓' : '○' }}</span> 6 caractères minimum</div>
                  <div class="criterion" [class.met]="hasUpperCase"><span>{{ hasUpperCase ? '✓' : '○' }}</span> Une majuscule</div>
                  <div class="criterion" [class.met]="hasNumber"><span>{{ hasNumber ? '✓' : '○' }}</span> Un chiffre</div>
                </div>
              </div>
              <div class="field" [class.valid]="isValid('password_confirmation') && passwordsMatch" [class.invalid]="isInvalid('password_confirmation') || (form.value.password_confirmation && !passwordsMatch)">
                <label>Confirmer le mot de passe</label>
                <div class="input-wrap">
                  <svg class="ico" viewBox="0 0 20 20" fill="none"><rect x="5" y="9" width="10" height="8" rx="2" stroke="#94a3b8" stroke-width="1.5"/><path d="M7 9V7a3 3 0 016 0v2" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <input [type]="showConfirm ? 'text' : 'password'" formControlName="password_confirmation" placeholder="Répétez le mot de passe">
                  <button type="button" class="eye" (click)="showConfirm=!showConfirm">
                    <svg viewBox="0 0 20 20" fill="none" width="18"><path d="M1 10s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z" stroke="#94a3b8" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="#94a3b8" stroke-width="1.5"/></svg>
                  </button>
                  <span class="check" *ngIf="passwordsMatch && form.value.password_confirmation">✓</span>
                </div>
                <div class="hint-err" *ngIf="form.value.password_confirmation && !passwordsMatch">Les mots de passe ne correspondent pas</div>
              </div>
              <div class="error-box" *ngIf="error">
                <svg viewBox="0 0 20 20" width="16" fill="none"><circle cx="10" cy="10" r="8" stroke="#ef4444" stroke-width="1.5"/><path d="M10 6v4M10 14h.01" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/></svg>
                {{ error }}
              </div>
              <button type="submit" [disabled]="loading || form.invalid || !passwordsMatch" class="btn-submit">
                <span *ngIf="!loading">S'inscrire</span>
                <span *ngIf="loading" class="spinner"></span>
              </button>
            </form>
            <p class="switch" *ngIf="!success">Déjà inscrit ? <a routerLink="/login">Se connecter</a></p>
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
    .form-side { flex:0 0 500px; display:flex; align-items:center; justify-content:center; padding:2rem; }
    .form-card { background:white; border-radius:20px; box-shadow:0 8px 40px rgba(30,58,95,.10); padding:2.5rem; width:100%; max-width:440px; }
    .brand { text-align:center; font-size:1.25rem; font-weight:800; color:#1E3A5F; margin-bottom:.4rem; }
    .brand span { color:#4A90D9; }
    h3 { text-align:center; font-size:1.6rem; color:#1E3A5F; font-weight:700; margin-bottom:.2rem; }
    .sub { text-align:center; color:#64748b; font-size:.88rem; margin-bottom:1.5rem; }
    .field { margin-bottom:.95rem; }
    label { display:block; font-size:.82rem; font-weight:600; color:#374151; margin-bottom:.35rem; }
    .input-wrap { position:relative; display:flex; align-items:center; }
    .ico { position:absolute; left:.85rem; width:17px; height:17px; }
    .input-wrap input { width:100%; padding:.72rem .72rem .72rem 2.6rem; border:1.5px solid #e2e8f0; border-radius:10px; font-size:.9rem; outline:none; transition:border-color .2s,box-shadow .2s; background:#f8fafc; color:#1e293b; }
    .input-wrap input:focus { border-color:#4A90D9; box-shadow:0 0 0 3px rgba(74,144,217,.12); background:white; }
    .field.valid .input-wrap input { border-color:#10b981; }
    .field.invalid .input-wrap input { border-color:#ef4444; }
    .check { position:absolute; right:2.5rem; color:#10b981; font-weight:700; font-size:.9rem; }
    .eye { position:absolute; right:.75rem; background:none; border:none; cursor:pointer; padding:0; display:flex; }
    .hint-err { font-size:.75rem; color:#ef4444; margin-top:.3rem; }
    .role-selector { display:flex; gap:.75rem; }
    .role-option { flex:1; border:1.5px solid #e2e8f0; border-radius:10px; padding:.7rem; text-align:center; cursor:pointer; transition:.2s; background:#f8fafc; }
    .role-option:hover { border-color:#4A90D9; background:#eff6ff; }
    .role-option.selected { border-color:#4A90D9; background:#eff6ff; }
    .role-icon { display:block; font-size:1.5rem; margin-bottom:.2rem; }
    .role-label { font-size:.82rem; font-weight:600; color:#1E3A5F; }
    .pw-strength { display:flex; align-items:center; gap:.5rem; margin-top:.4rem; }
    .strength-bars { display:flex; gap:3px; }
    .bar { width:40px; height:4px; background:#e2e8f0; border-radius:2px; transition:.3s; }
    .bar.active.weak { background:#ef4444; }
    .bar.active.medium { background:#f59e0b; }
    .bar.active.strong { background:#10b981; }
    .strength-label { font-size:.75rem; font-weight:600; }
    .strength-label.weak { color:#ef4444; }
    .strength-label.medium { color:#f59e0b; }
    .strength-label.strong { color:#10b981; }
    .pw-criteria { margin-top:.4rem; display:flex; flex-direction:column; gap:.2rem; }
    .criterion { font-size:.75rem; color:#94a3b8; transition:.2s; }
    .criterion.met { color:#10b981; }
    .error-box { display:flex; align-items:center; gap:.5rem; background:#fef2f2; border:1px solid #fecaca; color:#ef4444; padding:.65rem .85rem; border-radius:8px; font-size:.85rem; margin-bottom:1rem; }
    .btn-submit { width:100%; padding:.9rem; background:#4A90D9; color:white; border:none; border-radius:10px; font-size:1rem; font-weight:600; cursor:pointer; transition:background .2s,transform .1s; display:flex; align-items:center; justify-content:center; min-height:48px; margin-top:.5rem; }
    .btn-submit:hover:not(:disabled) { background:#1E3A5F; transform:translateY(-1px); }
    .btn-submit:disabled { opacity:.5; cursor:not-allowed; }
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
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  error = '';
  success = '';
  showPassword = false;
  showConfirm = false;
  pwStrength = 0;
  hasUpperCase = false;
  hasNumber = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['student'],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', Validators.required]
    });
  }

  isValid(f: string): boolean { const c = this.form.get(f); return !!(c && c.valid && c.touched); }
  isInvalid(f: string): boolean { const c = this.form.get(f); return !!(c && c.invalid && c.touched); }
  get passwordsMatch(): boolean { return this.form.value.password === this.form.value.password_confirmation; }

  checkPassword() {
    const pw = this.form.value.password || '';
    this.hasUpperCase = /[A-Z]/.test(pw);
    this.hasNumber = /[0-9]/.test(pw);
    let s = 0;
    if (pw.length >= 6) s++;
    if (this.hasUpperCase) s++;
    if (this.hasNumber) s++;
    this.pwStrength = s;
  }

  submit() {
    if (this.form.invalid || !this.passwordsMatch) return;
    this.loading = true;
    this.error = '';
    this.auth.register(this.form.value).subscribe({
      next: () => { this.success = 'ok'; this.loading = false; },
      error: (e) => { this.error = e.error?.email?.[0] || e.error?.message || "Erreur lors de l'inscription"; this.loading = false; }
    });
  }
}
