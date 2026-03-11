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
        <h1>🎓 E-Learning</h1>
        <h2>Inscription</h2>
        <div class="success" *ngIf="success">{{ success }}</div>
        <form [formGroup]="form" (ngSubmit)="submit()" *ngIf="!success">
          <div class="field">
            <label>Nom complet</label>
            <input type="text" formControlName="name" placeholder="Jean Dupont">
          </div>
          <div class="field">
            <label>Email</label>
            <input type="email" formControlName="email" placeholder="votre@email.com">
          </div>
          <div class="field">
            <label>Rôle</label>
            <select formControlName="role">
              <option value="student">Étudiant</option>
              <option value="teacher">Formateur</option>
            </select>
          </div>
          <div class="field">
            <label>Mot de passe</label>
            <input type="password" formControlName="password" placeholder="••••••••">
          </div>
          <div class="field">
            <label>Confirmer le mot de passe</label>
            <input type="password" formControlName="password_confirmation" placeholder="••••••••">
          </div>
          <div class="error" *ngIf="error">{{ error }}</div>
          <button type="submit" [disabled]="loading">
            {{ loading ? 'Inscription...' : "S'inscrire" }}
          </button>
        </form>
        <p *ngIf="!success">Déjà inscrit ? <a routerLink="/login">Se connecter</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#f0f4f8; }
    .auth-card { background:white; padding:2rem; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,.1); width:100%; max-width:400px; }
    h1 { text-align:center; color:#1E3A5F; }
    h2 { text-align:center; color:#444; margin-bottom:1.5rem; font-weight:400; }
    .field { margin-bottom:1rem; }
    label { display:block; margin-bottom:.4rem; color:#555; font-size:.9rem; }
    input, select { width:100%; padding:.75rem; border:1px solid #ddd; border-radius:8px; font-size:1rem; box-sizing:border-box; }
    button { width:100%; padding:.85rem; background:#1E3A5F; color:white; border:none; border-radius:8px; font-size:1rem; cursor:pointer; margin-top:.5rem; }
    button:hover { background:#2d5080; }
    .error { color:#e53e3e; margin-bottom:1rem; font-size:.9rem; }
    .success { background:#c6f6d5; color:#276749; padding:1rem; border-radius:8px; margin-bottom:1rem; text-align:center; }
    p { text-align:center; margin-top:1rem; color:#666; }
    a { color:#1E3A5F; }
  `]
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  error = '';
  success = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['student'],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', Validators.required]
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.auth.register(this.form.value).subscribe({
      next: () => { this.success = 'Inscription réussie ! Vérifiez votre email pour activer votre compte.'; this.loading = false; },
      error: (e) => { this.error = e.error?.email?.[0] || e.error?.message || 'Erreur lors de l\'inscription'; this.loading = false; }
    });
  }
}
