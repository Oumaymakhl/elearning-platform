import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  email = '';
  password = '';
  passwordConfirmation = '';
  loading = false;
  success = false;
  error = '';

  showPassword = false;
  showConfirm = false;
  has6Chars = false;
  hasUpper = false;
  hasNumber = false;
  strengthClass = 'weak';
  strengthLabel = 'Faible';
  strengthWidth = '0%';

  get isValid() {
    return this.has6Chars && this.hasUpper && this.hasNumber &&
           this.password === this.passwordConfirmation && this.passwordConfirmation.length > 0;
  }

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  tokenInvalid = false;

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.email = this.route.snapshot.queryParamMap.get('email') || '';

    if (!this.token || !this.email) {
      this.tokenInvalid = true;
      return;
    }

    // Vérifier le token au chargement
    this.http.post('/api/auth/verify-reset-token', {
      email: this.email,
      token: this.token
    }).subscribe({
      error: () => { this.tokenInvalid = true; }
    });
  }

  checkStrength() {
    this.has6Chars = this.password.length >= 6;
    this.hasUpper  = /[A-Z]/.test(this.password);
    this.hasNumber = /[0-9]/.test(this.password);
    const score = [this.has6Chars, this.hasUpper, this.hasNumber].filter(Boolean).length;
    if (score === 0) { this.strengthWidth = '0%'; this.strengthClass = 'weak'; this.strengthLabel = ''; }
    if (score === 1) { this.strengthClass = 'weak';   this.strengthLabel = 'Faible'; this.strengthWidth = '33%'; }
    if (score === 2) { this.strengthClass = 'medium'; this.strengthLabel = 'Moyen';  this.strengthWidth = '66%'; }
    if (score === 3) { this.strengthClass = 'strong'; this.strengthLabel = 'Fort';   this.strengthWidth = '100%'; }
  }

  submit() {
    if (!this.isValid) return;
    this.loading = true;
    this.error = '';
    this.http.post('/api/auth/reset-password', {
      email: this.email,
      token: this.token,
      password: this.password,
      password_confirmation: this.passwordConfirmation
    }).subscribe({
      next: () => { this.success = true; this.loading = false; setTimeout(() => this.router.navigate(['/login']), 3000); },
      error: (e) => { this.error = e.error?.message || 'Token invalide ou expiré.'; this.loading = false; }
    });
  }
}
