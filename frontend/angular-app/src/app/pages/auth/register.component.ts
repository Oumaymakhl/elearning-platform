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
    <div class="auth-container">
      <div class="auth-card">
        <div class="logo">🎓 E-Learning</div>
        <h2>Créer un compte</h2>

        <!-- Succès -->
        <div class="success-box" *ngIf="success">
          <div class="success-icon">📧</div>
          <h3>Inscription réussie !</h3>
          <p>Un email de confirmation a été envoyé à <strong>{{ form.value.email }}</strong>.<br>Vérifiez votre boîte mail pour activer votre compte.</p>
          <a routerLink="/login" class="btn-login">Se connecter →</a>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" *ngIf="!success">

          <!-- Nom -->
          <div class="field" [class.valid]="isValid('name')" [class.invalid]="isInvalid('name')">
            <label>Nom complet</label>
            <div class="input-wrap">
              <span class="input-icon">👤</span>
              <input type="text" formControlName="name" placeholder="Jean Dupont">
              <span class="check" *ngIf="isValid('name')">✓</span>
            </div>
            <div class="hint error-hint" *ngIf="isInvalid('name')">Le nom est requis</div>
          </div>

          <!-- Email -->
          <div class="field" [class.valid]="isValid('email')" [class.invalid]="isInvalid('email')">
            <label>Email</label>
            <div class="input-wrap">
              <span class="input-icon">✉️</span>
              <input type="email" formControlName="email" placeholder="votre@email.com">
              <span class="check" *ngIf="isValid('email')">✓</span>
            </div>
            <div class="hint error-hint" *ngIf="isInvalid('email')">Email invalide</div>
          </div>

          <!-- Rôle -->
          <div class="field">
            <label>Rôle</label>
            <div class="role-selector">
              <div class="role-option" [class.selected]="form.value.role === 'student'" (click)="form.patchValue({role:'student'})">
                <span class="role-icon">🎓</span>
                <span class="role-label">Étudiant</span>
              </div>
              <div class="role-option" [class.selected]="form.value.role === 'teacher'" (click)="form.patchValue({role:'teacher'})">
                <span class="role-icon">👨‍🏫</span>
                <span class="role-label">Formateur</span>
              </div>
            </div>
          </div>

          <!-- Mot de passe -->
          <div class="field" [class.valid]="isValid('password')" [class.invalid]="isInvalid('password')">
            <label>Mot de passe</label>
            <div class="input-wrap">
              <span class="input-icon">🔒</span>
              <input [type]="showPassword ? 'text' : 'password'" formControlName="password" placeholder="Minimum 6 caractères" (input)="checkPassword()">
              <button type="button" class="toggle-pw" (click)="showPassword = !showPassword">{{ showPassword ? '🙈' : '👁️' }}</button>
            </div>
            <!-- Force du mot de passe -->
            <div class="pw-strength" *ngIf="form.value.password">
              <div class="strength-bars">
                <div class="bar" [class.active]="pwStrength >= 1" [class.weak]="pwStrength === 1" [class.medium]="pwStrength === 2" [class.strong]="pwStrength >= 3"></div>
                <div class="bar" [class.active]="pwStrength >= 2" [class.medium]="pwStrength === 2" [class.strong]="pwStrength >= 3"></div>
                <div class="bar" [class.active]="pwStrength >= 3" [class.strong]="pwStrength >= 3"></div>
              </div>
              <span class="strength-label" [class.weak]="pwStrength === 1" [class.medium]="pwStrength === 2" [class.strong]="pwStrength >= 3">
                {{ pwStrength === 1 ? 'Faible' : pwStrength === 2 ? 'Moyen' : 'Fort' }}
              </span>
            </div>
            <!-- Critères -->
            <div class="pw-criteria" *ngIf="form.value.password">
              <div class="criterion" [class.met]="form.value.password?.length >= 6">
                <span>{{ form.value.password?.length >= 6 ? '✓' : '○' }}</span> 6 caractères minimum
              </div>
              <div class="criterion" [class.met]="hasUpperCase">
                <span>{{ hasUpperCase ? '✓' : '○' }}</span> Une majuscule
              </div>
              <div class="criterion" [class.met]="hasNumber">
                <span>{{ hasNumber ? '✓' : '○' }}</span> Un chiffre
              </div>
            </div>
          </div>

          <!-- Confirmation -->
          <div class="field" [class.valid]="isValid('password_confirmation') && passwordsMatch" [class.invalid]="isInvalid('password_confirmation') || (form.value.password_confirmation && !passwordsMatch)">
            <label>Confirmer le mot de passe</label>
            <div class="input-wrap">
              <span class="input-icon">🔒</span>
              <input [type]="showConfirm ? 'text' : 'password'" formControlName="password_confirmation" placeholder="Répétez le mot de passe">
              <button type="button" class="toggle-pw" (click)="showConfirm = !showConfirm">{{ showConfirm ? '🙈' : '👁️' }}</button>
              <span class="check" *ngIf="passwordsMatch && form.value.password_confirmation">✓</span>
            </div>
            <div class="hint error-hint" *ngIf="form.value.password_confirmation && !passwordsMatch">Les mots de passe ne correspondent pas</div>
          </div>

          <div class="error" *ngIf="error">{{ error }}</div>

          <button type="submit" [disabled]="loading || form.invalid || !passwordsMatch" class="btn-submit">
            <span *ngIf="!loading">🚀 S'inscrire</span>
            <span *ngIf="loading">Inscription en cours...</span>
          </button>
        </form>

        <p class="login-link" *ngIf="!success">Déjà inscrit ? <a routerLink="/login">Se connecter</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#0f2544,#1E3A5F); padding:1rem; }
    .auth-card { background:white; padding:2rem; border-radius:16px; box-shadow:0 20px 60px rgba(0,0,0,.2); width:100%; max-width:420px; }
    .logo { text-align:center; font-size:1.4rem; font-weight:800; color:#1E3A5F; margin-bottom:.5rem; }
    h2 { text-align:center; color:#444; margin-bottom:1.5rem; font-weight:400; font-size:1.1rem; }

    /* Succès */
    .success-box { text-align:center; padding:1rem 0; }
    .success-icon { font-size:3rem; margin-bottom:1rem; }
    .success-box h3 { color:#1E3A5F; margin:0 0 .5rem; }
    .success-box p { color:#64748b; font-size:.9rem; line-height:1.6; margin:0 0 1.5rem; }
    .btn-login { background:#1E3A5F; color:white; padding:.75rem 2rem; border-radius:8px; text-decoration:none; font-weight:600; display:inline-block; }

    /* Champs */
    .field { margin-bottom:1rem; }
    label { display:block; margin-bottom:.4rem; color:#555; font-size:.85rem; font-weight:500; }
    .input-wrap { position:relative; display:flex; align-items:center; }
    .input-icon { position:absolute; left:.75rem; font-size:.9rem; }
    .input-wrap input { width:100%; padding:.75rem .75rem .75rem 2.5rem; border:1.5px solid #ddd; border-radius:8px; font-size:.9rem; box-sizing:border-box; transition:border-color .2s; outline:none; }
    .input-wrap input:focus { border-color:#1E3A5F; }
    .field.valid .input-wrap input { border-color:#22c55e; }
    .field.invalid .input-wrap input { border-color:#ef4444; }
    .check { position:absolute; right:.75rem; color:#22c55e; font-weight:700; }
    .toggle-pw { position:absolute; right:.75rem; background:none; border:none; cursor:pointer; font-size:.9rem; padding:0; }
    .hint { font-size:.75rem; margin-top:.3rem; }
    .error-hint { color:#ef4444; }

    /* Rôle */
    .role-selector { display:flex; gap:.75rem; }
    .role-option { flex:1; border:1.5px solid #ddd; border-radius:10px; padding:.75rem; text-align:center; cursor:pointer; transition:.2s; }
    .role-option:hover { border-color:#1E3A5F; background:#f0f4ff; }
    .role-option.selected { border-color:#1E3A5F; background:#f0f4ff; }
    .role-icon { display:block; font-size:1.5rem; margin-bottom:.25rem; }
    .role-label { font-size:.82rem; font-weight:600; color:#1E3A5F; }

    /* Force mot de passe */
    .pw-strength { display:flex; align-items:center; gap:.5rem; margin-top:.4rem; }
    .strength-bars { display:flex; gap:3px; }
    .bar { width:40px; height:4px; background:#e2e8f0; border-radius:2px; transition:.3s; }
    .bar.active.weak { background:#ef4444; }
    .bar.active.medium { background:#f59e0b; }
    .bar.active.strong { background:#22c55e; }
    .strength-label { font-size:.75rem; font-weight:600; }
    .strength-label.weak { color:#ef4444; }
    .strength-label.medium { color:#f59e0b; }
    .strength-label.strong { color:#22c55e; }

    /* Critères */
    .pw-criteria { margin-top:.4rem; display:flex; flex-direction:column; gap:.2rem; }
    .criterion { font-size:.75rem; color:#94a3b8; transition:.2s; }
    .criterion.met { color:#22c55e; }

    /* Bouton */
    .btn-submit { width:100%; padding:.85rem; background:#1E3A5F; color:white; border:none; border-radius:8px; font-size:1rem; cursor:pointer; margin-top:.5rem; transition:.2s; }
    .btn-submit:hover:not(:disabled) { background:#2d5080; }
    .btn-submit:disabled { opacity:.5; cursor:not-allowed; }
    .error { color:#e53e3e; margin-bottom:1rem; font-size:.9rem; background:#fff5f5; padding:.75rem; border-radius:8px; }
    .login-link { text-align:center; margin-top:1rem; color:#666; font-size:.9rem; }
    a { color:#1E3A5F; font-weight:600; }
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

  isValid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.valid && c.touched);
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && c.touched);
  }

  get passwordsMatch(): boolean {
    return this.form.value.password === this.form.value.password_confirmation;
  }

  checkPassword() {
    const pw = this.form.value.password || '';
    this.hasUpperCase = /[A-Z]/.test(pw);
    this.hasNumber = /[0-9]/.test(pw);
    let strength = 0;
    if (pw.length >= 6) strength++;
    if (this.hasUpperCase) strength++;
    if (this.hasNumber) strength++;
    this.pwStrength = strength;
  }

  submit() {
    if (this.form.invalid || !this.passwordsMatch) return;
    this.loading = true;
    this.error = '';
    this.auth.register(this.form.value).subscribe({
      next: () => {
        this.success = 'ok';
        this.loading = false;
      },
      error: (e) => {
        this.error = e.error?.email?.[0] || e.error?.message || "Erreur lors de l'inscription";
        this.loading = false;
      }
    });
  }
}
