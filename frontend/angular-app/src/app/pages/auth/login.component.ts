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
    <div class="auth-container">
      <div class="auth-card">
        <h1>🎓 E-Learning</h1>
        <h2>Connexion</h2>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label>Email</label>
            <input type="email" formControlName="email" placeholder="votre@email.com">
          </div>
          <div class="field">
            <label>Mot de passe</label>
            <input type="password" formControlName="password" placeholder="••••••••">
          </div>
          <div class="error" *ngIf="error">{{ error }}</div>
          <button type="submit" [disabled]="loading">
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>
        <p>Pas encore inscrit ? <a routerLink="/register">S'inscrire</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#f0f4f8; }
    .auth-card { background:white; padding:2rem; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,.1); width:100%; max-width:400px; }
    h1 { text-align:center; color:#1E3A5F; margin-bottom:.5rem; }
    h2 { text-align:center; color:#444; margin-bottom:1.5rem; font-weight:400; }
    .field { margin-bottom:1rem; }
    label { display:block; margin-bottom:.4rem; color:#555; font-size:.9rem; }
    input { width:100%; padding:.75rem; border:1px solid #ddd; border-radius:8px; font-size:1rem; box-sizing:border-box; }
    button { width:100%; padding:.85rem; background:#1E3A5F; color:white; border:none; border-radius:8px; font-size:1rem; cursor:pointer; margin-top:.5rem; }
    button:hover { background:#2d5080; }
    button:disabled { opacity:.7; cursor:not-allowed; }
    .error { color:#e53e3e; margin-bottom:1rem; font-size:.9rem; }
    p { text-align:center; margin-top:1rem; color:#666; }
    a { color:#1E3A5F; }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => { this.error = e.error?.message || 'Identifiants incorrects'; this.loading = false; }
    });
  }
}
